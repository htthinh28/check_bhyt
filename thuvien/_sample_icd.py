# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
html = Path(r'G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html').read_text(encoding='utf-8')
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', html, re.S):
    drugs.extend(json.loads(m.group(1)))
print('Total drugs:', len(drugs))
with_chi = sum(1 for d in drugs if d.get('goiYMaICDChiDinh'))
print('With goiYMaICDChiDinh:', with_chi)
for name in ['Losartan', 'Metformin', 'Amoxicilin', 'Irbesartan', 'Abacavir']:
    d = next((x for x in drugs if name.lower() in (x.get('tenHoatChat') or '').lower()), None)
    if d:
        print(f'\n{name}:')
        for k in sorted(d.keys()):
            if 'icd' in k.lower() or 'ICD' in k:
                print(f'  {k}:', (d.get(k) or '')[:250])
