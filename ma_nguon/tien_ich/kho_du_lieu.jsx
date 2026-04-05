/**
 * ============================================================================
 * FILE: tien_ich/kho_du_lieu.jsx
 * MỤC ĐÍCH: Quản lý lưu trữ nội bộ cho ứng dụng CDSS.
 *
 * KIẾN TRÚC LƯU TRỮ:
 *   - WEB:    IndexedDB — không giới hạn dung lượng (thực tế GB), phù hợp
 *             hàng nghìn hồ sơ XML hàng ngày.
 *   - MOBILE: AsyncStorage với cấu trúc Index-Detail để vượt giới hạn 2MB/key.
 *
 * LƯU Ý: Phiên bản này tự động chuyển đổi (migrate) dữ liệu cũ từ localStorage
 * sang IndexedDB trong lần chạy đầu tiên, giải phóng toàn bộ localStorage cho
 * các module khác (Quản lý luật, v.v.).
 * ============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { chuanHoaHoSoCanhBao } from './chuan_hoa_van_ban';

const laMoiTruongWeb = () => Platform.OS === 'web' || typeof window !== 'undefined' || typeof document !== 'undefined';
const getIndexedDb = () => globalThis?.indexedDB || null;
const getLocalStorage = () => globalThis?.localStorage || null;

// ============================================================================
// PHẦN 1: INDEXEDDB — DÙNG TRÊN WEB
// ============================================================================
const IDB_NAME = 'CDSS_HO_SO_DB';
const IDB_STORE = 'ho_so';
const IDB_STORE_DANH_MUC = 'danh_muc';
const IDB_VERSION = 2;

let _dbCache = null;

const _openDB = () => {
  if (_dbCache) return Promise.resolve(_dbCache);
  return new Promise((resolve, reject) => {
    const indexedDb = getIndexedDb();
    if (!indexedDb) {
      reject(new Error('IndexedDB không khả dụng trong môi trường hiện tại.'));
      return;
    }

    const req = indexedDb.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'ma_lk' });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_DANH_MUC)) {
        db.createObjectStore(IDB_STORE_DANH_MUC, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => {
      const openedDb = e.target.result;
      _dbCache = openedDb;
      // Huỷ cache nếu có phiên bản mới
      openedDb.onversionchange = () => {
        try { openedDb.close(); } catch {}
        if (_dbCache === openedDb) _dbCache = null;
      };
      resolve(openedDb);
    };
    req.onerror = () => reject(req.error);
  });
};

// Helper bọc IndexedDB callback thành Promise
const idb = {
  put: async (record) => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
  bulkPut: async (records = []) => {
    if (!Array.isArray(records) || records.length === 0) return true;
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      records.forEach((record) => store.put(record));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      tx.onerror = () => reject(tx.error);
    });
  },
  getAllKeys: async () => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      tx.onerror = () => reject(tx.error);
    });
  },
  getMany: async (keys = []) => {
    if (!Array.isArray(keys) || keys.length === 0) return [];
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const results = new Array(keys.length).fill(null);
      let pending = keys.length;
      let settled = false;

      const finish = () => {
        if (!settled && pending <= 0) {
          settled = true;
          resolve(results);
        }
      };

      keys.forEach((key, index) => {
        const req = store.get(key);
        req.onsuccess = () => {
          results[index] = req.result || null;
          pending -= 1;
          finish();
        };
        req.onerror = () => {
          pending -= 1;
          finish();
        };
      });

      tx.onerror = () => {
        if (!settled) {
          settled = true;
          reject(tx.error);
        }
      };
      tx.onabort = () => {
        if (!settled) {
          settled = true;
          reject(tx.error);
        }
      };
    });
  },
  delete: async (key) => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
  clear: async () => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
};

const idbDanhMuc = {
  put: async (record) => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_DANH_MUC, 'readwrite');
      tx.objectStore(IDB_STORE_DANH_MUC).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
  get: async (key) => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_DANH_MUC, 'readonly');
      const req = tx.objectStore(IDB_STORE_DANH_MUC).get(key);
      req.onsuccess = () => resolve(req.result || null);
      tx.onerror = () => reject(tx.error);
    });
  },
  getAll: async () => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_DANH_MUC, 'readonly');
      const req = tx.objectStore(IDB_STORE_DANH_MUC).getAll();
      req.onsuccess = () => resolve(req.result || []);
      tx.onerror = () => reject(tx.error);
    });
  },
  delete: async (key) => {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_DANH_MUC, 'readwrite');
      tx.objectStore(IDB_STORE_DANH_MUC).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
};

/**
 * Chuyển đổi dữ liệu cũ từ localStorage sang IndexedDB (chạy một lần duy nhất).
 * Sau khi migrate xong, xoá các key cũ để giải phóng không gian localStorage
 * cho module Quản lý luật và các module khác.
 */
