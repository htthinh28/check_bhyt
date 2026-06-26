# -*- coding: utf-8 -*-
"""Tách dữ liệu nhúng trong Dược thư HTML ra duocthu_data/*.js (<10 MB/file)."""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML_PATH = BASE / "Dược thư Phương Châu - CHỈ MỞ FILE NÀY (1).html"
DATA_DIR = BASE / "duocthu_data"
LIMIT_BYTES = 10 * 1024 * 1024

CHUNK_CLASSES = (
    ("drugs-data-chunk", "drugs"),
    ("jci-data-chunk", "jci"),
    ("icd-data-chunk", "icd"),
)

LOADER_MARKER = "/* PC_EXTERNAL_DATA_LOADER */"
PREFIX_MARKER = "<!-- PC_DUOC_DATA_PREFIX -->"

LOADER_JS = r"""
        /* PC_EXTERNAL_DATA_LOADER */
        function getDuocDataPrefix() {
            if (window.PC_DUOC_DATA_PREFIX) return window.PC_DUOC_DATA_PREFIX;
            const p = (location.protocol || '').toLowerCase();
            return (p === 'file:' || p === 'content:' || p === 'ios:') ? 'duocthu_data/' : '/duocthu_data/';
        }

        async function loadExternalDataChunk(fileKey, el) {
            if (window.__PC_DUOC_CHUNKS && window.__PC_DUOC_CHUNKS[fileKey]) {
                return window.__PC_DUOC_CHUNKS[fileKey];
            }
            const file = el && el.dataset ? el.dataset.file : '';
            if (!file) {
                return JSON.parse(el.textContent || '[]');
            }
            const url = getDuocDataPrefix() + file;
            if (file.toLowerCase().endsWith('.js')) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = url;
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('Không tải được ' + url));
                    document.head.appendChild(s);
                });
                const data = window.__PC_DUOC_CHUNKS && window.__PC_DUOC_CHUNKS[fileKey];
                if (!data) throw new Error('Khối dữ liệu trống: ' + fileKey);
                return data;
            }
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
            return await res.json();
        }
"""

PREFIX_SCRIPT = (
    "<!-- PC_DUOC_DATA_PREFIX -->\n"
    '    <script>window.PC_DUOC_DATA_PREFIX=(location.protocol===\'file:\'||location.protocol===\'content:\')'
    "?'duocthu_data/':'/duocthu_data/';</script>"
)

CHUNK_RE = re.compile(
    r'<script type="application/json" class="(?P<cls>drugs-data-chunk|jci-data-chunk|icd-data-chunk)"'
    r'(?P<attrs>[^>]*)>(?P<body>.*?)</script>',
    re.S,
)


def patch_loader_functions(html: str) -> str:
    if LOADER_MARKER not in html:
        anchor = "        /** Đọc CSDL nhúng — hỗ trợ nhiều khối nhỏ (ổn định trên điện thoại/iOS) */"
        if anchor not in html:
            raise SystemExit("Không tìm thấy anchor readEmbeddedDrugsAsync")
        html = html.replace(anchor, LOADER_JS + "\n" + anchor, 1)

    if PREFIX_MARKER not in html:
        head_end = html.find("</head>")
        if head_end == -1:
            raise SystemExit("Không tìm thấy </head>")
        html = html[:head_end] + "\n    " + PREFIX_SCRIPT + "\n" + html[head_end:]

    old_drugs = (
        "                    const part = JSON.parse(chunkEls[i].textContent);\n"
        "                    if (!Array.isArray(part)) throw new Error('Khối dữ liệu ' + (i + 1) + ' không hợp lệ');"
    )
    new_drugs = (
        "                    const el = chunkEls[i];\n"
        "                    const fileKey = el.dataset.file ? el.dataset.file.replace(/\\.js$/i, '') : null;\n"
        "                    const part = fileKey ? await loadExternalDataChunk(fileKey, el) : JSON.parse(el.textContent);\n"
        "                    if (!Array.isArray(part)) throw new Error('Khối dữ liệu ' + (i + 1) + ' không hợp lệ');"
    )
    if old_drugs in html:
        html = html.replace(old_drugs, new_drugs, 1)

    old_jci = "                all.push(...JSON.parse(chunkEls[i].textContent));"
    new_jci = (
        "                const el = chunkEls[i];\n"
        "                const fk = el.dataset.file ? el.dataset.file.replace(/\\.js$/i, '') : null;\n"
        "                const part = fk ? await loadExternalDataChunk(fk, el) : JSON.parse(el.textContent);\n"
        "                all.push(...part);"
    )
    if old_jci in html:
        html = html.replace(old_jci, new_jci, 1)

    old_icd = (
        "                const part = JSON.parse(chunkEls[i].textContent);\n"
        "                if (!Array.isArray(part)) throw new Error('Khối ICD ' + (i + 1) + ' không hợp lệ');"
    )
    new_icd = (
        "                const el = chunkEls[i];\n"
        "                const fk = el.dataset.file ? el.dataset.file.replace(/\\.js$/i, '') : null;\n"
        "                const part = fk ? await loadExternalDataChunk(fk, el) : JSON.parse(el.textContent);\n"
        "                if (!Array.isArray(part)) throw new Error('Khối ICD ' + (i + 1) + ' không hợp lệ');"
    )
    if old_icd in html:
        html = html.replace(old_icd, new_icd, 1)

    return html


