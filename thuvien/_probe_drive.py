# -*- coding: utf-8 -*-
import re
import sys
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8")

fid = "1O7mPVW1EDzHLZk-pY8-4dd18dQtQtJt5"
url = f"https://drive.google.com/drive/folders/{fid}"
r = requests.get(url, timeout=60)
text = r.text
Path("_probe_drive.html").write_text(text[:500000], encoding="utf-8")
print("status", r.status_code, "len", len(text))
ids = re.findall(r'\["([a-zA-Z0-9_-]{25,})","([^"]{3,200})"\]', text)
print("pairs", len(ids))
for _id, name in ids[:30]:
    if re.search(r"\.(pdf|docx?)$", name, re.I):
        print(_id, name[:100])