const _migrateFromLocalStorage = async () => {
  try {
    const FLAG_KEY = 'CDSS_IDB_MIGRATED_V1';
    const localStorageRef = getLocalStorage();
    if (!localStorageRef) return;
    if (localStorageRef.getItem(FLAG_KEY)) return; // Đã migrate rồi

    const indexData = localStorageRef.getItem('CDSS_KHO_INDEX_MA_LK');
    if (!indexData) {
      localStorageRef.setItem(FLAG_KEY, '1');
      return;
    }

    let dsMaLK;
    try { dsMaLK = JSON.parse(indexData); } catch (_e) { dsMaLK = []; }

    let migrated = 0;
    for (const maLK of dsMaLK) {
      const key = `CDSS_HS_${maLK}`;
      const val = localStorageRef.getItem(key);
      if (val) {
        try {
          const hoSo = JSON.parse(val);
          await idb.put({ ...hoSo, ma_lk: maLK });
          localStorageRef.removeItem(key);
          migrated++;
        } catch (e) {
          console.warn(`[KHO_DU_LIEU] Bỏ qua migrate hồ sơ ${maLK}:`, e);
        }
      }
    }

    localStorageRef.removeItem('CDSS_KHO_INDEX_MA_LK');
    localStorageRef.setItem(FLAG_KEY, '1');

    if (migrated > 0) {
      console.log(`[KHO_DU_LIEU] Đã chuyển đổi ${migrated} hồ sơ từ localStorage → IndexedDB.`);
    }
  } catch (e) {
    console.error('[KHO_DU_LIEU] Lỗi migrate:', e);
  }
};

// ============================================================================
// PHẦN 2: ASYNCSTORAGE — DÙNG TRÊN MOBILE
// ============================================================================
const KHO_INDEX_KEY = 'CDSS_KHO_INDEX_MA_LK';
const PREFIX_HS_KEY = 'CDSS_HS_';
const DETAIL_CHUNK_BYTES = 280000;
const KHO_DANH_MUC_PREFIXES = ['DANH_MUC_', 'BYT_7603_', 'COLS_', 'BYT_7603_COLS_'];
const KHO_DANH_MUC_EXACT_KEYS = new Set(['THONG_TIN_CO_SO']);
const DANH_MUC_CACHE = new Map();
let dongBoDanhMucPromise = null;
let migrateDanhMucIdbPromise = null;
const chuanHoaBanGhiHoSo = (hoSo) => chuanHoaHoSoCanhBao(hoSo);

