# -*- coding: utf-8 -*-
"""Dashboard thống kê compact (~3cm) gắn trong header."""
from __future__ import annotations

COMPACT_STATS_CSS = """
    .dvkt-stat-chip {
      width: 3cm;
      min-width: 3cm;
      height: 3cm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.15rem;
      padding: 0.25rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(0,0,0,0.06);
      text-align: center;
      line-height: 1.1;
    }
    .dvkt-stat-chip .dvkt-stat-label {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      opacity: 0.9;
      max-height: 1.4em;
      overflow: hidden;
    }
    .dvkt-stat-chip .dvkt-stat-value {
      font-size: 0.95rem;
      font-weight: 800;
      line-height: 1;
    }
    .dvkt-stats-strip {
      scrollbar-width: thin;
    }
    .dvkt-stats-strip::-webkit-scrollbar {
      height: 4px;
    }
    .dvkt-stats-strip::-webkit-scrollbar-thumb {
      background: rgba(244, 63, 94, 0.35);
      border-radius: 4px;
    }
"""

def _chip(label: str, value_id: str, bg: str, text: str, border: str) -> str:
    return f"""        <div class="dvkt-stat-chip shrink-0 {bg} {border}">
          <p class="dvkt-stat-label {text}">{label}</p>
          <p id="{value_id}" class="dvkt-stat-value {text.replace('-700', '-900').replace('-600', '-900')}">0</p>
        </div>"""


COMPACT_STATS_STRIP = """
    <div class="border-t border-white/25 bg-white/95 backdrop-blur-sm">
      <div class="max-w-[1920px] mx-auto px-2 sm:px-4 py-2">
        <div class="dvkt-stats-strip flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
""" + "\n".join([
    _chip("QĐ7603 PL1", "statTagQd7603", "bg-rose-50", "text-rose-700", "border-rose-100"),
    _chip("TT23 PL1", "statTagTt23Pl1", "bg-emerald-50", "text-emerald-700", "border-emerald-100"),
    _chip("TT23 PL2", "statTagTt23Pl2", "bg-violet-50", "text-violet-700", "border-violet-100"),
    _chip("Map TT23", "statMapped", "bg-sky-50", "text-sky-700", "border-sky-100"),
    _chip("Chưa khớp", "statUnmapped", "bg-amber-50", "text-amber-700", "border-amber-100"),
    _chip("Liên kết 2C", "statLinked", "bg-slate-50", "text-slate-600", "border-slate-200"),
    _chip("PVHN", "statPvhnMapped", "bg-blue-50", "text-blue-700", "border-blue-100"),
    _chip("BHXH", "statBhxhMapped", "bg-sky-50", "text-sky-800", "border-sky-100"),
    _chip("Map 3 nguồn", "statFullMapped", "bg-indigo-50", "text-indigo-700", "border-indigo-100"),
    _chip("BV PCST", "statBvPcstMapped", "bg-cyan-50", "text-cyan-700", "border-cyan-100"),
    _chip("BV PCCT", "statBvPcctMapped", "bg-teal-50", "text-teal-700", "border-teal-100"),
    _chip("BV Sa Đéc", "statBvPsdMapped", "bg-emerald-50", "text-emerald-700", "border-emerald-100"),
    _chip("Map 5 nguồn", "statMasterFull", "bg-indigo-50", "text-indigo-800", "border-indigo-200"),
    _chip("PL2 Δ", "statPl2", "bg-amber-50", "text-amber-800", "border-amber-100"),
    _chip("PL3 huỷ", "statPl3", "bg-red-50", "text-red-700", "border-red-100"),
    _chip("Trường", "statFields", "bg-sky-50", "text-sky-800", "border-sky-100"),
]) + """
        </div>
      </div>
    </div>
"""

# statPl1 trùng statTagQd7603 — giữ id ẩn cho JS
COMPACT_STATS_HIDDEN = '<span id="statPl1" class="hidden" aria-hidden="true">0</span>\n'

OLD_STATS_SECTION_START = "  <!-- DATA REPORTING & ANALYTICS CARDS -->"
OLD_STATS_SECTION_END = "  <!-- CORE WORKSPACE -->"


def apply_compact_stats(html: str) -> str:
    if "dvkt-stat-chip" in html:
        return html

    if COMPACT_STATS_CSS not in html:
        html = html.replace("</style>", COMPACT_STATS_CSS + "\n  </style>", 1)

    start = html.find(OLD_STATS_SECTION_START)
    end = html.find(OLD_STATS_SECTION_END)
    if start != -1 and end != -1 and end > start:
        html = html[:start] + html[end:]

    header_close = "  </header>"
    if header_close not in html:
        return html
    html = html.replace(
        header_close,
        COMPACT_STATS_HIDDEN + COMPACT_STATS_STRIP + "\n  </header>",
        1,
    )
    return html
