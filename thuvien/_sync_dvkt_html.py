# -*- coding: utf-8 -*-
"""Đồng bộ runtime + report JS vào dich vụ kỹ thuật.html."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "dich vụ kỹ thuật.html"
RUNTIME_JS = BASE / "_dvkt_runtime.js"
REPORT_JS = BASE / "_dvkt_report.js"
MASTER_MAP_JS = BASE / "_dvkt_master_map.js"
BV_EMBED_JS = BASE / "_bv_embed.js"
PVHN_BHXH_EMBED_JS = BASE / "_pvhn_bhxh_embed.js"
BOOTSTRAP_JS = BASE / "_dvkt_bootstrap.js"
SHELL_MARKER = "  <!-- CORE JAVASCRIPT STATE ENGINE -->"
MARKER = "const INITIAL_TT23_PL2_DATA = "
FALLBACK_MARKER = "const INITIAL_PL1_DATA = "
RUNTIME_INJECT = "<!-- DVKT_RUNTIME_INJECT -->"


def _find_runtime_insert_end(html: str) -> int | None:
    """Vị trí chèn runtime: sau ]; của dataset cuối hoặc sau RUNTIME_INJECT."""
    if RUNTIME_INJECT in html:
        return html.find(RUNTIME_INJECT) + len(RUNTIME_INJECT)
    from _dvkt_data_io import _find_array_end

    for marker in (MARKER, FALLBACK_MARKER):
        idx = html.find(marker)
        if idx == -1:
            continue
        arr_start = html.find("[", idx + len(marker))
        if arr_start == -1:
            continue
        try:
            return _find_array_end(html, arr_start)
        except ValueError:
            continue
    return None


def sync_runtime(html: str) -> str:
    if SHELL_MARKER in html and html.find(SHELL_MARKER) < html.find(FALLBACK_MARKER, 0) if FALLBACK_MARKER in html else True:
        # Shell-only HTML: runtime nằm ngoài block data
        idx = html.find(SHELL_MARKER)
        if idx != -1 and MARKER not in html and FALLBACK_MARKER not in html:
            runtime = _load_runtime_bundle()
            script_tags = (
                f"\n  {RUNTIME_INJECT}\n  <script>\n{runtime}\n  </script>\n"
            )
            tail = html[idx:]
            if RUNTIME_INJECT in tail:
                return html
            return html[:idx] + script_tags + tail

    end_data = _find_runtime_insert_end(html)
    if end_data is None:
        idx = html.find(SHELL_MARKER)
        if idx == -1:
            raise SystemExit("Khong tim thay diem chen runtime")
        runtime = _load_runtime_bundle()
        inject = f"\n  {RUNTIME_INJECT}\n  <script>\n{runtime}\n  </script>\n"
        if RUNTIME_INJECT in html[:idx]:
            return html[:idx].rstrip() + "\n</body>\n</html>\n"
        return html[:idx].rstrip() + inject + "\n</body>\n</html>\n"
    script_close = html.find("  </script>", end_data)
    if script_close == -1:
        idx = html.find(SHELL_MARKER)
        if idx == -1:
            raise SystemExit("Khong tim thay the dong script")
        runtime = _load_runtime_bundle()
        inject = f"\n  {RUNTIME_INJECT}\n  <script>\n{runtime}\n  </script>\n"
        if RUNTIME_INJECT in html[:idx]:
            return html[:idx].rstrip() + "\n</body>\n</html>\n"
        return html[:idx].rstrip() + inject + "\n</body>\n</html>\n"
    runtime = _load_runtime_bundle()
    return html[:end_data] + "\n\n" + runtime + html[script_close:]


def _load_runtime_bundle() -> str:
    runtime = RUNTIME_JS.read_text(encoding="utf-8")
    master_map = MASTER_MAP_JS.read_text(encoding="utf-8") if MASTER_MAP_JS.is_file() else ""
    report = REPORT_JS.read_text(encoding="utf-8")
    bv_embed = ""
    if BV_EMBED_JS.is_file():
        bv_embed = BV_EMBED_JS.read_text(encoding="utf-8") + "\n\n"
    bhxh_embed = ""
    if PVHN_BHXH_EMBED_JS.is_file():
        bhxh_embed = PVHN_BHXH_EMBED_JS.read_text(encoding="utf-8") + "\n\n"
    bootstrap = BOOTSTRAP_JS.read_text(encoding="utf-8") if BOOTSTRAP_JS.is_file() else ""
    return bv_embed + bhxh_embed + bootstrap + "\n\n" + runtime + "\n\n" + master_map + report


def ensure_shell_patches(html: str) -> str:
    if "xlsx.full.min.js" not in html:
        html = html.replace(
            '<script src="https://cdn.tailwindcss.com"></script>',
            '<script src="https://cdn.tailwindcss.com"></script>\n'
            '  <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>',
        )

    if 'id="filterPhamVi"' not in html:
        html = html.replace(
            """          <div>
            <select
              id="filterPhanTuyen"
