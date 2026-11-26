"""Scatter plot of autoencoder top-k detections on student-semester records.

Reuses the injection and detectors of run_experiment.py. Prints the metrics over
10 seeds so they can be checked against the paper, then plots one seed.

Usage: DATABASE_URL=postgres://... python plot_scatter.py [--seed 0]
"""
import argparse
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

import run_experiment as ex

ENTITY = "student_semester"
OUT = Path(__file__).parent.parent / "fig_scatter_ae.pdf"
BLUE, ORANGE = "#2a78d6", "#eb6834"


def detect(clean, seed, frac=0.05):
    """Return injected data, labels, anomaly kinds and the autoencoder top-k mask."""
    df, label, kind = ex.inject(clean, ENTITY, frac, np.random.default_rng(seed))
    score = ex.ml_scores(ex.feats(ENTITY, df), seed)["autoencoder"]
    top = np.zeros(len(df), dtype=bool)
    top[np.argsort(-score, kind="stable")[: label.sum()]] = True
    return df, label, kind, top


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()
    clean = ex.load(os.environ["DATABASE_URL"])[ENTITY]

    stats = []
    for seed in range(10):
        _, label, kind, top = detect(clean, seed)
        stats.append([top[label == 1].mean(), top[kind == "rule"].mean(),
                      top[kind == "subtle"].mean()])
    p, r, s = np.mean(stats, axis=0)
    print(f"records={len(clean)} P@k={p:.3f} recall_rule={r:.3f} recall_subtle={s:.3f}")

    df, label, kind, top = detect(clean, a.seed)
    # sks_semester is an integer: spread points horizontally so they stay visible
    x = df.sks_semester.to_numpy() + np.random.default_rng(0).uniform(-0.3, 0.3, len(df))
    y = df.ips.to_numpy()

    plt.rcParams.update({"font.family": "serif", "font.serif": ["STIXGeneral"],
                         "mathtext.fontset": "stix", "font.size": 8, "pdf.fonttype": 42})
    fig, ax = plt.subplots(figsize=(3.45, 3.1), layout="constrained")
    for v, line in ((4.0, ax.axhline), (24.5, ax.axvline)):
        line(v, color="#8a8a86", lw=0.6, ls="--", zorder=1)

    normal, anom = label == 0, label == 1
    groups = [
        ("Normal", normal & ~top, dict(marker=".", s=8, c="#c4c3bd", linewidths=0)),
        ("False alarm", normal & top, dict(marker="x", s=12, c="#52514e", linewidths=0.7)),
        ("Rule type, detected", (kind == "rule") & top,
         dict(marker="o", s=18, c=BLUE, edgecolors="white", linewidths=0.4)),
        ("Rule type, missed", (kind == "rule") & ~top,
         dict(marker="o", s=14, facecolors="none", edgecolors=ORANGE, linewidths=0.8)),
        ("Subtle, detected", (kind == "subtle") & top,
         dict(marker="^", s=24, c=BLUE, edgecolors="white", linewidths=0.4)),
        ("Subtle, missed", (kind == "subtle") & ~top,
         dict(marker="^", s=20, facecolors="none", edgecolors=ORANGE, linewidths=0.8)),
    ]
    # zoom on the subtle anomalies, placed in the empty upper-right corner
    zoom = ax.inset_axes([0.70, 0.74, 0.30, 0.23], xlim=(20.6, 24.45), ylim=(-0.05, 0.55))
    zoom.tick_params(labelsize=6, length=2)
    zoom.set_xticks([21, 22, 23, 24])
    for z, (name, mask, style) in enumerate(groups, start=2):
        ax.scatter(x[mask], y[mask], label=f"{name} ({mask.sum()})", zorder=z, **style)
        zoom.scatter(x[mask], y[mask], zorder=z, **style)
    zoom.set_title("Zoom of boxed area", fontsize=6, pad=2)
    ax.add_patch(plt.Rectangle((20.6, -0.1), 3.85, 0.65, fill=False, ec="#0b0b0b", lw=0.7,
                               zorder=10))
    for name, mask, _ in groups:
        print(f"  {name}: {mask.sum()}")
    assert sum(m.sum() for _, m, _ in groups) == len(df)
    assert (anom & top).sum() + (normal & top).sum() == label.sum()

    ax.set_xlabel("Semester credits")
    ax.set_ylabel("Semester GPA")
    ax.spines[["top", "right"]].set_visible(False)
    fig.legend(loc="outside upper center", ncols=2, frameon=False, fontsize=7,
               handletextpad=0.2, columnspacing=0.8)
    # no creator metadata: the submission is double-blind
    fig.savefig(OUT, metadata={"Creator": None, "Producer": None, "CreationDate": None})
    fig.savefig("/tmp/xarx_scatter_preview.png", dpi=220)


if __name__ == "__main__":
    main()
