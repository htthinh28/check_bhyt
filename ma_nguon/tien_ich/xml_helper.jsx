/**
 * ============================================================
 * FILE: tien_ich/xml_helper.jsx
 * MỤC ĐÍCH: Cung cấp các hàm tiện ích để giải mã, bóc tách,
 * và xác thực dữ liệu XML theo chuẩn 130/QĐ-BYT.
 * ============================================================
 */

import { DOMParser as XmldomParser } from '@xmldom/xmldom';
import { Buffer } from 'buffer';

const taoDOMParser = () => {
  const ParserImpl = typeof globalThis.DOMParser === 'function' ? globalThis.DOMParser : XmldomParser;
  return new ParserImpl();
};

const TAP_TRUONG_DINH_DANH_CAN_GIU_SO_0 = new Set(['SO_CCCD', 'SO_DINH_DANH']);

const lamSachTenTruong = (name) => String(name || '').replace(/^\uFEFF/, '').trim();
const lamSachGiaTri = (value) => String(value || '').replace(/\u0000/g, '').trim();
const chuanHoaGiaTriTheoTruong = (fieldName, value) => {
  const cleaned = lamSachGiaTri(value);
  const tenTruong = lamSachTenTruong(fieldName).toUpperCase();
  if (TAP_TRUONG_DINH_DANH_CAN_GIU_SO_0.has(tenTruong)) {
    return cleaned.replace(/\s+/g, '');
  }
  return cleaned;
};
const boTienToNamespace = (name) => String(name || '').split(':').pop();
const layTenTruongKhongNamespace = (name) => lamSachTenTruong(boTienToNamespace(name));
const chuanHoaTenTag = (name) =>
  boTienToNamespace(name)
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

const MAP_TAG_THEO_XML = Object.freeze({
  XML1: ['TONG_HOP', 'TONGHOP', 'XML1', 'THONG_TIN_CHUNG'],
  XML2: ['CHI_TIET_THUOC', 'CHITIETTHUOC', 'XML2', 'THUOC'],
  XML3: ['CHI_TIET_DVKT', 'CHITIETDVKT', 'CHI_TIET_VTYT', 'CHITIETVTYT', 'XML3', 'DVKT'],
  XML4: ['CHI_TIET_CLS', 'CHITIETCLS', 'CHI_TIET_CHI_SO', 'CHITIETCHISO', 'XML4', 'CLS'],
  XML5: ['CHI_TIET_DIEN_BIEN_BENH', 'CHITIETDIENBIENBENH', 'DIEN_BIEN_BENH', 'XML5'],
  XML6: ['CHI_TIET_THANH_TOAN', 'CHITIETTHANHTOAN', 'THANH_TOAN', 'XML6'],
  XML11: ['CHI_TIEU_DU_LIEU_GIAY_CHUNG_NHAN_NGHI_VIEC_HUONG_BAO_HIEM_XA_HOI'],
});
const DANH_SACH_XML_CHUAN = Object.freeze(['XML1', 'XML2', 'XML3', 'XML4', 'XML5', 'XML6']);
const CAU_HINH_XUAT_XML = Object.freeze({
  XML1: { singleTag: 'TONG_HOP' },
  XML2: { listTag: 'DSACH_THUOC', itemTag: 'CHI_TIET_THUOC' },
  XML3: { listTag: 'DSACH_DVKT', itemTag: 'CHI_TIET_DVKT' },
  XML4: { listTag: 'DSACH_CLS', itemTag: 'CHI_TIET_CLS' },
  XML5: { listTag: 'DSACH_DIEN_BIEN_BENH', itemTag: 'CHI_TIET_DIEN_BIEN_BENH' },
  XML6: { listTag: 'DSACH_THANH_TOAN', itemTag: 'CHI_TIET_THANH_TOAN' },
});

const layDanhSachNodeTheoTen = (root, tenTag) => {
  if (!root || !tenTag) return [];
  const tenCanTim = chuanHoaTenTag(tenTag);
  const dsNode = [];
  const tatCaNode = root.getElementsByTagName('*');
  for (let i = 0; i < tatCaNode.length; i++) {
    const node = tatCaNode[i];
    const localName = node?.localName || node?.nodeName || '';
    if (chuanHoaTenTag(localName) === tenCanTim) dsNode.push(node);
  }
  return dsNode;
};

