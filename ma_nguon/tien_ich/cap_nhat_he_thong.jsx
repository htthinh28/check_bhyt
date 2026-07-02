/**
 * Phát hiện & ghi nhận đã xem thông báo cập nhật quy tắc / hệ thống CDSS.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import manifest from './man_cap_nhat_he_thong.json';
import { damBaoSeedLuatDuLieuMuc1 } from './seed_luat_du_lieu_muc1';
import { damBaoSeedLuatHanhChinhMuc2 } from './seed_luat_hanh_chinh_muc2';
import { damBaoSeedLuatPtttMuc11 } from './seed_luat_pttt_muc11';
import { damBaoSeedLuatThuocMuc8 } from './seed_luat_thuoc_muc8';

export const KHOA_CAP_NHAT_DA_XEM = 'CDSS_CAP_NHAT_HE_THONG_DA_XEM_V1';

export const PHIEN_BAN_MANIFEST = String(manifest?.phien_ban_manifest || '').trim();

const TEN_GOI_SEED = {
  LUAT_DU_LIEU_MUC1: 'Luật dữ liệu (XML)',
  LUAT_HANH_CHINH_MUC2: 'Luật hành chính',
  LUAT_PTTT_MUC11: 'Luật PTTT',
  LUAT_THUOC_MUC8: 'Luật thuốc',
};

const laWeb = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const docRawGlobal = async (key) => {
  if (laWeb()) {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) return v;
    } catch { /* */ }
  }
  return AsyncStorage.getItem(key).catch(() => null);
};

const ghiRawGlobal = async (key, value) => {
  const normalized = String(value ?? '');
  const tasks = [AsyncStorage.setItem(key, normalized).catch(() => {})];
  if (laWeb()) {
    tasks.push((async () => {
      try { window.localStorage.setItem(key, normalized); } catch { /* */ }
    })());
  }
  await Promise.all(tasks);
};

const layBanPhatHanhHienTai = () => {
  const ban = manifest?.ban_phat_hanh;
  if (!ban || typeof ban !== 'object') return null;
  const id = String(ban.id || manifest.phien_ban_manifest || '').trim();
  if (!id) return null;
  return {
    id,
    ngay: String(ban.ngay || '').trim(),
    tieu_de: String(ban.tieu_de || 'Cập nhật hệ thống').trim(),
    tom_tat: String(ban.tom_tat || '').trim(),
    phien_ban_ung_dung: String(manifest.phien_ban_ung_dung || '').trim(),
    muc: Array.isArray(ban.muc) ? ban.muc : [],
  };
};

const dongGoiKetQuaSeed = (key, ketQua) => {
  if (!ketQua?.applied) return null;
  const updated = Number(ketQua.updated_count) || 0;
  const removed = Number(ketQua.removed_count) || 0;
  const tong = updated + removed;
  if (tong <= 0 && !ketQua.applied) return null;
  return {
    module: TEN_GOI_SEED[key] || key,
    phien_ban: String(ketQua.version || '').trim(),
    so_dong_cap_nhat: updated,
    so_dong_xoa: removed,
  };
};

/**
 * Đồng bộ seed quy tắc và kiểm tra có cần hiện popup cập nhật không.
 * @returns {Promise<{ canh_bao: boolean, noi_dung: object|null, seed_ap_dung: object[] }>}
 */
export const kiemTraCapNhatHeThong = async () => {
  const ban = layBanPhatHanhHienTai();
  if (!ban) {
    return { canh_bao: false, noi_dung: null, seed_ap_dung: [] };
  }

  const [seedDl, seedHc, seedPttt, seedThuoc, daXemRaw] = await Promise.all([
    damBaoSeedLuatDuLieuMuc1().catch(() => null),
    damBaoSeedLuatHanhChinhMuc2().catch(() => null),
    damBaoSeedLuatPtttMuc11().catch(() => null),
    damBaoSeedLuatThuocMuc8().catch(() => null),
    docRawGlobal(KHOA_CAP_NHAT_DA_XEM),
  ]);

  const seedApDung = [
    dongGoiKetQuaSeed('LUAT_DU_LIEU_MUC1', seedDl),
    dongGoiKetQuaSeed('LUAT_HANH_CHINH_MUC2', seedHc),
    dongGoiKetQuaSeed('LUAT_PTTT_MUC11', seedPttt),
    dongGoiKetQuaSeed('LUAT_THUOC_MUC8', seedThuoc),
  ].filter(Boolean);

  let daXemId = '';
  try {
    const parsed = JSON.parse(String(daXemRaw || ''));
    daXemId = String(parsed?.id || parsed || '').trim();
  } catch {
    daXemId = String(daXemRaw || '').trim();
  }

  const canh_bao = daXemId !== ban.id;

  return {
    canh_bao,
    noi_dung: canh_bao
      ? { ...ban, seed_ap_dung: seedApDung }
      : null,
    seed_ap_dung: seedApDung,
  };
};

/** Ghi nhận người dùng đã đọc bản phát hành. */
export const danhDauDaXemCapNhat = async (banId) => {
  const id = String(banId || '').trim();
  if (!id) return;
  await ghiRawGlobal(KHOA_CAP_NHAT_DA_XEM, JSON.stringify({
    id,
    luc: new Date().toISOString(),
  }));
};
