import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KHOA_NHAT_KY = 'HE_THONG_NHAT_KY_HOAT_DONG';
const KHOA_TAI_KHOAN = 'DANH_SACH_TAI_KHOAN';
const SO_BAN_GHI_TOI_DA = 2000;

const getIndexedDb = () => globalThis?.indexedDB ?? null;

/** IndexedDB riêng cho tài khoản + nhật ký (web) — không dùng chung quota 5MB của localStorage. */
const IDB_HT_NAME = 'CDSS_HE_THONG_DB';
const IDB_HT_VERSION = 1;
const IDB_HT_STORE = 'kv';
let _idbHtDb = null;

const laMoiTruongWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const coTheDungIdbHeThong = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!getIndexedDb();

/** Web: gộp hai nguồn tài khoản — ưu tiên bản ghi có capNhatLuc/taoLuc mới hơn. */
export const gopHaiMangTaiKhoan = (arrA, arrB) => {
  const map = new Map();
  const tsTaiKhoan = (u) => Date.parse(u?.capNhatLuc || u?.taoLuc || '') || 0;
  const them = (u) => {
    if (!u || typeof u !== 'object') return;
    const email = String(u.email || '').trim().toLowerCase();
    if (!email) return;
    const existing = map.get(email);
    if (!existing) {
      map.set(email, u);
      return;
    }
    const merged = tsTaiKhoan(u) >= tsTaiKhoan(existing)
      ? { ...existing, ...u }
      : { ...u, ...existing };
    map.set(email, merged);
  };
  for (const u of [...(Array.isArray(arrA) ? arrA : []), ...(Array.isArray(arrB) ? arrB : [])]) them(u);
  return Array.from(map.values());
};

/** Hàng đợi ghi tuần tự — tránh last-write-wins khi tạo/sửa song song. */
let _chuoiGhiTaiKhoan = Promise.resolve();
const voiKhoaGhiTaiKhoan = (fn) => {
  const job = _chuoiGhiTaiKhoan.then(fn, fn);
  _chuoiGhiTaiKhoan = job.catch(() => {});
  return job;
};

const chonChuoiMangDaiHon = (r1, r2) => {
  const n1 = anToanArray(r1).length;
  const n2 = anToanArray(r2).length;
  if (n2 > n1) return r2 ?? r1;
  return r1 ?? r2;
};

