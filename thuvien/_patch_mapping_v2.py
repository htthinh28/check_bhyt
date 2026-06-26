# -*- coding: utf-8 -*-
"""Fix mapping panel: single right scrollbar, xlsx-only export, remove frozen split layout."""
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")

CSS_OLD = """        #duocMappingPanel { display: none; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; background: #f8fafc; }
        #duocMappingPanel.is-active { display: flex; }
        #sectionDuocThu.mapping-mode #workspace { display: none !important; }
        #sectionDuocThu.mapping-mode #duocDrugHeader { display: none !important; }
        .mapping-layout { display: flex; flex: 1; min-height: 0; overflow: hidden; flex-direction: column; }
        .mapping-config {
            width: 100%; flex-shrink: 0; flex-grow: 0;
            height: var(--mapping-config-h, 38%);
            min-height: 7rem; max-height: calc(100% - 7rem);
            background: #fff; overflow-y: auto; overflow-x: hidden;
            -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
        }
        #mappingPreviewScroll {
            min-height: 0; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
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
        .mapping-preview { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }"""

CSS_NEW = """        #duocMappingPanel { display: none; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; background: #f8fafc; }
        #duocMappingPanel.is-active { display: flex; }
        #sectionDuocThu.mapping-mode { overflow: hidden; }
        #sectionDuocThu.mapping-mode #workspace { display: none !important; }
        #sectionDuocThu.mapping-mode #duocDrugHeader { display: none !important; }
        #sectionDuocThu.mapping-mode #duocMappingPanel.is-active { flex: 1; min-height: 0; }
        .mapping-scroll-area {
            flex: 1; min-height: 0; overflow-y: scroll; overflow-x: hidden;
            -webkit-overflow-scrolling: touch; scrollbar-gutter: stable;
            background: #f8fafc;
        }
        .mapping-scroll-area::-webkit-scrollbar { width: 10px; }
        .mapping-scroll-area::-webkit-scrollbar-track { background: #f1f5f9; }
        .mapping-scroll-area::-webkit-scrollbar-thumb { background: #f472b6; border-radius: 8px; border: 2px solid #f1f5f9; }
        .mapping-scroll-area::-webkit-scrollbar-thumb:hover { background: #db2777; }
        .mapping-config {
            width: 100%; background: #fff; border-bottom: 1px solid #e2e8f0;
            overflow: visible;
        }
        .mapping-preview-block {
            background: #fff; border-top: 1px solid #e2e8f0;
        }
        #mappingPreviewTable { overflow-x: auto; }"""

HTML_OLD = """            <button type="button" onclick="exportMappingReport('xlsx')" class="btn-primary shrink-0 text-xs">
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
                <div id="mappingPreviewScroll" class="flex-1 min-h-0 overflow-auto catalog-scroll p-2 sm:p-3">
                    <div id="mappingPreviewTable"></div>
                </div>
            </div>
        </div>"""

HTML_NEW = """            <button type="button" onclick="exportMappingReport()" class="btn-primary shrink-0 text-xs">
                <i data-lucide="download" class="w-4 h-4 sm:mr-1"></i><span class="hidden sm:inline">Xuất Excel (.xlsx)</span>
            </button>
            <button type="button" onclick="toggleDuocMappingMode(false)" class="btn-secondary shrink-0 text-xs">
                <i data-lucide="x" class="w-4 h-4 sm:mr-1"></i>Đóng
            </button>
        </div>
        <div id="mappingScrollArea" class="mapping-scroll-area scrollbar-thin">
            <aside class="mapping-config p-3 sm:p-4" id="mappingConfigPanel"></aside>
            <div class="mapping-preview-block">
                <div id="mappingPreviewMeta" class="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 sticky top-0 z-10"></div>
                <div id="mappingPreviewScroll" class="p-2 sm:p-3">
                    <div id="mappingPreviewTable"></div>
                </div>
            </div>
        </div>"""

JS_SPLIT_OLD = """        const MAPPING_SPLIT_KEY = 'duocThuMappingSplitPct';
        let mappingSplitterBound = false;

        function applyMappingConfigHeight(pct) {
            const layout = document.getElementById('mappingLayout');
            if (!layout) return;
            const clamped = Math.min(75, Math.max(18, pct));
            layout.style.setProperty('--mapping-config-h', clamped + '%');
            try { localStorage.setItem(MAPPING_SPLIT_KEY, String(clamped)); } catch (_) { /* ignore */ }
        }

        function loadMappingSplitHeight() {
            try {
                const v = parseFloat(localStorage.getItem(MAPPING_SPLIT_KEY));
                if (!Number.isNaN(v)) applyMappingConfigHeight(v);
            } catch (_) { /* ignore */ }
        }

        function initMappingSplitter() {
            const layout = document.getElementById('mappingLayout');
            const splitter = document.getElementById('mappingSplitter');
            if (!layout || !splitter) return;
            loadMappingSplitHeight();
            if (mappingSplitterBound) return;
            mappingSplitterBound = true;
            let dragging = false;
            const onMove = (clientY) => {
                const rect = layout.getBoundingClientRect();
                if (rect.height <= 0) return;
                applyMappingConfigHeight(((clientY - rect.top) / rect.height) * 100);
            };
            const stop = () => {
                if (!dragging) return;
                dragging = false;
                splitter.classList.remove('is-dragging');
                document.body.classList.remove('mapping-split-drag');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', stop);
            };
            const onMouseMove = (e) => { if (dragging) { e.preventDefault(); onMove(e.clientY); } };
            const onTouchMove = (e) => { if (dragging && e.touches[0]) { e.preventDefault(); onMove(e.touches[0].clientY); } };
            const start = (clientY) => {
                dragging = true;
                splitter.classList.add('is-dragging');
                document.body.classList.add('mapping-split-drag');
                onMove(clientY);
            };
            splitter.addEventListener('mousedown', (e) => {
                e.preventDefault();
                start(e.clientY);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', stop);
                window.addEventListener('blur', stop, { once: true });
            });
            splitter.addEventListener('touchstart', (e) => {
                if (!e.touches[0]) return;
                start(e.touches[0].clientY);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
                document.addEventListener('touchcancel', stop);
            }, { passive: true });
            splitter.addEventListener('keydown', (e) => {
                const cur = parseFloat(localStorage.getItem(MAPPING_SPLIT_KEY)) || 38;
                if (e.key === 'ArrowUp') { e.preventDefault(); applyMappingConfigHeight(cur - 2); }
                if (e.key === 'ArrowDown') { e.preventDefault(); applyMappingConfigHeight(cur + 2); }
            });
        }

        function renderMappingPanel() {
            renderMappingConfigPanel();
            renderMappingPreview();
            initMappingSplitter();
            safeLucideIcons();
        }"""

