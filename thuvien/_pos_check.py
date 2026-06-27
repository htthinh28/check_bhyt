# -*- coding: utf-8 -*-
from pathlib import Path
t = Path(r'G:/My Drive/Thu vien (1)/Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html').read_text(encoding='utf-8')
s = t.find('const INITIAL_STANDARD_FIELDS')
i = t.find('class="icd-data-chunk"')
d = t.find('class="drugs-data-chunk"')
print('init', s, 'icd', i, 'drugs', d, 'size', len(t))
if s > 0:
    script_start = t.rfind('<script', 0, s)
    script_end = t.find('</script>', s)
    print('script_start', script_start, 'script_end', script_end, 'len', script_end - script_start)
