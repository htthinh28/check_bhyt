# -*- coding: utf-8 -*-
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
text = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html").read_text(encoding="utf-8")
for tag in ["</body>", "</html>", "// --- CONSTANTS", "DOMContentLoaded"]:
    print(tag, text.find(tag))

body = text.find("</body>")
html_end = text.find("</html>")
main = text.find("// --- CONSTANTS")
print("Order OK:", main < body < html_end if all(x>=0 for x in [main, body, html_end]) else "BAD")
