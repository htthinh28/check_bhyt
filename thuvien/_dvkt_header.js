
    const CATALOG_QD_LABEL = 'Quyết định số 7603/QĐ-BYT';
    const CATALOG_TT23_LABEL = 'Thông tư số 23/2024/TT-BYT';
    const SOURCE_TAGS = {
      QD_7603: { label: 'QĐ 7603', full: 'Quyết định số 7603/QĐ-BYT — Phụ lục 01 (TT39/TT43)', cls: 'bg-rose-100 text-rose-800 border border-rose-200' },
      TT23_PL1: { label: 'TT23-PL1', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 1 (Danh mục kỹ thuật)', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
      TT23_PL2: { label: 'TT23-PL2', full: 'Thông tư số 23/2024/TT-BYT — Phụ lục 2 (Danh mục phẫu thuật)', cls: 'bg-violet-100 text-violet-800 border border-violet-200' },
      BV_PCST: { label: 'BV PCST', full: 'Bệnh viện Quốc tế Phương Châu Sóc Trăng — Danh mục DVKT M05', cls: 'bg-cyan-100 text-cyan-900 border border-cyan-200' },
      BV_PCCT: { label: 'BV PCCT', full: 'Bệnh viện Quốc tế Phương Châu Cần Thơ', cls: 'bg-teal-100 text-teal-900 border border-teal-200' },
      BV_PSD: { label: 'BV Sa Đéc', full: 'BV Phương Châu Sa Đéc', cls: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
    };

    function getRowId(item) {
      return item.maTuongDuong || item.maDichVu || item.maPhamVi || item._rowId || item.maKyThuat || `${item.quyTrinhSo || 'qt'}_${item.stt}`;
    }

    function renderSourceBadge(tag) {
      if (!tag) return '—';
      const info = SOURCE_TAGS[tag];
      if (!info) return tag;
      return `<span class="px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${info.cls}" title="${info.full}">${info.label}</span>`;
    }
