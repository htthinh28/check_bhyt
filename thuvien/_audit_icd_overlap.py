# -*- coding: utf-8 -*-
"""Kiểm tra mã ICD trùng giữa chỉ định và chống chỉ định."""
import json
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

from pathlib import Path

t = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html").read_text(encoding="utf-8")
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))

overlaps = []
for d in drugs:
    chi = set((d.get("maICDChiDinh") or "").split(";")) - {""}
    chong = set((d.get("maICDChongChiDinh") or "").split(";")) - {""}
    both = chi & chong
    if both:
        overlaps.append((d.get("tenHoatChat"), sorted(both), chi, chong, d.get("chongChiDinh", "")[:300]))

print(f"Tổng thuốc: {len(drugs)}")
print(f"Thuốc có mã trùng chi/chong: {len(overlaps)}")
print()

# Thống kê mã hay bị trùng
code_counter = Counter()
for _, both, _, _, _ in overlaps:
    for c in both:
        code_counter[c] += 1
print("Mã trùng nhiều nhất:")
for code, n in code_counter.most_common(15):
    print(f"  {code}: {n} thuốc")

print("\n--- 10 ví dụ ---")
for name, both, chi, chong, chong_text in overlaps[:10]:
    print(f"\n{name}")
    print(f"  Trùng: {both}")
    print(f"  CHI: {';'.join(sorted(chi))[:120]}")
    print(f"  CHONG: {';'.join(sorted(chong))[:120]}")
    print(f"  chongChiDinh: {chong_text.replace(chr(10), ' ')[:200]}...")
