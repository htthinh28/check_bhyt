# -*- coding: utf-8 -*-
"""Add missing filterHdDieuTriCatalog + skip hash sync on file://."""
from pathlib import Path

dst = next(Path(r"C:\Users\admin\Desktop\Thu vien").glob("*(1)*.html"))
text = dst.read_text(encoding="utf-8")
orig_len = len(text)

MARKER = "        let qtktCatalog = [];\n\n\n        function filterQtktCatalog() {"
INSERT = """        let hdDieuTriCatalog = [];
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

if MARKER not in text:
    if "function filterHdDieuTriCatalog()" in text:
        print("filterHdDieuTriCatalog already present")
    else:
        raise SystemExit("Marker not found for filterHdDieuTriCatalog insert")

if "function filterHdDieuTriCatalog()" not in text:
    text = text.replace(MARKER, INSERT, 1)

HASH_OLD = """        function syncAppUrlHash() {
            try {
                const h = currentSection === 'home' ? '' : '#' + currentSection;"""

HASH_NEW = """        function syncAppUrlHash() {
            try {
                if ((location.protocol || '').toLowerCase() === 'file:') return;
                const h = currentSection === 'home' ? '' : '#' + currentSection;"""

if HASH_OLD in text and "file:') return;" not in text.split("function syncAppUrlHash")[1].split("}")[0]:
    text = text.replace(HASH_OLD, HASH_NEW, 1)

dst.write_text(text, encoding="utf-8")
print("Patched:", dst.name)
print("Bytes:", orig_len, "->", len(text))
if "function filterHdDieuTriCatalog()" not in text:
    raise SystemExit("Verify failed: filterHdDieuTriCatalog missing")
if text.rstrip().endswith("</html>"):
    print("OK: ends with </html>")
else:
    print("WARN: file may be truncated")