const moHeThongDb = () => {
  if (_idbHtDb) return Promise.resolve(_idbHtDb);
  return new Promise((resolve, reject) => {
    const idb = getIndexedDb();
    if (!idb) {
      reject(new Error('IndexedDB không khả dụng'));
      return;
    }
    const req = idb.open(IDB_HT_NAME, IDB_HT_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_HT_STORE)) {
        db.createObjectStore(IDB_HT_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      _idbHtDb = db;
      db.onversionchange = () => {
        try {
          db.close();
        } catch {
          /* */
        }
        if (_idbHtDb === db) _idbHtDb = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
};

const idbHtGet = async (key) => {
  const db = await moHeThongDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HT_STORE, 'readonly');
    const r = tx.objectStore(IDB_HT_STORE).get(key);
    r.onsuccess = () => {
      const row = r.result;
      resolve(row ? row.value : undefined);
    };
    r.onerror = () => reject(r.error);
  });
};

const idbHtPut = async (key, value) => {
  const db = await moHeThongDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HT_STORE, 'readwrite');
    tx.objectStore(IDB_HT_STORE).put({ key, value: String(value) });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const idbHtDelete = async (key) => {
  const db = await moHeThongDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_HT_STORE, 'readwrite');
    tx.objectStore(IDB_HT_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

/** Legacy (localStorage + AsyncStorage, cùng quota) — chỉ dùng khi migrate / fallback. */
const docLegacyWebRaw = async (key) => {
  let rAsync = null;
  let rLocal = null;
  try {
    rAsync = await AsyncStorage.getItem(key);
  } catch {
    /* */
  }
  try {
    if (window.localStorage) rLocal = window.localStorage.getItem(key);
  } catch {
    /* */
  }
  if (key === KHOA_TAI_KHOAN) {
    const merged = gopHaiMangTaiKhoan(anToanArray(rAsync), anToanArray(rLocal));
    return JSON.stringify(merged);
  }
  return chonChuoiMangDaiHon(rAsync, rLocal);
};

const xoaLegacyWeb = async (key) => {
  try {
    window.localStorage?.removeItem(key);
  } catch {
    /* */
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* */
  }
};

/** Đọc chuỗi JSON đã lưu; web ưu tiên IndexedDB rồi migrate từ legacy (giải phóng localStorage). */
const docChuoiHeThongWeb = async (key) => {
  let tuIdb;
  try {
    tuIdb = await idbHtGet(key);
  } catch (e) {
    console.warn('[nhat_ky_he_thong] IndexedDB đọc lỗi:', key, e?.message || e);
    tuIdb = undefined;
  }

  const legacy = await docLegacyWebRaw(key);

  if (key === KHOA_TAI_KHOAN) {
    const fromIdb = tuIdb != null ? anToanArray(tuIdb) : [];
    const fromLeg = legacy != null ? anToanArray(legacy) : [];
    const merged = gopHaiMangTaiKhoan(fromIdb, fromLeg);
    if (!merged.length) return null;
    const mergedJson = JSON.stringify(merged);
    const canDongBoIdb = fromLeg.length > 0 && (
      merged.length > fromIdb.length
      || (legacy != null && tuIdb != null && legacy !== tuIdb)
    );
    if (canDongBoIdb) {
      try {
        await idbHtPut(key, mergedJson);
        await xoaLegacyWeb(key);
      } catch (e) {
        console.warn('[nhat_ky_he_thong] đồng bộ merge tài khoản sang IDB:', e?.message || e);
      }
    }
    return mergedJson;
  }

  if (tuIdb !== undefined && tuIdb !== null) return tuIdb;

  if (legacy != null) {
    try {
      await idbHtPut(key, legacy);
      await xoaLegacyWeb(key);
    } catch (e) {
      console.warn('[nhat_ky_he_thong] migrate sang IndexedDB thất bại, giữ legacy trong phiên:', key, e?.message || e);
      return legacy;
    }
    return legacy;
  }
  return null;
};

const docStorage = async (key) => {
  if (laMoiTruongWeb()) {
    try {
      const localValue = window.localStorage.getItem(key);
      if (localValue !== null && localValue !== undefined) return localValue;
    } catch {
      /* */
    }
  }
  return AsyncStorage.getItem(key);
};

/** Đọc key hệ thống: web → IndexedDB (+ migrate); native → AsyncStorage. */
const docChuoiHeThong = async (key) => {
  if (coTheDungIdbHeThong()) {
    try {
      return await docChuoiHeThongWeb(key);
    } catch (e) {
      console.warn('[nhat_ky_he_thong] docChuoiHeThong IDB:', e?.message || e);
    }
    const leg = await docLegacyWebRaw(key);
    if (leg != null) return leg;
  }
  return docStorage(key);
};

const ghiStorage = async (key, value) => {
  const normalizedValue = String(value || '');
  if (coTheDungIdbHeThong()) {
    try {
      await idbHtPut(key, normalizedValue);
      await xoaLegacyWeb(key);
      return;
    } catch (e) {
      console.warn('[nhat_ky_he_thong] IndexedDB ghi lỗi, thử legacy:', key, e?.message || e);
      try {
        await idbHtDelete(key);
      } catch {
        /* xóa bản IDB cũ để đọc không lệch với legacy */
      }
    }
  }

  const tasks = [
    AsyncStorage.setItem(key, normalizedValue).catch((e) => {
      console.warn('[nhat_ky_he_thong] AsyncStorage.setItem lỗi:', key, e?.message || e);
    }),
  ];

  if (laMoiTruongWeb()) {
    tasks.push((async () => {
      try {
        window.localStorage.setItem(key, normalizedValue);
      } catch (e) {
        console.warn('[nhat_ky_he_thong] localStorage.setItem lỗi:', key, e?.message || e);
      }
    })());
  }

  await Promise.all(tasks);
};

const nowISO = () => new Date().toISOString();

const taoId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const anToanArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const chuanHoaTaiKhoan = (taiKhoan, nguoiCapNhat = 'SYSTEM') => {
  const email = String(taiKhoan?.email || '').trim().toLowerCase();
  const hoTen = String(taiKhoan?.hoTen || taiKhoan?.ten || '').trim();
  const khoa = String(taiKhoan?.khoa || '').trim();
  const phong = String(taiKhoan?.phong || '').trim();
  const chucDanh = String(taiKhoan?.chucDanh || '').trim();
  const soDienThoai = String(taiKhoan?.soDienThoai || taiKhoan?.soDienThoaiLienLac || '').trim();
  return {
    ...taiKhoan,
    email,
    ten: hoTen,
    hoTen,
    khoa,
    phong,
    chucDanh,
    soDienThoai,
    vaiTro: taiKhoan?.vaiTro === 'ADMIN' ? 'ADMIN' : 'USER',
    trangThai: taiKhoan?.trangThai === 'KHOA' ? 'KHOA' : 'HOAT_DONG',
    taoLuc: taiKhoan?.taoLuc || nowISO(),
    taoBoi: taiKhoan?.taoBoi || nguoiCapNhat,
    capNhatLuc: nowISO(),
    capNhatBoi: nguoiCapNhat,
    lanDangNhapCuoi: taiKhoan?.lanDangNhapCuoi || null,
    buocDoiMatKhau: taiKhoan?.buocDoiMatKhau === true,
  };
};

export const chuanHoaDanhSachTaiKhoan = (danhSach, nguoiCapNhat = 'SYSTEM') => {
  const seen = new Set();
  return (Array.isArray(danhSach) ? danhSach : [])
    .map((item) => chuanHoaTaiKhoan(item, nguoiCapNhat))
    .filter((item) => {
      if (!item.email || seen.has(item.email)) return false;
      seen.add(item.email);
      return true;
    });
};

export const docDanhSachTaiKhoan = async () => {
  const raw = await docChuoiHeThong(KHOA_TAI_KHOAN);
  return chuanHoaDanhSachTaiKhoan(anToanArray(raw));
};

const xacNhanVaTraDanhSachDaLuu = async (dsChuan) => {
  await ghiStorage(KHOA_TAI_KHOAN, JSON.stringify(dsChuan));
  const dsDaLuu = await docDanhSachTaiKhoan();
  const thieuTaiKhoan = dsChuan.some((item) => !dsDaLuu.some((saved) => saved.email === item.email));
  if (thieuTaiKhoan) {
    throw new Error('Không thể xác nhận dữ liệu tài khoản sau khi lưu vào storage.');
  }
  return dsDaLuu;
};

export const luuDanhSachTaiKhoan = async (danhSach, nguoiCapNhat = 'SYSTEM') => voiKhoaGhiTaiKhoan(async () => {
  const dsChuan = chuanHoaDanhSachTaiKhoan(danhSach, nguoiCapNhat);
  return xacNhanVaTraDanhSachDaLuu(dsChuan);
});

/** Thêm một tài khoản mới — đọc lại storage trong khóa ghi để tránh ghi đè user vừa tạo. */
export const themTaiKhoanMoi = async (banGhiMoi, nguoiCapNhat = 'ADMIN') => voiKhoaGhiTaiKhoan(async () => {
  const hienTai = await docDanhSachTaiKhoan();
  const email = String(banGhiMoi?.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Email tài khoản không hợp lệ.');
  }
  if (hienTai.some((u) => u.email === email)) {
    throw new Error(`Email ${email} đã tồn tại.`);
  }
  const dsChuan = chuanHoaDanhSachTaiKhoan([...hienTai, banGhiMoi], nguoiCapNhat);
  return xacNhanVaTraDanhSachDaLuu(dsChuan);
});

export const capNhatTaiKhoanTheoEmail = async (email, patch = {}, nguoiCapNhat = 'SYSTEM') => voiKhoaGhiTaiKhoan(async () => {
  const ds = await docDanhSachTaiKhoan();
  const emailChuan = String(email || '').trim().toLowerCase();
  const idx = ds.findIndex((item) => item.email === emailChuan);
  if (idx < 0) return { ok: false, danhSach: ds };

  ds[idx] = chuanHoaTaiKhoan({ ...ds[idx], ...patch, email: emailChuan }, nguoiCapNhat);
  const dsDaLuu = await xacNhanVaTraDanhSachDaLuu(ds);
  return { ok: true, danhSach: dsDaLuu, taiKhoan: dsDaLuu.find((item) => item.email === emailChuan) || ds[idx] };
});

export const ghiNhatKyHeThong = async ({ hanhDong, doiTuong = '', chiTiet = '', taiKhoan = '', vaiTro = 'USER' }) => {
  try {
    const raw = await docChuoiHeThong(KHOA_NHAT_KY);
    const danhSach = anToanArray(raw);
    const banGhi = {
      id: taoId(),
      thoiGian: nowISO(),
      taiKhoan: String(taiKhoan || '').trim().toLowerCase(),
      vaiTro: String(vaiTro || 'USER').toUpperCase(),
      hanhDong: String(hanhDong || 'KHAC').trim(),
      doiTuong: String(doiTuong || '').trim(),
      chiTiet: String(chiTiet || '').trim(),
    };

    const moiNhat = [banGhi, ...danhSach].slice(0, SO_BAN_GHI_TOI_DA);
    await ghiStorage(KHOA_NHAT_KY, JSON.stringify(moiNhat));
    return banGhi;
  } catch (e) {
    return null;
  }
};

export const layNhatKyHeThong = async ({ taiKhoan = '', tuKhoa = '', gioiHan = 200 } = {}) => {
  const raw = await docChuoiHeThong(KHOA_NHAT_KY);
  const danhSach = anToanArray(raw);

  const tk = String(taiKhoan || '').trim().toLowerCase();
  const q = String(tuKhoa || '').trim().toLowerCase();

  const ketQua = danhSach.filter((item) => {
    if (tk && item.taiKhoan !== tk) return false;
    if (!q) return true;
    const chuoi = `${item.hanhDong} ${item.doiTuong} ${item.chiTiet} ${item.taiKhoan}`.toLowerCase();
    return chuoi.includes(q);
  });

  const max = Number.isFinite(gioiHan) ? Math.max(1, Math.floor(gioiHan)) : 200;
  return ketQua.slice(0, max);
};
