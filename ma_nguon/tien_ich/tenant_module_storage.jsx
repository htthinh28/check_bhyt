/**
 * Key lưu module danh mục theo tenant.
 */
import {
  tenantFetchChunkedData,
  tenantGetItem,
  tenantSetItem,
  tenantWriteChunkedData,
} from './tenant_storage';

export const MODULE_STORAGE_KEYS = Object.freeze({
  M01: 'CDSS_DATA_LUAT_DU_LIEU',
  M02: 'CDSS_DATA_LUAT_HANH_CHINH',
  M03: 'CDSS_DATA_ICD10',
  M05: 'CDSS_DATA_DVKT',
  M06: 'CDSS_DATA_THUOC',
  M08: 'CDSS_DATA_LUAT_THUOC',
  M11: 'CDSS_DATA_LUAT_PTTT',
});

export const MODULE_COL_KEYS = Object.freeze({
  M01: 'CDSS_COLS_LUAT_DU_LIEU',
  M02: 'CDSS_COLS_LUAT_HANH_CHINH',
  M08: 'CDSS_COLS_LUAT_THUOC',
  M11: 'CDSS_COLS_LUAT_PTTT',
});

export const ON_OFF_KEYS = Object.freeze({
  QUY_TAC_NOI_BO: 'CDSS_ON_OFF_QUY_TAC_NOI_BO_V1',
  GHI_DE_NOI_DUNG: 'CDSS_GHI_DE_NOI_DUNG_QUY_TAC_NOI_BO_V1',
  AN_KHOI_QUAN_LY: 'CDSS_AN_KHOI_QUAN_LY_QUY_TAC_NOI_BO_V1',
});

const phienBanKey = (moduleCode) => `CATALOG_PHIEN_BAN_${String(moduleCode || '').toUpperCase()}`;

export const docModuleRows = async (moduleCode) => {
  const key = MODULE_STORAGE_KEYS[moduleCode];
  return key ? tenantFetchChunkedData(key) : [];
};

export const ghiModuleRows = async (moduleCode, rows = []) => {
  const key = MODULE_STORAGE_KEYS[moduleCode];
  if (!key) return false;
  await tenantWriteChunkedData(key, rows);
  return true;
};

export const docModuleCols = async (moduleCode) => {
  const key = MODULE_COL_KEYS[moduleCode];
  if (!key) return [];
  const raw = await tenantGetItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const ghiModuleCols = async (moduleCode, cols = []) => {
  const key = MODULE_COL_KEYS[moduleCode];
  if (!key) return false;
  await tenantSetItem(key, JSON.stringify(Array.isArray(cols) ? cols : []));
  return true;
};

export const docPhienBanModule = async (moduleCode) => {
  const raw = await tenantGetItem(phienBanKey(moduleCode));
  return String(raw || '').trim();
};

export const ghiPhienBanModule = async (moduleCode, version) => {
  await tenantSetItem(phienBanKey(moduleCode), String(version || '').trim());
};

export default {
  MODULE_STORAGE_KEYS,
  MODULE_COL_KEYS,
  ON_OFF_KEYS,
  docModuleRows,
  ghiModuleRows,
  docModuleCols,
  ghiModuleCols,
  docPhienBanModule,
  ghiPhienBanModule,
};
