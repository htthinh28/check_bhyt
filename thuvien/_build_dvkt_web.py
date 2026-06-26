# -*- coding: utf-8 -*-
"""Dựng giao diện mỏng dvkt_app/static — không nhúng dữ liệu vào HTML."""
from __future__ import annotations

import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"
APP_STATIC = BASE / "dvkt_app" / "static"
SHELL_MARKERS = (
    "  <!-- CORE JAVASCRIPT STATE ENGINE -->",
    "  <!-- DVKT_RUNTIME_INJECT -->",
)

JS_FILES = [
    "_pc_crosslink.js",
    "_dvkt_header.js",
    "_pvhn_bhxh_embed.js",
    "_dvkt_bootstrap.js",
    "_dvkt_runtime.js",
    "_dvkt_master_map.js",
    "_dvkt_report.js",
    "_dvkt_qtkt.js",
]

LOADING_OVERLAY = """
  <div id="dvktLoadingOverlay" class="hidden fixed inset-0 z-[9000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl px-8 py-6 text-center max-w-sm mx-4">
      <div class="text-3xl mb-3 animate-pulse">⏳</div>
      <p class="text-sm font-semibold text-slate-800">Đang tải danh mục DVKT</p>
      <p id="dvktLoadingMessage" class="text-xs text-slate-500 mt-2">Vui lòng đợi...</p>
    </div>
  </div>
"""


def patch_bhxh_filter_options(html: str) -> str:
    if 'value="CO_BHXH"' in html:
        return html
    html = html.replace(
        '<option value="FULL_MAPPING">✅ Mapping đủ 7603+TT23+PVHN</option>',
        '<option value="FULL_MAPPING">✅ Mapping đủ 7603+TT23+PVHN+BHXH</option>\n'
        '              <option value="CO_BHXH">🏷️ Đã có mã BHXH</option>\n'
        '              <option value="KHONG_BHXH">⚠ Chưa có mã BHXH</option>\n'
        '              <option value="FULL_WITH_BHXH">✅ Đủ 7603+TT23+PVHN+BHXH</option>',
        1,
    )
    if 'FULL_7603_TT23_PVHN_BHXH' not in html:
        html = html.replace(
            '<option value="FULL_7603_TT23_PVHN">✅ Đủ 7603+TT23+PVHN</option>',
            '<option value="FULL_7603_TT23_PVHN_BHXH">✅ Đủ 7603+TT23+PVHN+BHXH</option>\n'
            '              <option value="FULL_7603_TT23_PVHN">✅ Đủ 7603+TT23+PVHN</option>',
            1,
        )
    return html


def load_shell() -> str:
    text = None
    if HTML_PATH.is_file():
        raw = HTML_PATH.read_text(encoding="utf-8")
        idx = -1
        for marker in SHELL_MARKERS:
            pos = raw.find(marker)
            if pos != -1 and (idx == -1 or pos < idx):
                idx = pos
        if idx != -1:
            text = raw[:idx].rstrip()
    if not text and (APP_STATIC / "index.html").is_file():
        text = (APP_STATIC / "index.html").read_text(encoding="utf-8")
        cut = text.find("\n  <script src=\"/static/js/")
        if cut != -1:
            text = text[:cut].rstrip()
    if not text:
        raise SystemExit("Khong tim thay shell HTML (marker hoac static/index.html)")
    from _dvkt_sidebar_layout import patch_bhxh_sidebar_tab

    text = patch_bhxh_sidebar_tab(text)
    from _dvkt_sidebar_layout import patch_qtkt_sidebar_tab

    text = patch_qtkt_sidebar_tab(text)
    from _dvkt_compact_stats import apply_compact_stats

    text = apply_compact_stats(text)
    text = patch_bhxh_filter_options(text)
    crosslink_nav = """
    <div class="flex flex-wrap items-center gap-1.5 mt-1 sm:mt-0">
      <button type="button" onclick="openPcDuocThuApp({section:'duocthu'})" class="text-[10px] px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 font-semibold" title="Mở Dược thư Phương Châu">💊 Dược thư</button>
      <button type="button" onclick="openPcDvktApp({tab:'quytrinhkt'})" class="text-[10px] px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 font-semibold" title="Quy trình kỹ thuật">📋 QTKT</button>
    </div>"""
    if "openPcDuocThuApp" not in text:
        text = text.replace(
            '<span class="bg-emerald-800/50 text-[10px] px-2 py-0.5 rounded-full text-emerald-50 border border-emerald-300/60 font-semibold">TT23</span>',
            '<span class="bg-emerald-800/50 text-[10px] px-2 py-0.5 rounded-full text-emerald-50 border border-emerald-300/60 font-semibold">TT23</span>'
            + crosslink_nav,
            1,
        )
    script_tags = "\n".join(
        f'  <script src="/static/js/{Path(name).name}"></script>' for name in JS_FILES
    )
    script_tags += '\n  <script>fetch("/static/pc_apps.json").then(r=>r.json()).then(j=>{window.PC_APP_LINKS=Object.assign(window.PC_APP_LINKS||{},j);}).catch(()=>{});</script>'
    return text + "\n" + LOADING_OVERLAY + "\n" + script_tags + "\n</body>\n</html>\n"


def main() -> None:
    if not HTML_PATH.is_file():
        raise SystemExit(f"Missing {HTML_PATH}")
    js_dir = APP_STATIC / "js"
    js_dir.mkdir(parents=True, exist_ok=True)
    for name in JS_FILES:
        src = BASE / name
        if not src.is_file():
            raise SystemExit(f"Missing {src}")
        shutil.copy2(src, js_dir / src.name)
    cfg_src = BASE / "dvkt_app" / "static" / "pc_apps.json"
    dst_cfg = APP_STATIC / "pc_apps.json"
    if cfg_src.is_file():
        try:
            shutil.copy2(cfg_src, dst_cfg)
        except OSError:
            dst_cfg.write_text(cfg_src.read_text(encoding="utf-8"), encoding="utf-8")
    index_html = load_shell()
    (APP_STATIC / "index.html").write_text(index_html, encoding="utf-8")
    size_kb = (APP_STATIC / "index.html").stat().st_size / 1024
    js_total = sum(f.stat().st_size for f in js_dir.glob("*.js"))
    print(f"Built {APP_STATIC / 'index.html'} ({size_kb:.0f} KB)")
    print(f"JS static: {js_total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
