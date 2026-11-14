#!/usr/bin/env python3
"""Convert tkpi/TKPI-2020-tabel.xlsx into tkpi/data/tkpi.json for the Rust seeder.

Usage: python3 -I xlsx_to_json.py [xlsx_path] [json_path]
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xlsx_reader import read_workbook  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "TKPI-2020-tabel.xlsx")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "data", "tkpi.json")

# Column titles of sheet 8 ("JENIS ZAT GIZI") -> INFOODS tagname
RALAT_TAG = {
    "air": "WATER", "energi": "ENERC", "protein": "PROCNT", "lemak": "FAT", "kh": "CHOCDF",
    "serat": "FIBCFIBTG", "abu": "ASH", "kalsium": "CA", "fosfor": "P", "besi": "FE",
    "natrium": "NA", "kalium": "K", "tembaga": "CU", "seng": "ZN", "retinol": "RETOL",
    "b-kar": "CARTB", "kar-total": "CARTOL", "thiamin": "THIA", "riboflavin": "RIBF",
    "niasin": "NIA", "vit_c": "VITC",
}
# Sheet T4 component names -> tagname
METHOD_TAG = {
    "air": "WATER", "protein": "PROCNT", "lemak": "FAT", "karbohidrat": "CHOCDF",
    "serat pangan": "FIBCFIBTG", "abu": "ASH", "kalsium": "CA", "fosfor": "P", "besi": "FE",
    "natrium": "NA", "kalium": "K", "tembaga": "CU", "seng": "ZN", "retinol (vitamin a)": "RETOL",
    "β-karoten": "CARTB", "thiamin (vitamin b1)": "THIA", "riboflavin (vitamin b2)": "RIBF",
    "niacin": "NIA", "vitamin c": "VITC",
}
NUTRIENT_FIXES = {  # T3 cells that are merged / unclean in the source
    "FIBCFIBTG": "Serat",
    "VIT C": "VITC",
}
KIND = {"TUNGGAL/SINGLE": "single", "OLAHAN/PRODUK/KOMPOSIT": "processed"}


def s(v):
    if v is None:
        return None
    v = re.sub(r"\s+", " ", str(v)).strip()
    return v or None


def num(v):
    v = s(v)
    if v is None:
        return None
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None


def pad(r, n):
    return list(r) + [None] * (n - len(r))


def data_rows(rows, header_first_cell):
    for i, r in enumerate(rows):
        if r and s(r[0]) == header_first_cell:
            return rows[i + 1:]
    raise SystemExit(f"header {header_first_cell!r} not found")


wb = read_workbook(XLSX)
warn = []

# --- nutrients (T3) --------------------------------------------------------
nutrients = []
for r in data_rows(wb["T3 Penulisan Zat Gizi"], "No."):
    r = pad(r, 5)
    if not s(r[0]):
        continue
    tag = s(r[2])
    name = NUTRIENT_FIXES.get(tag) if tag == "FIBCFIBTG" else s(r[1])
    tag = NUTRIENT_FIXES.get(tag, tag)
    nutrients.append({"position": int(r[0]), "name": name, "tagname": tag,
                      "unit": s(r[3]), "decimal_places": int(r[4])})
tags = [n["tagname"] for n in nutrients]
assert len(tags) == 21, tags

# --- food groups (T1 + T2) --------------------------------------------------
codes = {}
for r in data_rows(wb["T2 Pengkodean Bahan Pangan"], "No."):
    r = pad(r, 3)
    if s(r[0]) and s(r[2]):
        codes[int(r[0])] = s(r[2])
groups = []
for r in data_rows(wb["T1 Pengelompokan Pangan"], "No."):
    r = pad(r, 2)
    if not s(r[0]):
        continue
    pos = int(r[0])
    code = codes[pos]  # e.g. ARAP: raw "AR", processed "AP"
    groups.append({"position": pos, "name": s(r[1]), "raw_code": code[:2], "processed_code": code[2:]})

# --- analysis methods (T4) --------------------------------------------------
methods = []
for r in data_rows(wb["T4 Metode Analisis"], "No."):
    r = pad(r, 3)
    key = (s(r[1]) or "").lower()
    if not key:
        continue
    tag = METHOD_TAG.get(key)
    if tag is None:
        warn.append(f"T4: unknown component {r[1]!r}")
        continue
    methods.append({"tagname": tag, "name": s(r[2])})

# --- foods -----------------------------------------------------------------
sheet = wb["4 Perbaikan Semua Kelompok"]
foods, seen = [], set()
for r in data_rows(sheet, "Kelompok Pangan"):
    r = pad(r, 28)
    code = s(r[3])
    if not code:
        continue
    if code in seen:
        warn.append(f"duplicate food code {code}")
        continue
    seen.add(code)
    gpos = int(re.match(r"4\.(\d+)", s(r[0])).group(1))
    source = s(r[5])
    if source:
        source = re.sub(r"\s*-\s*", "-", source)
    foods.append({
        "code": code, "name": s(r[4]), "group_position": gpos,
        "kind": KIND.get(s(r[2])), "source": source, "edible_portion": num(r[27]),
        "nutrients": {tag: num(r[6 + i]) for i, tag in enumerate(tags) if num(r[6 + i]) is not None},
    })
by_code = {f["code"]: f for f in foods}

# --- botanical names (5.x) --------------------------------------------------
for name, rows in wb.items():
    if not re.match(r"5\.\d+ ", name):
        continue
    for r in data_rows(rows, "Hal. PDF"):
        r = pad(r, 7)
        f = by_code.get(s(r[1]))
        if f is None:
            if s(r[1]):
                warn.append(f"{name}: unknown code {r[1]}")
            continue
        f.update(species=s(r[3]), genus=s(r[4]), family=s(r[5]), english_name=s(r[6]))

# --- local dishes (6.x) -----------------------------------------------------
local_dishes = []
for name, rows in wb.items():
    if not re.match(r"6\.\d+ ", name):
        continue
    for r in data_rows(rows, "Hal. PDF"):
        r = pad(r, 4)
        code = s(r[1])
        if not code or not s(r[2]):
            continue
        if code not in by_code:
            warn.append(f"{name}: unknown code {code}")
            continue
        local_dishes.append({"food_code": code, "name": s(r[2]), "description": s(r[3])})

# --- code history (7.x) -----------------------------------------------------
code_history = []
for name, rows in wb.items():
    if not re.match(r"7\.\d+ ", name):
        continue
    for r in data_rows(rows, "Hal. PDF"):
        r = pad(r, 5)
        old, new = s(r[2]), s(r[3])
        if not old or not new:
            continue
        if new not in by_code:
            warn.append(f"{name}: unknown new code {new}")
            continue
        code_history.append({"food_code": new, "old_code": old})

# --- corrections (8) ---------------------------------------------------------
corrections = []
for r in data_rows(wb["8 Daftar Ralat"], "Hal. PDF"):
    r = pad(r, 7)
    code = s(r[2])
    if not code:
        continue
    tag = RALAT_TAG.get((s(r[4]) or "").lower())
    if code not in by_code or tag is None:
        warn.append(f"ralat skipped: {r}")
        continue
    corrections.append({"food_code": code, "tagname": tag,
                        "original_value": num(r[5]), "corrected_value": num(r[6])})

out = {"food_groups": groups, "nutrients": nutrients, "analysis_methods": methods, "foods": foods,
       "local_dishes": local_dishes, "code_history": code_history, "corrections": corrections}
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items()})
for w in warn:
    print("WARN", w)
