/**
 * Lưu trữ bản ghi catalog_mapping — mỗi loại mapping (thẻ) một key AsyncStorage riêng.
 * Legacy: toàn bộ từng nằm ở CATALOG_MAPPING_V1; tự migrate khi đọc nếu còn dữ liệu legacy.
 */

import { docMangDanhMucTuStorage, ghiMangDanhMucVaoStorage } from './luu_tru_danh_muc';
import { layCauHinhLoaiMapping, MAPPING_TYPE_CONFIG } from './catalog_mapping_types';

/** Khóa cũ (một bảng chung) — chỉ dùng để đọc migrate, sau migrate sẽ ghi rỗng. */
export const KHOA_LUU_LEGACY = 'CATALOG_MAPPING_V1';

const PREFIX_SHARD = 'CATALOG_MAP_V1__';

/** Key lưu theo từng thẻ mapping (mapping_type). */
export const layKhoaLuuTheoLoaiMapping = (mappingType) => {
  const t = String(mappingType || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_');
  return `${PREFIX_SHARD}${t || 'UNKNOWN'}`;
};

function normalizeArray(a) {
  return Array.isArray(a) ? a : [];
}

const docShard = async (mappingType) =>
  normalizeArray(await docMangDanhMucTuStorage(layKhoaLuuTheoLoaiMapping(mappingType)));

const ghiShard = async (mappingType, rows) =>
  ghiMangDanhMucVaoStorage(layKhoaLuuTheoLoaiMapping(mappingType), normalizeArray(rows), {});

const tachHangTheoLoai = (rows) => {
  const known = new Set(MAPPING_TYPE_CONFIG.map((c) => c.mapping_type));
  const byType = {};
  for (const { mapping_type: mt } of MAPPING_TYPE_CONFIG) {
    byType[mt] = [];
  }
  const unknown = [];
  for (const row of normalizeArray(rows)) {
    const mt = String(row?.mapping_type || '').trim();
    if (known.has(mt)) byType[mt].push(row);
    else unknown.push(row);
  }
  return { byType, unknown };
};

/** Ghi từng shard + bucket loại không còn trong cấu hình; xóa legacy. */
const ghiTatCaShardTuHang = async (rows) => {
  const { byType, unknown } = tachHangTheoLoai(rows);
  const tasks = MAPPING_TYPE_CONFIG.map(({ mapping_type }) =>
    ghiShard(mapping_type, byType[mapping_type] || []),
  );
  tasks.push(ghiShard('_UNKNOWN_', unknown));
  await Promise.all(tasks);
  await ghiMangDanhMucVaoStorage(KHOA_LUU_LEGACY, [], {});
};

export const taiTatCaBanGhiMapping = async () => {
  const tuShard = [];
  for (const { mapping_type } of MAPPING_TYPE_CONFIG) {
    tuShard.push(...(await docShard(mapping_type)));
  }
  tuShard.push(...(await docShard('_UNKNOWN_')));

  const legacy = normalizeArray(await docMangDanhMucTuStorage(KHOA_LUU_LEGACY));
  if (legacy.length === 0) return tuShard;

  const theoId = new Map();
  for (const r of tuShard) {
    if (r?.id) theoId.set(r.id, r);
  }
  const gop = [...tuShard];
  for (const r of legacy) {
    if (r?.id && theoId.has(r.id)) continue;
    gop.push(r);
    if (r?.id) theoId.set(r.id, r);
  }
  await ghiTatCaShardTuHang(gop);
  return gop;
};

export const luuTatCaBanGhiMapping = async (rows) => {
  await ghiTatCaShardTuHang(rows);
};

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

/** @deprecated Dùng KHOA_LUU_LEGACY */
export const KHOA_LUU = KHOA_LUU_LEGACY;
