# -*- coding: utf-8 -*-
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
html = Path(r"G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html").read_text(encoding="utf-8")
for i in range(1, 15):
    pos = html.find(f'data-chunk="{i}"')
    print(f"chunk {i}: pos={pos}")
    if pos >= 0:
        line_end = html.find("\n", pos)
        has_close = html.find("</script>", pos, line_end if line_end > 0 else pos+5000000) >= 0
        print(f"  line_end={line_end}, has </script> on same line={has_close}")
print("file ends:", repr(html[-80:]))
