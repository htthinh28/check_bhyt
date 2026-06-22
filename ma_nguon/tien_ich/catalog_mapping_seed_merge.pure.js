/**
 * Logic thuần gộp seed catalog_mapping ↔ shard local (Metro + Node).
 */

const tachChuoiNhieuMa = (s) => {
  const raw = String(s || '').trim();
  if (!raw) return [];
  return raw
    .replace(/\|/g, ';')
    .replace(/,/g, ';')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean);
};

const chuanHoaChuoiMaChoSoSanh = (s) => {
  const parts = tachChuoiNhieuMa(s);
  if (parts.length === 0) return '';
  return [...new Set(parts)]
    .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' }))
    .join('; ');
};

const chuanHoaTrangThaiActive = (value) => value !== false;

const layMaThuocDauTien = (row) => {
  const md = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  if (Array.isArray(md.target_codes) && md.target_codes.length) {
    return String(md.target_codes[0] || '').trim();
  }
  const tc = String(row?.target_code || '').trim();
  if (!tc) return '';
  return tc.split(';')[0].trim();
};

/** Khóa nội dung ổn định để gộp seed ↔ bản ghi máy (không dựa id). */
export const layKhoaNoiDungBanGhiMappingSeed = (row) => {
  const mt = String(row?.mapping_type || '').trim().toUpperCase();
  const md = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const maLuat = String(md.ma_luat || '').trim().toUpperCase();
  if (maLuat) return `${mt}\0${maLuat}`;
  const ruleId = String(md.rule_id || '').trim().toUpperCase();
  if (ruleId) return `${mt}\0${ruleId}`;
  const maThuoc = layMaThuocDauTien(row).toUpperCase();
  if (maThuoc) return `${mt}\0DRUG:${maThuoc}`;
  const src = chuanHoaChuoiMaChoSoSanh(row?.source_code);
  const tgt = chuanHoaChuoiMaChoSoSanh(row?.target_code);
  return `${mt}\0${src}\0${tgt}`;
};

const tomTatNoiDungBanGhiMapping = (row) => ({
  mapping_type: String(row?.mapping_type || '').trim().toUpperCase(),
  source_code: chuanHoaChuoiMaChoSoSanh(row?.source_code),
  target_code: chuanHoaChuoiMaChoSoSanh(row?.target_code),
  is_active: row?.is_active !== false,
  ma_luat: String(row?.metadata?.ma_luat || '').trim().toUpperCase(),
  rule_id: String(row?.metadata?.rule_id || '').trim().toUpperCase(),
});

export const banGhiMappingBangNhau = (a, b) => {
  const listA = (Array.isArray(a) ? a : []).map(tomTatNoiDungBanGhiMapping);
  const listB = (Array.isArray(b) ? b : []).map(tomTatNoiDungBanGhiMapping);
  const sortKey = (x) =>
    `${x.mapping_type}\0${x.ma_luat}\0${x.rule_id}\0${x.source_code}\0${x.target_code}\0${x.is_active}`;
  listA.sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  listB.sort((x, y) => sortKey(x).localeCompare(sortKey(y)));
  return JSON.stringify(listA) === JSON.stringify(listB);
};

/** Gộp seed vào shard: cập nhật trùng khóa; thêm thiếu; giữ is_active=false của user. */
export const hopNhatBanGhiMappingShard = (existingRows = [], seedRows = []) => {
  const seedNorm = (Array.isArray(seedRows) ? seedRows : []).filter((r) => r && typeof r === 'object');
  const seedByKey = new Map();
  seedNorm.forEach((row) => {
    seedByKey.set(layKhoaNoiDungBanGhiMappingSeed(row), row);
  });

  const existingNorm = (Array.isArray(existingRows) ? existingRows : []).filter((r) => r && typeof r === 'object');
  const existingFirstByKey = new Map();
  existingNorm.forEach((row) => {
    const k = layKhoaNoiDungBanGhiMappingSeed(row);
    if (!existingFirstByKey.has(k)) existingFirstByKey.set(k, row);
  });

  const merged = [];
  const seedKeyEmitted = new Set();

  existingNorm.forEach((row) => {
    const k = layKhoaNoiDungBanGhiMappingSeed(row);
    if (seedByKey.has(k)) {
      if (!seedKeyEmitted.has(k)) {
        const seedRow = seedByKey.get(k);
        const prev = existingFirstByKey.get(k);
        const out =
          prev && !chuanHoaTrangThaiActive(prev.is_active)
            ? { ...seedRow, is_active: false }
            : seedRow;
        merged.push(out);
        seedKeyEmitted.add(k);
      }
      return;
    }
    merged.push(row);
  });

  seedNorm.forEach((row) => {
    const k = layKhoaNoiDungBanGhiMappingSeed(row);
    if (!seedKeyEmitted.has(k)) {
      merged.push(row);
      seedKeyEmitted.add(k);
    }
  });

  return {
    mergedRows: merged,
    addedCount: seedNorm.filter((r) => !existingFirstByKey.has(layKhoaNoiDungBanGhiMappingSeed(r))).length,
  };
};