def write_chunk_js(path: Path, key: str, data) -> int:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    text = (
        "(function(w){w.__PC_DUOC_CHUNKS=w.__PC_DUOC_CHUNKS||{};"
        f"w.__PC_DUOC_CHUNKS[{json.dumps(key)}]="
        + payload
        + ";})(window);\n"
    )
    path.write_text(text, encoding="utf-8")
    return path.stat().st_size


def split_chunks(html: str) -> tuple[str, list[str]]:
    logs: list[str] = []
    counters: dict[str, int] = {prefix: 0 for _, prefix in CHUNK_CLASSES}
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    def repl(match: re.Match) -> str:
        cls = match.group("cls")
        attrs = match.group("attrs")
        body = match.group("body").strip()
        prefix = next(p for c, p in CHUNK_CLASSES if c == cls)

        if 'data-file="' in attrs:
            return match.group(0)

        if not body:
            return match.group(0)

        counters[prefix] += 1
        n = counters[prefix]
        file_name = f"{prefix}-{n:02d}.js"
        key = f"{prefix}-{n:02d}"

        data = json.loads(body)
        out_path = DATA_DIR / file_name
        size = write_chunk_js(out_path, key, data)
        if size > LIMIT_BYTES:
            logs.append(f"  ✗ {file_name} vượt 10 MB ({size/1024/1024:.2f} MB)")
        else:
            logs.append(f"  ✓ {file_name} ({size/1024:.1f} KB)")

        return (
            f'<script type="application/json" class="{cls}"{attrs} data-file="{file_name}"></script>'
        )

    new_html = CHUNK_RE.sub(repl, html)
    return new_html, logs


def write_portable_db() -> None:
    """Gộp drugs → duoc-thu-db.json (tùy chọn, cho chế độ portable)."""
    drugs: list = []
    for path in sorted(DATA_DIR.glob("drugs-*.js")):
        text = path.read_text(encoding="utf-8")
        m = re.search(r"__PC_DUOC_CHUNKS\[[^\]]+\]=(\[.*\]);", text, re.S)
        if m:
            drugs.extend(json.loads(m.group(1)))
    if len(drugs) < 100:
        return
    snap = {"version": 5, "drugs": drugs}
    out = BASE / "duoc-thu-db.json"
    raw = json.dumps(snap, ensure_ascii=False)
    if len(raw.encode("utf-8")) > LIMIT_BYTES:
        print(f"Bỏ qua {out.name} (>{LIMIT_BYTES//1024//1024} MB) — dùng duocthu_data/drugs-*.js")
        return
    out.write_text(raw, encoding="utf-8")
    print(f"Portable DB: {out.name} ({out.stat().st_size/1024/1024:.2f} MB, {len(drugs)} thuốc)")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if not HTML_PATH.is_file():
        raise SystemExit(f"Không tìm thấy {HTML_PATH}")

    raw = HTML_PATH.read_text(encoding="utf-8")
    if 'class="drugs-data-chunk"' not in raw:
        raise SystemExit("File không có drugs-data-chunk")

    already = 'data-file="drugs-' in raw
    bak = HTML_PATH.with_suffix(".html.bak")
    if not bak.is_file() and not already:
        print(f"Sao lưu → {bak.name}")
        shutil.copy2(HTML_PATH, bak)

    html = patch_loader_functions(raw)
    if not already:
        html, logs = split_chunks(html)
        print(f"Đã tách {len(logs)} khối → {DATA_DIR}/")
        for line in logs:
            print(line)
    else:
        print("Dữ liệu đã tách trước đó (data-file có sẵn), chỉ cập nhật loader.")

    HTML_PATH.write_text(html, encoding="utf-8")
    shell_kb = HTML_PATH.stat().st_size / 1024
    shell_mb = shell_kb / 1024
    print(f"HTML shell: {shell_kb:.1f} KB ({shell_mb:.2f} MB)")
    if shell_mb > 10:
        print("⚠ HTML shell vẫn > 10 MB — kiểm tra thêm.")

    if not already:
        write_portable_db()

    big = [p for p in DATA_DIR.glob("*.js") if p.stat().st_size > LIMIT_BYTES]
    if big:
        raise SystemExit(f"Có file vượt 10 MB: {[p.name for p in big]}")
    print("Hoàn tất.")


if __name__ == "__main__":
    main()
