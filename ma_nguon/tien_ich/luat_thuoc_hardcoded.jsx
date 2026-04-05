import {
    DU_LIEU_SEED_LUAT_THUOC_MUC8,
    PHIEN_BAN_SEED_LUAT_THUOC_MUC8,
} from './du_lieu_luat_thuoc_muc8';

export const PHIEN_BAN_LUAT_THUOC_HARDCODED = PHIEN_BAN_SEED_LUAT_THUOC_MUC8;

const toRuleRow = (row, index) => {
  const maLuat = String(row?.MA_LUAT || row?.ma_luat || `THUOC_HARDCODED_${index + 1}`).trim();
  const trangThai = String(row?.TRANG_THAI || row?.trang_thai || 'ON').trim().toUpperCase() === 'OFF' ? 'OFF' : 'ON';
  return {
    ...row,
    id: row?.id || `HARDCODED_THUOC_${index + 1}`,
    TRANG_THAI: trangThai,
    MA_LUAT: maLuat,
    TEN_QUY_TAC: String(row?.TEN_QUY_TAC || row?.ten_quy_tac || maLuat).trim(),
    DIEU_KIEN: String(row?.DIEU_KIEN || row?.dieu_kien || '').trim(),
    CANH_BAO: String(row?.CANH_BAO || row?.canh_bao || '').trim(),
    PHAN_HE: 'LUAT_THUOC',
    LOAI_QUY_TAC: 'BUILTIN',
    trangthai: trangThai,
    maluat: maLuat,
    tenquytac: String(row?.TEN_QUY_TAC || row?.ten_quy_tac || maLuat).trim(),
    dieukien: String(row?.DIEU_KIEN || row?.dieu_kien || '').trim(),
    canhbao: String(row?.CANH_BAO || row?.canh_bao || '').trim(),
    phanhe: 'LUAT_THUOC',
    loai_quy_tac: 'BUILTIN',
  };
};

const CACHE_RULES_HARDCODED = (Array.isArray(DU_LIEU_SEED_LUAT_THUOC_MUC8) ? DU_LIEU_SEED_LUAT_THUOC_MUC8 : []).map(toRuleRow);

export const layDanhSachLuatThuocHardcoded = () => CACHE_RULES_HARDCODED.map((row) => ({ ...row }));
