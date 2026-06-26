# -*- coding: utf-8 -*-
"""Repair truncated HTML: restore tail + inject mapping JS compatible with current HTML."""
import re
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"G:/My Drive/Thu vien (1)")
HTML = BASE / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"
SRC = BASE / "index thu vien.txt"
MODULE = BASE / "_mapping_module.js"
BAK = HTML.with_suffix(HTML.suffix + ".pre-repair.bak")
LOG = BASE / "_repair_log.txt"

log_lines = []


def log(msg):
    print(msg)
    log_lines.append(msg)


def patch(text, old, new, label, required=True):
    if old in text:
        return text.replace(old, new, 1), True
    if new in text:
        log(f"skip {label} (already applied)")
        return text, False
    if required:
        raise SystemExit(f"MISSING patch: {label}")
    log(f"WARN optional patch missing: {label}")
    return text, False


def build_mapping_module():
    raw = MODULE.read_text(encoding="utf-8")

    # v2: remove splitter block
    split_start = raw.find("        const MAPPING_SPLIT_KEY")
    split_end = raw.find("        function renderMappingPanel()")
    if split_start >= 0 and split_end > split_start:
        raw = raw[:split_start] + raw[split_end:]

    raw = raw.replace(
        """        function renderMappingPanel() {
            renderMappingConfigPanel();
            renderMappingPreview();
            initMappingSplitter();
            safeLucideIcons();
        }""",
        """        function syncMappingScrollLayout() {
            const scroll = document.getElementById('mappingScrollArea');
            const panel = document.getElementById('duocMappingPanel');
            if (!scroll || !panel || !duocMappingActive) return;
            const top = scroll.getBoundingClientRect().top;
            const maxH = Math.max(240, Math.floor(window.innerHeight - top - 4));
            scroll.style.maxHeight = maxH + 'px';
            scroll.style.height = maxH + 'px';
            scroll.style.overflowY = 'scroll';
        }

        function renderMappingPanel() {
            document.body.classList.remove('mapping-split-drag');
            renderMappingConfigPanel();
            renderMappingPreview();
            safeLucideIcons();
            requestAnimationFrame(() => {
                syncMappingScrollLayout();
                requestAnimationFrame(syncMappingScrollLayout);
            });
        }""",
        1,
    )

    # popout helpers before toggleDuocMappingMode
    popout = """
        function isDuocMappingPopoutWindow() {
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

"""
    raw = raw.replace("        async function toggleDuocMappingMode(forceOpen) {", popout + "        async function toggleDuocMappingMode(forceOpen) {", 1)

    raw = raw.replace(
        """            if (duocMappingActive) {
                if (!icdReady && typeof initIcdCatalog === 'function') {
                    try { await initIcdCatalog(); } catch (_) { /* ignore */ }
                }
                renderMappingPanel();
            } else {
                updateUI();
            }
        }""",
        """            if (duocMappingActive) {
                document.body.classList.remove('mapping-split-drag');
                if (!icdReady && typeof initIcdCatalog === 'function') {
                    try { await initIcdCatalog(); } catch (_) { /* ignore */ }
                }
                renderMappingPanel();
            } else {
                updateUI();
            }
        }

        if (!window.__mappingScrollResizeBound) {
            window.__mappingScrollResizeBound = true;
            window.addEventListener('resize', () => { if (duocMappingActive) syncMappingScrollLayout(); });
        }""",
        1,
    )

    # xlsx-only export (matches HTML onclick="exportMappingReport()")
    export_old = raw[raw.find("        function mappingEscapeCsv"): raw.find("        loadMappingReportState();")]
    export_new = """        function downloadMappingFile(blob, filename) {
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
        }

        function exportMappingReport() {
            try {
                const { columns, rows } = buildMappingReportRows();
                if (!columns.length) return showNotification('Chọn ít nhất một cột trước khi xuất.');
                if (!rows.length) return showNotification('Không có dữ liệu phù hợp để xuất.');
                if (typeof XLSX === 'undefined') {
                    return showNotification('Thư viện Excel chưa tải. Kiểm tra mạng hoặc tải lại trang.');
                }
                const exportCols = columns.map(c => ({ key: c.id, label: c.label }));
                const stamp = new Date().toISOString().slice(0, 10);
                const baseName = `Mapping_DuocThu_${mappingReportState.rowMode}_${stamp}`;
                const sheetRows = rows.map(r => {
                    const o = {};
                    exportCols.forEach(c => { o[c.label] = r[c.key] ?? ''; });
                    return o;
                });
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Mapping');
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                downloadMappingFile(blob, `${baseName}.xlsx`);
                showNotification(`Đã xuất Excel .xlsx (${rows.length.toLocaleString('vi-VN')} dòng).`);
            } catch (err) {
                console.error('exportMappingReport', err);
                showNotification('Lỗi xuất Excel: ' + (err?.message || 'không xác định'));
            }
        }

"""
    if export_old not in raw:
        raise SystemExit("Could not locate export block in mapping module")
    raw = raw.replace(export_old, export_new, 1)

    # preview table without nested scroll wrapper + icdTen null-safe
    raw = raw.replace(
        "get: ctx => (typeof icdTen === 'function' ? icdTen(ctx.icdDetail) : '') || ctx.icd?.raw || ''",
        "get: ctx => (ctx.icdDetail && typeof icdTen === 'function' ? icdTen(ctx.icdDetail) : '') || ctx.icd?.raw || ''",
    )
    raw = raw.replace(
        'tableWrap.innerHTML = `<div class="catalog-scroll"><table class="catalog-table mapping-preview-table min-w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-gray-400 py-6">Không có dòng phù hợp.</td></tr>`}</tbody></table></div>${rows.length > previewCap ? `<p class="text-xs text-gray-500 mt-2 text-center">Xem trước ${previewCap.toLocaleString(\'vi-VN\')} / ${rows.length.toLocaleString(\'vi-VN\')} dòng.</p>` : \'\'}`;',
        'tableWrap.innerHTML = `<table class="catalog-table mapping-preview-table min-w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-gray-400 py-6">Không có dòng phù hợp.</td></tr>`}</tbody></table>${rows.length > previewCap ? `<p class="text-xs text-gray-500 mt-2 text-center">Xem trước ${previewCap.toLocaleString(\'vi-VN\')} / ${rows.length.toLocaleString(\'vi-VN\')} dòng.</p>` : \'\'}`;',
    )

    return raw