const taoKhoaHoSo = (maLK) => `${PREFIX_HS_KEY}${maLK}`;
const taoKhoaMetaChunkHoSo = (maLK) => `${taoKhoaHoSo(maLK)}_CHUNKS`;
const taoKhoaChunkHoSo = (maLK, index) => `${taoKhoaHoSo(maLK)}_CHUNK_${index}`;
const chuanHoaDanhSachMaLK = (danhSach = []) => Array.from(new Set((Array.isArray(danhSach) ? danhSach : []).filter(Boolean)));
const tachThanhChunkText = (payload = '', kichThuoc = DETAIL_CHUNK_BYTES) => {
  const text = String(payload || '');
  if (!text) return [''];
  const out = [];
  for (let i = 0; i < text.length; i += kichThuoc) {
    out.push(text.slice(i, i + kichThuoc));
  }
  return out;
};
const parseJsonAnToan = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};
const chuanHoaKhoaChunk = (key = '') => {
  const raw = String(key || '').trim();
  if (!raw) return '';
  if (raw.includes('_CHUNK_')) return raw.slice(0, raw.indexOf('_CHUNK_'));
  if (raw.endsWith('_CHUNKS')) return raw.slice(0, -'_CHUNKS'.length);
  return raw;
};
const laKhoaDanhMucUngDung = (key = '') => {
  const raw = chuanHoaKhoaChunk(key);
  if (!raw) return false;
  if (KHO_DANH_MUC_EXACT_KEYS.has(raw)) return true;
  return KHO_DANH_MUC_PREFIXES.some((prefix) => raw.startsWith(prefix));
};
const chuanHoaDuLieuDanhMuc = (value) => (Array.isArray(value) ? value : []);
const docJsonChunkTheoKhoa = async (key) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return null;
  const chunkCount = Number(await AsyncStorage.getItem(`${baseKey}_CHUNKS`)) || 0;
  if (chunkCount > 0) {
    const chunkKeys = Array.from({ length: chunkCount }, (_, index) => `${baseKey}_CHUNK_${index}`);
    const chunkPairs = await AsyncStorage.multiGet(chunkKeys);
    let payload = '';
    chunkPairs.forEach(([, raw]) => {
      if (raw) payload += String(raw);
    });
    return parseJsonAnToan(payload);
  }
  return parseJsonAnToan(await AsyncStorage.getItem(baseKey));
};
const docJsonChunkTuLocalStorageDongBo = (key) => {
  const baseKey = chuanHoaKhoaChunk(key);
  const localStorageRef = getLocalStorage();
  if (!baseKey || !localStorageRef) return null;
  try {
    const chunkCount = Number(localStorageRef.getItem(`${baseKey}_CHUNKS`)) || 0;
    if (chunkCount > 0) {
      let payload = '';
      for (let index = 0; index < chunkCount; index += 1) {
        payload += String(localStorageRef.getItem(`${baseKey}_CHUNK_${index}`) || '');
      }
      return parseJsonAnToan(payload);
    }
    return parseJsonAnToan(localStorageRef.getItem(baseKey));
  } catch (_error) {
    return null;
  }
};
const luuJsonChunkTheoKhoa = async (key, value, chunkBytes = DETAIL_CHUNK_BYTES) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return false;

  const payload = JSON.stringify(value ?? []);
  const keyMeta = `${baseKey}_CHUNKS`;
  const oldChunkCount = Number(await AsyncStorage.getItem(keyMeta)) || 0;

  if (payload.length <= chunkBytes) {
    await AsyncStorage.setItem(baseKey, payload);
    const dsCanXoa = [keyMeta];
    for (let index = 0; index < oldChunkCount; index += 1) {
      dsCanXoa.push(`${baseKey}_CHUNK_${index}`);
    }
    if (dsCanXoa.length > 0) await AsyncStorage.multiRemove(dsCanXoa);
    return true;
  }

  const chunks = tachThanhChunkText(payload, chunkBytes);
  const pairs = [[keyMeta, String(chunks.length)]];
  chunks.forEach((chunk, index) => {
    pairs.push([`${baseKey}_CHUNK_${index}`, chunk]);
  });
  await AsyncStorage.multiSet(pairs);

  const dsCanXoa = [baseKey];
  for (let index = chunks.length; index < oldChunkCount; index += 1) {
    dsCanXoa.push(`${baseKey}_CHUNK_${index}`);
  }
  if (dsCanXoa.length > 0) await AsyncStorage.multiRemove(dsCanXoa);
  return true;
};

const xoaJsonChunkTheoKhoa = async (key) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return false;
  const oldChunkCount = Number(await AsyncStorage.getItem(`${baseKey}_CHUNKS`)) || 0;
  const dsCanXoa = [`${baseKey}_CHUNKS`, baseKey];
  for (let index = 0; index < oldChunkCount; index += 1) {
    dsCanXoa.push(`${baseKey}_CHUNK_${index}`);
  }
  await AsyncStorage.multiRemove(dsCanXoa).catch(() => {});
  return true;
};

