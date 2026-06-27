# -*- coding: utf-8 -*-
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")
changes = 0

def sub(old, new, label):
    global text, changes
    if old not in text:
        if new in text:
            print(f"skip {label} (already applied)")
            return
        raise SystemExit(f"MISSING: {label}")
    text = text.replace(old, new, 1)
    changes += 1
    print(f"patched {label}")

# --- CSS: scroll + splitter ---
sub(
    """        .mapping-config {
            width: 100%; flex-shrink: 0; flex-grow: 0;
            height: var(--mapping-config-h, 38%);
            min-height: 7rem; max-height: calc(100% - 7rem);
            background: #fff; overflow-y: auto;
        }""",
    """        .mapping-config {
            width: 100%; flex-shrink: 0; flex-grow: 0;
            height: var(--mapping-config-h, 38%);
            min-height: 7rem; max-height: calc(100% - 7rem);
            background: #fff; overflow-y: auto; overflow-x: hidden;
            -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
        }
        #mappingPreviewScroll {
            min-height: 0; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
        }""",
    "CSS scroll",
)

sub(
    "        body.mapping-split-drag { cursor: row-resize !important; user-select: none !important; }\n        body.mapping-split-drag * { cursor: row-resize !important; }",
    "        body.mapping-split-drag { cursor: row-resize !important; user-select: none !important; }",
    "CSS drag body",
)

# --- HTML: min-h-0 on scroll container ---
sub(
    'id="mappingPreviewScroll" class="flex-1 overflow-auto catalog-scroll p-2 sm:p-3"',
    'id="mappingPreviewScroll" class="flex-1 min-h-0 overflow-auto catalog-scroll p-2 sm:p-3"',
    "HTML scroll",
)

# --- JS: icdTen null-safe ---
sub(
    "get: ctx => (typeof icdTen === 'function' ? icdTen(ctx.icdDetail) : '') || ctx.icd?.raw || ''",
    "get: ctx => (ctx.icdDetail && typeof icdTen === 'function' ? icdTen(ctx.icdDetail) : '') || ctx.icd?.raw || ''",
    "icdTen null-safe",
)

# --- JS: preview table without nested scroll wrapper ---
sub(
    'tableWrap.innerHTML = `<div class="catalog-scroll"><table class="catalog-table mapping-preview-table min-w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-gray-400 py-6">Không có dòng phù hợp.</td></tr>`}</tbody></table></div>${rows.length > previewCap ? `<p class="text-xs text-gray-500 mt-2 text-center">Xem trước ${previewCap.toLocaleString(\'vi-VN\')} / ${rows.length.toLocaleString(\'vi-VN\')} dòng.</p>` : \'\'}`;',
    'tableWrap.innerHTML = `<table class="catalog-table mapping-preview-table min-w-full border-collapse"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-gray-400 py-6">Không có dòng phù hợp.</td></tr>`}</tbody></table>${rows.length > previewCap ? `<p class="text-xs text-gray-500 mt-2 text-center">Xem trước ${previewCap.toLocaleString(\'vi-VN\')} / ${rows.length.toLocaleString(\'vi-VN\')} dòng.</p>` : \'\'}`;',
    "preview scroll wrapper",
)

# --- JS: splitter drag cleanup ---
sub(
    """            splitter.addEventListener('mousedown', (e) => {
                e.preventDefault();
                start(e.clientY);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', stop);
            });""",
    """            splitter.addEventListener('mousedown', (e) => {
                e.preventDefault();
                start(e.clientY);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', stop);
                window.addEventListener('blur', stop, { once: true });
            });""",
    "splitter blur",
)

sub(
    """            splitter.addEventListener('touchstart', (e) => {
                if (!e.touches[0]) return;
                start(e.touches[0].clientY);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
            }, { passive: true });""",
    """            splitter.addEventListener('touchstart', (e) => {
                if (!e.touches[0]) return;
                start(e.touches[0].clientY);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
                document.addEventListener('touchcancel', stop);
            }, { passive: true });""",
    "splitter touchcancel",
)

# --- JS: robust export ---
OLD_EXPORT = """        function exportMappingReport(format) {
            const { columns, rows } = buildMappingReportRows();
            if (!columns.length) return showNotification('Chọn ít nhất một cột trước khi xuất.');
            if (!rows.length) return showNotification('Không có dữ liệu phù hợp để xuất.');
            const exportCols = columns.map(c => ({ key: c.id, label: c.label }));
            const stamp = new Date().toISOString().slice(0, 10);
            const baseName = `Mapping_DuocThu_${mappingReportState.rowMode}_${stamp}`;
            if (format === 'csv') {
                const header = exportCols.map(c => escapeCSVValue(c.label)).join(',');
                const lines = rows.map(r => exportCols.map(c => escapeCSVValue(r[c.key])).join(','));
                const blob = new Blob(['\\ufeff' + [header, ...lines].join('\\n')], { type: 'text/csv;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${baseName}.csv`;
                a.click();
                showNotification(`Đã xuất CSV (${rows.length.toLocaleString('vi-VN')} dòng).`);
                return;
            }
            if (typeof XLSX === 'undefined') {
                exportMappingReport('csv');
                showNotification('Thư viện Excel chưa tải — đã xuất CSV thay thế.');
                return;
            }
            const sheetRows = rows.map(r => {
                const o = {};
                exportCols.forEach(c => { o[c.label] = r[c.key] ?? ''; });
                return o;
            });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Mapping');
            XLSX.writeFile(wb, `${baseName}.xlsx`);
            showNotification(`Đã xuất Excel (${rows.length.toLocaleString('vi-VN')} dòng).`);
        }"""

NEW_EXPORT = """        function mappingEscapeCsv(val) {
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

sub(OLD_EXPORT, NEW_EXPORT, "export robust")

dst.write_text(text, encoding="utf-8")
print("OK changes", changes, "lines", text.count("\n") + 1, "html_end", "</html>" in text)
