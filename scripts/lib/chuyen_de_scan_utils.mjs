/**
 * Quét tĩnh ma_nguon/tien_ich/luat_giam_dinh_chuyen_de_hardcoded.jsx (mỗi quy tắc một dòng).
 * @returns {{ id: string, maLuat: string | null, placeholder: boolean, trangThai: 'ON'|'OFF'|null }[]}
 */
export function scanChuyenDeRulesFromFile(srcPath, fs) {
  const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const idM = line.match(/id:\s*'(CHUYEN_DE-\d+)'/);
    if (!idM) continue;
    const id = idM[1];
    const placeholder = /DIEU_KIEN:\s*CHUYEN_DE_XML130_CHO_XU_LY_SAU\s*,/.test(line);
    const tm = line.match(/TRANG_THAI:\s*'(ON|OFF)'/);
    const maM = line.match(/MA_LUAT:\s*'(Chuyen_de_\d+)'/);
    out.push({
      id,
      maLuat: maM ? maM[1] : null,
      placeholder,
      trangThai: tm ? tm[1] : null,
    });
  }
  return out;
}

/** CHUYEN_DE-001 → CHUYEN_DE_001 (chuẩn hóa so khớp quy_tac_on_off_noi_bo). */
export function chuyenDeIdToNormalizedMa(id) {
  const n = id.replace(/^CHUYEN_DE-/, '');
  return `CHUYEN_DE_${n.padStart(3, '0')}`;
}