const migrateDanhMucWebToIndexedDb = async ({ force = false } = {}) => {
  if (!laMoiTruongWeb()) return { ok: true, count: 0 };
  if (migrateDanhMucIdbPromise && !force) return migrateDanhMucIdbPromise;

  migrateDanhMucIdbPromise = (async () => {
    const localStorageRef = getLocalStorage();
    const flagKey = 'CDSS_IDB_CATALOG_MIGRATED_V2';
    try {
      if (!force && localStorageRef?.getItem(flagKey) === '1') {
        return { ok: true, count: 0, skipped: true };
      }

      const allKeys = await AsyncStorage.getAllKeys().catch(() => []);
      const baseKeys = Array.from(
        new Set((Array.isArray(allKeys) ? allKeys : []).map((key) => chuanHoaKhoaChunk(key)).filter(laKhoaDanhMucUngDung))
      );

      let migrated = 0;
      for (const baseKey of baseKeys) {
        const raw = await docJsonChunkTheoKhoa(baseKey);
        const normalized = chuanHoaDuLieuDanhMuc(raw);
        await idbDanhMuc.put({ key: baseKey, data: normalized, updated_at: Date.now() });
        await xoaJsonChunkTheoKhoa(baseKey).catch(() => {});
        DANH_MUC_CACHE.set(baseKey, normalized);
        migrated += 1;
      }

      localStorageRef?.setItem(flagKey, '1');
      return { ok: true, count: migrated };
    } catch (error) {
      console.warn('[KHO_DU_LIEU] Migrate danh mục web sang IndexedDB thất bại:', error);
      return { ok: false, count: 0, error };
    } finally {
      migrateDanhMucIdbPromise = null;
    }
  })();

  return migrateDanhMucIdbPromise;
};

// ============================================================================
// PHẦN 3: CÁC HÀM XUẤT KHẨU (API CHUNG CHO CẢ WEB VÀ MOBILE)
// ============================================================================

/**
 * 1. LƯU HỒ SƠ VÀO KHO
 * Web: IndexedDB (dung lượng GB). Mobile: AsyncStorage (phân mảnh).
 */
const docDanhSachMaLKMobile = async () => {
  const indexData = await AsyncStorage.getItem(KHO_INDEX_KEY);
  if (!indexData) return [];
  return chuanHoaDanhSachMaLK(parseJsonAnToan(indexData) || []);
};

const docNhieuPayloadHoSoMobile = async (danhSachMaLK = []) => {
  const dsMaLK = chuanHoaDanhSachMaLK(danhSachMaLK);
  if (dsMaLK.length === 0) return [];

  const dsKhoaHoSo = dsMaLK.map((maLK) => taoKhoaHoSo(maLK));
  const dsKhoaMeta = dsMaLK.map((maLK) => taoKhoaMetaChunkHoSo(maLK));
  const basePairs = await AsyncStorage.multiGet([...dsKhoaHoSo, ...dsKhoaMeta]);
  const baseMap = new Map(basePairs);
  const chunkCountMap = new Map();
  const dsKhoaChunk = [];

  dsMaLK.forEach((maLK) => {
    const soChunk = Number(baseMap.get(taoKhoaMetaChunkHoSo(maLK))) || 0;
    chunkCountMap.set(maLK, soChunk);
    for (let i = 0; i < soChunk; i += 1) {
      dsKhoaChunk.push(taoKhoaChunkHoSo(maLK, i));
    }
  });

  const chunkMap = dsKhoaChunk.length > 0
    ? new Map(await AsyncStorage.multiGet(dsKhoaChunk))
    : new Map();

  return dsMaLK.map((maLK) => {
    const soChunk = chunkCountMap.get(maLK) || 0;
    if (soChunk > 0) {
      let payload = '';
      for (let i = 0; i < soChunk; i += 1) {
        payload += String(chunkMap.get(taoKhoaChunkHoSo(maLK, i)) || '');
      }
      return payload || null;
    }
    return baseMap.get(taoKhoaHoSo(maLK)) || null;
  });
};