""",
            """          <div>
            <select
              id="filterPhamVi"
              onchange="handleFilterPhamVi(this.value)"
              class="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="">-- Mọi phạm vi HN --</option>
              <option value="CO_PVHN">Đã gắn PVHN</option>
              <option value="KHONG_PVHN">Chưa gắn PVHN</option>
              <option value="PVHN_BSYK">BS Y khoa</option>
              <option value="PVHN_BSCK">Tất cả BS chuyên khoa</option>
              <option value="PVHN_BSCK_HSCC">BS CK — Hồi sức cấp cứu</option>
              <option value="PVHN_BSCK_NOI">BS CK — Nội khoa</option>
              <option value="PVHN_BSCK_NGOAI">BS CK — Ngoại khoa</option>
              <option value="PVHN_BSCK_GMH">BS CK — Gây mê hồi sức</option>
              <option value="PVHN_BSCK_DQ">BS CK — Điện quang</option>
              <option value="PVHN_BSCK_TMH">BS CK — Tai Mũi Họng</option>
              <option value="PVHN_BSCK_PS">BS CK — Phụ sản</option>
              <option value="PVHN_KTY">Kỹ thuật y</option>
              <option value="PVHN_DD">Điều dưỡng</option>
              <option value="PVHN_CCNV">Cấp cứu ngoại viện</option>
            </select>
          </div>

          <div>
            <select
              id="filterPhanTuyen"
