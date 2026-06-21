#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh ma_nguon/tien_ich/seed_icd_drug_bhyt.json (thẻ ICD_DRUG) từ:
  - 86 quy tắc «Kiểm tra Chỉ định ICD-10» trong du_lieu_luat_thuoc_muc8.jsx
  - Danh sách ICD được phép (NOT IN / NOT LIKE) trong active_rules_inventory.txt (UTF-16 LE)

Chạy:
  python scripts/build_seed_icd_drug_from_muc8_rules.py
  python scripts/build_seed_icd_drug_from_muc8_rules.py --out ma_nguon/tien_ich/seed_icd_drug_bhyt.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = REPO_ROOT / "ma_nguon" / "tien_ich" / "seed_icd_drug_bhyt.json"
DEFAULT_MUC8 = REPO_ROOT / "ma_nguon" / "tien_ich" / "du_lieu_luat_thuoc_muc8.jsx"
DEFAULT_INVENTORY = REPO_ROOT / "active_rules_inventory.txt"

MUC8_ARRAY_RE = re.compile(
    r"export const DU_LIEU_SEED_LUAT_THUOC_MUC8 = (\[[\s\S]*?\]);",
    re.MULTILINE,
)
MA_THUOC_RE = re.compile(r"XML2\.MA_THUOC == '([^']+)'")
NOT_IN_RE = re.compile(r"MA_BENH_CHINH NOT IN \(([^)]+)\)")
KT_LIKE_RE = re.compile(r"MA_BENH_KT NOT LIKE '%([^%]+)%'")
CHINH_LIKE_RE = re.compile(r"MA_BENH_CHINH NOT LIKE '([^%']+)%'")


def load_muc8_rules(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    m = MUC8_ARRAY_RE.search(text)
    if not m:
        raise RuntimeError(f"Không tìm thấy DU_LIEU_SEED_LUAT_THUOC_MUC8 trong {path}")
    rows = eval(m.group(1))  # noqa: S307 — nguồn nội bộ repo
    out = []
    for row in rows:
        dk = str(row.get("DIEU_KIEN") or "")
        if "CO_CO_DONG_MAPPING_ICD_THUOC" not in dk:
            continue
        ma_m = MA_THUOC_RE.search(dk)
        if not ma_m:
            continue
        out.append(
            {
                "ma_luat": str(row.get("MA_LUAT") or "").strip(),
                "ma_thuoc": ma_m.group(1).strip(),
                "ten_quy_tac": str(row.get("TEN_QUY_TAC") or "").strip(),
                "canh_bao": str(row.get("CANH_BAO") or "").strip(),
            }
        )
    return out


def parse_icd_from_inventory_line(dk: str) -> list[str]:
    icds: set[str] = set()
    for m in NOT_IN_RE.finditer(dk):
        for code in re.findall(r"'([^']+)'", m.group(1)):
            c = code.strip()
            if c:
                icds.add(c)
    for m in KT_LIKE_RE.finditer(dk):
        c = m.group(1).strip()
        if c:
            icds.add(c)
    for m in CHINH_LIKE_RE.finditer(dk):
        prefix = m.group(1).strip().rstrip("%")
        if prefix:
            icds.add(prefix)
    return sorted(icds)


def load_inventory_indication_by_ma_thuoc(path: Path) -> dict[str, list[str]]:
    if not path.is_file():
        return {}
    text = path.read_text(encoding="utf-16-le")
    by_ma: dict[str, list[str]] = {}
    for line in text.splitlines():
        if not line.startswith("THUOC_"):
            continue
        if "MA_BENH_CHINH NOT IN" not in line and "MA_BENH_CHINH NOT LIKE" not in line:
            continue
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        dk = "\t".join(parts[2:])
        ma_m = MA_THUOC_RE.search(dk)
        if not ma_m:
            continue
        ma_thuoc = ma_m.group(1).strip()
        icds = parse_icd_from_inventory_line(dk)
        if icds:
            by_ma[ma_thuoc] = icds
    return by_ma


def parse_icd_from_canh_bao(canh_bao: str) -> list[str]:
    icds: set[str] = set()
    for m in re.finditer(r"\b([A-TV-Z]\d{2}(?:\.\d{1,2})?)\b", canh_bao or ""):
        icds.add(m.group(1))
    return sorted(icds)


def build_seed_row(
    *,
    ma_luat: str,
    ma_thuoc: str,
    ten_quy_tac: str,
    icds: list[str],
    line_no: int,
    nguon: str,
) -> dict:
    ts = datetime.now(timezone.utc).isoformat()
    rid = f"SEED_ICD_CD_{ma_luat}_{line_no}"
    md = {
        "rule_id": rid,
        "ma_luat": ma_luat,
        "ten_quy_tac": ten_quy_tac,
        "source_icd_codes": icds,
        "target_codes": [ma_thuoc],
        "nguon_dong": nguon,
    }
    return {
        "id": str(uuid.uuid4()),
        "mapping_type": "ICD_DRUG",
        "source_catalog": "icd10",
        "target_catalog": "drug_items",
        "source_id": 0,
        "target_id": 0,
        "source_code": ";".join(icds),
        "target_code": ma_thuoc,
        "effective_from": None,
        "effective_to": None,
        "priority": 0,
        "is_active": True,
        "metadata": md,
        "approval_status": "APPROVED",
        "created_at": ts,
        "updated_at": ts,
        "created_by": "build_seed_icd_drug_from_muc8_rules.py",
        "updated_by": "",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--muc8", type=Path, default=DEFAULT_MUC8)
    ap.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    rules = load_muc8_rules(args.muc8)
    inv_by_ma = load_inventory_indication_by_ma_thuoc(args.inventory)

    out_rows: list[dict] = []
    missing: list[str] = []

    for i, rule in enumerate(rules, start=1):
        ma = rule["ma_thuoc"]
        icds = inv_by_ma.get(ma) or []
        nguon = "active_rules_inventory"
        if not icds:
            icds = parse_icd_from_canh_bao(rule["canh_bao"])
            nguon = "canh_bao_fallback"
        if not icds:
            missing.append(f"{rule['ma_luat']} ({ma})")
            continue
        out_rows.append(
            build_seed_row(
                ma_luat=rule["ma_luat"],
                ma_thuoc=ma,
                ten_quy_tac=rule["ten_quy_tac"],
                icds=icds,
                line_no=i,
                nguon=nguon,
            )
        )

    if missing:
        print("CẢNH BÁO: thiếu ICD cho:", ", ".join(missing), file=sys.stderr)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        json.dump(out_rows, f, ensure_ascii=False, indent=2)

    drugs = {r["target_code"] for r in out_rows}
    print(f"Wrote {len(out_rows)} ICD_DRUG rows ({len(drugs)} MA_THUOC) -> {args.out}")
    if len(out_rows) != len(rules):
        print(f"Expected {len(rules)} rules, got {len(out_rows)} seed rows", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
