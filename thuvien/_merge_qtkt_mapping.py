# -*- coding: utf-8 -*-
"""Merge Quy trình kỹ thuật BYT → dataset quytrinhkt + liên kết QĐ7603 / TT23 / ICD-10."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from _dvkt_data_io import DEFAULT_DATA_DIR, load_dataset, save_dataset
from _qtkt_dvkt_bridge import link_qtkt_row, load_mapping_context, is_polluted_tt23_name
from _qtkt_icd_bridge import _build_long_name_index, apply_qtkt_icd_fields, validate_icd_fields
from _parse_qtkt_pdf import audit_qtkt_sources, parse_qtkt_pdf
from _update_icd_deep import try_load_xlsx

BASE = Path(__file__).resolve().parent
DEFAULT_SOURCE = BASE / "data" / "qtkt_source"
DOWNLOAD_SOURCE = Path(r"C:\Users\admin\Downloads\qtkt_source")
ICD_XLSX_CANDIDATES = [
    BASE / "data" / "icd10" / "Phu luc Bang danh muc ICD10_FINAL.xlsx",
    Path(r"c:\Users\admin\Downloads\Phu luc Bang danh muc ICD10_FINAL  (1).xlsx"),
    Path(r"c:\Users\admin\Documents\Google Drive\BHYT\icd10 2026\Phu luc Bang danh muc ICD10_FINAL.xlsx"),
]

QTKT_COLUMNS = [
    {"key": "stt", "label": "STT", "type": "number"},
    {"key": "quyTrinhSo", "label": "QT số (trong tài liệu)", "type": "number"},
    {"key": "maKyThuat", "label": "Mã kỹ thuật (TT23)", "type": "text"},
    {"key": "tenKyThuat", "label": "Tên kỹ thuật (quy trình)", "type": "text"},
    {"key": "tenKyThuatTT23", "label": "Tên kỹ thuật TT23", "type": "text"},
    {"key": "phuLucTT23", "label": "Phụ lục TT23", "type": "text"},
    {"key": "chuongTT23", "label": "Chương TT23", "type": "text"},
    {"key": "maICDChiDinh", "label": "Mã ICD-10 chỉ định", "type": "text"},
    {"key": "tenBenhICDChiDinh", "label": "Tên bệnh ICD chỉ định", "type": "text"},
    {"key": "maICDChongChiDinh", "label": "Mã ICD-10 chống chỉ định", "type": "text"},
    {"key": "tenBenhICDChongChiDinh", "label": "Tên bệnh ICD chống chỉ định", "type": "text"},
    {"key": "doTinCayICDChiDinh", "label": "Độ tin cậy ICD chỉ định", "type": "text"},
    {"key": "doTinCayICDChongChiDinh", "label": "Độ tin cậy ICD chống chỉ định", "type": "text"},
    {"key": "chiDinh", "label": "Chỉ định (nguyên văn)", "type": "text"},
    {"key": "chongChiDinh", "label": "Chống chỉ định (nguyên văn)", "type": "text"},
    {"key": "thoiGianThucHien", "label": "Thời gian thực hiện", "type": "text"},
    {"key": "nhanSuThucHien", "label": "Nhân sự / Phạm vi hành nghề", "type": "text"},
    {"key": "soQuyetDinh", "label": "Số QĐ BYT", "type": "text"},
    {"key": "ngayBanHanh", "label": "Ngày ban hành", "type": "text"},
    {"key": "tenTaiLieu", "label": "Tài liệu nguồn", "type": "text"},
    {"key": "chuyenKhoa", "label": "Chuyên khoa / Tập", "type": "text"},
    {"key": "tenFileNguon", "label": "File nguồn", "type": "text"},
    {"key": "lienKetQD7603", "label": "Mã QĐ7603 liên kết", "type": "text"},
    {"key": "maTT43", "label": "Mã TT43 (QĐ7603)", "type": "text"},
    {"key": "maTuongDuong", "label": "Mã tương đương", "type": "text"},
    {"key": "tenTT43", "label": "Tên QĐ7603", "type": "text"},
    {"key": "maDichVuBV", "label": "Mã DVKT bệnh viện", "type": "text"},
    {"key": "tenDichVuBV", "label": "Tên DVKT bệnh viện", "type": "text"},
    {"key": "benhVienDVKT", "label": "Nguồn DM bệnh viện", "type": "text"},
    {"key": "doTinCayMappingBV", "label": "Độ tin cậy DM BV", "type": "text"},
    {"key": "ghiChuMappingBV", "label": "Ghi chú DM BV", "type": "text"},
    {"key": "ghiChuMapping", "label": "Ghi chú mapping pháp lý", "type": "text"},
    {"key": "lienKetTT23", "label": "Mã TT23 liên kết", "type": "text"},
    {"key": "doTinCayMapping", "label": "Độ tin cậy mapping", "type": "text"},
    {"key": "tagsMapping", "label": "Thẻ mapping", "type": "computed"},
]


def load_icd_catalog() -> tuple[dict, dict, list[tuple[str, dict]]] | tuple[None, None, None]:
    for path in ICD_XLSX_CANDIDATES:
        loaded = try_load_xlsx(str(path))
        if loaded:
            catalog, _, children = loaded
            return catalog, children, _build_long_name_index(catalog)
    html_glob = list(BASE.glob("*(1)*.html"))
    if html_glob:
        from _update_icd_deep import load_icd_from_html

        text = html_glob[0].read_text(encoding="utf-8", errors="replace")
        catalog, _, children = load_icd_from_html(text)
        if catalog:
            return catalog, children, _build_long_name_index(catalog)
    from _qtkt_normalize import load_icd_from_duocthu_data

    loaded = load_icd_from_duocthu_data(BASE)
    if loaded and loaded[0]:
        return loaded
    return None, None, None


def enrich_qtkt_rows(
    rows: list[dict],
    catalog: dict | None,
    children: dict | None,
    long_names: list[tuple[str, dict]] | None = None,
) -> list[dict]:
    ctx = load_mapping_context()
    out: list[dict] = []
    for i, row in enumerate(rows, start=1):
        from _qtkt_normalize import normalize_qtkt_row

        row = normalize_qtkt_row(dict(row))
        row["stt"] = i
        if catalog and children:
            apply_qtkt_icd_fields(row, catalog, children, long_names)
        row = link_qtkt_row(row, ctx)
        row["_rowId"] = f"qtkt-{row.get('quyTrinhSo','')}-{row.get('maKyThuat','')}-{row.get('tenFileNguon','')[:12]}"
        out.append(row)
    return out


def update_manifest(columns: list[dict], *, version: str | None = None, row_count: int | None = None) -> None:
    manifest_path = DEFAULT_DATA_DIR / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.is_file() else {"tabs": [], "columns": {}}
    tabs = list(manifest.get("tabs", []))
    if "quytrinhkt" not in tabs:
        tabs.append("quytrinhkt")
    manifest["tabs"] = tabs
    if version:
        manifest["version"] = version
    manifest.setdefault("columns", {})["quytrinhkt"] = columns
    meta = manifest.setdefault("meta", {})
    meta["quytrinhkt"] = {
        "nguon": "Quy trình kỹ thuật ban hành kèm QĐ-BYT theo chuyên khoa (2025–2026)",
        "canCuPhapLy": [
            "TT 23/2024/TT-BYT — danh mục kỹ thuật (PL1/PL2)",
            "QĐ 7603/QĐ-BYT — danh mục DVKT",
            "ICD-10 (TT06/QĐ 3176) — chỉ định / chống chỉ định",
            "Danh mục DVKT bệnh viện (PCST · PCCT · PSD)",
        ],
        "capNhat": version or manifest.get("version", ""),
        "soQuyTrinh": row_count,
        "cauTruc": "§2 Chỉ định · §3 Chống chỉ định · §5.1 Nhân sự · §5.6 Thời gian (mẫu BYT)",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def resolve_source_dir(source_dir: Path | None = None) -> Path:
    if source_dir:
        return source_dir
    if DEFAULT_SOURCE.is_dir() and list(DEFAULT_SOURCE.rglob("*.pdf")):
        return DEFAULT_SOURCE
    if DOWNLOAD_SOURCE.is_dir() and list(DOWNLOAD_SOURCE.rglob("*.pdf")):
        return DOWNLOAD_SOURCE
    return DEFAULT_SOURCE


def merge_qtkt(source_dir: Path | None = None, *, log=None, incremental: bool = True) -> tuple[list[dict], list[dict]]:
    src = resolve_source_dir(source_dir)
    catalog, children, long_names = load_icd_catalog()
    checkpoint_path = BASE / "data" / "qtkt_merge_state.json"
    done_files: set[str] = set()
    all_rows: list[dict] = []
    if incremental and checkpoint_path.is_file():
        try:
            state = json.loads(checkpoint_path.read_text(encoding="utf-8"))
            done_files = set(state.get("done_files", []))
            all_rows = state.get("rows", [])
            if log:
                log(f"Checkpoint: {len(done_files)} file da parse, {len(all_rows)} quy trinh")
        except (json.JSONDecodeError, OSError):
            pass

    from _parse_qtkt_pdf import discover_qtkt_files

    files = discover_qtkt_files(src)
    if log:
        log(f"  {len(files)} PDF se parse ({len(done_files)} da xong)")
    else:
        print(f"  {len(files)} PDF se parse", flush=True)

    for i, path in enumerate(files, start=1):
        if path.name in done_files:
            continue
        try:
            line = f"  [{i}/{len(files)}]"
            if log:
                log(line)
            else:
                print(line, flush=True)
            rows = parse_qtkt_pdf(path)
            rows = enrich_qtkt_rows(rows, catalog, children, long_names)
            all_rows.extend(rows)
            for j, row in enumerate(all_rows, start=1):
                row["stt"] = j
            done_files.add(path.name)
            if incremental:
                checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
                checkpoint_path.write_text(
                    json.dumps({"done_files": sorted(done_files), "rows": all_rows}, ensure_ascii=False),
                    encoding="utf-8",
                )
                save_dataset("quytrinhkt", QTKT_COLUMNS, all_rows, DEFAULT_DATA_DIR)
                update_manifest(QTKT_COLUMNS)
            tail = f"    Tong tich luy: {len(all_rows)} quy trinh"
            if log:
                log(tail)
            else:
                print(tail, flush=True)
        except Exception as exc:
            err = f"  Loi parse {path.name}: {exc}"
            if log:
                log(err)
            else:
                print(err, flush=True)

    if incremental and checkpoint_path.is_file() and len(done_files) >= len(files):
        checkpoint_path.unlink(missing_ok=True)

    return all_rows, QTKT_COLUMNS


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    log_path = BASE / "merge_qtkt_run.log"
    try:
        log_path.write_text("", encoding="utf-8")
    except OSError:
        pass

    def log(msg: str = "") -> None:
        print(msg, flush=True)
        try:
            with log_path.open("a", encoding="utf-8") as fh:
                fh.write(msg + "\n")
        except OSError:
            pass

    log("=== Merge Quy trinh ky thuat BYT ===")
    src = resolve_source_dir()
    log(f"Nguon: {src}")
    audit = audit_qtkt_sources(src)
    log(f"PDF se parse: {len(audit['parse'])}")
    if audit["skip_heavy"]:
        log(f"Bo qua (>{os.environ.get('QTKT_MAX_MB', '28')} MB): {len(audit['skip_heavy'])}")
        for item in audit["skip_heavy"]:
            log(f"  - {item['mb']} MB | {item['name']}")
    if audit["skip_small"]:
        log(f"Bo qua (<{os.environ.get('QTKT_MIN_KB', '400')} KB): {len(audit['skip_small'])}")
    if audit["skip_expired"]:
        log(f"Bo qua (Het hieu luc): {len(audit['skip_expired'])}")
    rows, cols = merge_qtkt(src, log=log)
    catalog, _, _ = load_icd_catalog()
    log(f"Quy trinh: {len(rows)} ban ghi")
    linked_tt23 = sum(1 for r in rows if r.get("lienKetTT23"))
    linked_7603 = sum(1 for r in rows if r.get("lienKetQD7603"))
    linked_bv = sum(1 for r in rows if r.get("maDichVuBV"))
    official_tt23 = sum(1 for r in rows if r.get("tenKyThuatTT23") and not is_polluted_tt23_name(r.get("tenKyThuatTT23", "")))
    polluted_tt23 = sum(1 for r in rows if is_polluted_tt23_name(r.get("tenKyThuatTT23", "")))
    has_icd = sum(1 for r in rows if r.get("maICDChiDinh"))
    has_icd_cc = sum(1 for r in rows if r.get("maICDChongChiDinh"))
    has_chi_text = sum(1 for r in rows if r.get("chiDinh"))
    icd_issues = sum(1 for r in rows if catalog and validate_icd_fields(r, catalog))
    log(f"Lien ket TT23: {linked_tt23} | QD7603: {linked_7603} | DM BV: {linked_bv}")
    log(f"Ten TT23 chinh thuc: {official_tt23} | Ten TT23 nhieu (can sua): {polluted_tt23}")
    log(f"Co van ban chi dinh: {has_chi_text} | ICD chi dinh: {has_icd} | ICD chong chi dinh: {has_icd_cc}")
    if icd_issues:
        log(f"Canh bao validate ICD: {icd_issues} ban ghi")
    save_dataset("quytrinhkt", cols, rows, DEFAULT_DATA_DIR)
    update_manifest(cols, version=__import__("datetime").date.today().isoformat(), row_count=len(rows))
    log("Da ghi dvkt_app/data/quytrinhkt.json.gz")


if __name__ == "__main__":
    main()
