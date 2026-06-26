# -*- coding: utf-8 -*-
"""Đọc/ghi dataset DVKT dạng JSON nén (.json.gz) — tách khỏi HTML monolithic."""
from __future__ import annotations

import gzip
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = BASE / "dvkt_app" / "data"

DATASET_IDS = (
    "pl1",
    "pl2",
    "pl3",
    "tt23pl1",
    "tt23pl2",
    "bvpcst",
    "bvpcct",
    "bvpsd",
    "pvhnbhxh",
    "quytrinhkt",
)

_DATASET_CONST = {
    "pl1": ("INITIAL_PL1_COLUMNS", "INITIAL_PL1_DATA"),
    "pl2": ("INITIAL_PL2_COLUMNS", "INITIAL_PL2_DATA"),
    "pl3": ("INITIAL_PL3_COLUMNS", "INITIAL_PL3_DATA"),
    "tt23pl1": ("INITIAL_TT23_PL1_COLUMNS", "INITIAL_TT23_PL1_DATA"),
    "tt23pl2": ("INITIAL_TT23_PL2_COLUMNS", "INITIAL_TT23_PL2_DATA"),
    "bvpcst": ("INITIAL_BVPCST_COLUMNS", "INITIAL_BVPCST_DATA"),
    "bvpcct": ("INITIAL_BVPCCT_COLUMNS", "INITIAL_BVPCCT_DATA"),
    "bvpsd": ("INITIAL_BVPSD_COLUMNS", "INITIAL_BVPSD_DATA"),
    "pvhnbhxh": ("INITIAL_PVHN_BHXH_COLUMNS", "INITIAL_PVHN_BHXH_DATA"),
    "quytrinhkt": ("INITIAL_QTKT_COLUMNS", "INITIAL_QTKT_DATA"),
}


def _find_array_end(text: str, start: int) -> int:
    """start trỏ tới '[' — trả về index sau '];'."""
    depth = 0
    in_str = False
    esc = False
    i = start
    n = len(text)
    while i < n:
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    while end < n and text[end] in " \t\r\n":
                        end += 1
                    if end < n and text[end] == ";":
                        return end + 1
                    return i + 1
        i += 1
    raise ValueError(f"Khong tim thay ket thuc mang tai offset {start}")


def load_json_block(text: str, name: str) -> list | None:
    marker = f"const {name} = "
    idx = text.find(marker)
    if idx == -1:
        return None
    arr_start = text.find("[", idx + len(marker))
    if arr_start == -1:
        return None
    arr_end = _find_array_end(text, arr_start)
    return json.loads(text[arr_start:arr_end].rstrip(";").strip())


def extract_all_from_html(html_path: Path) -> dict[str, dict]:
    text = html_path.read_text(encoding="utf-8")
    out: dict[str, dict] = {}
    for tab_id, (col_name, data_name) in _DATASET_CONST.items():
        columns = load_json_block(text, col_name)
        rows = load_json_block(text, data_name)
        if columns is None or rows is None:
            raise SystemExit(f"Missing {col_name} / {data_name} in {html_path.name}")
        out[tab_id] = {"columns": columns, "rows": rows}
    return out


def save_dataset(tab_id: str, columns: list, rows: list, data_dir: Path | None = None) -> Path:
    data_dir = data_dir or DEFAULT_DATA_DIR
    data_dir.mkdir(parents=True, exist_ok=True)
    path = data_dir / f"{tab_id}.json.gz"
    payload = json.dumps({"columns": columns, "rows": rows}, ensure_ascii=False, separators=(",", ":"))
    with gzip.open(path, "wt", encoding="utf-8", compresslevel=9) as f:
        f.write(payload)
    return path


def load_dataset(tab_id: str, data_dir: Path | None = None) -> dict:
    data_dir = data_dir or DEFAULT_DATA_DIR
    path = data_dir / f"{tab_id}.json.gz"
    if not path.is_file():
        raise FileNotFoundError(path)
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return json.load(f)


def save_all(datasets: dict[str, dict], data_dir: Path | None = None) -> list[Path]:
    paths = []
    for tab_id, pack in datasets.items():
        paths.append(save_dataset(tab_id, pack["columns"], pack["rows"], data_dir))
    manifest = {
        "tabs": list(datasets.keys()),
        "version": __import__("datetime").date.today().isoformat(),
        "columns": {tab_id: pack["columns"] for tab_id, pack in datasets.items()},
    }
    data_dir = data_dir or DEFAULT_DATA_DIR
    data_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = data_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    paths.append(manifest_path)
    return paths


def dir_size_mb(path: Path) -> float:
    total = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    return total / (1024 * 1024)


def format_sizes(data_dir: Path | None = None) -> str:
    data_dir = data_dir or DEFAULT_DATA_DIR
    lines = [f"Dir: {data_dir}"]
    for tab_id in DATASET_IDS:
        p = data_dir / f"{tab_id}.json.gz"
        if p.is_file():
            lines.append(f"  {tab_id}: {p.stat().st_size / 1024 / 1024:.2f} MB")
    if data_dir.is_dir():
        lines.append(f"Total data: {dir_size_mb(data_dir):.2f} MB")
    return "\n".join(lines)
