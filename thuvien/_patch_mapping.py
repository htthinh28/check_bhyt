# -*- coding: utf-8 -*-
import shutil
from pathlib import Path

DIR = Path(r"C:\Users\admin\Desktop\Thu vien")
src = next(p for p in DIR.glob("*.html") if "(1)" not in p.name and "CH" in p.name)
dst = next(p for p in DIR.glob("*(1)*.html"))
module_js = (DIR / "_mapping_module.js").read_text(encoding="utf-8")

shutil.copy2(src, dst)
text = dst.read_text(encoding="utf-8")

CSS_ANCHOR = "        #duocThuToolbar.collapsed { display: none !important; }\n"
CSS_INSERT = CSS_ANCHOR + """        #duocMappingPanel { display: none; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; background: #f8fafc; }
        #duocMappingPanel.is-active { display: flex; }
        #sectionDuocThu.mapping-mode #workspace { display: none !important; }
        #sectionDuocThu.mapping-mode #duocDrugHeader { display: none !important; }
        .mapping-layout { display: flex; flex: 1; min-height: 0; overflow: hidden; flex-direction: column; }
        .mapping-config {
            width: 100%; flex-shrink: 0; flex-grow: 0;
            height: var(--mapping-config-h, 38%);
            min-height: 7rem; max-height: calc(100% - 7rem);
            background: #fff; overflow-y: auto;
        }
        .mapping-splitter {
            flex-shrink: 0; height: 0.625rem; cursor: row-resize; touch-action: none;
            background: linear-gradient(to bottom, #e2e8f0, #cbd5e1, #e2e8f0);
            border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;
            display: flex; align-items: center; justify-content: center; user-select: none; z-index: 3;
        }
        .mapping-splitter::after {
            content: ''; width: 2.5rem; height: 0.2rem; border-radius: 999px;
            background: #94a3b8; box-shadow: 0 0.125rem 0 rgb(100 116 139 / 0.25);
        }
        .mapping-splitter:hover, .mapping-splitter.is-dragging {
            background: linear-gradient(to bottom, #fce7f3, #f9a8d4, #fce7f3);
        }
        .mapping-splitter:hover::after, .mapping-splitter.is-dragging::after { background: #db2777; }
        body.mapping-split-drag { cursor: row-resize !important; user-select: none !important; }
        body.mapping-split-drag * { cursor: row-resize !important; }
        .mapping-preview { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
        .mapping-section-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0.75rem 0 0.35rem; }
        .mapping-col-item { display: flex; align-items: flex-start; gap: 0.35rem; padding: 0.3rem 0.4rem; border-radius: 0.45rem; font-size: 0.72rem; line-height: 1.35; cursor: pointer; }
        .mapping-col-item:hover { background: #fdf2f8; }
        .mapping-col-item input { margin-top: 0.15rem; flex-shrink: 0; }
        .mapping-preset-btn { display: block; width: 100%; text-align: left; padding: 0.45rem 0.55rem; margin-bottom: 0.35rem; border: 1px solid #e2e8f0; border-radius: 0.55rem; background: #fff; font-size: 0.72rem; font-weight: 600; color: #334155; cursor: pointer; }
        .mapping-preset-btn:hover { border-color: #f9a8d4; background: #fdf2f8; color: #9d174d; }
        .mapping-preview-table { font-size: 0.68rem; }
        .mapping-preview-table th { position: sticky; top: 0; z-index: 2; background: #f1f5f9; white-space: nowrap; }
        .mapping-preview-table td { max-width: 14rem; word-break: break-word; vertical-align: top; }
"""

BTN_OLD = """        <button onclick="openModal('FIELDS')" class="btn-secondary shrink-0">
            <i data-lucide="settings" class="w-4 h-4 sm:mr-2 shrink-0"></i>
            <span class="hidden sm:inline truncate">Trường dữ liệu</span>
            <span class="sm:hidden">Trường</span>
        </button>
        <input type="file" id="fileInput" accept=".csv" class="hidden" onchange="handleImport(event)">"""

BTN_NEW = """        <button onclick="openModal('FIELDS')" class="btn-secondary shrink-0">
            <i data-lucide="settings" class="w-4 h-4 sm:mr-2 shrink-0"></i>
            <span class="hidden sm:inline truncate">Trường dữ liệu</span>
            <span class="sm:hidden">Trường</span>
        </button>
        <button type="button" id="btnDuocMapping" onclick="toggleDuocMappingMode()" class="btn-secondary shrink-0" title="Báo cáo mapping linh hoạt: ICD-10, BYT, BV">
            <i data-lucide="table-2" class="w-4 h-4 sm:mr-2 shrink-0"></i>
            <span class="hidden sm:inline truncate">Mapping / Báo cáo</span>
            <span class="sm:hidden">Mapping</span>
        </button>
        <input type="file" id="fileInput" accept=".csv" class="hidden" onchange="handleImport(event)">"""

