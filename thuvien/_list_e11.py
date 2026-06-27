# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
t = open(r'G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html', encoding='utf-8').read()
icd = []
for m in re.finditer(r'class="icd-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    icd.extend(json.loads(m.group(1)))
e11 = [x for x in icd if (x.get('m') or '').startswith('E11')]
print('E11 codes:', len(e11))
for x in sorted(e11, key=lambda z: z['m']):
    print(x['m'], '-', (x.get('t') or '')[:70])
