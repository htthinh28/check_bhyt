#!/usr/bin/env node
/**
 * Kiểm tra các nhãn lỗi portal BHXH (user report) đã có rule/engine tương ứng trong repo.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PORTAL_ERRORS = [
  'DVKT không nằm trong danh mục được thực hiện',
  'Giá thuốc thanh toán lớn hơn giá thuốc được phê duyệt',
  'Thanh toán chi phí có ngày y lệnh sau ngày ra viện',
  'Thanh toán ngày giường sai quy định (ngoài các trường hợp đặc biệt)',
  'Thanh toán ngày giường sai quy định ( 1 ngày giường nhỏ hơn 4h)',
  'Thuốc sai đường dùng so với TT40,T30,TT05',
  'Thuốc sai đường dùng so với danh mục sử dụng tại BV',
  'Thuốc sai hàm lượng so với danh mục sử dụng tại BV',
  'Thuốc ngoài danh mục sử dụng tại BV',
  'Vào viện đúng tuyến, Chi phí >=15% TLCS, Bệnh viện đề nghị sai Mức hưởng',
  'Đề nghị tiền khám trên 1 chuyên khoa sai quy định',
];

const RULE_HINTS = {
  'DVKT không nằm trong danh mục được thực hiện': ['DM-DVKT-01', 'DVKT-OP-09', 'XML3_DM_BV_01'],
  'Giá thuốc thanh toán lớn hơn giá thuốc được phê duyệt': ['DM-THUOC-04', 'XML2_GIA_03'],
  'Thanh toán chi phí có ngày y lệnh sau ngày ra viện': ['CLN-HC-45', 'HC_65'],
  'Thanh toán ngày giường sai quy định (ngoài các trường hợp đặc biệt)': ['CLN-GIUONG-03', 'HC_130'],
  'Thanh toán ngày giường sai quy định ( 1 ngày giường nhỏ hơn 4h)': ['CLN-GIUONG-02'],
  'Thuốc sai đường dùng so với TT40,T30,TT05': ['DM-THUOC-07'],
  'Thuốc sai đường dùng so với danh mục sử dụng tại BV': ['DM-THUOC-06'],
  'Thuốc sai hàm lượng so với danh mục sử dụng tại BV': ['DM-THUOC-05'],
  'Thuốc ngoài danh mục sử dụng tại BV': ['DM-THUOC-01', 'XML2_DM_BV_01'],
  'Vào viện đúng tuyến, Chi phí >=15% TLCS, Bệnh viện đề nghị sai Mức hưởng': ['HC_252', 'HC-06f'],
  'Đề nghị tiền khám trên 1 chuyên khoa sai quy định': ['CLN-KHAM-01', 'HC_236'],
};

const readText = (rel) => {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

const corpus = [
  'ma_nguon/tien_ich/dong_co_giam_dinh.jsx',
  'ma_nguon/tien_ich/du_lieu_luat_hanh_chinh_muc2.jsx',
  'ma_nguon/tien_ich/dvkt_op_giam_dinh.jsx',
].map(readText).join('\n');

let failed = 0;
for (const label of PORTAL_ERRORS) {
  const hints = RULE_HINTS[label] || [];
  const okText = corpus.includes(label);
  const okCode = hints.some((h) => corpus.includes(h));
  if (!okText && !okCode) {
    console.error(`FAIL: thiếu mapping cho «${label}»`);
    failed += 1;
  } else {
    console.log(`OK  : ${label}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} lỗi portal chưa có rule.`);
  process.exit(1);
}
console.log('\nTất cả nhãn lỗi portal đã có rule tương ứng trong mã nguồn.');
