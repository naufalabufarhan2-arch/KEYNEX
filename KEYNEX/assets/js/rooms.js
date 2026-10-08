/**
 * KEYNEX Rooms Page Controller
 * Displays complete room occupancy grid with status filters & live search
 */

document.addEventListener('DOMContentLoaded', async () => {
  await KEYNEXStore.init();
  renderRoomsGrid();
  initFilters();
});

let currentFilter = 'all';
let currentSearch = '';

function renderRoomsGrid() {
  const container = document.getElementById('rooms-page-grid');
  if (!container) return;

  const rooms = KEYNEXStore.getRooms();
  const bookings = KEYNEXStore.getBookings();
  const lockers = KEYNEXStore.getLockers();

  const filtered = rooms.filter(room => {
    const matchesFilter = currentFilter === 'all' || room.status === currentFilter;
    const matchesSearch = room.kode.toLowerCase().includes(currentSearch.toLowerCase()) ||
                          room.nama.toLowerCase().includes(currentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted)">Tidak ada ruangan yang sesuai filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(room => {
    const locker = lockers.find(l => l.slot === room.slot);
    const activeBooking = bookings.find(b => b.ruangan === room.kode && (b.status === 'sedang digunakan' || b.status === 'terlambat'));

    let statusClass = room.status;
    let statusText = room.status.replace('_', ' ').toUpperCase();

    if (activeBooking && activeBooking.status === 'terlambat') {
      statusClass = 'terlambat';
      statusText = `TERLAMBAT (${activeBooking.minutes_late || 15} MENIT)`;
    }

    let occupantDetails = '';
    if (activeBooking) {
      occupantDetails = `
        <div class="detail-row"><span class="detail-label">Nama:</span><span class="detail-val">${activeBooking.nama}</span></div>
        <div class="detail-row"><span class="detail-label">NIM:</span><span class="detail-val">${activeBooking.nim}</span></div>
        <div class="detail-row"><span class="detail-label">Kelas:</span><span class="detail-val">${activeBooking.kelas}</span></div>
        <div class="detail-row"><span class="detail-label">Sampai:</span><span class="detail-val" style="color:var(--accent-yellow)">${activeBooking.jam_selesai}</span></div>
      `;
    } else {
      occupantDetails = `
        <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-val" style="color:var(--accent-green)">Tersedia</span></div>
        <div class="detail-row"><span class="detail-label">Kapasitas:</span><span class="detail-val">${room.kapasitas} Kursi</span></div>
        <div class="detail-row"><span class="detail-label">Lantai:</span><span class="detail-val">Lantai ${room.lantai}</span></div>
      `;
    }

    const isKeyTaken = locker ? !locker.sensor : false;
    const keyBadge = isKeyTaken
      ? `<span style="color:var(--accent-red)"><i class="fa-solid fa-key"></i> Diambil</span>`
      : `<span style="color:var(--accent-green)"><i class="fa-solid fa-key"></i> Tersedia</span>`;

    return `
      <div class="room-card">
        <div class="room-header">
          <div class="room-title">${room.nama}</div>
          <span class="room-slot-tag">SLOT ${String(room.slot).padStart(2,'0')}</span>
        </div>
        <div>
          <span class="status-badge ${statusClass}">
            <span class="status-dot ${statusClass}"></span> ${statusText}
          </span>
        </div>
        <div class="room-details">
          ${occupantDetails}
        </div>
        <div class="room-footer">
          <span class="detail-label">Kunci:</span>
          <div class="key-indicator">${keyBadge}</div>
        </div>
      </div>
    `;
  }).join('');
}

function initFilters() {
  const searchInput = document.getElementById('search-room-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderRoomsGrid();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderRoomsGrid();
    });
  });
}