const luuChiTietHoSoMobile = async (maLK, hoSo) => {
  const key = taoKhoaHoSo(maLK);
  const keyMeta = taoKhoaMetaChunkHoSo(maLK);
  const payload = JSON.stringify(hoSo);
  const oldChunkCount = Number(await AsyncStorage.getItem(keyMeta)) || 0;

  if (payload.length <= DETAIL_CHUNK_BYTES) {
    await AsyncStorage.setItem(key, payload);
    const dsCanXoa = [keyMeta];
    for (let i = 0; i < oldChunkCount; i += 1) {
      dsCanXoa.push(taoKhoaChunkHoSo(maLK, i));
    }
    if (dsCanXoa.length > 0) await AsyncStorage.multiRemove(dsCanXoa);
    return;
  }

  const chunks = tachThanhChunkText(payload);
  const pairs = [[keyMeta, String(chunks.length)]];
  chunks.forEach((chunk, index) => {
    pairs.push([taoKhoaChunkHoSo(maLK, index), chunk]);
  });
  await AsyncStorage.multiSet(pairs);

  const dsCanXoa = [key];
  for (let i = chunks.length; i < oldChunkCount; i += 1) {
    dsCanXoa.push(taoKhoaChunkHoSo(maLK, i));
  }
  if (dsCanXoa.length > 0) await AsyncStorage.multiRemove(dsCanXoa);
};

const xoaChiTietHoSoMobile = async (maLK) => {
  const key = taoKhoaHoSo(maLK);
  const keyMeta = taoKhoaMetaChunkHoSo(maLK);
  const chunkCount = Number(await AsyncStorage.getItem(keyMeta)) || 0;
  const dsCanXoa = [key, keyMeta];
  for (let i = 0; i < chunkCount; i += 1) {
    dsCanXoa.push(taoKhoaChunkHoSo(maLK, i));
  }
  await AsyncStorage.multiRemove(dsCanXoa);
};

export const layDanhSachMaLKTuKho = async () => {
  try {
    if (Platform.OS === 'web') {
      await _migrateFromLocalStorage();
      return chuanHoaDanhSachMaLK(await idb.getAllKeys());
    }
    return await docDanhSachMaLKMobile();
  } catch (error) {
    console.error('[KHO_DU_LIEU] Lỗi lấy danh sách MA_LK:', error);
    return [];
  }
};

export const layNhieuHoSoTuKho = async (danhSachMaLK = []) => {
  try {
    const dsMaLK = chuanHoaDanhSachMaLK(danhSachMaLK);
    if (dsMaLK.length === 0) return [];

    if (Platform.OS === 'web') {
      await _migrateFromLocalStorage();
      const ketQua = await idb.getMany(dsMaLK);
      return ketQua.map(chuanHoaBanGhiHoSo).filter(Boolean);
    }

    const payloads = await docNhieuPayloadHoSoMobile(dsMaLK);
    return payloads
      .map((raw) => chuanHoaBanGhiHoSo(parseJsonAnToan(raw)))
      .filter(Boolean);
  } catch (error) {
    console.error('[KHO_DU_LIEU] Lỗi lấy nhiều hồ sơ:', error);
    return [];
  }
};

