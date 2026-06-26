# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

html = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = html.read_text(encoding='utf-8')

# sample drugs from chunk 1
m = re.search(r'class="drugs-data-chunk" data-chunk="1"[^>]*>(\[.*?\])</script>', text, re.S)
if m:
    drugs = json.loads(m.group(1))
    d = drugs[0]
    print("Sample drug keys:", [k for k in d.keys() if 'icd' in k.lower() or k in ('chiDinh','chongChiDinh')])
    print("goiYMaICDChiDinh:", d.get('goiYMaICDChiDinh', 'MISSING')[:200] if d.get('goiYMaICDChiDinh') else 'MISSING')
    print("chiDinh[:120]:", d.get('chiDinh','')[:120])

# count drugs with icd fields
all_drugs = []
for cm in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', text, re.S):
    all_drugs.extend(json.loads(cm.group(1)))
print("Total drugs:", len(all_drugs))
with_chi = sum(1 for d in all_drugs if d.get('goiYMaICDChiDinh'))
with_chong = sum(1 for d in all_drugs if d.get('goiYMaICDChongChiDinh'))
print("With goiYMaICDChiDinh:", with_chi)
print("With goiYMaICDChongChiDinh:", with_chong)

# ICD catalog count
icd_all = []
for cm in re.finditer(r'class="icd-data-chunk"[^>]*>(\[.*?\])</script>', text, re.S):
    icd_all.extend(json.loads(cm.group(1)))
print("Embedded ICD entries:", len(icd_all))
detailed = [x for x in icd_all if '.' in (x.get('m') or '')]
print("With decimal (detailed):", len(detailed))
