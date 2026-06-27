
    const QTKT_TAB_ID = 'quytrinhkt';
    let qtktViewMode = 'table';

    function setQtktViewMode(mode) {
      qtktViewMode = mode === 'info' ? 'info' : 'table';
      const btnTable = document.getElementById('qtktViewTableBtn');
      const btnInfo = document.getElementById('qtktViewInfoBtn');
      if (btnTable) {
        btnTable.classList.toggle('bg-amber-600', qtktViewMode === 'table');
        btnTable.classList.toggle('text-white', qtktViewMode === 'table');
      }
      if (btnInfo) {
        btnInfo.classList.toggle('bg-amber-600', qtktViewMode === 'info');
        btnInfo.classList.toggle('text-white', qtktViewMode === 'info');
      }
      renderUI();
    }

    function ensureQtktToolbar() {
      const panel = document.getElementById('dvktDataPanel');
      if (!panel || document.getElementById('qtktViewToolbar')) return;
      const bar = document.createElement('div');
      bar.id = 'qtktViewToolbar';
      bar.className = 'hidden mb-4 flex flex-wrap items-center gap-2';
      bar.innerHTML = `
        <div class="w-full mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 leading-relaxed">
          <strong>Quy trình kỹ thuật BYT (2025–2026):</strong> trích từ QĐ-BYT từng chuyên khoa · liên kết
          <strong>TT 32/2023</strong> (DVKT) · <strong>QĐ 7603</strong> · <strong>ICD-10 TT06</strong>.
          §2 Chỉ định · §3 Chống chỉ định · §5.1 Nhân sự · §5.6 Thời gian.
        </div>
        <span class="text-xs font-bold uppercase text-amber-800 tracking-wide">Hiển thị quy trình:</span>
        <button type="button" id="qtktViewTableBtn" onclick="setQtktViewMode('table')"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-600 text-white">📋 Bảng</button>
        <button type="button" id="qtktViewInfoBtn" onclick="setQtktViewMode('info')"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-900 bg-amber-50">🧭 Infographic</button>
      `;
      const filters = panel.querySelector('.border-b.border-slate-100');
      if (filters) filters.insertAdjacentElement('afterend', bar);
      else panel.prepend(bar);
    }

    function toggleQtktToolbar(show) {
      ensureQtktToolbar();
      const bar = document.getElementById('qtktViewToolbar');
      if (bar) bar.classList.toggle('hidden', !show);
    }

    function escapeQtktHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function qtktIcdChipClick(ev, ma) {
      const code = String(ma || '').trim().toUpperCase();
      if (!code) return;
      if (ev && ev.shiftKey) {
        state.filterIcd = code;
        state.currentPage = 1;
        renderUI();
        return;
      }
      if (typeof openPcDuocThuByIcd === 'function') openPcDuocThuByIcd(code);
      else {
        state.filterIcd = code;
        state.currentPage = 1;
        renderUI();
      }
    }

    function renderQtktIcdChips(maStr, tenStr, kind) {
      const mas = String(maStr || '').split(';').map(s => s.trim()).filter(Boolean);
      const tens = String(tenStr || '').split(';').map(s => s.trim()).filter(Boolean);
      if (!mas.length) return `<span class="text-xs text-slate-400 italic">Chưa trích xuất mã ICD</span>`;
      const cls = kind === 'chong' ? 'bg-red-50 text-red-800 border-red-200 hover:ring-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:ring-emerald-300';
      return mas.map((ma, i) => {
        const ten = tens[i] || '';
        const safeMa = escapeQtktHtml(ma);
        return `<button type="button" onclick="qtktIcdChipClick(event,'${safeMa}')" class="inline-flex flex-col max-w-full px-2 py-1 text-[11px] rounded-lg border ${cls} mr-1 mb-1 text-left cursor-pointer hover:ring-2" title="${escapeQtktHtml(ten)} · Click: Dược thư · Shift+click: lọc QTKT"><b>${safeMa}</b>${ten ? `<span class="text-[10px] opacity-80 line-clamp-2">${escapeQtktHtml(ten)}</span>` : ''}</button>`;
      }).join('');
    }

    function renderQtktInfographicCard(row) {
      const tags = [];
      if (row.lienKetQD7603) tags.push(`<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">QĐ7603 ${escapeQtktHtml(row.maTT43 || row.lienKetQD7603)}</span>`);
      if (row.lienKetTT23) tags.push(`<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">TT23 ${escapeQtktHtml(row.lienKetTT23)}</span>`);
      return `
        <article class="qtkt-info-card border border-amber-200 rounded-2xl bg-gradient-to-br from-white to-amber-50/40 shadow-sm overflow-hidden">
          <header class="px-4 py-3 bg-amber-600/90 text-white">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-[10px] uppercase tracking-wider opacity-90">QT số ${escapeQtktHtml(row.quyTrinhSo)} · ${escapeQtktHtml(row.maKyThuat || '—')}</p>
                <h3 class="text-sm font-bold leading-snug">${escapeQtktHtml(row.tenKyThuat || row.tenKyThuatTT23)}</h3>
              </div>
              <div class="text-right text-[10px] opacity-90">
                <div>${escapeQtktHtml(row.soQuyetDinh || 'QĐ-BYT')}</div>
                <div>${escapeQtktHtml(row.ngayBanHanh || '')}</div>
              </div>
            </div>
            <div class="flex flex-wrap gap-1 mt-2">${tags.join('')}</div>
          </header>
          <div class="p-4 space-y-3 text-sm">
            <section>
              <p class="text-[10px] font-bold uppercase text-emerald-700 mb-1">Chỉ định · ICD-10</p>
              <div class="flex flex-wrap mb-1">${renderQtktIcdChips(row.maICDChiDinh, row.tenBenhICDChiDinh, 'chi')}</div>
              <p class="text-xs text-slate-600 whitespace-pre-line">${escapeQtktHtml(row.chiDinh || '—')}</p>
            </section>
            <section>
              <p class="text-[10px] font-bold uppercase text-red-700 mb-1">Chống chỉ định · ICD-10</p>
              <div class="flex flex-wrap mb-1">${renderQtktIcdChips(row.maICDChongChiDinh, row.tenBenhICDChongChiDinh, 'chong')}</div>
              <p class="text-xs text-slate-600 whitespace-pre-line">${escapeQtktHtml(row.chongChiDinh || '—')}</p>
            </section>
            <section class="grid sm:grid-cols-2 gap-3">
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[10px] font-bold uppercase text-slate-500">Thời gian thực hiện</p>
                <p class="text-xs font-semibold text-slate-800 mt-1">${escapeQtktHtml(row.thoiGianThucHien || '—')}</p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-[10px] font-bold uppercase text-slate-500">Nhân sự / PVHN</p>
                <p class="text-xs text-slate-700 mt-1 whitespace-pre-line">${escapeQtktHtml(row.nhanSuThucHien || '—')}</p>
              </div>
            </section>
            <footer class="pt-2 border-t border-dashed border-amber-200 text-[10px] text-slate-500">
              <span class="font-semibold">${escapeQtktHtml(row.chuyenKhoa || '')}</span>
              · ${escapeQtktHtml(row.tenTaiLieu || row.tenFileNguon || '')}
            </footer>
          </div>
        </article>`;
    }

    function getQtktTableWrap() {
      const body = document.getElementById('tableBody');
      return body ? body.closest('.overflow-x-auto') : null;
    }

    function renderQtktInfographicView(rows) {
      const host = document.getElementById('qtktInfographicHost');
      const tableWrap = getQtktTableWrap();
      if (!host) return;
      if (tableWrap) tableWrap.classList.add('hidden');
      host.classList.remove('hidden');
      if (!rows.length) {
        host.innerHTML = '<div class="text-center text-slate-500 py-16">Không có quy trình phù hợp bộ lọc.</div>';
        return;
      }
      host.innerHTML = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${rows.map(renderQtktInfographicCard).join('')}</div>`;
    }

    function ensureQtktInfographicHost() {
      const panel = document.getElementById('dvktDataPanel');
      if (!panel || document.getElementById('qtktInfographicHost')) return;
      const div = document.createElement('div');
      div.id = 'qtktInfographicHost';
      div.className = 'hidden';
      const tableWrap = getQtktTableWrap();
      if (tableWrap) tableWrap.insertAdjacentElement('afterend', div);
      else panel.appendChild(div);
    }

    function renderQtktTableView() {
      const host = document.getElementById('qtktInfographicHost');
      const tableWrap = getQtktTableWrap();
      if (host) host.classList.add('hidden');
      if (tableWrap) tableWrap.classList.remove('hidden');
    }

    function renderQtktMappingBadges(item) {
      const parts = [];
      if (item.lienKetQD7603) {
        parts.push(`<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200" title="QĐ7603">7603 ${escapeQtktHtml(item.maTT43 || item.lienKetQD7603)}</span>`);
      }
      if (item.lienKetTT23) {
        parts.push(`<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200" title="TT23">TT23 ${escapeQtktHtml(item.lienKetTT23)}</span>`);
      }
      if (item.doTinCayMapping) {
        const cls = item.doTinCayMapping === 'Cao' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800';
        parts.push(`<span class="px-2 py-0.5 text-[10px] font-semibold rounded ${cls}">${escapeQtktHtml(item.doTinCayMapping)}</span>`);
      }
      return parts.length ? parts.join(' ') : '—';
    }
