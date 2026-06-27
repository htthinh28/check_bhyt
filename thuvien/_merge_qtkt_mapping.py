# -*- coding: utf-8 -*-
"""Merge Quy trình kỹ thuật BYT → dataset quytrinhkt + liên kết QĐ7603 / TT23 / ICD-10."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from _dvkt_data_io import DATASET_IDS, DEFAULT_DATA_DIR, load_dataset, save_dataset
from _merge_tt23_mapping import name_similarity, norm_code, norm_text
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
    return None, None, None


def index_pl1(rows: list[dict]) -> dict[str, dict]:
    by_ma43: dict[str, dict] = {}
    by_ma7603: dict[str, dict] = {}
    by_ten: dict[str, dict] = {}
    for row in rows:
        m43 = norm_code(row.get("maTT43", ""))
        if m43:
            by_ma43[m43] = row
        m76 = row.get("maTuongDuong", "")
        if m76:
            by_ma7603[m76] = row
        tn = norm_text(row.get("tenTT43", ""))
        if tn:
            by_ten[tn] = row
    return {"by_ma43": by_ma43, "by_ma7603": by_ma7603, "by_ten": by_ten}


def index_tt23(rows: list[dict]) -> dict[str, dict]:
    by_ma: dict[str, dict] = {}
    by_ten: dict[str, dict] = {}
    by_stt: dict[str, dict] = {}
    for row in rows:
        ma = norm_code(row.get("maKyThuat", ""))
        if ma:
            by_ma[ma] = row
        stt = str(row.get("stt", "")).strip()
        if stt:
            by_stt[stt] = row
        tn = norm_text(row.get("tenKyThuat", ""))
        if tn:
            by_ten[tn] = row
    return {"by_ma": by_ma, "by_ten": by_ten, "by_stt": by_stt}


def find_tt23_match(row: dict, tt23_pl1: dict, tt23_pl2: dict) -> tuple[dict | None, str]:
    """Tìm dòng TT23 (PL1 hoặc PL2) theo mã / STT / tên."""
    ma = norm_code(row.get("maKyThuat", ""))
    name = norm_text(row.get("tenKyThuat", "") or row.get("tenKyThuatTT23", ""))
    stt = str(row.get("sttKyThuat", "")).strip()

    for idx, label in ((tt23_pl1, "PL1"), (tt23_pl2, "PL2")):
        if ma and ma in idx["by_ma"]:
            return idx["by_ma"][ma], label
        if stt and stt in idx["by_stt"]:
            return idx["by_stt"][stt], label
    if ma and ma.isdigit():
        for idx, label in ((tt23_pl1, "PL1"), (tt23_pl2, "PL2")):
            if ma in idx["by_stt"]:
                return idx["by_stt"][ma], label
    if name:
        for idx, label in ((tt23_pl1, "PL1"), (tt23_pl2, "PL2")):
            if name in idx["by_ten"]:
                return idx["by_ten"][name], label
        best = None
        best_score = 0.0
        for idx, label in ((tt23_pl1, "PL1"), (tt23_pl2, "PL2")):
            for cand in idx["by_ten"].values():
                sc = name_similarity(name, norm_text(cand.get("tenKyThuat", "")))
                if sc > best_score:
                    best_score = sc
                    best = (cand, label)
        if best and best_score >= 0.82:
            return best[0], best[1]
    return None, ""


def link_qtkt_row(row: dict, tt23_pl1: dict, tt23_pl2: dict, pl1_idx: dict) -> dict:
    tt23, src = find_tt23_match(row, tt23_pl1, tt23_pl2)
    pl1 = None
    conf = "Thấp"
    if tt23:
        row["lienKetTT23"] = tt23.get("maKyThuat", "")
        row["tenKyThuatTT23"] = row.get("tenKyThuatTT23") or tt23.get("tenKyThuat", "")
        link = tt23.get("lienKetQD7603", "")
        if link and link in pl1_idx["by_ma7603"]:
            pl1 = pl1_idx["by_ma7603"][link]
        elif norm_code(row.get("maKyThuat", "")) in pl1_idx["by_ma43"]:
            pl1 = pl1_idx["by_ma43"][norm_code(row.get("maKyThuat", ""))]
        conf = "Cao" if link else ("Trung bình" if src else "Thấp")
    if not tt23:
        tn = norm_text(row.get("tenKyThuat", "") or row.get("tenKyThuatTT23", ""))
        ma43 = norm_code(row.get("maKyThuat", ""))
        if ma43 and ma43 in pl1_idx["by_ma43"]:
            pl1 = pl1_idx["by_ma43"][ma43]
            conf = "Trung bình"
        elif tn:
            sc_best = 0.0
            for cand in pl1_idx["by_ten"].values():
                sc = name_similarity(tn, norm_text(cand.get("tenTT43", "")))
                if sc > sc_best:
                    sc_best = sc
                    if sc >= 0.82:
                        pl1 = cand
            if pl1:
                conf = "Trung bình"
    if pl1:
        row["lienKetQD7603"] = pl1.get("maTuongDuong", "")
        row["maTT43"] = pl1.get("maTT43", "")
        row["maTuongDuong"] = pl1.get("maTuongDuong", "")
        row["tenTT43"] = pl1.get("tenTT43", "")
        if conf != "Cao":
            conf = "Cao" if row.get("lienKetTT23") else "Trung bình"
    row["doTinCayMapping"] = conf if (row.get("lienKetTT23") or row.get("lienKetQD7603")) else ""
    return row


def enrich_qtkt_rows(
    rows: list[dict],
    catalog: dict | None,
    children: dict | None,
    long_names: list[tuple[str, dict]] | None = None,
) -> list[dict]:
    pl1_pack = load_dataset("pl1", DEFAULT_DATA_DIR)
    tt23_pl1_pack = load_dataset("tt23pl1", DEFAULT_DATA_DIR)
    tt23_pl2_pack = load_dataset("tt23pl2", DEFAULT_DATA_DIR)
    pl1_idx = index_pl1(pl1_pack["rows"] if pl1_pack else [])
    tt23_pl1 = index_tt23(tt23_pl1_pack["rows"] if tt23_pl1_pack else [])
    tt23_pl2 = index_tt23(tt23_pl2_pack["rows"] if tt23_pl2_pack else [])

    out: list[dict] = []
    for i, row in enumerate(rows, start=1):
        row = dict(row)
        row["stt"] = i
        if catalog and children:
            apply_qtkt_icd_fields(row, catalog, children, long_names)
        row = link_qtkt_row(row, tt23_pl1, tt23_pl2, pl1_idx)
        row["_rowId"] = f"qtkt-{row.get('quyTrinhSo','')}-{row.get('maKyThuat','')}-{row.get('tenFileNguon','')[:12]}"
        out.append(row)
    return out


def update_manifest(columns: list[dict]) -> None:
    manifest_path = DEFAULT_DATA_DIR / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.is_file() else {"tabs": [], "columns": {}}
    tabs = list(manifest.get("tabs", []))
    if "quytrinhkt" not in tabs:
        tabs.append("quytrinhkt")
    manifest["tabs"] = tabs
    manifest.setdefault("columns", {})["quytrinhkt"] = columns
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
    has_icd = sum(1 for r in rows if r.get("maICDChiDinh"))
    has_icd_cc = sum(1 for r in rows if r.get("maICDChongChiDinh"))
    has_chi_text = sum(1 for r in rows if r.get("chiDinh"))
    icd_issues = sum(1 for r in rows if catalog and validate_icd_fields(r, catalog))
    log(f"Lien ket TT23: {linked_tt23} | QD7603: {linked_7603}")
    log(f"Co van ban chi dinh: {has_chi_text} | ICD chi dinh: {has_icd} | ICD chong chi dinh: {has_icd_cc}")
    if icd_issues:
        log(f"Canh bao validate ICD: {icd_issues} ban ghi")
    save_dataset("quytrinhkt", cols, rows, DEFAULT_DATA_DIR)
    update_manifest(cols)
    log("Da ghi dvkt_app/data/quytrinhkt.json.gz")


if __name__ == "__main__":
    main()
