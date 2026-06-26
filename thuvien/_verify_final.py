# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
t = Path(r'G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html').read_text(encoding='utf-8')
print('size MB', len(t)//1024//1024)
print('</html>', '</html>' in t)
print('maICDChiDinh in JS', 'maICDChiDinh' in t[:t.find('class="drugs-data-chunk"')])
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))
print('drugs', len(drugs))
d = next(x for x in drugs if 'Losartan' in x.get('tenHoatChat',''))
print('Losartan:')
print('  ma CHI:', d.get('maICDChiDinh'))
print('  ten CHI:', d.get('tenBenhICDChiDinh'))
print('  ma CHONG:', d.get('maICDChongChiDinh'))
print('  ten CHONG:', d.get('tenBenhICDChongChiDinh'))
print('DATA_VERSION 9', 'const DATA_VERSION = 9' in t)