const layNodeConTheoTen = (element, tenTag) => {
  if (!element || !tenTag) return null;
  const tenCanTim = chuanHoaTenTag(tenTag);
  const nodes = element.childNodes || [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node?.nodeType !== 1) continue;
    const localName = node?.localName || node?.nodeName || '';
    if (chuanHoaTenTag(localName) === tenCanTim) return node;
  }

  const tatCaNode = layDanhSachNodeTheoTen(element, tenTag);
  return tatCaNode.length > 0 ? tatCaNode[0] : null;
};

const layThongDiepParserError = (xmlDoc) => {
  if (!xmlDoc) return '';
  const errs = layDanhSachNodeTheoTen(xmlDoc, 'parsererror');
  if (errs?.length > 0) return lamSachGiaTri(errs[0].textContent);
  const rootName = String(xmlDoc?.documentElement?.nodeName || '').toLowerCase();
  if (rootName.includes('parsererror')) {
    return lamSachGiaTri(xmlDoc?.documentElement?.textContent);
  }
  return '';
};

const chuanHoaNoiDungXmlTruocKhiParse = (xmlRaw) => {
  let xml = String(xmlRaw || '').replace(/^\uFEFF/, '').replace(/\u0000/g, '').trim();
  if (!xml) return '';

  // Một số XML từ HIS/BV bị ghi sai URI namespace làm browser DOMParser báo parsererror.
  xml = xml.replace(
    /\bxmlns:xsi\s*=\s*(["'])\s*http:\/\/www\.w3\.org\/2001\/XMLSchema(?:[\s-]+instance)?\s*\1/gi,
    'xmlns:xsi=$1http://www.w3.org/2001/XMLSchema-instance$1'
  );
  xml = xml.replace(
    /\bxmlns:xsd\s*=\s*(["'])\s*http:\/\/www\.w3\.org\/2001\/XMLSchema(?:[\s-]+instance)?\s*\1/gi,
    'xmlns:xsd=$1http://www.w3.org/2001/XMLSchema$1'
  );

  return xml;
};

const boNamespaceGayLoiTrinhDuyet = (xmlRaw) =>
  String(xmlRaw || '').replace(/\s+xmlns:(xsi|xsd)\s*=\s*(["']).*?\2/gi, '');

const parseXmlAnToan = (xmlRaw) => {
  const parser = taoDOMParser();
  const xmlDaChuan = chuanHoaNoiDungXmlTruocKhiParse(xmlRaw);
  let xmlDoc = parser.parseFromString(xmlDaChuan, "text/xml");
  let parserError = layThongDiepParserError(xmlDoc);

  if (parserError && /(xmlns:|namespace|not a valid uri)/i.test(parserError)) {
    const xmlKhongNamespace = boNamespaceGayLoiTrinhDuyet(xmlDaChuan);
    xmlDoc = parser.parseFromString(xmlKhongNamespace, "text/xml");
    parserError = layThongDiepParserError(xmlDoc);
  }

  return { xmlDoc, parserError };
};

const giaiMaBase64 = (base64Str) => {
  try {
    if (!base64Str) return "";

    if (typeof globalThis.atob === 'function') {
      const binaryStr = globalThis.atob(base64Str.trim());
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new TextDecoder("utf-8").decode(bytes);
    }

    return Buffer.from(base64Str.trim(), "base64").toString("utf-8");
  } catch (e) {
    console.error("[xml_helper] Lỗi giải mã Base64:", e);
    return "";
  }
};

const getTagValue = (element, tagName) => {
  const node = layNodeConTheoTen(element, tagName);
  return node ? lamSachGiaTri(node.textContent) : "";
};

const normalizeLoaiHoSo = (loaiRaw) => {
  const cleaned = String(loaiRaw || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');

  const matchSo = cleaned.match(/^0*([0-9]+)$/);
  if (matchSo) return `XML${Number(matchSo[1])}`;

  const match = cleaned.match(/^XML0*([0-9]+)$/);
  if (match) return `XML${Number(match[1])}`;

  const matchTrongChuoi = cleaned.match(/XML0*([0-9]+)/);
  if (matchTrongChuoi) return `XML${Number(matchTrongChuoi[1])}`;

  return cleaned;
};

const taoHoSoRong = () => ({
  xml1: {},
  xml2: [],
  xml3: [],
  xml4: [],
  xml5: [],
  xml6: [],
  _raw: {},
  _meta: {
    rawLoaiHoSo: [],
    availableXmlTypes: [],
    missingXmlTypes: [...DANH_SACH_XML_CHUAN],
    emptyXmlTypes: [],
  },
});

const coDuLieuHoSo = (hoSo = {}) =>
  Object.keys(hoSo?.xml1 || {}).length > 0 ||
  (hoSo?.xml2 || []).length > 0 ||
  (hoSo?.xml3 || []).length > 0 ||
  (hoSo?.xml4 || []).length > 0 ||
  (hoSo?.xml5 || []).length > 0 ||
  (hoSo?.xml6 || []).length > 0;

const coDuLieuBang = (duLieu, loaiXml) => {
  if (loaiXml === 'XML1') {
    if (!duLieu || typeof duLieu !== 'object' || Array.isArray(duLieu)) return false;
    const dsKey = Object.keys(duLieu).filter((key) => key !== 'parsererror');
    return dsKey.length > 0 && !duLieu.parsererror;
  }

  if (!Array.isArray(duLieu)) return false;
  return duLieu.some((item) => item && typeof item === 'object' && !item.parsererror && Object.keys(item).length > 0);
};

const taoMetaHoSo = (danhSachLoaiHoSo = [], hoSo = {}) => {
  const rawLoaiHoSo = Array.from(
    new Set(
      (Array.isArray(danhSachLoaiHoSo) ? danhSachLoaiHoSo : [])
        .map((item) => normalizeLoaiHoSo(item))
        .filter((item) => DANH_SACH_XML_CHUAN.includes(item))
    )
  );

  const availableXmlTypes = DANH_SACH_XML_CHUAN.filter((loaiXml) =>
    coDuLieuBang(hoSo?.[loaiXml.toLowerCase()], loaiXml)
  );

  return {
    rawLoaiHoSo,
    availableXmlTypes,
    missingXmlTypes: DANH_SACH_XML_CHUAN.filter((loaiXml) => !rawLoaiHoSo.includes(loaiXml)),
    emptyXmlTypes: DANH_SACH_XML_CHUAN.filter(
      (loaiXml) => rawLoaiHoSo.includes(loaiXml) && !availableXmlTypes.includes(loaiXml)
    ),
  };
};

const parseRecordsByTag = (xmlDoc, tagName) => {
  const danhSach = [];
  if (!xmlDoc || !tagName) return danhSach;
  const items = layDanhSachNodeTheoTen(xmlDoc, tagName);
  for (let i = 0; i < items.length; i++) {
    const obj = {};
    const childNodes = items[i].childNodes || [];
    for (let j = 0; j < childNodes.length; j++) {
      const node = childNodes[j];
      if (node?.nodeType !== 1) continue;
      const key = layTenTruongKhongNamespace(node.nodeName);
      if (!key) continue;
      obj[key] = chuanHoaGiaTriTheoTruong(key, node.textContent);
    }
    if (Object.keys(obj).length > 0) danhSach.push(obj);
  }
  return danhSach;
};

const chuanHoaDongXml1TuPhienBanCu = (row = {}) => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;

  const normalized = { ...row };

  if (IS_EMPTY_GIA_TRI(normalized.MATINH_CU_TRU) && !IS_EMPTY_GIA_TRI(normalized.MATIX_CU_TRU)) {
    normalized.MATINH_CU_TRU = normalized.MATIX_CU_TRU;
  }
  if (IS_EMPTY_GIA_TRI(normalized.NAM_NAM_LIEN_TUC) && !IS_EMPTY_GIA_TRI(normalized.NAM_NAM_LIENWTUC)) {
    normalized.NAM_NAM_LIEN_TUC = normalized.NAM_NAM_LIENWTUC;
  }

  delete normalized.MATIX_CU_TRU;
  delete normalized.NAM_NAM_LIENWTUC;

  return normalized;
};

const chuanHoaDongXml5TuPhienBanCu = (row = {}, xml1 = {}) => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;

  const daCoCotCu = !!(row.DIEN_BIEN_LS || row.THOI_DIEM_DBLS || row.NGUOI_THUC_HIEN || row.GIAI_DOAN_BENH);
  if (!daCoCotCu) return row;

  const normalized = { ...row };

  if (IS_EMPTY_GIA_TRI(normalized.DIEN_BIEN) && !IS_EMPTY_GIA_TRI(normalized.DIEN_BIEN_LS)) {
    normalized.DIEN_BIEN = normalized.DIEN_BIEN_LS;
  }
  if (IS_EMPTY_GIA_TRI(normalized.NGAY_YL) && !IS_EMPTY_GIA_TRI(normalized.THOI_DIEM_DBLS)) {
    normalized.NGAY_YL = normalized.THOI_DIEM_DBLS;
  }
  if (IS_EMPTY_GIA_TRI(normalized.MA_BAC_SI) && !IS_EMPTY_GIA_TRI(normalized.NGUOI_THUC_HIEN)) {
    normalized.MA_BAC_SI = normalized.NGUOI_THUC_HIEN;
  }
  if (IS_EMPTY_GIA_TRI(normalized.MA_KHOA) && !IS_EMPTY_GIA_TRI(xml1?.MA_KHOA)) {
    normalized.MA_KHOA = xml1.MA_KHOA;
  }

  delete normalized.DIEN_BIEN_LS;
  delete normalized.THOI_DIEM_DBLS;
  delete normalized.NGUOI_THUC_HIEN;
  delete normalized.GIAI_DOAN_BENH;

  return normalized;
};

const chuanHoaHoSoSauKhiParse = (hoSo = {}) => {
  if (!hoSo || typeof hoSo !== 'object') return hoSo;
  const xml1 = chuanHoaDongXml1TuPhienBanCu(hoSo.xml1 || {});
  const xml5 = Array.isArray(hoSo.xml5) ? hoSo.xml5.map((row) => chuanHoaDongXml5TuPhienBanCu(row, xml1)) : hoSo.xml5;
  return {
    ...hoSo,
    xml1,
    xml5,
  };
};

const IS_EMPTY_GIA_TRI = (value) => value === null || value === undefined || String(value).trim() === '';

const parseHoSoTrucTiep = (xmlDoc) => {
  const parseByTags = (tags = []) => {
    for (const tag of tags) {
      const ds = parseRecordsByTag(xmlDoc, tag);
      if (ds.length > 0) return ds;
    }
    return [];
  };

  const xml1List = parseByTags(MAP_TAG_THEO_XML.XML1);
  const xml2List = parseByTags(MAP_TAG_THEO_XML.XML2);
  const xml3List = parseByTags(MAP_TAG_THEO_XML.XML3);
  const xml4List = parseByTags(MAP_TAG_THEO_XML.XML4);
  const xml5List = parseByTags(MAP_TAG_THEO_XML.XML5);
  const xml6List = parseByTags(MAP_TAG_THEO_XML.XML6);

  const hoSoGop = {
    xml1: xml1List[0] || {},
    xml2: xml2List,
    xml3: xml3List,
    xml4: xml4List,
    xml5: xml5List,
    xml6: xml6List,
    _raw: {},
    _meta: {
      rawLoaiHoSo: [],
      availableXmlTypes: [],
      missingXmlTypes: [...DANH_SACH_XML_CHUAN],
      emptyXmlTypes: [],
    },
  };

  const coDuLieu =
    Object.keys(hoSoGop.xml1).length > 0 ||
    hoSoGop.xml2.length > 0 ||
    hoSoGop.xml3.length > 0 ||
    hoSoGop.xml4.length > 0 ||
    hoSoGop.xml5.length > 0 ||
    hoSoGop.xml6.length > 0;

  if (!coDuLieu) return null;

  const hoSoDaChuanHoa = chuanHoaHoSoSauKhiParse(hoSoGop);
  const rawLoaiHoSo = DANH_SACH_XML_CHUAN.filter((loaiXml) => coDuLieuBang(hoSoDaChuanHoa?.[loaiXml.toLowerCase()], loaiXml));
  hoSoDaChuanHoa._meta = taoMetaHoSo(rawLoaiHoSo, hoSoDaChuanHoa);
  return hoSoDaChuanHoa;
};

const parseInnerXML = (xmlRaw, loaiHoso) => {
  const loaiChuan = normalizeLoaiHoSo(loaiHoso);
  const cleanedXml = chuanHoaNoiDungXmlTruocKhiParse(xmlRaw);
  if (!cleanedXml) return loaiChuan === 'XML1' ? {} : [];

  const { xmlDoc, parserError } = parseXmlAnToan(cleanedXml);
  if (parserError) {
    const loi = { parsererror: parserError };
    return loaiChuan === 'XML1' ? loi : [loi];
  }
  let ketQua = [];

  const dsTag = MAP_TAG_THEO_XML[loaiChuan] || [loaiChuan, `CHI_TIET_${loaiChuan}`, `CHITIET${loaiChuan}`, 'HOSO'];
  let items = [];
  for (let i = 0; i < dsTag.length; i++) {
    items = layDanhSachNodeTheoTen(xmlDoc, dsTag[i]);
    if (items.length > 0) break;
  }

  for (let i = 0; i < items.length; i++) {
    let obj = {};
    const childNodes = items[i].childNodes || [];
    for (let j = 0; j < childNodes.length; j++) {
      const node = childNodes[j];
      if (node?.nodeType !== 1) continue;
      const key = layTenTruongKhongNamespace(node.nodeName);
      if (!key) continue;
      obj[key] = chuanHoaGiaTriTheoTruong(key, node.textContent);
    }
    ketQua.push(obj);
  }

  if (ketQua.length === 0) {
    const root = xmlDoc?.documentElement;
    if (root) {
      const obj = {};
      const childNodes = root.childNodes || [];
      for (let j = 0; j < childNodes.length; j++) {
        const node = childNodes[j];
        if (node?.nodeType !== 1) continue;
        const key = layTenTruongKhongNamespace(node.nodeName);
        if (!key) continue;
        obj[key] = chuanHoaGiaTriTheoTruong(key, node.textContent);
      }
      if (Object.keys(obj).length > 0) ketQua.push(obj);
    }
  }

  return loaiChuan === 'XML1' ? (ketQua[0] || {}) : ketQua;
};

const parseHoSoTuDanhSachFileHoso = (listFileHoso) => {
  const hoSoGop = taoHoSoRong();
  const danhSachLoaiHoSo = [];
  for (let i = 0; i < listFileHoso.length; i++) {
    const loaiRaw = getTagValue(listFileHoso[i], 'LOAIHOSO');
    const loai = normalizeLoaiHoSo(loaiRaw);
    if (loai) danhSachLoaiHoSo.push(loai);
    const base64Content = getTagValue(listFileHoso[i], 'NOIDUNGFILE');
    if (!base64Content) continue;

    const dataParsed = parseInnerXML(giaiMaBase64(base64Content), loai);
    const key = loai.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(hoSoGop, key)) {
      hoSoGop[key] = dataParsed;
    } else {
      hoSoGop._raw[loai] = dataParsed;
    }
  }
  const hoSoDaChuanHoa = chuanHoaHoSoSauKhiParse(hoSoGop);
  hoSoDaChuanHoa._meta = taoMetaHoSo(danhSachLoaiHoSo, hoSoDaChuanHoa);
  return hoSoDaChuanHoa;
};

export const xuLyFileXML130 = (rawXMLString) => {
  try {
    const xmlRaw = chuanHoaNoiDungXmlTruocKhiParse(rawXMLString);
    if (!xmlRaw.trim()) return [];

    const { xmlDoc, parserError } = parseXmlAnToan(xmlRaw);
    if (parserError) {
      return [
        {
          xml1: { parsererror: parserError },
          xml2: [],
          xml3: [],
          xml4: [],
          xml5: [],
          xml6: [],
          _raw: {},
        },
      ];
    }

    const listHoso = xmlDoc.getElementsByTagName('HOSO');
    if (listHoso.length > 0) {
      const ketQua = [];
      for (let i = 0; i < listHoso.length; i++) {
        const listFileHosoTheoHoSo = listHoso[i].getElementsByTagName('FILEHOSO');
        if (listFileHosoTheoHoSo.length === 0) continue;
        const hoSo = parseHoSoTuDanhSachFileHoso(listFileHosoTheoHoSo);
        if (coDuLieuHoSo(hoSo)) ketQua.push(hoSo);
      }
      if (ketQua.length > 0) return ketQua;
    }

    const listFileHoso = xmlDoc.getElementsByTagName('FILEHOSO');
    if (listFileHoso.length > 0) {
      const hoSo = parseHoSoTuDanhSachFileHoso(listFileHoso);
      if (coDuLieuHoSo(hoSo)) return [hoSo];
    }

    // Fallback: ho tro XML truc tiep (khong dong goi FILEHOSO + base64)
    const hoSoTrucTiep = parseHoSoTrucTiep(xmlDoc);
    if (hoSoTrucTiep) return [hoSoTrucTiep];

    return [];
  } catch (err) {
    console.error("[xml_helper] Lỗi xử lý XML 130:", err);
    return [];
  }
};

export const validateHoSo = (hoSo) => {
  let errors = [];
  const xml1 = hoSo.xml1 || {};
  if (!xml1.MA_LK) errors.push("Thiếu Mã lượt khám (MA_LK)");
  if (!xml1.HO_TEN) errors.push("Thiếu Họ tên bệnh nhân (HO_TEN)");
  if (!xml1.MA_THE_BHYT && !xml1.MA_THE) errors.push("Thiếu Mã thẻ BHYT");
  return { hop_le: errors.length === 0, danh_sach_loi: errors };
};

const escapeXml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const chuyenThanhMang = (duLieu) => {
  if (Array.isArray(duLieu)) return duLieu;
  if (duLieu && typeof duLieu === 'object') return [duLieu];
  return [];
};

const ghiNodeTuObject = (lines, value, indent) => {
  for (const [field, val] of Object.entries(value || {})) {
    if (field === 'id' || String(field).startsWith('_')) continue;
    lines.push(`${indent}<${field}>${escapeXml(val)}</${field}>`);
  }
};

export const xuatHoSoThanhXML130 = (hoSoNguon = {}, options = {}) => {
  const hoSo = hoSoNguon && typeof hoSoNguon === 'object' ? hoSoNguon : {};
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<HOSO>'];
  const loaiHoSoDaGhi = [];

  DANH_SACH_XML_CHUAN.forEach((loaiXml) => {
    const key = loaiXml.toLowerCase();
    const duLieu = hoSo?.[key] ?? hoSo?.[loaiXml];
    if (!duLieu) return;

    const cfg = CAU_HINH_XUAT_XML[loaiXml];
    if (!cfg) return;
    loaiHoSoDaGhi.push(loaiXml);

    if (cfg.singleTag) {
      lines.push(`  <${cfg.singleTag}>`);
      ghiNodeTuObject(lines, duLieu, '    ');
      lines.push(`  </${cfg.singleTag}>`);
      return;
    }

    const items = chuyenThanhMang(duLieu);
    if (items.length === 0) return;

    lines.push(`  <${cfg.listTag}>`);
    items.forEach((item) => {
      lines.push(`    <${cfg.itemTag}>`);
      ghiNodeTuObject(lines, item, '      ');
      lines.push(`    </${cfg.itemTag}>`);
    });
    lines.push(`  </${cfg.listTag}>`);
  });

  const dsXmlPhu = Object.keys(hoSo)
    .filter((key) => /^xml\d+$/i.test(key))
    .map((key) => normalizeLoaiHoSo(key))
    .filter((loaiXml) => !DANH_SACH_XML_CHUAN.includes(loaiXml));

  Array.from(new Set(dsXmlPhu)).forEach((loaiXml) => {
    const data = hoSo?.[loaiXml.toLowerCase()] ?? hoSo?.[loaiXml] ?? hoSo?._raw?.[loaiXml];
    const items = chuyenThanhMang(data);
    if (items.length === 0) return;
    lines.push(`  <DSACH_${loaiXml}>`);
    items.forEach((item) => {
      lines.push(`    <${loaiXml}>`);
      ghiNodeTuObject(lines, item, '      ');
      lines.push(`    </${loaiXml}>`);
    });
    lines.push(`  </DSACH_${loaiXml}>`);
    loaiHoSoDaGhi.push(loaiXml);
  });

  lines.push('</HOSO>');

  const maLK = hoSo?.xml1?.MA_LK || hoSo?.XML1?.MA_LK || hoSo?.ma_lk || 'EDITED';
  const tenFilePrefix = options?.tenFilePrefix || 'HOSO_QD130';
  return {
    xmlContent: lines.join('\n'),
    tenFile: `${tenFilePrefix}_${maLK}.xml`,
    danhSachLoaiXml: Array.from(new Set(loaiHoSoDaGhi)),
  };
};
