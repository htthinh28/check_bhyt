# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
t = Path(r'G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html.pre-head-move.bak').read_text(encoding='utf-8')
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))
print('drugs', len(drugs))
print('navigateToSection', 'function navigateToSection' in t)
print('maICDChiDinh', 'maICDChiDinh' in t)
print('icd chunks', len(re.findall('icd-data-chunk', t)))
