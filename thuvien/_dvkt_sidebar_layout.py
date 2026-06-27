# -*- coding: utf-8 -*-
"""HTML sidebar trái — danh mục DVKT (nhúng vào shell)."""

SIDEBAR_WORKSPACE_OPEN = """  <!-- CORE WORKSPACE -->
  <div id="dvktWorkspace" class="flex-1 flex w-full max-w-[1920px] mx-auto relative min-h-0">

    <div id="dvktSidebarBackdrop" class="hidden fixed inset-0 bg-black/40 z-[6998] lg:hidden" onclick="closeMobileSidebar()"></div>

    <aside id="dvktSidebar" class="fixed lg:sticky top-0 left-0 z-[6999] h-full lg:h-auto lg:max-h-screen w-[17.5rem] xl:w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-200 shrink-0">
      <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">Danh mục DVKT</h2>
          <p class="text-[10px] text-slate-400 mt-0.5">Phụ lục &amp; nguồn dữ liệu</p>
        </div>
        <button type="button" onclick="closeMobileSidebar()" class="lg:hidden text-slate-400 hover:text-slate-600 text-xl leading-none px-1" aria-label="Đóng">✕</button>
      </div>
      <nav id="dvktSidebarNav" class="flex-1 overflow-y-auto py-3 px-2 space-y-4">

        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-600">Quyết định 7603/QĐ-BYT</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('pl1')" id="tabBtn-pl1" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 bg-rose-50 text-rose-900 border-rose-500">
              <span class="truncate text-left">📋 PL1 — Danh mục đầy đủ</span>
              <span id="tabCount-pl1" class="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('pl2')" id="tabBtn-pl2" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🔄 PL2 — Thay đổi / bổ sung</span>
              <span id="tabCount-pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('pl3')" id="tabBtn-pl3" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🚫 PL3 — Mã đã huỷ</span>
              <span id="tabCount-pl3" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Thông tư 23/2024/TT-BYT</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('tt23pl1')" id="tabBtn-tt23pl1" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">📗 TT23 — Phụ lục 1</span>
              <span id="tabCount-tt23pl1" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('tt23pl2')" id="tabBtn-tt23pl2" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">📘 TT23 — Phụ lục 2</span>
              <span id="tabCount-tt23pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">BHXH — Chức danh CM</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('pvhnbhxh')" id="tabBtn-pvhnbhxh" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">📋 Mã PVHN BHXH 2024</span>
              <span id="tabCount-pvhnbhxh" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Mapping &amp; báo cáo</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('mapfull')" id="tabBtn-mapfull" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🔗 Mapping tổng hợp</span>
              <span id="tabCount-mapfull" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('baocao')" id="tabBtn-baocao" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">📊 Báo cáo tùy biến</span>
              <span id="tabCount-baocao" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">—</span>
            </button>
          </div>
        </div>

        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700">CDSS Bảo hiểm y tế</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🏥 PC Sóc Trăng</span>
              <span id="tabCount-bvpcst" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('bvpcct')" id="tabBtn-bvpcct" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🏥 PC Cần Thơ</span>
              <span id="tabCount-bvpcct" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
            <button type="button" onclick="switchTab('bvpsd')" id="tabBtn-bvpsd" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🏥 PC Sa Đéc</span>
              <span id="tabCount-bvpsd" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

      </nav>
    </aside>

    <main class="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 py-4 lg:py-6">

      <div class="lg:hidden mb-4 flex items-center gap-3">
        <button type="button" onclick="toggleMobileSidebar()" class="shrink-0 flex items-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-md">
          <span class="text-lg leading-none">☰</span>
          <span>Danh mục</span>
        </button>
        <p id="dvktActiveTabLabel" class="text-sm font-semibold text-slate-700 truncate flex-1">PL1 — Danh mục đầy đủ</p>
      </div>

      <!-- CONTAINER CHÍNH -->
      <div class="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6">
"""

SIDEBAR_WORKSPACE_CLOSE = """    </div>
    </main>
  </div><!-- /dvktWorkspace -->
"""

# Marker để tìm và thay khối tab ngang cũ
OLD_WORKSPACE_START = "  <!-- CORE WORKSPACE -->"
OLD_CONTAINER_MARKER = '    <div class="bg-white rounded-b-xl shadow-md border-x border-b border-slate-200 p-6">'
NEW_CONTAINER_MARKER = '      <div class="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6">'


def apply_sidebar_layout(html: str) -> str:
    """Thay tab ngang bằng sidebar trái (idempotent nếu đã có dvktSidebar)."""
    if 'id="dvktSidebar"' in html:
        return html

    start = html.find(OLD_WORKSPACE_START)
    if start == -1:
        return html

    matched_marker = None
    container_idx = -1
    for m in (
        OLD_CONTAINER_MARKER,
        '    <div class="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6">',
        '    <div class="bg-white rounded-xl shadow-md border border-slate-200 p-6">',
    ):
        container_idx = html.find(m, start)
        if container_idx != -1:
            matched_marker = m
            break
    if container_idx == -1 or not matched_marker:
        return html

    alt_close = """      </div><!-- /dvktDataPanel -->

    </div>
  </main>

  <!-- FOOTER"""
    alt_new = """      </div><!-- /dvktDataPanel -->

""" + SIDEBAR_WORKSPACE_CLOSE + "\n  <!-- FOOTER"
    if alt_close in html:
        html = html.replace(alt_close, alt_new, 1)
    else:
        old_close = """    </div>
  </main>

  <!-- FOOTER"""
        if old_close in html:
            html = html.replace(old_close, SIDEBAR_WORKSPACE_CLOSE + "\n  <!-- FOOTER", 1)

    inner_start = container_idx + len(matched_marker)
    return html[:start] + SIDEBAR_WORKSPACE_OPEN + html[inner_start:]


def patch_qtkt_sidebar_tab(html: str) -> str:
    if "tabBtn-quytrinhkt" in html:
        return html
    needle = '<p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Mapping &amp; báo cáo</p>'
    if needle not in html:
        return html
    block = """
        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Quy trình kỹ thuật BYT</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('quytrinhkt')" id="tabBtn-quytrinhkt" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">🧭 Quy trình kỹ thuật</span>
              <span id="tabCount-quytrinhkt" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

"""
    return html.replace(needle, block + "        " + needle, 1)


def patch_bhxh_sidebar_tab(html: str) -> str:
    if "tabBtn-pvhnbhxh" in html:
        return html
    needle = '<p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Mapping &amp; báo cáo</p>'
    if needle not in html:
        return html
    block = """
        <div>
          <p class="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">BHXH — Chức danh CM</p>
          <div class="space-y-0.5">
            <button type="button" onclick="switchTab('pvhnbhxh')" id="tabBtn-pvhnbhxh" class="dvkt-sidebar-btn w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-r-lg transition-all border-l-4 text-slate-600 hover:bg-slate-50 border-transparent">
              <span class="truncate text-left">📋 Mã PVHN BHXH 2024</span>
              <span id="tabCount-pvhnbhxh" class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">0</span>
            </button>
          </div>
        </div>

        """
    return html.replace(needle, block + needle, 1)
