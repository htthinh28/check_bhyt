
    // === MAPPING TỔNG HỢP: QĐ7603 · TT23 · PVHN · ĐA BỆNH VIỆN ===
    const BV_HOSPITAL_META = [
      { id: 'bvpcst', short: 'PCST', label: 'Sóc Trăng', sourceTag: 'BV_PCST', pl1Co: 'coTaiBV_PCST' },
      { id: 'bvpcct', short: 'PCCT', label: 'Cần Thơ', sourceTag: 'BV_PCCT', pl1Co: 'coTaiBV_PCCT' },
      { id: 'bvpsd', short: 'PSD', label: 'Sa Đéc', sourceTag: 'BV_PSD', pl1Co: 'coTaiBV_PSD' },
    ];

    const MASTER_MAP_COLUMNS = [
      { key: 'stt', label: 'STT', type: 'number' },
      { key: 'tagsMapping', label: 'Thẻ mapping đa nguồn', type: 'computed' },
      { key: 'mucDoMapping', label: 'Mức độ mapping', type: 'text' },
      { key: 'soBvCo', label: 'Số BV có DV', type: 'number' },
      { key: 'maTuongDuong', label: 'Mã QĐ7603', type: 'text' },
      { key: 'maTT43', label: 'Mã TT43', type: 'text' },
      { key: 'tenTT43', label: 'Tên QĐ7603', type: 'text' },
      { key: 'phanTuyen', label: 'Phân tuyến', type: 'text' },
      { key: 'maKyThuatTT23', label: 'Mã TT23', type: 'text' },
      { key: 'tenKyThuatTT23', label: 'Tên TT23', type: 'text' },
      { key: 'theLienKetTT23', label: 'Thẻ TT23', type: 'text' },
      { key: 'doTinCayMapping', label: 'Độ tin cậy TT23', type: 'text' },
      { key: 'thePhamViHanhNghe', label: 'Mã PVHN', type: 'text' },
      { key: 'tenPhamViHanhNghe', label: 'Tên PVHN', type: 'text' },
      { key: 'chuyenKhoaPVHN', label: 'Chuyên khoa BS CK', type: 'text' },
      { key: 'chiTietChuyenKhoaPVHN', label: 'Chi tiết CK', type: 'text' },
      { key: 'maPhamViBHXH', label: 'Mã PVHN BHXH', type: 'text' },
      { key: 'tenChucDanhBHXH', label: 'Chức danh BHXH được phép', type: 'text' },
      { key: 'soChucDanhBHXH', label: 'Số chức danh BHXH', type: 'number' },
      { key: 'doTinCayBHXH', label: 'Độ tin cậy BHXH', type: 'text' },
      { key: 'doTinCayPhamVi', label: 'Độ tin cậy PVHN', type: 'text' },
      { key: 'maDichVuPCST', label: 'PCST — Mã DV', type: 'text' },
      { key: 'tenDichVuPCST', label: 'PCST — Tên DV', type: 'text' },
      { key: 'donGiaPCST', label: 'PCST — Đơn giá', type: 'number' },
      { key: 'maDichVuPCCT', label: 'PCCT — Mã DV', type: 'text' },
      { key: 'tenDichVuPCCT', label: 'PCCT — Tên DV', type: 'text' },
      { key: 'donGiaPCCT', label: 'PCCT — Đơn giá', type: 'number' },
      { key: 'maDichVuPSD', label: 'Sa Đéc — Mã DV', type: 'text' },
      { key: 'tenDichVuPSD', label: 'Sa Đéc — Tên DV', type: 'text' },
      { key: 'donGiaPSD', label: 'Sa Đéc — Đơn giá', type: 'number' },
      { key: 'chenhGiaBv', label: 'Chênh giá BV (max-min)', type: 'number' },
      { key: 'ghiChuMapping', label: 'Ghi chú mapping TT23', type: 'text' },
      { key: 'ghiChuPhamVi', label: 'Ghi chú PVHN', type: 'text' },
      { key: 'loaiDong', label: 'Loại dòng', type: 'text' },
    ];

    let masterMapCache = null;
    let masterMapCacheKey = '';

    function normalizeBvCode(ma) {
      const s = String(ma || '').trim();
      return s.endsWith('_GT') ? s.slice(0, -3) : s;
    }

    function indexBvDataset(rows, by7603, byMa, orphans) {
      (rows || []).forEach(r => {
        const link = r.lienKetQD7603 || '';
        const ma = normalizeBvCode(r.maDichVu);
        if (link) {
          if (!by7603[link]) by7603[link] = [];
          by7603[link].push(r);
        } else if (ma) {
          if (!byMa[ma]) byMa[ma] = [];
          byMa[ma].push(r);
        }
        if (!link) orphans.push(r);
      });
    }

    function pickBvRow(list) {
      if (!list || !list.length) return null;
      const linked = list.find(r => r.lienKetQD7603);
      return linked || list[0];
    }

    function attachBvFields(row, meta, bvRow) {
      const sfx = meta.short;
      if (!bvRow) {
        row[`co${sfx}`] = '';
        row[`maDichVu${sfx}`] = '';
        row[`tenDichVu${sfx}`] = '';
        row[`donGia${sfx}`] = 0;
        row[`ghiChu${sfx}`] = '';
        return;
      }
      row[`co${sfx}`] = 'Có';
      row[`maDichVu${sfx}`] = bvRow.maDichVu || '';
      row[`tenDichVu${sfx}`] = bvRow.tenDichVu || '';
      row[`donGia${sfx}`] = bvRow.donGia || 0;
      row[`ghiChu${sfx}`] = bvRow.ghiChuBV || '';
    }

    function calcMucDoMapping(flags) {
      const { has7603, hasTT23, hasPVHN, hasBHXH, bvCount } = flags;
      if (!has7603 && bvCount > 0) return 'Chỉ BV (chưa map QĐ7603)';
      if (has7603 && hasTT23 && hasPVHN && hasBHXH && bvCount === 3) return 'Đủ 7603+TT23+PVHN+BHXH+3 BV';
      if (has7603 && hasTT23 && hasPVHN && hasBHXH && bvCount >= 1) return `Đủ 7603+TT23+PVHN+BHXH+${bvCount} BV`;
      if (has7603 && hasTT23 && hasPVHN && hasBHXH) return 'Đủ 7603+TT23+PVHN+BHXH';
      if (has7603 && hasTT23 && hasPVHN && bvCount === 3) return 'Đủ 7603+TT23+PVHN+3 BV';
      if (has7603 && hasTT23 && hasPVHN && bvCount >= 1) return `Đủ 7603+TT23+PVHN+${bvCount} BV`;
      if (has7603 && hasTT23 && hasPVHN) return 'Đủ 7603+TT23+PVHN';
      if (has7603 && hasTT23) return 'Đủ 7603+TT23 (chưa PVHN)';
      if (has7603 && hasPVHN) return 'Đủ 7603+PVHN (chưa TT23)';
      if (has7603 && hasBHXH) return 'Đủ 7603+BHXH';
      if (has7603 && bvCount >= 1) return `Đủ 7603+${bvCount} BV`;
      if (has7603) return 'Chỉ QĐ7603';
      return 'Chưa phân loại';
    }

    function buildMasterMappingDataset() {
      const cacheKey = BV_HOSPITAL_META.map(h => (state.datasets[h.id] || []).length).join('|') + '|' + state.datasets.pl1.length;
      if (masterMapCache && masterMapCacheKey === cacheKey) return masterMapCache;

      const by7603 = {};
      const byMa = {};
      const orphans = [];
      const bvIndexes = {};

      BV_HOSPITAL_META.forEach(meta => {
        const rows = state.datasets[meta.id] || [];
        bvIndexes[meta.id] = { by7603: {}, byMa: {} };
        indexBvDataset(rows, bvIndexes[meta.id].by7603, bvIndexes[meta.id].byMa, orphans);
      });

      const masterRows = [];
      let stt = 0;

      state.datasets.pl1.forEach(pl1 => {
        stt += 1;
        const ma = pl1.maTuongDuong || '';
        const row = {
          _rowId: `master-${ma || stt}`,
          stt,
          loaiDong: 'QĐ7603',
          maTuongDuong: ma,
          maTT43: pl1.maTT43 || '',
          tenTT43: pl1.tenTT43 || '',
          phanTuyen: pl1.phanTuyen || '',
          maKyThuatTT23: pl1.maKyThuatTT23 || '',
          tenKyThuatTT23: pl1.tenKyThuatTT23 || '',
          theLienKetTT23: pl1.theLienKetTT23 || '',
          doTinCayMapping: pl1.doTinCayMapping || '',
          ghiChuMapping: pl1.ghiChuMapping || '',
          thePhamViHanhNghe: pl1.thePhamViHanhNghe || '',
          tenPhamViHanhNghe: pl1.tenPhamViHanhNghe || '',
          chuyenKhoaPVHN: pl1.chuyenKhoaPVHN || '',
          chiTietChuyenKhoaPVHN: pl1.chiTietChuyenKhoaPVHN || '',
          maPhamViBHXH: pl1.maPhamViBHXH || '',
          tenChucDanhBHXH: pl1.tenChucDanhBHXH || '',
          soChucDanhBHXH: pl1.soChucDanhBHXH || 0,
          doTinCayBHXH: pl1.doTinCayBHXH || '',
          doTinCayPhamVi: pl1.doTinCayPhamVi || '',
          ghiChuPhamVi: pl1.ghiChuPhamVi || '',
        };

        let bvCount = 0;
        const prices = [];
        BV_HOSPITAL_META.forEach(meta => {
          const bvRow = pickBvRow(bvIndexes[meta.id].by7603[ma]) || pickBvRow(bvIndexes[meta.id].byMa[ma]);
          attachBvFields(row, meta, bvRow);
          if (bvRow) {
            bvCount += 1;
            if (bvRow.donGia) prices.push(Number(bvRow.donGia));
          }
        });

        row.soBvCo = bvCount;
        row.chenhGiaBv = prices.length >= 2 ? Math.max(...prices) - Math.min(...prices) : 0;
        row.mucDoMapping = calcMucDoMapping({
          has7603: true,
          hasTT23: !!pl1.theLienKetTT23,
          hasPVHN: !!pl1.thePhamViHanhNghe,
          hasBHXH: !!pl1.maPhamViBHXH,
          bvCount,
        });
        masterRows.push(row);
      });

      const orphanKeys = new Set();
      BV_HOSPITAL_META.forEach(meta => {
        (state.datasets[meta.id] || []).forEach(bv => {
          if (bv.lienKetQD7603) return;
          const key = `orphan-${meta.id}-${bv.maDichVu || bv._rowId}`;
          if (orphanKeys.has(key)) return;
          orphanKeys.add(key);
          stt += 1;
          const row = {
            _rowId: key,
            stt,
            loaiDong: `BV chưa map (${meta.label})`,
            maTuongDuong: '',
            maTT43: '',
            tenTT43: '',
            phanTuyen: '',
            maKyThuatTT23: '',
            tenKyThuatTT23: '',
            theLienKetTT23: '',
            doTinCayMapping: '',
            ghiChuMapping: bv.ghiChuMapping || '',
            thePhamViHanhNghe: '',
            tenPhamViHanhNghe: '',
            chuyenKhoaPVHN: '',
            chiTietChuyenKhoaPVHN: '',
            doTinCayPhamVi: '',
            ghiChuPhamVi: '',
            soBvCo: 1,
            chenhGiaBv: 0,
          };
          BV_HOSPITAL_META.forEach(m => attachBvFields(row, m, m.id === meta.id ? bv : null));
          row.mucDoMapping = 'Chỉ BV (chưa map QĐ7603)';
          masterRows.push(row);
        });
      });

      masterMapCache = masterRows;
      masterMapCacheKey = cacheKey;
      return masterRows;
    }

    function renderMasterMappingBadges(item) {
      const parts = [];
      if (item.loaiDong === 'QĐ7603' || item.maTuongDuong) parts.push(renderSourceBadge('QD_7603'));
      if (item.theLienKetTT23) parts.push(renderSourceBadge(item.theLienKetTT23));
      const pvhn = renderPvhnBadges(item.thePhamViHanhNghe);
      if (pvhn && pvhn !== '—') parts.push(pvhn);
      const bhxh = typeof renderBhxhBadges === 'function' ? renderBhxhBadges(item.maPhamViBHXH) : '';
      if (bhxh) parts.push(bhxh);
      BV_HOSPITAL_META.forEach(meta => {
        if (item[`co${meta.short}`] === 'Có') parts.push(renderSourceBadge(meta.sourceTag));
      });
      return `<div class="flex flex-wrap gap-1 items-center leading-relaxed">${parts.join('')}</div>`;
    }

    function ensureMasterMapTab() {
      if (!state.columns.mapfull) state.columns.mapfull = [...MASTER_MAP_COLUMNS];
      state.datasets.mapfull = buildMasterMappingDataset();
    }

    function matchesMasterMapFilter(item) {
      const f = state.filterTheNguon;
      if (!f || state.activeTab !== 'mapfull') return true;
      if (f === 'FULL_ALL') {
        return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH && item.soBvCo >= 1;
      }
      if (f === 'FULL_7603_TT23_PVHN') {
        return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe;
      }
      if (f === 'FULL_7603_TT23_PVHN_BHXH') {
        return !!item.maTuongDuong && !!item.theLienKetTT23 && !!item.thePhamViHanhNghe && !!item.maPhamViBHXH;
      }
      if (f === 'CO_BHXH') return !!item.maPhamViBHXH;
      if (f === 'KHONG_BHXH') return item.loaiDong === 'QĐ7603' && !item.maPhamViBHXH;
      if (f === 'CO_CA_3_BV') return item.soBvCo === 3;
      if (f === 'CO_IT_NHAT_1_BV') return item.soBvCo >= 1;
      if (f === 'CHENH_GIA_BV') return item.chenhGiaBv > 0;
      if (f === 'CHUA_DU_MAPPING') {
        return !item.theLienKetTT23 || !item.thePhamViHanhNghe || item.soBvCo === 0;
      }
      if (f === 'CHI_BV_CHUA_MAP') return item.loaiDong !== 'QĐ7603';
      if (f === 'KHONG_PVHN') return item.loaiDong === 'QĐ7603' && !item.thePhamViHanhNghe;
      if (f === 'KHONG_TT23') return item.loaiDong === 'QĐ7603' && !item.theLienKetTT23;
      return matchesTheNguonFilter(item);
    }
