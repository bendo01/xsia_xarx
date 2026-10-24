"""Compliance anomaly detection on PDDIKTI Feeder data with injected anomalies.

Reads feeder_master.* tables (read-only), injects anomalies into a copy of each
entity, runs rule-based and ML detectors, and writes metrics to results/.

Usage: DATABASE_URL=postgres://... python run_experiment.py [--seeds 10] [--frac 0.05]
"""
import argparse
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg
from sklearn.ensemble import IsolationForest
from sklearn.metrics import roc_auc_score
from sklearn.neighbors import LocalOutlierFactor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

OUT = Path(__file__).parent / "results"


# ---------------------------------------------------------------- data
QUERIES = {
    "student_semester": """
        select ips, ipk, sks_semester, sks_total,
               (nama_status_mahasiswa = 'Aktif')::int as aktif
        from feeder_master.perkuliahan_mahasiswa""",
    "course": """
        select sks_mata_kuliah, coalesce(sks_tatap_muka,0) as sks_tm,
               coalesce(sks_praktek,0) as sks_prak,
               coalesce(sks_praktek_lapangan,0) as sks_lap,
               coalesce(sks_simulasi,0) as sks_sim
        from feeder_master.matakuliah""",
    "teaching": """
        select rencana_minggu_pertemuan as rencana,
               realisasi_minggu_pertemuan as realisasi
        from feeder_master.aktifitas_mengajar_dosen
        where rencana_minggu_pertemuan is not null
          and realisasi_minggu_pertemuan is not null""",
}


def load(url):
    out = {}
    with psycopg.connect(url) as conn:
        conn.read_only = True
        for k, q in QUERIES.items():
            out[k] = pd.read_sql(q, conn).astype(float)
    return out


# ---------------------------------------------------------------- rules
def rules_student_semester(d):
    return ((d.ipk > 4.0) | (d.ips > 4.0) | ((d.ipk == 0) & (d.ips > 0))
            | (d.sks_semester > 24)).to_numpy()


def rules_course(d):
    s = d.sks_tm + d.sks_prak + d.sks_lap + d.sks_sim
    return ((s != d.sks_mata_kuliah) | (d.sks_mata_kuliah > 9) | (s == 0)).to_numpy()


def rules_teaching(d):
    return (d.realisasi > 18).to_numpy()


RULES = {"student_semester": rules_student_semester, "course": rules_course,
         "teaching": rules_teaching}


# ---------------------------------------------------------------- injection
# Each injector edits row i of df in place. "rule" types violate an explicit
# rule; "subtle" types stay inside every rule threshold.
def inj_ss_ipk(df, i, r): df.loc[i, "ipk"] = r.uniform(4.1, 6.0)
def inj_ss_ips(df, i, r): df.loc[i, "ips"] = r.uniform(4.1, 6.0)
def inj_ss_ipk0(df, i, r): df.loc[i, ["ipk", "ips"]] = [0.0, r.uniform(1.0, 4.0)]
def inj_ss_sks(df, i, r): df.loc[i, "sks_semester"] = r.integers(25, 40)


def inj_ss_subtle(df, i, r):
    # high credit load combined with very low semester GPA, within all limits
    df.loc[i, ["sks_semester", "ips", "aktif"]] = [r.integers(21, 25), r.uniform(0.0, 0.5), 1]


def inj_c_mismatch(df, i, r):
    df.loc[i, "sks_mata_kuliah"] = df.loc[i, "sks_mata_kuliah"] + r.integers(1, 4)


def inj_c_gt9(df, i, r):
    v = float(r.integers(10, 15))
    df.loc[i, ["sks_mata_kuliah", "sks_tm", "sks_prak", "sks_lap", "sks_sim"]] = [v, v, 0, 0, 0]


def inj_c_zero(df, i, r):
    df.loc[i, ["sks_tm", "sks_prak", "sks_lap", "sks_sim"]] = 0.0


def inj_t_gt18(df, i, r): df.loc[i, "realisasi"] = r.integers(19, 30)


def inj_t_subtle(df, i, r):
    # realized meetings far below plan, within the limit
    df.loc[i, "realisasi"] = max(0, int(df.loc[i, "rencana"] * r.uniform(0.0, 0.25)))


INJECTORS = {
    "student_semester": {"rule": [inj_ss_ipk, inj_ss_ips, inj_ss_ipk0, inj_ss_sks],
                         "subtle": [inj_ss_subtle]},
    "course": {"rule": [inj_c_mismatch, inj_c_gt9, inj_c_zero], "subtle": []},
    "teaching": {"rule": [inj_t_gt18], "subtle": [inj_t_subtle]},
}


