import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
    COT_SEED_LUAT_THUOC_MUC8,
    DU_LIEU_SEED_LUAT_THUOC_MUC8,
    PHIEN_BAN_SEED_LUAT_THUOC_MUC8,
} from './du_lieu_luat_thuoc_muc8';

const KHOA_MIGRATION_SEED = 'CDSS_RULE_SEED_MIGRATIONS_V1';
const KHOA_PHIEN_BAN_SEED = 'LUAT_THUOC_MUC8';
const KHOA_DU_LIEU = ['CDSS_DATA_LUAT_THUOC', 'CDSS_DATA_XML2'];
const KHOA_COT = ['CDSS_COLS_LUAT_THUOC', 'CDSS_COLS_XML2'];
const COT_MAC_DINH = ['TRANG_THAI', 'MA_LUAT', 'TEN_QUY_TAC', 'DIEU_KIEN', 'CANH_BAO', 'GHI_CHU', 'NGUON_DU_LIEU'];

let promiseDamBaoSeed = null;

const laMoiTruongWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const parseJSONAnToan = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const chuanHoaTrangThai = (value) => String(value || 'ON').trim().toUpperCase() === 'OFF' ? 'OFF' : 'ON';
const chuanHoaText = (value) => String(value || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

const chuanHoaDongLuat = (row, index = 0) => ({
  id: String(row?.id || `SEED_THUOC_${index + 1}`),
  TRANG_THAI: chuanHoaTrangThai(row?.TRANG_THAI),
  MA_LUAT: String(row?.MA_LUAT || '').trim(),
  TEN_QUY_TAC: String(row?.TEN_QUY_TAC || '').trim(),
  DIEU_KIEN: String(row?.DIEU_KIEN || '').trim(),
  CANH_BAO: String(row?.CANH_BAO || '').trim(),
  GHI_CHU: String(row?.GHI_CHU || '').trim(),
  NGUON_DU_LIEU: String(row?.NGUON_DU_LIEU || 'DuLieu_LUAT_THUOC (9).xlsx').trim(),
});

const taoKhoaDongLuat = (row = {}) => {
  const maLuat = String(row?.MA_LUAT || '').trim().toUpperCase();
  if (maLuat) return `MA:${maLuat}`;

  const dieuKien = chuanHoaText(row?.DIEU_KIEN);
  const canhBao = chuanHoaText(row?.CANH_BAO);
  const tenQuyTac = chuanHoaText(row?.TEN_QUY_TAC);
  return `SIG:${dieuKien}|${canhBao}|${tenQuyTac}`;
};

const hopNhatCot = (existingCols = []) => {
  const merged = [...COT_MAC_DINH];
  [...(Array.isArray(existingCols) ? existingCols : []), ...COT_SEED_LUAT_THUOC_MUC8].forEach((col) => {
    const value = String(col || '').trim();
    if (!value || merged.includes(value)) return;
    merged.push(value);
  });
  return merged;
};

const hopNhatDongLuat = (existingRows = [], seedRows = []) => {
  const seedNorm = (Array.isArray(seedRows) ? seedRows : []).map((row, index) => chuanHoaDongLuat(row, index));
  const seedByMa = new Map();
  seedNorm.forEach((n) => {
    const ma = String(n.MA_LUAT || '').trim().toUpperCase();
    if (ma) seedByMa.set(ma, n);
  });

  const existingNorm = (Array.isArray(existingRows) ? existingRows : []).map((row, index) => chuanHoaDongLuat(row, index));
  const existingFirstByMa = new Map();
  existingNorm.forEach((n) => {
    const ma = String(n.MA_LUAT || '').trim().toUpperCase();
    if (ma && !existingFirstByMa.has(ma)) existingFirstByMa.set(ma, n);
  });

  const merged = [];
  const seedMaEmitted = new Set();

  existingNorm.forEach((row) => {
    const ma = String(row.MA_LUAT || '').trim().toUpperCase();
    if (ma && seedByMa.has(ma)) {
      if (!seedMaEmitted.has(ma)) {
        merged.push(seedByMa.get(ma));
        seedMaEmitted.add(ma);
      }
      return;
    }
    merged.push(row);
  });

  seedNorm.forEach((n) => {
    const ma = String(n.MA_LUAT || '').trim().toUpperCase();
    if (ma && !seedMaEmitted.has(ma)) {
      merged.push(n);
      seedMaEmitted.add(ma);
    }
  });

  let addedCount = 0;
  seedByMa.forEach((seedRow, ma) => {
    const prev = existingFirstByMa.get(ma);
    if (!prev) {
      addedCount += 1;
      return;
    }
    if (JSON.stringify(prev) !== JSON.stringify(seedRow)) addedCount += 1;
  });

  return { mergedRows: merged, addedCount };
};

const docRaw = async (key) => {
  if (laMoiTruongWeb()) {
    const rawWeb = window.localStorage.getItem(key);
    if (rawWeb !== null && rawWeb !== undefined) return rawWeb;
  }
  return AsyncStorage.getItem(key);
};

const ghiRaw = async (key, raw) => {
  if (laMoiTruongWeb()) {
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      // ignore localStorage quota/write issues here; AsyncStorage remains the fallback.
    }
  }
  await AsyncStorage.setItem(key, raw).catch(() => {});
};

