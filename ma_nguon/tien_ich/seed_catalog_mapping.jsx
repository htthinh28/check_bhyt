/**
 * Đảm bảo shard catalog_mapping (CATALOG_MAP_V1__*) có dữ liệu seed BHYT
 * khi máy trống hoặc thiếu bản ghi — đồng bộ màn Mapping nghiệp vụ với engine giám định.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  banGhiMappingBangNhau,
  hopNhatBanGhiMappingShard,
} from './catalog_mapping_seed_merge.pure.js';
import { docMangDanhMucTuStorage, ghiMangDanhMucVaoStorage } from './luu_tru_danh_muc';
import seedIcdDrugBhyt from './seed_icd_drug_bhyt.json';
import seedIcdDrugContraBhyt from './seed_icd_drug_contra_bhyt.json';

const PREFIX_SHARD = 'CATALOG_MAP_V1__';
const layKhoaLuuTheoLoaiMapping = (mappingType) => {
  const t = String(mappingType || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_');
  return `${PREFIX_SHARD}${t || 'UNKNOWN'}`;
};

const KHOA_MIGRATION_SEED = 'CDSS_RULE_SEED_MIGRATIONS_V1';
const KHOA_PHIEN_BAN_ICD_DRUG = 'CATALOG_MAP_ICD_DRUG';
const KHOA_PHIEN_BAN_ICD_DRUG_CONTRA = 'CATALOG_MAP_ICD_DRUG_CONTRA';

export const PHIEN_BAN_SEED_CATALOG_MAPPING_ICD_DRUG = '2026-06-21_icd_drug_86';
export const PHIEN_BAN_SEED_CATALOG_MAPPING_ICD_DRUG_CONTRA = '2026-03-31_icd_drug_contra_290';

export { hopNhatBanGhiMappingShard, layKhoaNoiDungBanGhiMappingSeed } from './catalog_mapping_seed_merge.pure.js';

const SEED_THEO_LOAI = {
  ICD_DRUG: {
    versionKey: KHOA_PHIEN_BAN_ICD_DRUG,
    version: PHIEN_BAN_SEED_CATALOG_MAPPING_ICD_DRUG,
    rows: Array.isArray(seedIcdDrugBhyt) ? seedIcdDrugBhyt : [],
  },
  ICD_DRUG_CONTRA: {
    versionKey: KHOA_PHIEN_BAN_ICD_DRUG_CONTRA,
    version: PHIEN_BAN_SEED_CATALOG_MAPPING_ICD_DRUG_CONTRA,
    rows: Array.isArray(seedIcdDrugContraBhyt) ? seedIcdDrugContraBhyt : [],
  },
};

let promiseDamBaoSeed = null;

const laMoiTruongWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const parseJSONAnToan = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
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
      // ignore quota
    }
  }
  await AsyncStorage.setItem(key, raw).catch(() => {});
};

const damBaoSeedShardTheoLoai = async ({ mappingType, versionKey, version, seedRows, migrationMap }) => {
  const storageKey = layKhoaLuuTheoLoaiMapping(mappingType);
  const existing = await docMangDanhMucTuStorage(storageKey);
  const { mergedRows, addedCount } = hopNhatBanGhiMappingShard(existing, seedRows);
  const daApDungDungPhienBan = String(migrationMap?.[versionKey] || '') === version;
  const canGhiLai = !daApDungDungPhienBan || !banGhiMappingBangNhau(mergedRows, existing);

  if (!canGhiLai) {
    return {
      mapping_type: mappingType,
      ok: true,
      applied: false,
      added_count: 0,
      total_count: mergedRows.length,
      version,
    };
  }

  await ghiMangDanhMucVaoStorage(storageKey, mergedRows, {});
  migrationMap[versionKey] = version;

  return {
    mapping_type: mappingType,
    ok: true,
    applied: true,
    added_count: addedCount,
    total_count: mergedRows.length,
    version,
  };
};

export const damBaoSeedCatalogMapping = async () => {
  if (promiseDamBaoSeed) return promiseDamBaoSeed;

  promiseDamBaoSeed = (async () => {
    const migrationMap = parseJSONAnToan(await docRaw(KHOA_MIGRATION_SEED), {});
    const results = [];

    for (const [mappingType, cfg] of Object.entries(SEED_THEO_LOAI)) {
      if (!cfg?.rows?.length) continue;
      const res = await damBaoSeedShardTheoLoai({
        mappingType,
        versionKey: cfg.versionKey,
        version: cfg.version,
        seedRows: cfg.rows,
        migrationMap,
      });
      results.push(res);
    }

    const coThayDoi = results.some((r) => r.applied);
    if (coThayDoi) {
      await ghiRaw(
        KHOA_MIGRATION_SEED,
        JSON.stringify({
          ...(migrationMap && typeof migrationMap === 'object' ? migrationMap : {}),
          catalog_mapping_updated_at: new Date().toISOString(),
        }),
      );
    }

    return {
      ok: true,
      applied: coThayDoi,
      shards: results,
    };
  })();

  try {
    return await promiseDamBaoSeed;
  } finally {
    promiseDamBaoSeed = null;
  }
};