def inject(clean, entity, frac, rng):
    df = clean.copy()
    n = len(df)
    inj = INJECTORS[entity]
    kinds = [("rule", f) for f in inj["rule"]] + [("subtle", f) for f in inj["subtle"]]
    m = max(1, int(round(n * frac / len(kinds))))
    idx = rng.permutation(n)[: m * len(kinds)]
    label = np.zeros(n, dtype=int)
    kind = np.array(["normal"] * n, dtype=object)
    for j, (k, f) in enumerate(kinds):
        for i in idx[j * m:(j + 1) * m]:
            f(df, i, rng)
            label[i] = 1
            kind[i] = k
    return df, label, kind


# ---------------------------------------------------------------- detectors
def feats(entity, df):
    if entity == "student_semester":
        return df[["ips", "ipk", "sks_semester", "sks_total", "aktif"]].to_numpy()
    if entity == "course":
        s = df.sks_tm + df.sks_prak + df.sks_lap + df.sks_sim
        return np.c_[df.sks_mata_kuliah, df.sks_tm, df.sks_prak, df.sks_lap,
                     df.sks_sim, df.sks_mata_kuliah - s]
    return np.c_[df.rencana, df.realisasi, df.realisasi / df.rencana.clip(lower=1)]


def ml_scores(X, seed):
    Xs = StandardScaler().fit_transform(X)
    iforest = -IsolationForest(n_estimators=200, random_state=seed).fit(Xs).score_samples(Xs)
    lof = -LocalOutlierFactor(n_neighbors=20).fit(Xs).negative_outlier_factor_
    d = Xs.shape[1]
    ae = MLPRegressor(hidden_layer_sizes=(max(2, d * 2), max(2, d // 2 + 1), max(2, d * 2)),
                      max_iter=400, random_state=seed).fit(Xs, Xs)
    err = ((ae.predict(Xs) - Xs) ** 2).mean(axis=1)
    return {"isolation_forest": iforest, "lof": lof, "autoencoder": err}


def rank01(x):
    return pd.Series(x).rank(pct=True).to_numpy()


def evaluate(score, flag, label, kind):
    k = int(label.sum())
    top = np.argsort(-score, kind="stable")[:k]
    out = {"auc": roc_auc_score(label, score), "p_at_k": label[top].mean()}
    if flag is not None:
        tp = int((flag & (label == 1)).sum())
        out.update(precision=tp / max(1, int(flag.sum())), recall=tp / k)
        out["f1"] = (2 * out["precision"] * out["recall"] / (out["precision"] + out["recall"])
                     if tp else 0.0)
    # recall of the top-k set per anomaly type
    for t in ("rule", "subtle"):
        mask = kind == t
        if mask.any():
            out[f"recall_topk_{t}"] = label[top][np.isin(top, np.where(mask)[0])].sum() / mask.sum()
    return out


def run_once(clean, entity, frac, seed):
    rng = np.random.default_rng(seed)
    df, label, kind = inject(clean, entity, frac, rng)
    flag = RULES[entity](df)
    ml = ml_scores(feats(entity, df), seed)
    results = {"rules": evaluate(flag.astype(float), flag, label, kind)}
    for name, s in ml.items():
        results[name] = evaluate(s, None, label, kind)
    # combined: rule violations first, then ML ensemble rank
    ens = np.mean([rank01(s) for s in ml.values()], axis=0)
    comb = flag * 10.0 + ens
    results["combined"] = evaluate(comb, flag | (ens >= np.sort(ens)[-int(label.sum())]),
                                   label, kind)
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=10)
    ap.add_argument("--frac", type=float, default=0.05)
    a = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    data = load(os.environ["DATABASE_URL"])

    clean_flags = {e: int(RULES[e](d).sum()) for e, d in data.items()}
    print("rule violations in original data:", clean_flags)

    rows = []
    for entity, clean in data.items():
        for seed in range(a.seeds):
            res = run_once(clean, entity, a.frac, seed)
            for method, m in res.items():
                rows.append({"entity": entity, "seed": seed, "method": method, **m})
    df = pd.DataFrame(rows)
    df.to_csv(OUT / "metrics_per_seed.csv", index=False)
    summ = df.drop(columns="seed").groupby(["entity", "method"]).agg(["mean", "std"])
    summ.columns = ["_".join(c) for c in summ.columns]
    summ.round(4).to_csv(OUT / "metrics_summary.csv")
    meta = {"records": {e: len(d) for e, d in data.items()},
            "violations_original": clean_flags, "seeds": a.seeds, "frac": a.frac}
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2))
    pd.set_option("display.width", 250)
    pd.set_option("display.max_columns", 30)
    print(summ.round(3).to_string())


if __name__ == "__main__":
    main()