export const luuHoSoVaoKho = async (danhSachHoSoMoi) => {
  try {
    if (!danhSachHoSoMoi || danhSachHoSoMoi.length === 0) return;

    if (Platform.OS === 'web') {
      const dsCanLuu = [];
      for (const hoSo of danhSachHoSoMoi) {
        const maLK = hoSo.ma_lk || hoSo.XML1?.MA_LK || hoSo.xml1?.MA_LK;
        if (!maLK) continue;
        // Loại bỏ trường _raw (luôn rỗng) để tiết kiệm không gian
        const { _raw, ...hoSoLuu } = hoSo;
        dsCanLuu.push(chuanHoaBanGhiHoSo({ ...hoSoLuu, ma_lk: maLK }));
      }
      await idb.bulkPut(dsCanLuu);
    } else {
      const dsMaLK = await docDanhSachMaLKMobile();

      for (const hoSo of danhSachHoSoMoi) {
        const maLK = hoSo.ma_lk || hoSo.XML1?.MA_LK || hoSo.xml1?.MA_LK;
        if (!maLK) continue;
        const { _raw, ...hoSoLuu } = hoSo;
        await luuChiTietHoSoMobile(maLK, chuanHoaBanGhiHoSo(hoSoLuu));
        if (!dsMaLK.includes(maLK)) dsMaLK.push(maLK);
      }
      await AsyncStorage.setItem(KHO_INDEX_KEY, JSON.stringify(chuanHoaDanhSachMaLK(dsMaLK)));
    }

    console.log(`[KHO_DU_LIEU] Đã lưu ${danhSachHoSoMoi.length} hồ sơ thành công.`);
    return true;
  } catch (error) {
    console.error('[KHO_DU_LIEU] Lỗi khi lưu kho:', error);
    throw new Error(`Lỗi lưu hồ sơ: ${error.message || 'Không xác định'}`);
  }
};

/**
 * 2. LẤY TOÀN BỘ HỒ SƠ TỪ KHO
 */
export const layTatCaHoSoTuKho = async () => {
  try {
    if (Platform.OS === 'web') {
      // Chuyển đổi dữ liệu cũ từ localStorage (chỉ chạy lần đầu)
      await _migrateFromLocalStorage();
      const ds = await idb.getAll();
      return ds.map(chuanHoaBanGhiHoSo).reverse();
    } else {
      const dsMaLK = await docDanhSachMaLKMobile();
      if (dsMaLK.length === 0) return [];
      const data = await layNhieuHoSoTuKho(dsMaLK);
      return data.reverse();
    }
  } catch (error) {
    console.error('[KHO_DU_LIEU] Lỗi truy xuất kho:', error);
    return [];
  }
};

/**
 * 3. XÓA MỘT HỒ SƠ KHỎI KHO
 */
export const xoaHoSoKhoiKho = async (maLK_CanXoa) => {
  try {
    if (!maLK_CanXoa) return false;
    if (Platform.OS === 'web') {
      await idb.delete(maLK_CanXoa);
    } else {
      await xoaChiTietHoSoMobile(maLK_CanXoa);
      const dsMaLK = await docDanhSachMaLKMobile();
      await AsyncStorage.setItem(
        KHO_INDEX_KEY,
        JSON.stringify(dsMaLK.filter((ma) => ma !== maLK_CanXoa))
      );
    }
    return true;
  } catch (error) {
    console.error(`[KHO_DU_LIEU] Lỗi xóa hồ sơ ${maLK_CanXoa}:`, error);
    return false;
  }
};

/**
 * 4. XÓA TOÀN BỘ KHO
 */
export const xoaToanBoKho = async () => {
  try {
    if (Platform.OS === 'web') {
      await idb.clear();
      // Xóa cả flag migrate để reset sạch
      getLocalStorage()?.removeItem('CDSS_IDB_MIGRATED_V1');
    } else {
      const dsMaLK = await docDanhSachMaLKMobile();
      for (const maLK of dsMaLK) {
        await xoaChiTietHoSoMobile(maLK);
      }
      await AsyncStorage.removeItem(KHO_INDEX_KEY);
    }
    console.log('[KHO_DU_LIEU] Đã xóa toàn bộ kho lưu trữ.');
    return true;
  } catch (error) {
    console.error('[KHO_DU_LIEU] Lỗi dọn dẹp kho:', error);
    return false;
  }
};


export const layDanhMuc = (key, fallback = []) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return chuanHoaDuLieuDanhMuc(fallback);

  if (DANH_MUC_CACHE.has(baseKey)) {
    return chuanHoaDuLieuDanhMuc(DANH_MUC_CACHE.get(baseKey));
  }

  if (Platform.OS === 'web') {
    const raw = docJsonChunkTuLocalStorageDongBo(baseKey);
    const normalized = chuanHoaDuLieuDanhMuc(raw);
    DANH_MUC_CACHE.set(baseKey, normalized);
    return normalized;
  }

  return chuanHoaDuLieuDanhMuc(fallback);
};

