# -*- coding: utf-8 -*-
"""Ứng dụng web Danh mục DVKT — Flask, dữ liệu tách file nén."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from flask import Flask, Response, jsonify, send_from_directory

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
STATIC_DIR = APP_DIR / "static"
THU_VIEN_ROOT = APP_DIR.parent
DUOC_THU_HTML = THU_VIEN_ROOT / "Dược thư BHYT - CHỈ MỞ FILE NÀY (1).html"
DUOC_THU_DATA = THU_VIEN_ROOT / "duocthu_data"
DUOC_THU_STATIC = STATIC_DIR / "duocthu" / "index.html"
CHANDOAN_DIR = THU_VIEN_ROOT / "chandoan-html"

sys.path.insert(0, str(APP_DIR.parent))
from _dvkt_data_io import DATASET_IDS, load_dataset  # noqa: E402

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")

# Cache gzip trên RAM — đọc đĩa một lần, truyền nén (~2.5 MB thay vì ~40 MB)
_GZIP_CACHE: dict[str, bytes] = {}
_MANIFEST_RAW: str | None = None
_ACTIVE_DATASET_IDS: tuple[str, ...] = DATASET_IDS


def discover_dataset_ids() -> tuple[str, ...]:
    """Hợp nhất DATASET_IDS + manifest + file .json.gz trên đĩa."""
    seen: list[str] = []
    for tab_id in DATASET_IDS:
        if tab_id not in seen:
            seen.append(tab_id)
    manifest_path = DATA_DIR / "manifest.json"
    if manifest_path.is_file():
        try:
            tabs = json.loads(manifest_path.read_text(encoding="utf-8")).get("tabs", [])
            for tab_id in tabs:
                if tab_id not in seen:
                    seen.append(tab_id)
        except json.JSONDecodeError:
            pass
    if DATA_DIR.is_dir():
        for path in sorted(DATA_DIR.glob("*.json.gz")):
            tab_id = path.name.removesuffix(".json.gz")
            if tab_id not in seen:
                seen.append(tab_id)
    return tuple(seen)


def warmup_cache() -> None:
    global _MANIFEST_RAW, _ACTIVE_DATASET_IDS
    _ACTIVE_DATASET_IDS = discover_dataset_ids()
    manifest_path = DATA_DIR / "manifest.json"
    if manifest_path.is_file():
        _MANIFEST_RAW = manifest_path.read_text(encoding="utf-8")
    _GZIP_CACHE.clear()
    for tab_id in _ACTIVE_DATASET_IDS:
        path = DATA_DIR / f"{tab_id}.json.gz"
        if path.is_file():
            _GZIP_CACHE[tab_id] = path.read_bytes()
    print(f"Cache: {len(_GZIP_CACHE)} dataset ({', '.join(_GZIP_CACHE)})")
    print(f"Gzip total: {sum(len(v) for v in _GZIP_CACHE.values()) / 1024 / 1024:.2f} MB")


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


def _duoc_thu_html_bytes() -> bytes | None:
    for path in (DUOC_THU_STATIC, DUOC_THU_HTML):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        if path == DUOC_THU_HTML:
            text = text.replace('src="chandoan-html/', 'src="/chandoan-html/')
            text = text.replace("src='chandoan-html/", "src='/chandoan-html/")
        return text.encode("utf-8")
    return None


@app.route("/duocthu")
@app.route("/duocthu/")
def duoc_thu():
    body = _duoc_thu_html_bytes()
    if body is None:
        return Response(
            "Không tìm thấy file Dược thư. Chạy: python _sync_duoc_thu_static.py",
            status=404,
            mimetype="text/html; charset=utf-8",
        )
    return Response(body, mimetype="text/html; charset=utf-8")


@app.route("/chandoan-html/<path:filename>")
def chandoan_html(filename: str):
    if not CHANDOAN_DIR.is_dir():
        return Response("Thiếu thư mục chandoan-html", status=404)
    path = (CHANDOAN_DIR / filename).resolve()
    if not str(path).startswith(str(CHANDOAN_DIR.resolve())):
        return Response("Forbidden", status=403)
    if not path.is_file():
        return Response("Not found", status=404)
    return Response(path.read_bytes(), mimetype="application/javascript")


@app.route("/api/duocthu/status")
def duocthu_status():
    return jsonify({
        "static_html": DUOC_THU_STATIC.is_file(),
        "source_html": DUOC_THU_HTML.is_file(),
        "data_dir": DUOC_THU_DATA.is_dir(),
        "data_files": len(list(DUOC_THU_DATA.glob("*.js"))) if DUOC_THU_DATA.is_dir() else 0,
        "url": "http://127.0.0.1:5050/duocthu",
    })


@app.route("/duocthu_data/<path:filename>")
def duocthu_data(filename: str):
    if not DUOC_THU_DATA.is_dir():
        return Response("Thiếu thư mục duocthu_data", status=404)
    path = (DUOC_THU_DATA / filename).resolve()
    if not str(path).startswith(str(DUOC_THU_DATA.resolve())):
        return Response("Forbidden", status=403)
    if not path.is_file():
        return Response("Not found", status=404)
    mimetype = "application/javascript" if path.suffix.lower() == ".js" else "application/json"
    return Response(path.read_bytes(), mimetype=mimetype)


@app.route("/api/manifest")
def manifest():
    if _MANIFEST_RAW:
        return Response(_MANIFEST_RAW, mimetype="application/json")
    path = DATA_DIR / "manifest.json"
    if not path.is_file():
        return jsonify({"tabs": list(_ACTIVE_DATASET_IDS), "version": "unknown", "columns": {}})
    return Response(path.read_text(encoding="utf-8"), mimetype="application/json")


@app.route("/api/data/<tab_id>")
def data(tab_id: str):
    global _ACTIVE_DATASET_IDS
    ids = _ACTIVE_DATASET_IDS or discover_dataset_ids()
    if tab_id not in ids:
        _ACTIVE_DATASET_IDS = discover_dataset_ids()
        ids = _ACTIVE_DATASET_IDS
    if tab_id not in ids:
        return jsonify({"error": "unknown dataset", "tab": tab_id, "available": list(ids)}), 404
    raw = _GZIP_CACHE.get(tab_id)
    if raw is None:
        path = DATA_DIR / f"{tab_id}.json.gz"
        if path.is_file():
            raw = path.read_bytes()
            _GZIP_CACHE[tab_id] = raw
    if raw is not None:
        return Response(
            raw,
            mimetype="application/json",
            headers={"Content-Encoding": "gzip", "Vary": "Accept-Encoding"},
        )
    try:
        pack = load_dataset(tab_id, DATA_DIR)
    except FileNotFoundError:
        return jsonify({"error": "dataset not found"}), 404
    return jsonify(pack)


def main():
    import os

    if not DATA_DIR.is_dir():
        print("Chua co du lieu. Chay: python _extract_dvkt_data.py")
        sys.exit(1)
    warmup_cache()
    host = os.environ.get("CDSS_THUVIEN_HOST", "127.0.0.1").strip() or "127.0.0.1"
    port = int(os.environ.get("CDSS_THUVIEN_PORT", "5050") or "5050")
    print(f"Mo trinh duyet: http://{host}:{port}")
    print(f"Duoc thu:      http://{host}:{port}/duocthu")
    app.run(host=host, port=port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
