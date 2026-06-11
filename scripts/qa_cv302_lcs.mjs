#!/usr/bin/env node
/**
 * QA ngưỡng LCS CV 302 (01/7/2026) — logic mirror muc_luong_co_so_bhyt.jsx
 */

const LCS_CU = 2340000;
const LCS_MOI = 2530000;
const MOC = '20260701';

const layLcs = (ngay) => (String(ngay).slice(0, 8) >= MOC ? LCS_MOI : LCS_CU);
const nguong15 = (ngay) => Math.round(0.15 * layLcs(ngay));
const nguong6 = (ngay) => 6 * layLcs(ngay);
const nguong45 = (ngay) => 45 * layLcs(ngay);

const laDuoi15 = (ngay, tt) => tt > 0 && tt < nguong15(ngay);

const tinhCctConLai = (luyKe, namYmd) => {
    const nam = String(namYmd).slice(0, 4);
    if (nam === '2026') {
        const luyKeQuyDoi = (luyKe / LCS_CU) * LCS_MOI;
        return Math.max(0, 6 * LCS_MOI - luyKeQuyDoi);
    }
    return Math.max(0, nguong6(namYmd) - luyKe);
};

const assertEq = (label, actual, expected) => {
    if (actual !== expected) {
        console.error(`FAIL ${label}: got ${actual}, want ${expected}`);
        process.exitCode = 1;
        return false;
    }
    console.log(`OK ${label}`);
    return true;
};

assertEq('LCS trước 01/7/2026', layLcs('20260630'), LCS_CU);
assertEq('LCS từ 01/7/2026', layLcs(MOC), LCS_MOI);
assertEq('15% LCS mới', nguong15(MOC), 379500);
assertEq('15% LCS cũ', nguong15('20260101'), 351000);
assertEq('6× LCS mới', nguong6(MOC), 15180000);
assertEq('45× LCS mới', nguong45(MOC), 113850000);
assertEq('miễn CCT < 379.500', laDuoi15('20260715', 300000), true);
assertEq('không miễn CCT >= 379.500', laDuoi15('20260715', 400000), false);

const nguongConLai = Math.round(tinhCctConLai(3510000, '20260701'));
assertEq('CCT còn lại sau quy đổi LCS (mẫu 1,5×LCS cũ)', nguongConLai, 11385000);

if (process.exitCode) {
    console.error('QA CV302 LCS: FAILED');
    process.exit(1);
}
console.log('QA CV302 LCS: all passed');
