# -*- coding: utf-8 -*-
"""Gỡ brandname Phương Châu khỏi mã nguồn — thay bằng CDSS Bảo hiểm y tế."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {
    '.git', 'node_modules', 'web_export_test', 'web_export_verify',
    '.expo', 'dist', 'build', '__pycache__', '.venv',
}
SKIP_PATH_PARTS = (
    'tai_lieu/_extract_hop_dong_phuong_chau',
    'Hop_dong_plain.txt',
    'The_tri_thuc_hop_dong_KCB_BHYT_BV_Phuong_Chau',
    'Phu_luc_QD_CLVT_BVPCST_2025_plain.txt',
)

EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.py', '.mjs',
    '.cjs', '.yml', '.txt', '.xml',
}

# Thứ tự quan trọng: cụm dài trước
REPLACEMENTS: list[tuple[str, str]] = [
    ('CDSS BHYT Phương Châu', 'CDSS Bảo hiểm y tế'),
    ('CDSS BHYT Phuong Chau', 'CDSS Bảo hiểm y tế'),
    ('CDSS Phương Châu', 'CDSS Bảo hiểm y tế'),
    ('CDSS PHƯƠNG CHÂU', 'CDSS BẢO HIỂM Y TẾ'),
    ('Tập đoàn Y tế Phương Châu', 'CDSS Bảo hiểm y tế'),
    ('TẬP ĐOÀN Y TẾ PHƯƠNG CHÂU', 'CDSS BẢO HIỂM Y TẾ'),
    ('Bệnh viện Quốc tế Phương Châu Sóc Trăng', 'CSKCB Sóc Trăng'),
    ('BỆNH VIỆN QUỐC TẾ PHƯƠNG CHÂU SÓC TRĂNG', 'CSKCB SÓC TRĂNG'),
    ('Bệnh viện Quốc tế Phương Châu', 'CSKCB'),
    ('BỆNH VIỆN QUỐC TẾ PHƯƠNG CHÂU', 'CDSS BẢO HIỂM Y TẾ'),
    ('BV Quốc tế Phương Châu', 'CSKCB'),
    ('BV QUỐC TẾ PHƯƠNG CHÂU SÓC TRĂNG', 'CSKCB SÓC TRĂNG'),
    ('BV QUỐC TẾ PHƯƠNG CHÂU', 'CDSS BHYT'),
    ('Phác đồ Phương Châu', 'Phác đồ CDSS BHYT'),
    ('PHÁC ĐỒ PHƯƠNG CHÂU', 'PHÁC ĐỒ CDSS BHYT'),
    ('Dược thư Phương Châu', 'Dược thư BHYT'),
    ('Phương Châu Sóc Trăng', 'CSKCB Sóc Trăng'),
    ('Phương Châu', 'CDSS BHYT'),
    ('PHƯƠNG CHÂU', 'CDSS BHYT'),
    ('Phuong Chau', 'CDSS BHYT'),
    ('phuong chau', 'cdss bhyt'),
]


def should_skip(path: Path) -> bool:
    parts = path.parts
    if any(p in SKIP_DIRS for p in parts):
        return True
    s = str(path).replace('\\', '/')
    if any(x in s for x in SKIP_PATH_PARTS):
        return True
    if path.suffix not in EXTENSIONS:
        return False
    return False


def rebrand_text(text: str) -> tuple[str, int]:
    n = 0
    for old, new in REPLACEMENTS:
        if old in text:
            c = text.count(old)
            text = text.replace(old, new)
            n += c
    return text, n


def main() -> None:
    changed_files: list[tuple[Path, int]] = []
    for path in ROOT.rglob('*'):
        if not path.is_file() or should_skip(path):
            continue
        try:
            raw = path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            continue
        new, n = rebrand_text(raw)
        if n and new != raw:
            path.write_text(new, encoding='utf-8')
            changed_files.append((path.relative_to(ROOT), n))
    print(f'Đã sửa {len(changed_files)} file, {sum(n for _, n in changed_files)} thay thế')
    for rel, n in sorted(changed_files, key=lambda x: -x[1])[:40]:
        print(f'  {n:4d}  {rel}')


if __name__ == '__main__':
    main()
