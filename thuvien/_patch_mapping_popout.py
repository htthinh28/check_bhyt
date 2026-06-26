# -*- coding: utf-8 -*-
"""Mở Mapping / Báo cáo trong cửa sổ mới (#duocthu/mapping)."""
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")

EARLY_OLD = """        var VALID = { home: 1, duocthu: 1, khangsinh: 1, jci: 1, icd: 1, nd90: 1, qtkt: 1, promt: 1 };
        var section = null;
        try {
            var h = (location.hash || '').replace(/^#\\/?/, '').split(/[&?/]/)[0].toLowerCase();
            if (h && VALID[h]) section = h;
        } catch (_) {}"""

EARLY_NEW = """        var VALID = { home: 1, duocthu: 1, khangsinh: 1, jci: 1, icd: 1, nd90: 1, qtkt: 1, promt: 1 };
        var section = null;
        var mappingPopout = false;
        try {
            var hashRaw = (location.hash || '').replace(/^#\\/?/, '').toLowerCase();
            var hashParts = hashRaw.split(/[&?/]/);
            var h = hashParts[0];
            if (h && VALID[h]) section = h;
            if (hashParts[0] === 'duocthu' && hashParts.slice(1).indexOf('mapping') >= 0) mappingPopout = true;
        } catch (_) {}
        if (mappingPopout) document.documentElement.setAttribute('data-mapping-popout', 'true');"""

CSS_ANCHOR = "        .mapping-preview-table td { max-width: 14rem; word-break: break-word; vertical-align: top; }"
CSS_ADD = """        .mapping-preview-table td { max-width: 14rem; word-break: break-word; vertical-align: top; }
        html[data-mapping-popout="true"] .lib-nav-tabs { display: none !important; }
        html[data-mapping-popout="true"] #sectionDuocThu .lib-module-bar,
        html[data-mapping-popout="true"] #duocThuToolbar { display: none !important; }
        html[data-mapping-popout="true"] #sectionDuocThu { display: flex !important; flex-direction: column; flex: 1 1 0; min-height: 0; overflow: hidden; }
        html[data-mapping-popout="true"] #sectionDuocThu #workspace,
        html[data-mapping-popout="true"] #sectionDuocThu #duocDrugHeader { display: none !important; }
        html[data-mapping-popout="true"] #sectionDuocThu.mapping-mode #duocMappingPanel.is-active,
        html[data-mapping-popout="true"] #duocMappingPanel.is-active { display: flex !important; flex: 1 1 0; min-height: 0; }"""

BTN_OLD = """        <button type="button" id="btnDuocMapping" onclick="toggleDuocMappingMode()" class="btn-secondary shrink-0" title="Báo cáo mapping linh hoạt: ICD-10, BYT, BV">
            <i data-lucide="table-2" class="w-4 h-4 sm:mr-2 shrink-0"></i>
            <span class="hidden sm:inline truncate">Mapping / Báo cáo</span>
            <span class="sm:hidden">Mapping</span>
        </button>"""

BTN_NEW = """        <button type="button" id="btnDuocMapping" onclick="handleDuocMappingButtonClick(event)" class="btn-secondary shrink-0" title="Mapping / báo cáo trong trang (Ctrl+click: cửa sổ mới)">
            <i data-lucide="table-2" class="w-4 h-4 sm:mr-2 shrink-0"></i>
            <span class="hidden sm:inline truncate">Mapping / Báo cáo</span>
            <span class="sm:hidden">Mapping</span>
        </button>
        <button type="button" id="btnDuocMappingPopout" onclick="openDuocMappingInNewWindow()" class="btn-secondary shrink-0 px-2 sm:px-2.5" title="Mở Mapping / Báo cáo trong cửa sổ mới">
            <i data-lucide="external-link" class="w-4 h-4"></i>
            <span class="hidden lg:inline ml-1.5">Cửa sổ mới</span>
        </button>"""

CLOSE_OLD = """            <button type="button" onclick="toggleDuocMappingMode(false)" class="btn-secondary shrink-0 text-xs">
                <i data-lucide="x" class="w-4 h-4 sm:mr-1"></i>Đóng
            </button>"""

CLOSE_NEW = """            <button type="button" onclick="closeDuocMappingPanel()" class="btn-secondary shrink-0 text-xs">
                <i data-lucide="x" class="w-4 h-4 sm:mr-1"></i>Đóng
            </button>"""

JS_OLD = """        async function toggleDuocMappingMode(forceOpen) {
            if (typeof forceOpen === 'boolean') duocMappingActive = forceOpen;
            else duocMappingActive = !duocMappingActive;"""

JS_NEW = """        function isDuocMappingPopoutWindow() {
            return document.documentElement.getAttribute('data-mapping-popout') === 'true';
        }

        function getDuocMappingPopoutUrl() {
            return location.href.split('#')[0] + '#duocthu/mapping';
        }

        function openDuocMappingInNewWindow() {
            const url = getDuocMappingPopoutUrl();
            const w = window.open(url, '_blank', 'noopener,noreferrer');
            if (!w) showNotification('Trình duyệt chặn cửa sổ mới — cho phép popup hoặc dùng Ctrl+click trên nút Mapping.');
            return false;
        }

        function handleDuocMappingButtonClick(ev) {
            if (ev && (ev.ctrlKey || ev.metaKey || ev.shiftKey)) {
                ev.preventDefault();
                openDuocMappingInNewWindow();
                return;
            }
            toggleDuocMappingMode();
        }

        function closeDuocMappingPanel() {
            if (isDuocMappingPopoutWindow()) {
                window.close();
                return;
            }
            toggleDuocMappingMode(false);
        }

        async function toggleDuocMappingMode(forceOpen) {
            if (typeof forceOpen === 'boolean') duocMappingActive = forceOpen;
            else duocMappingActive = !duocMappingActive;"""

RESTORE_OLD = """            if (duocMappingActive && currentSection === 'duocthu' && dbReady) {
                toggleDuocMappingMode(true);
            }"""

RESTORE_NEW = """            if ((duocMappingActive || isDuocMappingPopoutWindow()) && currentSection === 'duocthu' && dbReady) {
                toggleDuocMappingMode(true);
            }"""

BOOT_OLD = """        function bootAppNavigation() {
            loadUiState();
            initSearchFilters();"""

BOOT_NEW = """        function bootAppNavigation() {
            loadUiState();
            if (isDuocMappingPopoutWindow()) duocMappingActive = true;
            initSearchFilters();"""

patches = [
    ("early hash", EARLY_OLD, EARLY_NEW),
    ("CSS popout", CSS_ANCHOR, CSS_ADD),
    ("toolbar btn", BTN_OLD, BTN_NEW),
    ("close btn", CLOSE_OLD, CLOSE_NEW),
    ("JS popout", JS_OLD, JS_NEW),
    ("restore", RESTORE_OLD, RESTORE_NEW),
    ("boot", BOOT_OLD, BOOT_NEW),
]

for label, old, new in patches:
    if old not in text:
        if label == "CSS popout" and "data-mapping-popout" in text:
            print(f"skip {label}")
            continue
        if label == "toolbar btn" and "btnDuocMappingPopout" in text:
            print(f"skip {label}")
            continue
        raise SystemExit(f"MISSING {label}")
    text = text.replace(old, new, 1)
    print(f"patched {label}")

if not text.rstrip().endswith("</html>"):
    raise SystemExit("HTML truncated!")
dst.write_text(text, encoding="utf-8")
print("OK", dst.name)
