/**
 * Lưu trữ bản ghi catalog_mapping (đặc tả 2.2) — client: AsyncStorage key CATALOG_MAPPING_V1.
 */

import { docMangDanhMucTuStorage, ghiMangDanhMucVaoStorage } from './luu_tru_danh_muc';
import { layCauHinhLoaiMapping } from './catalog_mapping_types';

const KHOA_LUU = 'CATALOG_MAPPING_V1';

export const taiTatCaBanGhiMapping = async () => normalizeArray(await docMangDanhMucTuStorage(KHOA_LUU));

export const luuTatCaBanGhiMapping = async (rows) => {
  await ghiMangDanhMucVaoStorage(KHOA_LUU, normalizeArray(rows), {});
};

function normalizeArray(a) {
  return Array.isArray(a) ? a : [];
}

export const taoIdMapping = () =>
  `cm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/** Kiểm tra hiệu lực theo ngày (BR05) */
export const mappingCoHieuLucTaiNgay = (row, ngay = new Date()) => {
  if (!row?.is_active) return false;
  const d = ngay instanceof Date ? ngay : new Date(ngay);
  const t = d.getTime();
  if (row.effective_from) {
    const f = new Date(row.effective_from).getTime();
    if (Number.isFinite(f) && t < f) return false;
  }
  if (row.effective_to) {
    const e = new Date(row.effective_to).getTime();
    if (Number.isFinite(e) && t > e) return false;
  }
  return true;
};

/**
 * BR02 + BR03: không trùng (type, source_code, target_code) chồng hiệu lực; N:1 chỉ 1 target active/source.
 */
export const validateMappingMoi = ({ rows, rowMoi, boQuaId }) => {
  const cfg = layCauHinhLoaiMapping(rowMoi.mapping_type);
  if (!cfg) return { ok: false, message: 'INVALID_MAPPING_TYPE' };

  const src = String(rowMoi.source_code || '').trim();
  const tgt = String(rowMoi.target_code || '').trim();
  if (!src || !tgt) return { ok: false, message: 'Thiếu mã nguồn hoặc mã đích.' };

  const others = rows.filter((r) => r.id !== boQuaId && r.mapping_type === rowMoi.mapping_type);

  if (cfg.cardinality === 'N:1') {
    const trung = others.filter(
      (r) =>
        String(r.source_code || '').trim() === src
        && r.is_active
        && mappingCoHieuLucTaiNgay(r)
        && String(r.target_code || '').trim() !== tgt,
    );
    if (trung.length > 0 && rowMoi.is_active !== false) {
      return {
        ok: false,
        message: 'CARDINALITY_VIOLATION: Mỗi DVKT chỉ một loại phẫu thuật hiệu lực (N:1). Hãy vô hiệu bản ghi cũ trước.',
      };
    }
  }

  const trungHoanToan = others.some(
    (r) =>
      String(r.source_code || '').trim() === src
      && String(r.target_code || '').trim() === tgt
      && r.is_active
      && giaoHieuLuc(rowMoi, r),
  );
  if (trungHoanToan && rowMoi.is_active !== false) {
    return { ok: false, message: 'DUPLICATE_MAPPING: Đã có mapping trùng nguồn–đích trong khoảng hiệu lực.' };
  }

  return { ok: true };
};

function giaoHieuLuc(a, b) {
  const af = a.effective_from ? new Date(a.effective_from).getTime() : -Infinity;
  const at = a.effective_to ? new Date(a.effective_to).getTime() : Infinity;
  const bf = b.effective_from ? new Date(b.effective_from).getTime() : -Infinity;
  const bt = b.effective_to ? new Date(b.effective_to).getTime() : Infinity;
  return !(at < bf || bt < af);
}

export { KHOA_LUU };
