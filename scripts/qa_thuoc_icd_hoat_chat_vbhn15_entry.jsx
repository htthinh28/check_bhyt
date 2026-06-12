import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { capNhatDanhMuc } from '../ma_nguon/tien_ich/kho_du_lieu.jsx';
import {
  chayBoMayGiamDinhV3,
  chayGiamDinhToanDienV15,
  xoaCacheBoMayGiamDinh,
} from '../ma_nguon/tien_ich/dong_co_giam_dinh.jsx';

const MA_THUOC_BV = '40.TESTBIO';
const MA_HOAT_CHAT = '40.ADA';

const seedStorage = async () => {
  await AsyncStorage.clear();
  await capNhatDanhMuc('DANH_MUC_THUOC_MAU_M03', [
    {
      MA_THUOC: MA_THUOC_BV,
      TEN_THUOC: 'Bio test adalimumab',
      TEN_HOAT_CHAT: 'Adalimumab',
      LOAI_THUOC: 'SINH_PHAM',
    },
  ]);
  await capNhatDanhMuc('DANH_MUC_THUOC_DIEU_KIEN_TT', [
    {
      MA_GIAM_DINH: 'DKTT_ADALIMUMAB_ICD',
      TEN_QUY_TAC: 'Adalimumab dung theo ICD M05-M06',
      MA_HOAT_CHAT,
      TEN_HOAT_CHAT: 'Adalimumab',
      MA_ICD10: 'M05-M06',
      CANH_BAO_CDSS_ALERT: 'Adalimumab khong khop ICD thanh toan M05-M06',
    },
  ]);
  await AsyncStorage.setItem('CATALOG_MAP_V1__ICD_DRUG', JSON.stringify([
    {
      mapping_type: 'ICD_DRUG',
      source_code: 'M05-M06',
      target_code: MA_HOAT_CHAT,
      target_name: 'Adalimumab',
      metadata: {
        source_icd_codes: ['M05-M06'],
        target_codes: [MA_HOAT_CHAT],
        hoat_chat_aliases: ['Adalimumab'],
      },
      is_active: true,
    },
  ]));
  xoaCacheBoMayGiamDinh();
};

const buildHoSo = (maBenhChinh, overrides = {}) => ({
  XML1: [{
    MA_LK: `LK_${maBenhChinh}`,
    MA_BENH_CHINH: maBenhChinh,
    MA_BENH_KT: '',
    CHAN_DOAN_RV: maBenhChinh === 'M05.9' ? 'Viem khop dang thap' : 'Ung thu vu',
    MA_LOAI_KCB: '01',
    NGAY_VAO: '202606010800',
    NGAY_RA: '202606011000',
    MA_CSKCB: '94170',
    MA_KHOA: 'K01',
    T_TONGCHI_BV: 100000,
    T_TONGCHI_BH: 80000,
    T_BHTT: 80000,
    T_BNCCT: 0,
  }],
  XML2: [{
    MA_LK: `LK_${maBenhChinh}`,
    MA_THUOC: MA_THUOC_BV,
    MA_HOAT_CHAT,
    TEN_THUOC: 'Bio test adalimumab',
    TEN_HOAT_CHAT: 'Adalimumab',
    T_BHTT: 80000,
    SO_LUONG: 1,
    SO_NGAY: 1,
    ...overrides,
  }],
  XML3: [],
  XML4: [],
  XML5: [],
  XML6: [],
});

const hasRule = (warnings, maLuat) =>
  warnings.some((w) => String(w?.ma_luat || '').trim().toUpperCase() === maLuat);

const main = async () => {
  await seedStorage();
  const saiIcdDynamic = await chayBoMayGiamDinhV3(buildHoSo('C50'));
  assert.equal(hasRule(saiIcdDynamic, 'THUOC_541'), true, 'THUOC_541 must warn when mapped active ingredient ICD does not match');

  await seedStorage();
  const dungIcdDynamic = await chayBoMayGiamDinhV3(buildHoSo('M05.9'));
  assert.equal(hasRule(dungIcdDynamic, 'THUOC_541'), false, 'THUOC_541 must not warn when ICD is inside M05-M06 range');

  await seedStorage();
  const saiIcdBuiltin = await chayGiamDinhToanDienV15(buildHoSo('C50'));
  assert.equal(hasRule(saiIcdBuiltin, 'DKTT_ADALIMUMAB_ICD'), true, 'Built-in DKTT must match by MA_HOAT_CHAT');

  await seedStorage();
  const dungIcdBuiltin = await chayGiamDinhToanDienV15(buildHoSo('M06'));
  assert.equal(hasRule(dungIcdBuiltin, 'DKTT_ADALIMUMAB_ICD'), false, 'Built-in DKTT must accept ICD category range M05-M06');

  await seedStorage();
  const saiIcdByAlias = await chayBoMayGiamDinhV3(buildHoSo('C50', { MA_HOAT_CHAT: '' }));
  assert.equal(hasRule(saiIcdByAlias, 'THUOC_541'), true, 'THUOC_541 must fall back to active ingredient alias when MA_HOAT_CHAT is missing');

  console.log('qa_thuoc_icd_hoat_chat_vbhn15: OK');
};

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
