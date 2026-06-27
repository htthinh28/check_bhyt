# -*- coding: utf-8 -*-
"""Move main app JS to <head> so it runs before 15MB embedded JSON; fix vi-sinh paths."""
import re
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"G:/My Drive/Thu vien (1)")
HTML = BASE / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html"
SRC = BASE / "index thu vien.txt"
CHANDOAN = BASE / "chandoan-html"

MAIN_START = "        // --- CONSTANTS & INITIAL DATA ---"
MAIN_SCRIPT_OPEN = "<script>\n" + MAIN_START
HEAD_INSERT_AFTER = "    })();\n    </script>\n</head>"


def ensure_complete(text: str) -> str:
    if "data-chunk=\"13\"" in text and "function navigateToSection" in text and text.rstrip().endswith("</html>"):
        return text
    print("File incomplete — restoring tail from index thu vien.txt...")
    src = SRC.read_text(encoding="utf-8")
    idx12_html = text.find('data-chunk="12"')
    if idx12_html < 0:
        raise SystemExit("chunk 12 missing")
    head = text[: text.rfind("\n", 0, idx12_html) + 1]
    idx12_src = src.find('data-chunk="12"')
    tail = src[src.rfind("\n", 0, idx12_src) + 1 :]
    return head + tail


def fix_vi_sinh_files():
    pairs = [
        ("vi-sinh-lam-sang-2025.mjs", "vi-sinh-lam-sang-2025.js"),
        ("vi-sinh-lam-sang-2025-meta.mjs", "vi-sinh-lam-sang-2025-meta.js"),
    ]
    for src_name, dst_name in pairs:
        src = CHANDOAN / src_name
        dst = CHANDOAN / dst_name
        if src.exists() and (not dst.exists() or dst.stat().st_size != src.stat().st_size):
            shutil.copy2(src, dst)
            print("Copied", dst_name)


def move_main_script_to_head(text: str) -> str:
    start = text.find(MAIN_SCRIPT_OPEN)
    if start < 0:
        start = text.find("<script>\n        // --- CONSTANTS")
    if start < 0:
        raise SystemExit("Main script block not found")

    end = text.find("</script>", start)
    if end < 0:
        raise SystemExit("Main script closing tag not found")
    end += len("</script>")

    block = text[start:end]
    if HEAD_INSERT_AFTER not in text:
        raise SystemExit("Head anchor not found")

    # Remove from bottom (include trailing newline)
    tail_after = text[end:].lstrip("\n")
    text_without = text[:start] + tail_after

    # Insert into head
    text_without = text_without.replace(
        HEAD_INSERT_AFTER,
        "    })();\n    </script>\n" + block + "\n</head>",
        1,
    )
    return text_without


def patch_vi_sinh_refs(text: str) -> str:
    text = text.replace(
        'src="chandoan-html/vi-sinh-lam-sang-2025.js"',
        'src="chandoan-html/vi-sinh-lam-sang-2025.js"',
    )
    return text


def add_storage_guard(text: str) -> str:
    guard = """
    <script>
    (function () {
        function wrapStorage(name) {
            try {
                var s = window[name];
                var probe = '__storage_probe__';
                s.setItem(probe, '1');
                s.removeItem(probe);
                return;
            } catch (_) {}
            var mem = {};
            window[name] = {
                getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
                setItem: function (k, v) { mem[k] = String(v); },
                removeItem: function (k) { delete mem[k]; },
                clear: function () { mem = {}; },
                key: function (i) { return Object.keys(mem)[i] || null; },
                get length() { return Object.keys(mem).length; }
            };
        }
        wrapStorage('localStorage');
        wrapStorage('sessionStorage');
    })();
    </script>
"""
    anchor = "<script>\n        tailwind.config = {"
    if "wrapStorage('localStorage')" in text:
        print("Storage guard already present")
        return text
    if anchor not in text:
        raise SystemExit("Tailwind anchor missing for storage guard")
    return text.replace(anchor, guard + "\n    " + anchor, 1)


def main():
    fix_vi_sinh_files()
    text = HTML.read_text(encoding="utf-8")
    print("Before:", len(text), "bytes")

    bak = HTML.with_suffix(HTML.suffix + ".pre-head-move.bak")
    if not bak.exists():
        shutil.copy2(HTML, bak)
        print("Backup:", bak.name)

    text = ensure_complete(text)
    text = move_main_script_to_head(text)
    text = patch_vi_sinh_refs(text)
    text = add_storage_guard(text)

    checks = {
        "nav_in_head": text.find("function navigateToSection") < text.find("<body"),
        "single_main": text.count(MAIN_START) == 1,
        "html_end": text.rstrip().endswith("</html>"),
        "chunks_14": all(f'data-chunk="{i}"' in text for i in range(1, 15)),
    }
    print("Checks:", checks)
    if not all(checks.values()):
        raise SystemExit("Verification failed")

    HTML.write_text(text, encoding="utf-8")
    print("After:", len(text), "bytes — main JS now in <head>")


if __name__ == "__main__":
    main()