MAPPING_HTML = """
    <!-- MAPPING / BÁO CÁO LINH HOẠT -->
    <div id="duocMappingPanel" class="hidden" aria-label="Mapping dược thư ICD BYT BV">
        <div class="shrink-0 px-3 sm:px-4 md:px-6 py-2 bg-white border-b border-gray-200 flex flex-wrap items-center gap-2">
            <div class="min-w-0 flex-1">
                <h2 class="text-sm sm:text-base font-extrabold text-gray-800">Mapping &amp; báo cáo tùy biến</h2>
                <p class="text-[10px] sm:text-xs text-gray-500">Ghép dược thư · ICD-10 chi tiết · danh mục BYT · danh mục BV — chọn cột và kiểu dòng cần xuất.</p>
            </div>
            <button type="button" onclick="exportMappingReport('xlsx')" class="btn-primary shrink-0 text-xs">
                <i data-lucide="download" class="w-4 h-4 sm:mr-1"></i><span class="hidden sm:inline">Xuất Excel</span>
            </button>
            <button type="button" onclick="exportMappingReport('csv')" class="btn-secondary shrink-0 text-xs">
                <i data-lucide="file-spreadsheet" class="w-4 h-4 sm:mr-1"></i><span class="hidden sm:inline">CSV</span>
            </button>
            <button type="button" onclick="toggleDuocMappingMode(false)" class="btn-secondary shrink-0 text-xs">
                <i data-lucide="x" class="w-4 h-4 sm:mr-1"></i>Đóng
            </button>
        </div>
        <div class="mapping-layout flex-1 min-h-0" id="mappingLayout">
            <aside class="mapping-config scrollbar-thin p-3 sm:p-4" id="mappingConfigPanel"></aside>
            <div class="mapping-splitter" id="mappingSplitter" role="separator" aria-orientation="horizontal" aria-label="Kéo lên hoặc xuống để đổi chiều cao khung cấu hình" tabindex="0"></div>
            <div class="mapping-preview">
                <div id="mappingPreviewMeta" class="shrink-0 px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600"></div>
                <div id="mappingPreviewScroll" class="flex-1 overflow-auto catalog-scroll p-2 sm:p-3">
                    <div id="mappingPreviewTable"></div>
                </div>
            </div>
        </div>
    </div>
"""

JS_ANCHOR = "        // --- IMPORT / EXPORT (CSV) ---"
SHEETJS_TAG = '    <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>\n'

if "#duocMappingPanel {" not in text:
    if CSS_ANCHOR not in text:
        raise SystemExit("CSS anchor missing")
    text = text.replace(CSS_ANCHOR, CSS_INSERT, 1)

if "btnDuocMapping" not in text:
    if BTN_OLD not in text:
        raise SystemExit("toolbar button anchor missing")
    text = text.replace(BTN_OLD, BTN_NEW, 1)

if 'id="duocMappingPanel"' not in text:
    marker = '        <div id="duocMainColumn" class="duoc-main-column">'
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("duocMainColumn missing")
    close = text.find("    </section>", idx)
    jci = text.find("    <!-- MỤC JCI v8 -->", idx)
    if close < 0 or jci < 0 or close > jci:
        raise SystemExit(f"bad section close close={close} jci={jci}")
    text = text[:close] + MAPPING_HTML + text[close:]

if "MAPPING_STORAGE_KEY" not in text:
    if JS_ANCHOR not in text:
        raise SystemExit("JS anchor missing")
    text = text.replace(JS_ANCHOR, module_js + "\n" + JS_ANCHOR, 1)

if "let duocMappingActive" not in text:
    text = text.replace(
        "        let duocToolbarExpanded = true;",
        "        let duocToolbarExpanded = true;\n        let duocMappingActive = false;",
        1,
    )

if "duocMappingActive" not in text.split("function loadUiState")[1].split("function saveUiState")[0]:
    text = text.replace(
        "                if (typeof s.promtFiltersVisible === 'boolean') promtFiltersVisible = s.promtFiltersVisible;",
        "                if (typeof s.promtFiltersVisible === 'boolean') promtFiltersVisible = s.promtFiltersVisible;\n                if (typeof s.duocMappingActive === 'boolean') duocMappingActive = s.duocMappingActive;",
        1,
    )

if "duocMappingActive," not in text.split("function saveUiState")[1].split("function ")[0]:
    text = text.replace(
        "                    promtSidebarVisible, promtFiltersVisible,",
        "                    promtSidebarVisible, promtFiltersVisible, duocMappingActive,",
        1,
    )

old_update = """        function updateUI() {
            if (currentSection !== 'duocthu') {
                clearDuocDrugHeader();
                return;
            }
            renderTree();"""
new_update = """        function updateUI() {
            if (currentSection !== 'duocthu') {
                clearDuocDrugHeader();
                return;
            }
            if (duocMappingActive) return;
            renderTree();"""
if "if (duocMappingActive) return;" not in text and old_update in text:
    text = text.replace(old_update, new_update, 1)

restore_patch = """            if (saved.jciActiveCode && currentSection === 'jci' && jciReady) {
                showJciStandard(saved.jciActiveCode);
            }
            const needRetry = attempt < 60 && ("""
restore_new = """            if (saved.jciActiveCode && currentSection === 'jci' && jciReady) {
                showJciStandard(saved.jciActiveCode);
            }
            if (duocMappingActive && currentSection === 'duocthu' && dbReady) {
                toggleDuocMappingMode(true);
            }
            const needRetry = attempt < 60 && ("""
if restore_patch in text and "duocMappingActive && currentSection === 'duocthu'" not in text:
    text = text.replace(restore_patch, restore_new, 1)

if "xlsx.full.min.js" not in text and SHEETJS_TAG.strip() not in text:
    lucide_anchor = '    <script src="https://unpkg.com/lucide@latest"></script>\n'
    if lucide_anchor in text:
        text = text.replace(lucide_anchor, lucide_anchor + SHEETJS_TAG, 1)

dst.write_text(text, encoding="utf-8")
checks = {
    "lines": text.count("\n") + 1,
    "html_end": "</html>" in text,
    "mapping_fn": "toggleDuocMappingMode" in text,
    "panel": 'id="duocMappingPanel"' in text,
    "btn": "btnDuocMapping" in text,
    "xlsx": "xlsx.full.min.js" in text,
}
print("OK", checks)