const docDuLieuHienTai = async (keys) => {
  for (const key of keys) {
    const parsed = parseJSONAnToan(await docRaw(key), []);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  }
  return [];
};

export const damBaoSeedLuatThuocMuc8 = async () => {
  if (promiseDamBaoSeed) return promiseDamBaoSeed;

  promiseDamBaoSeed = (async () => {
    const [rowsHienTai, colsHienTai, migrationMap] = await Promise.all([
      docDuLieuHienTai(KHOA_DU_LIEU),
      docDuLieuHienTai(KHOA_COT),
      docRaw(KHOA_MIGRATION_SEED).then((raw) => parseJSONAnToan(raw, {})),
    ]);

    const { mergedRows, addedCount } = hopNhatDongLuat(rowsHienTai, DU_LIEU_SEED_LUAT_THUOC_MUC8);
    const mergedCols = hopNhatCot(colsHienTai);
    const daApDungDungPhienBan = String(migrationMap?.[KHOA_PHIEN_BAN_SEED] || '') === PHIEN_BAN_SEED_LUAT_THUOC_MUC8;
    const canGhiLai = addedCount > 0
      || !daApDungDungPhienBan
      || mergedCols.length !== (Array.isArray(colsHienTai) ? colsHienTai.length : 0);

    if (!canGhiLai) {
      return {
        ok: true,
        applied: false,
        added_count: 0,
        total_count: mergedRows.length,
        version: PHIEN_BAN_SEED_LUAT_THUOC_MUC8,
      };
    }

    const rawRows = JSON.stringify(mergedRows);
    const rawCols = JSON.stringify(mergedCols);
    await Promise.all([
      ...KHOA_DU_LIEU.map((key) => ghiRaw(key, rawRows)),
      ...KHOA_COT.map((key) => ghiRaw(key, rawCols)),
    ]);

    const migrationMoi = {
      ...(migrationMap && typeof migrationMap === 'object' ? migrationMap : {}),
      [KHOA_PHIEN_BAN_SEED]: PHIEN_BAN_SEED_LUAT_THUOC_MUC8,
      updated_at: new Date().toISOString(),
    };
    await ghiRaw(KHOA_MIGRATION_SEED, JSON.stringify(migrationMoi));

    return {
      ok: true,
      applied: true,
      added_count: addedCount,
      total_count: mergedRows.length,
      version: PHIEN_BAN_SEED_LUAT_THUOC_MUC8,
    };
  })();

  try {
    return await promiseDamBaoSeed;
  } finally {
    promiseDamBaoSeed = null;
  }
};