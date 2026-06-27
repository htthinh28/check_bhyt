# -*- coding: utf-8 -*-
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

html_path = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html")
text = html_path.read_text(encoding="utf-8")
print("File size:", len(text))
print("Has </html>:", "</html>" in text)
print("navigateToSection:", "function navigateToSection" in text)

# find main app script (last big script block before </body>)
scripts = list(re.finditer(r"<script(?![^>]*type=[\"']application/json[\"'])[^>]*>", text))
print("Non-json script tags:", len(scripts))
for i, m in enumerate(scripts):
    start = m.end()
    end = text.find("</script>", start)
    chunk = text[start:end]
    print(f"  script {i+1}: start={m.start()}, len={len(chunk):,}, has navigate={('function navigateToSection' in chunk)}")

main = None
for m in reversed(scripts):
    start = m.end()
    end = text.find("</script>", start)
    chunk = text[start:end]
    if "function navigateToSection" in chunk:
        main = chunk
        break

if not main:
    print("ERROR: main script not found")
    sys.exit(1)

js_path = html_path.parent / "_extracted_main.js"
js_path.write_text(main, encoding="utf-8")
print("Wrote", js_path.name, "bytes", len(main))

# node syntax check
try:
    r = subprocess.run(["node", "--check", str(js_path)], capture_output=True, text=True)
    print("node --check exit:", r.returncode)
    if r.stdout:
        print("stdout:", r.stdout[:2000])
    if r.stderr:
        print("stderr:", r.stderr[:4000])
except FileNotFoundError:
    print("node not found, skip syntax check")

# check for accidental </script> in main script strings
if re.search(r"</script>", main, re.I):
    print("WARN: literal </script> found inside main script")
