# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

html = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = html.read_text(encoding='utf-8')
all_drugs = []
for cm in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', text, re.S):
    all_drugs.extend(json.loads(cm.group(1)))

samples = ['Amoxicilin', 'Docetaxel', 'Losartan', 'Paracetamol']
for name in samples:
    d = next(x for x in all_drugs if name.lower() in (x.get('tenHoatChat') or '').lower())
    print('\n===', d['tenHoatChat'], '===')
    print('CHI:', d.get('goiYMaICDChiDinh','')[:500])
    print('CHONG:', d.get('goiYMaICDChongChiDinh','')[:300])

# count semicolons in chi dinh
multi = [d for d in all_drugs if d.get('goiYMaICDChiDinh') and ';' in d['goiYMaICDChiDinh']]
print('\nDrugs with multiple chi dinh codes (;):', len(multi))
if multi:
    print('Example:', multi[0]['tenHoatChat'], '->', multi[0]['goiYMaICDChiDinh'][:200])

# codes without decimal (3-char only)
def codes_only(s):
    if not s: return []
    parts = s.split(';')
    out = []
    for p in parts:
        m = re.match(r'\s*([A-TV-ZU]\d{2}(?:\.\d+)?)', p.strip())
        if m: out.append(m.group(1))
    return out

three_only = 0
for d in all_drugs:
    for field in ('goiYMaICDChiDinh','goiYMaICDChongChiDinh'):
        for c in codes_only(d.get(field)):
            if '.' not in c:
                three_only += 1
print('3-char codes (no decimal) in suggestions:', three_only)