""",
        )

    if 'id="statPvhnMapped"' not in html:
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-slate-50 border border-slate-200">
          <p class="text-[10px] uppercase text-slate-600 font-bold">Liên kết 2 chiều</p>
          <p id="statLinked" class="text-lg font-bold text-slate-800">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-slate-50 border border-slate-200">
          <p class="text-[10px] uppercase text-slate-600 font-bold">Liên kết 2 chiều</p>
          <p id="statLinked" class="text-lg font-bold text-slate-800">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
          <p class="text-[10px] uppercase text-blue-700 font-bold">Đã gắn PVHN</p>
          <p id="statPvhnMapped" class="text-lg font-bold text-blue-900">0</p>
        </div>
      </div>""",
        )

    if 'id="reportModal"' not in html:
        html = html.replace(
            "  <!-- CORE JAVASCRIPT STATE ENGINE -->",
            """  <!-- MODAL 3: BÁO CÁO TÙY BIẾN -->
  <div id="reportModal" class="fixed inset-0 bg-black/50 z-[8500] hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="p-5 bg-indigo-600 text-white flex justify-between items-center">
        <div>
          <h3 class="text-base font-bold">Báo cáo tùy biến DVKT</h3>
          <p class="text-xs text-indigo-100">QĐ 7603 · TT23 · Phạm vi hành nghề TT32</p>
        </div>
        <button onclick="closeReportModal()" class="text-white hover:text-indigo-100 text-2xl font-bold">✕</button>
      </div>
      <div id="reportModalBody" class="flex-1 overflow-y-auto p-5"></div>
      <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
        <button onclick="closeReportModal()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold">Đóng</button>
        <button onclick="exportDvktReport()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">Xuất Excel (.xlsx)</button>
      </div>
    </div>
  </div>

  <!-- CORE JAVASCRIPT STATE ENGINE -->""",
        )

    html = html.replace('onclick="exportCSV()"', 'onclick="exportXlsx()"')
    html = html.replace('<span>📤 Xuất CSV</span>', '<span>📤 Xuất Excel</span>')
    html = html.replace('title="Xuất bảng hiện tại ra tệp CSV để đọc trong Excel"', 'title="Xuất bảng hiện tại ra tệp Excel (.xlsx)"')
    html = html.replace('onclick="handleImportCSV(event)"', 'onclick="handleImportXlsx(event)"')
    html = html.replace('accept=".csv"', 'accept=".xlsx,.xls"')
    html = html.replace('id="csvFileInput"', 'id="xlsxFileInput"')
    html = html.replace('<span>📂 Nhập CSV</span>', '<span>📂 Nhập Excel</span>')
    html = html.replace('title="Nhập danh sách từ file CSV của bạn"', 'title="Nhập danh sách từ file Excel (.xlsx)"')
    html = html.replace('title="Tải file mẫu định dạng CSV chuẩn"', 'title="Tải file mẫu định dạng Excel (.xlsx)"')

    if 'openReportModal()' not in html:
        html = html.replace(
            """          <button
            onclick="openFieldModal()"
""",
            """          <button
            onclick="openReportModal()"
            class="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
            title="Tạo báo cáo tùy biến theo cột và phạm vi hành nghề"
          >
            <span>📊 Báo cáo</span>
          </button>

          <button
            onclick="openFieldModal()"
""",
        )

    if "TT32/2023" not in html[:3000]:
        html = html.replace(
            "QĐ 7603/QĐ-BYT · Thông tư 23/2024/TT-BYT · Mapping đa yếu tố (mã + tên)",
            "QĐ 7603 · TT23 · TT32 PVHN · Mapping đa yếu tố",
        )

    if 'Mapping đa yếu tố: QĐ 7603' not in html:
        html = html.replace(
            "Mapping đa yếu tố: mã TT43/TT23 + tên dịch vụ kỹ thuật — mỗi dòng gắn thẻ nguồn văn bản rõ ràng",
            "Mapping đa yếu tố: QĐ 7603 · TT23 (PL1/PL2) · Phạm vi hành nghề TT32 — thẻ gắn liền từng dòng",
        )

    if 'statFullMapped' not in html:
        html = html.replace(
            'id="statPvhnMapped"',
            'id="statPvhnMapped"',
        )
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
          <p class="text-[10px] uppercase text-blue-700 font-bold">Đã gắn PVHN</p>
          <p id="statPvhnMapped" class="text-lg font-bold text-blue-900">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
          <p class="text-[10px] uppercase text-blue-700 font-bold">Đã gắn PVHN</p>
          <p id="statPvhnMapped" class="text-lg font-bold text-blue-900">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
          <p class="text-[10px] uppercase text-indigo-700 font-bold">Mapping đủ 3 nguồn</p>
          <p id="statFullMapped" class="text-lg font-bold text-indigo-900">0</p>
        </div>
      </div>""",
        )

    if 'value="FULL_MAPPING"' not in html:
        html = html.replace(
            '<option value="DA_LIEN_KET">🔗 Đã liên kết QĐ7603 ↔ TT23</option>',
            '<option value="DA_LIEN_KET">🔗 Đã liên kết QĐ7603 ↔ TT23</option>\n'
            '              <option value="CO_PVHN">🏷️ Đã gắn phạm vi hành nghề</option>\n'
            '              <option value="KHONG_PVHN">⚠ Chưa gắn phạm vi hành nghề</option>\n'
            '              <option value="FULL_MAPPING">✅ Mapping đủ 7603+TT23+PVHN</option>',
        )

    if 'PVHN TT32' not in html:
        html = html.replace(
            '<span class="text-violet-400">TT23-PL2</span></p>',
            '<span class="text-violet-400">TT23-PL2</span> · <span class="text-blue-400">PVHN TT32</span></p>',
        )

    if 'BV_PCST' not in html:
        html = html.replace(
            "TT23_PL2: { label: 'TT23-PL2', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 2 (Danh mục phẫu thuật)', cls: 'bg-violet-100 text-violet-800 border border-violet-200' }\n    };",
            "TT23_PL2: { label: 'TT23-PL2', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 2 (Danh mục phẫu thuật)', cls: 'bg-violet-100 text-violet-800 border border-violet-200' },\n"
            "      BV_PCST: { label: 'BV PCST', full: 'Bệnh viện Quốc tế Phương Châu Sóc Trăng — Danh mục DVKT M05', cls: 'bg-cyan-100 text-cyan-900 border border-cyan-200' }\n"
            "    };",
        )

    if 'item.maDichVu' not in html:
        html = html.replace(
            "return item.maTuongDuong || item._rowId || `${item.maKyThuat || 'row'}_${item.stt}`;",
            "return item.maTuongDuong || item.maDichVu || item._rowId || `${item.maKyThuat || 'row'}_${item.stt}`;",
        )

    if 'tabBtn-bvpcst' not in html:
        html = html.replace(
            """      <button onclick="switchTab('tt23pl2')" id="tabBtn-tt23pl2" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>📘 TT23 — PHỤ LỤC 2</span>
        <span id="tabCount-tt23pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
            """      <button onclick="switchTab('tt23pl2')" id="tabBtn-tt23pl2" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>📘 TT23 — PHỤ LỤC 2</span>
        <span id="tabCount-tt23pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sóc Trăng</span>
        <span id="tabCount-bvpcst" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
        )

    if 'CO_TAI_BV_PCST' not in html:
        html = html.replace(
            '<option value="FULL_MAPPING">✅ Mapping đủ 7603+TT23+PVHN</option>',
            '<option value="FULL_MAPPING">✅ Mapping đủ 7603+TT23+PVHN</option>\n'
            '              <option value="CO_TAI_BV_PCST">🏥 Có tại BV PC Sóc Trăng</option>',
        )

    if 'statBvPcstMapped' not in html:
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
          <p class="text-[10px] uppercase text-indigo-700 font-bold">Mapping đủ 3 nguồn</p>
          <p id="statFullMapped" class="text-lg font-bold text-indigo-900">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
          <p class="text-[10px] uppercase text-indigo-700 font-bold">Mapping đủ 3 nguồn</p>
          <p id="statFullMapped" class="text-lg font-bold text-indigo-900">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-cyan-50 border border-cyan-100">
          <p class="text-[10px] uppercase text-cyan-700 font-bold">BV PCST đã map</p>
          <p id="statBvPcstMapped" class="text-lg font-bold text-cyan-900">0</p>
        </div>
      </div>""",
        )

    if 'BV_PCCT' not in html:
        html = html.replace(
            "BV_PCST: { label: 'BV PCST', full: 'Bệnh viện Quốc tế Phương Châu Sóc Trăng — Danh mục DVKT M05', cls: 'bg-cyan-100 text-cyan-900 border border-cyan-200' }\n    };",
            "BV_PCST: { label: 'BV PCST', full: 'Bệnh viện Quốc tế Phương Châu Sóc Trăng — Danh mục DVKT M05', cls: 'bg-cyan-100 text-cyan-900 border border-cyan-200' },\n"
            "      BV_PCCT: { label: 'BV PCCT', full: 'Bệnh viện Quốc tế Phương Châu Cần Thơ — Danh mục DVKT', cls: 'bg-teal-100 text-teal-900 border border-teal-200' }\n"
            "    };",
        )

    if 'tabBtn-bvpcct' not in html:
        html = html.replace(
            """      <button onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sóc Trăng</span>
        <span id="tabCount-bvpcst" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
            """      <button onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sóc Trăng</span>
        <span id="tabCount-bvpcst" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('bvpcct')" id="tabBtn-bvpcct" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Cần Thơ</span>
        <span id="tabCount-bvpcct" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
        )

    if 'CO_TAI_BV_PCCT' not in html:
        html = html.replace(
            '<option value="CO_TAI_BV_PCST">🏥 Có tại BV PC Sóc Trăng</option>',
            '<option value="CO_TAI_BV_PCST">🏥 Có tại BV PC Sóc Trăng</option>\n'
            '              <option value="CO_TAI_BV_PCCT">🏥 Có tại BV PC Cần Thơ</option>',
        )

    if 'statBvPcctMapped' not in html:
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-cyan-50 border border-cyan-100">
          <p class="text-[10px] uppercase text-cyan-700 font-bold">BV PCST đã map</p>
          <p id="statBvPcstMapped" class="text-lg font-bold text-cyan-900">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-cyan-50 border border-cyan-100">
          <p class="text-[10px] uppercase text-cyan-700 font-bold">BV PCST đã map</p>
          <p id="statBvPcstMapped" class="text-lg font-bold text-cyan-900">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-teal-50 border border-teal-100">
          <p class="text-[10px] uppercase text-teal-700 font-bold">BV PCCT đã map</p>
          <p id="statBvPcctMapped" class="text-lg font-bold text-teal-900">0</p>
        </div>
      </div>""",
        )

    if 'BV_PSD' not in html:
        html = html.replace(
            "BV_PCCT: { label: 'BV PCCT', full: 'Bệnh viện Quốc tế Phương Châu Cần Thơ — Danh mục DVKT', cls: 'bg-teal-100 text-teal-900 border border-teal-200' }\n    };",
            "BV_PCCT: { label: 'BV PCCT', full: 'Bệnh viện Quốc tế Phương Châu Cần Thơ — Danh mục DVKT', cls: 'bg-teal-100 text-teal-900 border border-teal-200' },\n"
            "      BV_PSD: { label: 'BV Sa Đéc', full: 'Bệnh viện Phương Châu Sa Đéc — Danh mục DVKT', cls: 'bg-emerald-100 text-emerald-900 border border-emerald-200' }\n"
            "    };",
        )

    if 'tabBtn-bvpsd' not in html:
        html = html.replace(
            """      <button onclick="switchTab('bvpcct')" id="tabBtn-bvpcct" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Cần Thơ</span>
        <span id="tabCount-bvpcct" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
            """      <button onclick="switchTab('bvpcct')" id="tabBtn-bvpcct" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Cần Thơ</span>
        <span id="tabCount-bvpcct" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('bvpsd')" id="tabBtn-bvpsd" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sa Đéc</span>
        <span id="tabCount-bvpsd" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
        )

    if 'CO_TAI_BV_PSD' not in html:
        html = html.replace(
            '<option value="CO_TAI_BV_PCCT">🏥 Có tại BV PC Cần Thơ</option>',
            '<option value="CO_TAI_BV_PCCT">🏥 Có tại BV PC Cần Thơ</option>\n'
            '              <option value="CO_TAI_BV_PSD">🏥 Có tại BV PC Sa Đéc</option>',
        )

    if 'statBvPsdMapped' not in html:
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-teal-50 border border-teal-100">
          <p class="text-[10px] uppercase text-teal-700 font-bold">BV PCCT đã map</p>
          <p id="statBvPcctMapped" class="text-lg font-bold text-teal-900">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-teal-50 border border-teal-100">
          <p class="text-[10px] uppercase text-teal-700 font-bold">BV PCCT đã map</p>
          <p id="statBvPcctMapped" class="text-lg font-bold text-teal-900">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <p class="text-[10px] uppercase text-emerald-700 font-bold">BV Sa Đéc đã map</p>
          <p id="statBvPsdMapped" class="text-lg font-bold text-emerald-900">0</p>
        </div>
      </div>""",
        )

    if 'tabBtn-mapfull' not in html:
        html = html.replace(
            """      <button onclick="switchTab('tt23pl2')" id="tabBtn-tt23pl2" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>📘 TT23 — PHỤ LỤC 2</span>
        <span id="tabCount-tt23pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" """,
            """      <button onclick="switchTab('tt23pl2')" id="tabBtn-tt23pl2" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>📘 TT23 — PHỤ LỤC 2</span>
        <span id="tabCount-tt23pl2" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('mapfull')" id="tabBtn-mapfull" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🔗 Mapping tổng hợp</span>
        <span id="tabCount-mapfull" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('bvpcst')" id="tabBtn-bvpcst" """,
        )

    if 'FULL_7603_TT23_PVHN' not in html:
        html = html.replace(
            '<option value="CO_TAI_BV_PSD">🏥 Có tại BV PC Sa Đéc</option>',
            '<option value="CO_TAI_BV_PSD">🏥 Có tại BV PC Sa Đéc</option>\n'
            '              <option value="FULL_7603_TT23_PVHN">✅ Đủ 7603+TT23+PVHN</option>\n'
            '              <option value="FULL_ALL">✅ Đủ 7603+TT23+PVHN+có BV</option>\n'
            '              <option value="CO_CA_3_BV">🏥 Có tại cả 3 BV</option>\n'
            '              <option value="CO_IT_NHAT_1_BV">🏥 Có tại ≥1 BV</option>\n'
            '              <option value="CHENH_GIA_BV">💰 Chênh giá giữa các BV</option>\n'
            '              <option value="CHUA_DU_MAPPING">⚠ Chưa đủ mapping</option>\n'
            '              <option value="CHI_BV_CHUA_MAP">⚠ Chỉ BV (chưa QĐ7603)</option>\n'
            '              <option value="KHONG_TT23">⚠ Chưa liên kết TT23</option>',
        )

    if 'tabBtn-baocao' not in html:
        html = html.replace(
            """      <button onclick="switchTab('bvpsd')" id="tabBtn-bvpsd" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sa Đéc</span>
        <span id="tabCount-bvpsd" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>
    </div>""",
            """      <button onclick="switchTab('bvpsd')" id="tabBtn-bvpsd" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>🏥 BV PC Sa Đéc</span>
        <span id="tabCount-bvpsd" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">0</span>
      </button>

      <button onclick="switchTab('baocao')" id="tabBtn-baocao" class="py-3 px-6 font-semibold text-sm rounded-t-lg transition-all duration-150 whitespace-nowrap flex items-center space-x-2 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-t border-x border-slate-200">
        <span>📊 Báo cáo tùy biến</span>
        <span id="tabCount-baocao" class="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">—</span>
      </button>
    </div>""",
        )

    if 'id="dvktDataPanel"' not in html:
        html = html.replace(
            """      <!-- BỘ LỌC TÌM KIẾM VÀ CÁC THAO TÁC NHANH -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">""",
            """      <div id="dvktReportPanel" class="hidden"></div>

      <div id="dvktDataPanel">
      <!-- BỘ LỌC TÌM KIẾM VÀ CÁC THAO TÁC NHANH -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">""",
        )
        html = html.replace(
            """        </div>
      </div>

    </div>
  </main>""",
            """        </div>
      </div>

      </div><!-- /dvktDataPanel -->

    </div>
  </main>""",
            1,
        )

    if 'statMasterFull' not in html:
        html = html.replace(
            """        <div class="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <p class="text-[10px] uppercase text-emerald-700 font-bold">BV Sa Đéc đã map</p>
          <p id="statBvPsdMapped" class="text-lg font-bold text-emerald-900">0</p>
        </div>
      </div>""",
            """        <div class="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <p class="text-[10px] uppercase text-emerald-700 font-bold">BV Sa Đéc đã map</p>
          <p id="statBvPsdMapped" class="text-lg font-bold text-emerald-900">0</p>
        </div>
        <div class="text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
          <p class="text-[10px] uppercase text-indigo-700 font-bold">Mapping đủ 5 nguồn</p>
          <p id="statMasterFull" class="text-lg font-bold text-indigo-900">0</p>
        </div>
      </div>""",
        )

    from _dvkt_sidebar_layout import apply_sidebar_layout

    html = apply_sidebar_layout(html)

    from _dvkt_compact_stats import apply_compact_stats

    html = apply_compact_stats(html)

    from _dvkt_sidebar_layout import patch_bhxh_sidebar_tab

    html = patch_bhxh_sidebar_tab(html)

    return html


def main():
    html = HTML_PATH.read_text(encoding="utf-8")
    html = ensure_shell_patches(html)
    html = sync_runtime(html)
    HTML_PATH.write_text(html, encoding="utf-8")
    print(f"Da dong bo runtime + shell vao HTML ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()
