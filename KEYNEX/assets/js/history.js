/**
 * KEYNEX History Page Controller
 * Displays full booking history log with search, multi-filters, and PIN codes
 */

document.addEventListener('DOMContentLoaded', async () => {
  await KEYNEXStore.init();
  populateRoomFilterOptions();
  renderHistoryTable();
  initHistoryFilters();
});

let currentSearch = '';
let currentRoomFilter = 'all';
let currentDateFilter = '';
let currentStatusFilter = 'all';

function populateRoomFilterOptions() {
  const select = document.getElementById('filter-room-select');
  if (!select) return;

  const rooms = KEYNEXStore.getRooms();
  select.innerHTML = `<option value="all">Semua Ruangan</option>` +
    rooms.map(r => `<option value="${r.kode}">${r.nama}</option>`).join('');
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  const bookings = KEYNEXStore.getBookings();

  const filtered = bookings.filter(b => {
    const searchLower = currentSearch.toLowerCase();
    const matchesSearch = !currentSearch ||
      b.booking_id.toLowerCase().includes(searchLower) ||
      b.nim.toLowerCase().includes(searchLower) ||
      b.nama.toLowerCase().includes(searchLower) ||
      b.ruangan.toLowerCase().includes(searchLower);

    const matchesRoom = currentRoomFilter === 'all' || b.ruangan === currentRoomFilter;
    const matchesDate = !currentDateFilter || b.tanggal === currentDateFilter;
    const matchesStatus = currentStatusFilter === 'all' || b.status.toLowerCase() === currentStatusFilter.toLowerCase();

    return matchesSearch && matchesRoom && matchesDate && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 30px; color: var(--text-muted)">Tidak ada data riwayat peminjaman.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    let statusClass = b.status.replace(' ', '_');
    let statusLabel = b.status.toUpperCase();

    if (b.status === 'terlambat') {
      statusLabel = `TERLAMBAT (${b.minutes_late || 15}m)`;
    }

    return `
      <tr>
        <td><span class="booking-code">${b.booking_id}</span></td>
        <td>${b.nim}</td>
        <td style="font-weight:700">${b.nama}</td>
        <td>${b.no_hp || '-'}</td>
        <td>${b.kelas}</td>
        <td><span style="font-weight:700; color:var(--accent-cyan)">${b.ruangan}</span></td>
        <td>${b.tanggal}</td>
        <td>${b.jam_mulai}</td>
        <td>${b.jam_selesai}</td>
        <td><span class="pin-code">${b.pin}</span></td>
        <td>
          <span class="status-badge ${statusClass}">
            <span class="status-dot ${statusClass}"></span> ${statusLabel}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function initHistoryFilters() {
  const searchInput = document.getElementById('history-search-input');
  const roomSelect = document.getElementById('filter-room-select');
  const dateInput = document.getElementById('filter-date-input');
  const statusSelect = document.getElementById('filter-status-select');
  const resetBtn = document.getElementById('reset-filters-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderHistoryTable();
    });
  }

  if (roomSelect) {
    roomSelect.addEventListener('change', (e) => {
      currentRoomFilter = e.target.value;
      renderHistoryTable();
    });
  }

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      currentDateFilter = e.target.value;
      renderHistoryTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      renderHistoryTable();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentSearch = '';
      currentRoomFilter = 'all';
      currentDateFilter = '';
      currentStatusFilter = 'all';

      if (searchInput) searchInput.value = '';
      if (roomSelect) roomSelect.value = 'all';
      if (dateInput) dateInput.value = '';
      if (statusSelect) statusSelect.value = 'all';

      renderHistoryTable();
    });
  }
}