JS_SPLIT_NEW = """        function renderMappingPanel() {
            document.body.classList.remove('mapping-split-drag');
            renderMappingConfigPanel();
            renderMappingPreview();
            safeLucideIcons();
        }"""

JS_EXPORT_OLD_START = """        function mappingEscapeCsv(val) {
            if (val === null || val === undefined) return '';
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\\n') || strVal.includes('\\r')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }

        function downloadMappingFile(blob, filename) {"""

# Read export function end from file - replace whole export block
JS_EXPORT_OLD = """        function mappingEscapeCsv(val) {
            if (val === null || val === undefined) return '';
            const strVal = String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\\n') || strVal.includes('\\r')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }

        function downloadMappingFile(blob, filename) {
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
        }

        function exportMappingReport(format) {
            try {
                const { columns, rows } = buildMappingReportRows();
                if (!columns.length) return showNotification('Chọn ít nhất một cột trước khi xuất.');
                if (!rows.length) return showNotification('Không có dữ liệu phù hợp để xuất.');
                const exportCols = columns.map(c => ({ key: c.id, label: c.label }));
                const stamp = new Date().toISOString().slice(0, 10);
                const baseName = `Mapping_DuocThu_${mappingReportState.rowMode}_${stamp}`;
                if (format === 'csv' || format === 'xlsx') {
                    const header = exportCols.map(c => mappingEscapeCsv(c.label)).join(',');
                    const lines = rows.map(r => exportCols.map(c => mappingEscapeCsv(r[c.key])).join(','));
                    const csvBlob = new Blob(['\\ufeff' + [header, ...lines].join('\\n')], { type: 'text/csv;charset=utf-8' });
                    if (format === 'csv') {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                        return;
                    }
                    if (typeof XLSX === 'undefined') {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Excel chưa tải — đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                        return;
                    }
                    try {
                        const sheetRows = rows.map(r => {
                            const o = {};
                            exportCols.forEach(c => { o[c.label] = r[c.key] ?? ''; });
                            return o;
                        });
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Mapping');
                        XLSX.writeFile(wb, `${baseName}.xlsx`);
                        showNotification(`Đã xuất Excel (${rows.length.toLocaleString('vi-VN')} dòng).`);
                    } catch (_) {
                        downloadMappingFile(csvBlob, `${baseName}.csv`);
                        showNotification(`Không ghi được Excel — đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                    }
                }
            } catch (err) {
                console.error('exportMappingReport', err);
                showNotification('Lỗi xuất báo cáo: ' + (err?.message || 'không xác định'));
            }
        }"""

JS_EXPORT_NEW = """        function downloadMappingFile(blob, filename) {
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
        }"""

TOGGLE_PATCH_OLD = """            if (duocMappingActive) {
                if (!icdReady && typeof initIcdCatalog === 'function') {
                    try { await initIcdCatalog(); } catch (_) { /* ignore */ }
                }
                renderMappingPanel();"""
TOGGLE_PATCH_NEW = """            if (duocMappingActive) {
                document.body.classList.remove('mapping-split-drag');
                if (!icdReady && typeof initIcdCatalog === 'function') {
                    try { await initIcdCatalog(); } catch (_) { /* ignore */ }
                }
                renderMappingPanel();"""

patches = [
    ("CSS", CSS_OLD, CSS_NEW),
    ("HTML", HTML_OLD, HTML_NEW),
    ("JS split", JS_SPLIT_OLD, JS_SPLIT_NEW),
    ("JS export", JS_EXPORT_OLD, JS_EXPORT_NEW),
    ("JS toggle", TOGGLE_PATCH_OLD, TOGGLE_PATCH_NEW),
]

for name, old, new in patches:
    if old not in text:
        if name == "CSS" and ".mapping-scroll-area" in text:
            print(f"skip {name}")
            continue
        raise SystemExit(f"MISSING {name}")
    text = text.replace(old, new, 1)
    print(f"patched {name}")

dst.write_text(text, encoding="utf-8")
print("OK lines", text.count("\n") + 1, "scroll", "mappingScrollArea" in text, "xlsx-only", "exportMappingReport()" in text)
