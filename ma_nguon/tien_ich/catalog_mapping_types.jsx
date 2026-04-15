/**
 * Đặc tả: DacTaKyThuat_MappingDanhMuc v1.0 — mapping_type_config + tham chiếu danh mục nội bộ (AsyncStorage).
 * Tên catalog theo spec (employees, dvkt_items, …); storageKey là khóa tab trong Quản lý danh mục.
 */

export const CATALOG_REF = {
  employees: { storageKey: 'DANH_MUC_NHAN_SU', codeFields: ['MA_BHXH', 'MACCHN'], nameFields: ['HO_TEN'] },
  dvkt_items: { storageKey: 'DANH_MUC_DVKT_M05', codeFields: ['MA_DICH_VU', 'MA_TUONG_DUONG'], nameFields: ['TEN_DICH_VU', 'TEN_DVKT_GIA'] },
  /** Tập mã PHAN_LOAI_PTTT suy ra từ DVKT M05 — không còn mapping DVKT→PTTT riêng */
  surgery_types: { storageKey: null, codeFields: ['PHAN_LOAI_PTTT'], nameFields: [] },
  bed_types: { storageKey: 'DANH_MUC_GIUONG_BAN_KHAM_BV', codeFields: ['MA_TUONG_DUONG'], nameFields: ['TEN_DVKT_PHEDUYET', 'TEN_DVKT_GIA'] },
  equipments: { storageKey: 'DANH_MUC_TRANG_THIET_BI_M06', codeFields: ['MA_MAY'], nameFields: ['TEN_TB', 'KY_HIEU'] },
};

/** Theo mục 2.4 đặc tả */
export const MAPPING_TYPE_CONFIG = [
  {
    mapping_type: 'STAFF_DVKT',
    display_name: 'Nhân viên → DVKT',
    source_catalog: 'employees',
    target_catalog: 'dvkt_items',
    cardinality: 'M:N',
    allow_overlap: true,
    require_approval: true,
    is_active: true,
  },
  {
    mapping_type: 'SURGERY_BED',
    display_name: 'Phân loại PT → Giường bệnh',
    source_catalog: 'surgery_types',
    target_catalog: 'bed_types',
    cardinality: 'M:N',
    allow_overlap: true,
    require_approval: true,
    is_active: true,
  },
  {
    mapping_type: 'STAFF_EQUIPMENT',
    display_name: 'Nhân viên → Máy / thiết bị',
    source_catalog: 'employees',
    target_catalog: 'equipments',
    cardinality: 'M:N',
    allow_overlap: true,
    require_approval: false,
    is_active: true,
  },
  {
    mapping_type: 'DVKT_EQUIPMENT',
    display_name: 'DVKT → Máy / thiết bị',
    source_catalog: 'dvkt_items',
    target_catalog: 'equipments',
    cardinality: 'M:N',
    allow_overlap: true,
    require_approval: false,
    is_active: true,
  },
];

export const layCauHinhLoaiMapping = (mappingType) =>
  MAPPING_TYPE_CONFIG.find((x) => x.mapping_type === mappingType) || null;

export const LAY_MAPPING_TYPE_OPTIONS = [{ value: '', label: 'Tất cả loại' }].concat(
  MAPPING_TYPE_CONFIG.map((c) => ({ value: c.mapping_type, label: `${c.mapping_type} — ${c.display_name}` })),
);
