# -*- coding: utf-8 -*-
"""
Khôi phục HTML từ backup và áp dụng patch ICD (JS + dữ liệu thuốc) an toàn.
Chạy: python _apply_icd_patch.py
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _update_icd_deep import (  # noqa: E402
    format_split_fields,
    load_drugs_from_html,
    load_icd_from_html,
    map_text_to_icds,
    parse_legacy_combined,
    patch_html_drug_chunks,
    try_load_xlsx,
    XLSX_DEFAULT,
)

sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE = Path(__file__).resolve().parent
HTML = WORKSPACE / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html"
BACKUP = WORKSPACE / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html.pre-head-move.bak"
CORRUPT_BAK = WORKSPACE / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html.pre-icd-patch.bak"

JS_REPLACEMENTS: list[tuple[str, str]] = [
    (
        """            { key: 'chiDinh', label: 'Chỉ định' },
            { key: 'goiYMaICDChiDinh', label: 'Gợi ý mã ICD-10 (Chỉ định)' },
            { key: 'chongChiDinh', label: 'Chống chỉ định' },
            { key: 'goiYMaICDChongChiDinh', label: 'Gợi ý mã ICD-10 (Chống chỉ định)' },""",
        """            { key: 'chiDinh', label: 'Chỉ định' },
            { key: 'maICDChiDinh', label: 'Mã ICD chỉ định' },
            { key: 'tenBenhICDChiDinh', label: 'Tên bệnh (theo ICD-10) chỉ định' },
            { key: 'chongChiDinh', label: 'Chống chỉ định' },
            { key: 'maICDChongChiDinh', label: 'Mã ICD chống chỉ định' },
            { key: 'tenBenhICDChongChiDinh', label: 'Tên bệnh (theo ICD-10) chống chỉ định' },""",
    ),
    (
        "const INLINE_ONLY_KEYS = new Set(['goiYMaICDChiDinh', 'goiYMaICDChongChiDinh', 'tagNguoiCoThai', 'tagChoConBu']);",
        "const INLINE_ONLY_KEYS = new Set(['maICDChiDinh', 'tenBenhICDChiDinh', 'maICDChongChiDinh', 'tenBenhICDChongChiDinh', 'goiYMaICDChiDinh', 'goiYMaICDChongChiDinh', 'tagNguoiCoThai', 'tagChoConBu']);",
    ),
    (
        """        function parseIcdMaFromBadgeText(text) {
            const m = String(text || '').match(/([A-Z]\\d{2}(?:\\.\\d{1,2})?)/i);
            return m ? m[1].toUpperCase() : '';
        }""",
        """        function parseIcdMaFromBadgeText(text) {
            const m = String(text || '').match(/([A-TV-ZU]\\d{2}(?:\\.\\d{1,2})?\\*?)/i);
            return m ? m[1].toUpperCase() : '';
        }

        function parseIcdMaTenFromLegacy(text) {
            const mas = [];
            const tens = [];
            String(text || '').split(';').forEach(part => {
                part = part.trim();
                if (!part) return;
                const dash = part.match(/^([A-TV-ZU]\\d{2}(?:\\.\\d{1,2})?\\*?)\\s*[—–\\-]\\s*(.+)$/i);
                if (dash) {
                    mas.push(dash[1].toUpperCase());
                    tens.push(dash[2].trim());
                    return;
                }
                const ma = parseIcdMaFromBadgeText(part);
                if (ma) mas.push(ma);
            });
            return { ma: mas.join(';'), ten: tens.join(';') };
        }

        function combineIcdMaTenFields(maStr, tenStr) {
            const mas = String(maStr || '').split(';').map(s => s.trim()).filter(Boolean);
            const tens = String(tenStr || '').split(';').map(s => s.trim());
            if (!mas.length) return '';
            return mas.map((m, i) => (tens[i] ? `${m} — ${tens[i]}` : m)).join('; ');
        }

        function syncLegacyGoiYIcdFields(drug) {
            if (!drug) return;
            drug.goiYMaICDChiDinh = combineIcdMaTenFields(drug.maICDChiDinh, drug.tenBenhICDChiDinh);
            drug.goiYMaICDChongChiDinh = combineIcdMaTenFields(drug.maICDChongChiDinh, drug.tenBenhICDChongChiDinh);
        }

        function getDrugIcdMaField(drug, kind) {
            if (!drug) return '';
            return kind === 'chong_chi_dinh' ? (drug.maICDChongChiDinh || '') : (drug.maICDChiDinh || '');
        }

        function getDrugIcdTenField(drug, kind) {
            if (!drug) return '';
            return kind === 'chong_chi_dinh' ? (drug.tenBenhICDChongChiDinh || '') : (drug.tenBenhICDChiDinh || '');
        }""",
    ),
    (
        """        const renderIcdBadges = (icdText) => {
            if (!icdText) return '';
            const parts = String(icdText).split(';').map(s => s.trim()).filter(Boolean);
            if (!parts.length) return '';
            const badges = parts.map(p => `<span class="icd-badge">${escapeHTML(p)}</span>`).join('');
            return `<div class="mt-3 pt-3 border-t border-dashed border-gray-200"><p class="text-xs font-bold text-gray-500 uppercase mb-2">Gợi ý mã ICD-10</p><div class="flex flex-wrap">${badges}</div></div>`;
        };""",
        """        const renderIcdBadges = (maStr, tenStr) => {
            const mas = String(maStr || '').split(';').map(s => s.trim()).filter(Boolean);
            if (!mas.length) {
                const legacy = String(tenStr || maStr || '').trim();
                if (!legacy) return '';
                const parts = legacy.split(';').map(s => s.trim()).filter(Boolean);
                if (!parts.length) return '';
                const badges = parts.map(p => `<span class="icd-badge">${escapeHTML(p)}</span>`).join('');
                return `<div class="mt-3 pt-3 border-t border-dashed border-gray-200"><p class="text-xs font-bold text-gray-500 uppercase mb-2">Gợi ý mã ICD-10</p><div class="flex flex-wrap">${badges}</div></div>`;
            }
            const tens = String(tenStr || '').split(';').map(s => s.trim());
            const badges = mas.map((m, i) => {
                const label = tens[i] ? `${m} — ${tens[i]}` : m;
                return `<span class="icd-badge" title="${escapeHTML(tens[i] || '')}">${escapeHTML(label)}</span>`;
            }).join('');
            return `<div class="mt-3 pt-3 border-t border-dashed border-gray-200"><p class="text-xs font-bold text-gray-500 uppercase mb-2">Gợi ý mã ICD-10</p><div class="flex flex-wrap">${badges}</div></div>`;
        };""",
    ),
    (
        """            const icdInline = field.key === 'chiDinh' ? activeDrug.goiYMaICDChiDinh
                : (field.key === 'chongChiDinh' ? activeDrug.goiYMaICDChongChiDinh : '');
            if (!content && !icdInline && !tagKey) return '';""",
        """            const icdInlineMa = field.key === 'chiDinh' ? activeDrug.maICDChiDinh
                : (field.key === 'chongChiDinh' ? activeDrug.maICDChongChiDinh : '');
            const icdInlineTen = field.key === 'chiDinh' ? activeDrug.tenBenhICDChiDinh
                : (field.key === 'chongChiDinh' ? activeDrug.tenBenhICDChongChiDinh : '');
            const icdInlineLegacy = field.key === 'chiDinh' ? activeDrug.goiYMaICDChiDinh
                : (field.key === 'chongChiDinh' ? activeDrug.goiYMaICDChongChiDinh : '');
            if (!content && !icdInlineMa && !icdInlineLegacy && !tagKey) return '';""",
    ),
    (
        "${renderIcdBadges(icdInline)}",
        "${renderIcdBadges(icdInlineMa || icdInlineLegacy, icdInlineTen)}",
    ),
    (
        "const icdKey = field.key === 'chiDinh' ? 'goiYMaICDChiDinh' : (field.key === 'chongChiDinh' ? 'goiYMaICDChongChiDinh' : null);",
        "const icdMaKey = field.key === 'chiDinh' ? 'maICDChiDinh' : (field.key === 'chongChiDinh' ? 'maICDChongChiDinh' : null);\n                const icdTenKey = field.key === 'chiDinh' ? 'tenBenhICDChiDinh' : (field.key === 'chongChiDinh' ? 'tenBenhICDChongChiDinh' : null);",
    ),
    (
        """                if (icdKey) {
                    html += `<label class="font-bold text-gray-600 mt-3 mb-1 text-xs">Gợi ý mã ICD-10 (phân cách bằng dấu ;)</label>`;
                    html += `<input type="text" class="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50/50 text-sm font-mono"
                        value="${escapeHTML(editingFormData[icdKey])}"
                        onchange="updateFormData('${icdKey}', this.value)"
                        placeholder="VD: E11.9 — Đái tháo đường type 2; I10 — Tăng huyết áp" />`;
                }""",
        """                if (icdMaKey && icdTenKey) {
                    const icdKind = field.key === 'chiDinh' ? 'chỉ định' : 'chống chỉ định';
                    html += `<label class="font-bold text-gray-600 mt-3 mb-1 text-xs">Mã ICD ${icdKind} (phân cách bằng dấu ;)</label>`;
                    html += `<input type="text" class="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50/50 text-sm font-mono mb-2"
                        value="${escapeHTML(editingFormData[icdMaKey])}"
                        onchange="updateFormData('${icdMaKey}', this.value); syncLegacyGoiYIcdFields(editingFormData);"
                        placeholder="VD: E11.8;E11.9;I10" />`;
                    html += `<label class="font-bold text-gray-600 mb-1 text-xs">Tên bệnh theo ICD-10 ${icdKind} (phân cách bằng dấu ;, cùng thứ tự với mã)</label>`;
                    html += `<input type="text" class="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50/50 text-sm"
                        value="${escapeHTML(editingFormData[icdTenKey])}"
                        onchange="updateFormData('${icdTenKey}', this.value); syncLegacyGoiYIcdFields(editingFormData);"
                        placeholder="VD: Bệnh đái tháo đường típ 2, kèm biến chứng không xác định;..." />`;
                }""",
    ),
    (
        "columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'icd.loai', 'icd.ma', 'icd.ten', 'icd.dinhNghia', 'icd.flags', 'icd.whoGuide', 'icd.raw', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt'],",
        "columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'drug.maICDChiDinh', 'drug.tenBenhICDChiDinh', 'drug.maICDChongChiDinh', 'drug.tenBenhICDChongChiDinh', 'icd.loai', 'icd.ma', 'icd.ten', 'icd.dinhNghia', 'icd.flags', 'icd.whoGuide', 'icd.raw', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt'],",
    ),
    (
        "columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'drug.chiDinh', 'drug.goiYMaICDChiDinh', 'drug.goiYMaICDChongChiDinh', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt', 'icd.ma', 'icd.ten', 'icd.dinhNghia'],",
        "columns: ['drug.tenHoatChat', 'drug.nhomThuoc', 'drug.chiDinh', 'drug.maICDChiDinh', 'drug.tenBenhICDChiDinh', 'drug.maICDChongChiDinh', 'drug.tenBenhICDChongChiDinh', 'drug.maThuocBYT', 'byt.tenThuoc', 'byt.soDangKy', 'bv.tenBietDuoc', 'bv.ma', 'bv.bhyt', 'icd.ma', 'icd.ten', 'icd.dinhNghia'],",
    ),
    (
        """        function parseIcdSuggestionList(text, kind) {
            if (!text) return [];
            return String(text).split(';').map(part => {
                part = part.trim();
                if (!part) return null;
                const ma = parseIcdMaFromBadgeText(part)
                    || (part.match(/^([A-TV-ZU]\\d{2}(?:\\.\\d{1,2})?)/i)?.[1]?.toUpperCase() || '');
                if (!ma) return null;
                return { ma, raw: part, kind };
            }).filter(Boolean);
        }""",
        """        function parseIcdSuggestionList(text, kind, drug) {
            const maField = drug ? getDrugIcdMaField(drug, kind) : '';
            const source = maField || text;
            if (!source) return [];
            return String(source).split(';').map(part => {
                part = part.trim();
                if (!part) return null;
                const ma = parseIcdMaFromBadgeText(part) || part.toUpperCase();
                if (!ma) return null;
                const tenParts = drug ? String(getDrugIcdTenField(drug, kind) || '').split(';').map(s => s.trim()) : [];
                const mas = String(maField || source).split(';').map(s => s.trim()).filter(Boolean);
                const idx = mas.indexOf(ma);
                const ten = idx >= 0 && tenParts[idx] ? tenParts[idx] : '';
                const raw = ten ? `${ma} — ${ten}` : part;
                return { ma, raw, kind };
            }).filter(Boolean);
        }""",
    ),
    (
        "if (mappingReportState.onlyWithIcd && !d.goiYMaICDChiDinh && !d.goiYMaICDChongChiDinh) return false;",
        "if (mappingReportState.onlyWithIcd && !d.maICDChiDinh && !d.maICDChongChiDinh && !d.goiYMaICDChiDinh && !d.goiYMaICDChongChiDinh) return false;",
    ),
    (
        "const icdChi = parseIcdSuggestionList(drug.goiYMaICDChiDinh, 'chi_dinh');",
        "const icdChi = parseIcdSuggestionList(drug.goiYMaICDChiDinh, 'chi_dinh', drug);",
    ),
    (
        "const icdChong = parseIcdSuggestionList(drug.goiYMaICDChongChiDinh, 'chong_chi_dinh');",
        "const icdChong = parseIcdSuggestionList(drug.goiYMaICDChongChiDinh, 'chong_chi_dinh', drug);",
    ),
    (
        """            migrateDrugsV2();
            migrateDrugsV3();
            migrateDrugsV4();
            restoreViewState();""",
        """            migrateDrugsV2();
            migrateDrugsV3();
            migrateDrugsV4();
            migrateDrugsV5();
            restoreViewState();""",
    ),
    (
        "const DATA_VERSION = 8;",
        """        function migrateDrugsV5() {
            let n = 0;
            drugs.forEach(d => {
                if (!d.maICDChiDinh && d.goiYMaICDChiDinh) {
                    const p = parseIcdMaTenFromLegacy(d.goiYMaICDChiDinh);
                    d.maICDChiDinh = p.ma;
                    d.tenBenhICDChiDinh = p.ten;
                    n++;
                }
                if (!d.maICDChongChiDinh && d.goiYMaICDChongChiDinh) {
                    const p = parseIcdMaTenFromLegacy(d.goiYMaICDChongChiDinh);
                    d.maICDChongChiDinh = p.ma;
                    d.tenBenhICDChongChiDinh = p.ten;
                    n++;
                }
                syncLegacyGoiYIcdFields(d);
            });
            if (n) scheduleSave();
        }

        const DATA_VERSION = 9;""",
    ),
    (
        "const icdHint = drugs.some(d => d.chiDinh && !d.goiYMaICDChiDinh)",
        "const icdHint = drugs.some(d => d.chiDinh && !d.maICDChiDinh && !d.goiYMaICDChiDinh)",
    ),
    (
        """            drugs.forEach(d => {
                ingest(d.goiYMaICDChiDinh);
                ingest(d.goiYMaICDChongChiDinh);
            });""",
        """            drugs.forEach(d => {
                const ingestPair = (maStr, tenStr) => {
                    const mas = String(maStr || '').split(';').map(s => s.trim()).filter(Boolean);
                    const tens = String(tenStr || '').split(';').map(s => s.trim());
                    mas.forEach((ma, i) => {
                        if (!ma) return;
                        const ten = tens[i] || ma;
                        if (!map.has(ma)) map.set(ma, { m: ma, t: ten });
                    });
                };
                ingestPair(d.maICDChiDinh, d.tenBenhICDChiDinh);
                ingestPair(d.maICDChongChiDinh, d.tenBenhICDChongChiDinh);
                if (!d.maICDChiDinh) ingest(d.goiYMaICDChiDinh);
                if (!d.maICDChongChiDinh) ingest(d.goiYMaICDChongChiDinh);
            });""",
    ),
    (
        """            migrateDrugsV3();
            migrateDrugsV4();
            await safeIdbSet(buildSnapshot());""",
        """            migrateDrugsV3();
            migrateDrugsV4();
            migrateDrugsV5();
            await safeIdbSet(buildSnapshot());""",
    ),
]


def patch_js_head(html: str) -> str:
    start = html.find("const INITIAL_STANDARD_FIELDS")
    if start < 0:
        raise SystemExit("Khong tim thay INITIAL_STANDARD_FIELDS")
    script_start = html.rfind("<script", 0, start)
    script_end = html.find("</script>", start)
    if script_start < 0 or script_end < 0:
        raise SystemExit("Khong xac dinh duoc khoi script chinh")

    head_part = html[:script_start]
    script_part = html[script_start : script_end + len("</script>")]
    tail_part = html[script_end + len("</script>") :]

    for old, new in JS_REPLACEMENTS:
        if old not in script_part:
            raise SystemExit(f"JS patch khong tim thay: {old[:60]}...")
        script_part = script_part.replace(old, new, 1)
    return head_part + script_part + tail_part


def update_drugs(drugs: list[dict], catalog, children) -> None:
    for d in drugs:
        apply_icd_fields_to_drug(d, catalog, children)


def main():
    if not BACKUP.is_file():
        raise SystemExit(f"Thieu backup: {BACKUP}")
    if HTML.is_file():
        shutil.copy2(HTML, CORRUPT_BAK)
        print("Da luu ban hong:", CORRUPT_BAK.name)
    shutil.copy2(BACKUP, HTML)
    print("Da khoi phuc tu:", BACKUP.name)

    html = HTML.read_text(encoding="utf-8")
    html = patch_js_head(html)

    loaded = try_load_xlsx(XLSX_DEFAULT)
    if loaded:
        catalog, _, children = loaded
        print("ICD: Excel", len(catalog))
    else:
        catalog, _, children = load_icd_from_html(html)
        print("ICD: embedded", len(catalog))

    drugs = load_drugs_from_html(html)
    print("Thuoc:", len(drugs))
    update_drugs(drugs, catalog, children)
    html = patch_html_drug_chunks(html, drugs)

    if "</html>" not in html:
        raise SystemExit("HTML truncated after patch!")
    HTML.write_text(html, encoding="utf-8")
    print("Hoan tat:", HTML.name)

    d = next(x for x in drugs if "Losartan" in (x.get("tenHoatChat") or ""))
    print("Losartan maICDChiDinh:", d.get("maICDChiDinh"))


if __name__ == "__main__":
    main()
