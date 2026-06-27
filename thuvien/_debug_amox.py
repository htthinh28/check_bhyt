# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
from _update_icd_deep import norm, split_clauses, CHONG_CLAUSE_SIGNAL, RELATIVE_CONTRA_CLAUSE, map_chong_text_to_icds, load_icd_from_html

t = Path(r'G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html').read_text(encoding='utf-8')
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))
d = next(x for x in drugs if 'Amoxicilin' in x.get('tenHoatChat',''))
print('chongChiDinh:', repr(d.get('chongChiDinh','')[:200]))
for c in split_clauses(d.get('chongChiDinh') or ''):
    cn = norm(c)
    print('clause:', cn[:80])
    print('  signal:', bool(CHONG_CLAUSE_SIGNAL.search(cn)))
    print('  relative:', bool(RELATIVE_CONTRA_CLAUSE.search(cn)))

catalog, _, children = load_icd_from_html(t)
print('mapped:', map_chong_text_to_icds(d.get('chongChiDinh') or '', catalog, children))