def main():
    log("Reading files...")
    html = HTML.read_text(encoding="utf-8")
    src = SRC.read_text(encoding="utf-8")

    log(f"HTML size before: {len(html):,}")
    log(f"Has </html>: {'</html>' in html}")
    log(f"Has chunk 13: {'data-chunk=\"13\"' in html}")

    if "data-chunk=\"13\"" not in html:
        idx12_html = html.find('data-chunk="12"')
        if idx12_html < 0:
            raise SystemExit("chunk 12 not found in html")
        head = html[:html.rfind("\n", 0, idx12_html) + 1]

        idx12_src = src.find('data-chunk="12"')
        if idx12_src < 0:
            raise SystemExit("chunk 12 not found in source")
        tail = src[src.rfind("\n", 0, idx12_src) + 1:]
        log(f"Restoring from chunk 12 in source ({len(tail):,} bytes)")
        if not BAK.exists():
            shutil.copy2(HTML, BAK)
            log(f"Backup: {BAK.name}")
        html = head + tail
        log("Tail restored.")
    else:
        log("Chunk 13 already present — skipping tail restore.")

    mapping_js = build_mapping_module()

    if "MAPPING_STORAGE_KEY" not in html:
        html, _ = patch(
            html,
            "        // --- IMPORT / EXPORT (CSV) ---",
            mapping_js + "\n        // --- IMPORT / EXPORT (CSV) ---",
            "inject mapping module",
        )
    else:
        log("skip inject mapping module (already present)")

    html, _ = patch(
        html,
        "        let duocToolbarExpanded = true;",
        "        let duocToolbarExpanded = true;\n        let duocMappingActive = false;",
        "duocMappingActive var",
    )

    html, _ = patch(
        html,
        "                if (typeof s.promtFiltersVisible === 'boolean') promtFiltersVisible = s.promtFiltersVisible;",
        "                if (typeof s.promtFiltersVisible === 'boolean') promtFiltersVisible = s.promtFiltersVisible;\n                if (typeof s.duocMappingActive === 'boolean') duocMappingActive = s.duocMappingActive;",
        "loadUiState duocMapping",
    )

    html, _ = patch(
        html,
        "                    duocToolbarExpanded, nd90SidebarVisible, nd90TopbarExpanded, promtSidebarVisible, promtFiltersVisible,",
        "                    duocToolbarExpanded, nd90SidebarVisible, nd90TopbarExpanded, promtSidebarVisible, promtFiltersVisible, duocMappingActive,",
        "saveUiState duocMapping",
    )

    html, _ = patch(
        html,
        """        function updateUI() {
            if (currentSection !== 'duocthu') {
                clearDuocDrugHeader();
                return;
            }
            renderTree();
            renderContent();""",
        """        function updateUI() {
            if (currentSection !== 'duocthu') {
                clearDuocDrugHeader();
                return;
            }
            if (duocMappingActive) return;
            renderTree();
            renderContent();""",
        "updateUI mapping guard",
    )

    restore_old = """            if (saved.jciActiveCode && currentSection === 'jci' && jciReady) {
                showJciStandard(saved.jciActiveCode);
            }
            const needRetry = attempt < 60 && (
                (saved.activeDrugId && currentSection === 'duocthu' && !dbReady) ||"""
    restore_new = """            if (saved.jciActiveCode && currentSection === 'jci' && jciReady) {
                showJciStandard(saved.jciActiveCode);
            }
            if ((duocMappingActive || isDuocMappingPopoutWindow()) && currentSection === 'duocthu' && dbReady) {
                toggleDuocMappingMode(true);
            }
            const needRetry = attempt < 60 && (
                (saved.activeDrugId && currentSection === 'duocthu' && !dbReady) ||"""
    html, _ = patch(html, restore_old, restore_new, "restore mapping state")

    html, _ = patch(
        html,
        """        function bootAppNavigation() {
            loadUiState();
            initSearchFilters();""",
        """        function bootAppNavigation() {
            loadUiState();
            if (isDuocMappingPopoutWindow()) duocMappingActive = true;
            initSearchFilters();""",
        "boot popout",
    )

    html, _ = patch(
        html,
        """        function syncAppUrlHash() {
            try {
                const h = currentSection === 'home' ? '' : '#' + currentSection;""",
        """        function syncAppUrlHash() {
            try {
                if ((location.protocol || '').toLowerCase() === 'file:') return;
                const h = currentSection === 'home' ? '' : '#' + currentSection;""",
        "file hash skip",
        required=False,
    )

    marker = "        let qtktCatalog = [];\n\n\n        function filterQtktCatalog() {"
    insert = """        let hdDieuTriCatalog = [];
        let qtktCatalog = [];


        function filterHdDieuTriCatalog() {
            const box = document.getElementById('hdDieuTriContent');
            if (!box) return;
            const q = normalizeVietnamese(document.getElementById('hdDieuTriSearchInput')?.value || '');
            const status = document.getElementById('hdDieuTriSearchStatus');
            const items = (hdDieuTriCatalog || []).filter(function(it) {
                if (!q) return true;
                const hay = normalizeVietnamese([it.title, it.specialty, it.code, it.summary].join(' '));
                return hay.includes(q);
            });
            if (status) status.textContent = items.length ? items.length + ' mục' : (q ? 'Không có kết quả' : 'Sẵn sàng tra cứu hướng dẫn điều trị.');
            if (!items.length) {
                box.innerHTML = '<div class="byt-doc-empty"><div class="byt-doc-empty-icon"><i data-lucide="stethoscope" class="w-7 h-7"></i></div><h3>' + (q ? 'Không tìm thấy' : 'Hướng dẫn điều trị') + '</h3><p>' + (q ? 'Thử từ khóa khác.' : 'Danh mục sẽ hiển thị khi có dữ liệu nhúng.') + '</p></div>';
                safeLucideIcons();
                return;
            }
            box.innerHTML = '<div class="byt-doc-list">' + items.map(function(it) {
                return '<article class="byt-doc-card"><div class="byt-doc-card-title">' + escapeHTML(it.title || '') + '</div><div class="byt-doc-card-meta">' + escapeHTML([it.specialty, it.code].filter(Boolean).join(' · ')) + '</div></article>';
            }).join('') + '</div>';
            safeLucideIcons();
        }


        function filterQtktCatalog() {"""
    if "function filterHdDieuTriCatalog()" not in html:
        html, _ = patch(html, marker, insert, "filterHdDieuTriCatalog")

    checks = {
        "chunks_1_14": all(f'data-chunk="{i}"' in html for i in range(1, 15)),
        "navigateToSection": "function navigateToSection" in html,
        "toggleDuocMappingMode": "function toggleDuocMappingMode" in html or "async function toggleDuocMappingMode" in html,
        "handleDuocMappingButtonClick": "function handleDuocMappingButtonClick" in html,
        "html_close": html.rstrip().endswith("</html>"),
    }
    log("Checks: " + str(checks))
    if not all(checks.values()):
        raise SystemExit("Verification failed: " + str(checks))

    HTML.write_text(html, encoding="utf-8")
    log(f"Repaired file written. New size: {len(html):,} bytes, lines: {html.count(chr(10)) + 1}")
    LOG.write_text("\n".join(log_lines), encoding="utf-8")


if __name__ == "__main__":
    main()
