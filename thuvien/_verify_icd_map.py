# -*- coding: utf-8 -*-
import json, re
from pathlib import Path

p = Path(r"C:\Users\admin\Desktop\Thu vien\Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html")
t = p.read_text(encoding="utf-8")
print("ends </html>:", t.rstrip().endswith("</html>"))
drugs = []
for m in re.finditer(r'class="drugs-data-chunk"[^>]*>(\[.*?\])</script>', t, re.S):
    drugs.extend(json.loads(m.group(1)))
print("drugs:", len(drugs))
print("with goiYMaICDChiDinh:", sum(1 for d in drugs if d.get("goiYMaICDChiDinh")))
print("with goiYMaICDChongChiDinh:", sum(1 for d in drugs if d.get("goiYMaICDChongChiDinh")))
