# -*- coding: utf-8 -*-
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _apply_icd_patch import JS_REPLACEMENTS, patch_js_head

html = Path(r'G:/My Drive/Thu vien (1)/Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html').read_text(encoding='utf-8')
start = html.find('const INITIAL_STANDARD_FIELDS')
script_start = html.rfind('<script', 0, start)
script_end = html.find('</script>', start)
script_part = html[script_start:script_end + 9]
missing = [i for i,(o,_) in enumerate(JS_REPLACEMENTS) if o not in script_part]
print('script len', len(script_part))
print('missing indices', missing)
for i in missing:
    print('---', i, JS_REPLACEMENTS[i][0][:80])