export const docDanhMucTuKho = async (key, fallback = []) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return chuanHoaDuLieuDanhMuc(fallback);

  if (DANH_MUC_CACHE.has(baseKey)) {
    return chuanHoaDuLieuDanhMuc(DANH_MUC_CACHE.get(baseKey));
  }

  try {
    if (laMoiTruongWeb()) {
      await migrateDanhMucWebToIndexedDb();
      const idbRecord = await idbDanhMuc.get(baseKey).catch(() => null);
      if (idbRecord && Object.prototype.hasOwnProperty.call(idbRecord, 'data')) {
        const normalized = chuanHoaDuLieuDanhMuc(idbRecord.data);
        DANH_MUC_CACHE.set(baseKey, normalized);
        return normalized;
      }
    }

    const raw = await docJsonChunkTheoKhoa(baseKey);
    const normalized = chuanHoaDuLieuDanhMuc(raw);
    DANH_MUC_CACHE.set(baseKey, normalized);
    if (laMoiTruongWeb()) {
      await idbDanhMuc.put({ key: baseKey, data: normalized, updated_at: Date.now() }).catch(() => {});
      await xoaJsonChunkTheoKhoa(baseKey).catch(() => {});
    }
    return normalized;
  } catch (error) {
    console.warn('[KHO_DU_LIEU] Catalog read failed: ' + baseKey + ':', error);
    return chuanHoaDuLieuDanhMuc(fallback);
  }
};

export const capNhatDanhMuc = async (key, data) => {
  const baseKey = chuanHoaKhoaChunk(key);
  if (!baseKey) return false;

  const normalized = chuanHoaDuLieuDanhMuc(data);
  DANH_MUC_CACHE.set(baseKey, normalized);
  if (laMoiTruongWeb()) {
    await idbDanhMuc.put({ key: baseKey, data: normalized, updated_at: Date.now() });
    await xoaJsonChunkTheoKhoa(baseKey).catch(() => {});
    return true;
  }
  await luuJsonChunkTheoKhoa(baseKey, normalized);
  return true;
};

export const dongBoTuBoNho = async ({ force = false } = {}) => {
  if (dongBoDanhMucPromise && !force) return dongBoDanhMucPromise;

  dongBoDanhMucPromise = (async () => {
    try {
      if (laMoiTruongWeb()) {
        await migrateDanhMucWebToIndexedDb();
        const records = await idbDanhMuc.getAll();
        records.forEach((record) => {
          const baseKey = chuanHoaKhoaChunk(record?.key);
          if (!baseKey) return;
          DANH_MUC_CACHE.set(baseKey, chuanHoaDuLieuDanhMuc(record?.data));
        });
        return { ok: true, count: records.length };
      }

      const allKeys = await AsyncStorage.getAllKeys().catch(() => []);
      const baseKeys = Array.from(
        new Set((Array.isArray(allKeys) ? allKeys : []).map((key) => chuanHoaKhoaChunk(key)).filter(laKhoaDanhMucUngDung))
      );

      await Promise.all(
        baseKeys.map(async (baseKey) => {
          const raw = await docJsonChunkTheoKhoa(baseKey);
          DANH_MUC_CACHE.set(baseKey, chuanHoaDuLieuDanhMuc(raw));
        })
      );

      return { ok: true, count: baseKeys.length };
    } catch (error) {
      console.warn('[KHO_DU_LIEU] Catalog cache sync failed:', error);
      return { ok: false, count: 0, error };
    } finally {
      dongBoDanhMucPromise = null;
    }
  })();

  return dongBoDanhMucPromise;
};

const KhoDuLieu = {
  layDanhSachMaLKTuKho,
  layNhieuHoSoTuKho,
  luuHoSoVaoKho,
  layTatCaHoSoTuKho,
  xoaHoSoKhoiKho,
  xoaToanBoKho,
  layDanhMuc,
  docDanhMucTuKho,
  capNhatDanhMuc,
  dongBoTuBoNho,
};

export default KhoDuLieu;
