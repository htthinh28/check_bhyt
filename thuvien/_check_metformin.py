# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
t = open(r'G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html', encoding='utf-8').read()
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))
d = next(x for x in drugs if 'metformin' in (x.get('tenHoatChat') or '').lower())
print('chiDinh:', d.get('chiDinh','')[:500])
icd = []
for m in re.finditer(r'class="icd-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    icd.extend(json.loads(m.group(1)))
n08 = [x for x in icd if 'N08' in (x.get('m') or '')]
print('N08 codes:', [x['m'] for x in n08[:15]])
