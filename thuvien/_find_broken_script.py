# -*- coding: utf-8 -*-
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

text = Path(r"G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html").read_text(encoding="utf-8")

pos = 9345239
print("Context around 9345239:")
print(repr(text[pos:pos+500]))

# find </script> inside chunk 14 before its real end
start = text.find('data-chunk="14"')
start = text.rfind("<script", 0, start)
chunk_start = text.find(">", start) + 1
print("\nChunk 14 starts at", chunk_start)

# find FIRST </script> after chunk 14 start
first_close = text.lower().find("</script>", chunk_start)
print("First </script> after chunk 14 start:", first_close, "offset in chunk:", first_close - chunk_start)
print("Context at first close:", repr(text[first_close-60:first_close+20]))

# count all </script> between chunk 14 start and main script
main_script = text.find("<script>\n        // --- CONSTANTS")
print("\nMain script at:", main_script)
between = text[chunk_start:main_script]
hits = []
idx = 0
while True:
    i = between.lower().find("</script>", idx)
    if i < 0:
        break
    hits.append(i)
    idx = i + 1
print(f"</script> hits between chunk14 start and main script: {len(hits)}")
for h in hits[:5]:
    print(" ", repr(between[h-50:h+15]))
