/**
 * KEYNEX Dashboard Controller
 * Realtime Stats, Hardware Status, Chart.js Visualizations, and Kiosk Simulator
 */

document.addEventListener('DOMContentLoaded', async () => {
  await KEYNEXStore.init();
  initClock();
  renderStats();
  renderSystemStatus();
  renderActiveRoomCards();
  renderActivityFeed();
  initCharts();
  initKioskModal();
});

// Realtime Clock & Date
function initClock() {
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');

  function update() {
    const now = new Date();
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
  }

  update();
  setInterval(update, 1000);
}

// Render Header Stats
function renderStats() {
  const rooms = KEYNEXStore.getRooms();
  const bookings = KEYNEXStore.getBookings();

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'tersedia').length;
  const occupiedRooms = rooms.filter(r => r.status === 'digunakan').length;
  const upcomingRooms = rooms.filter(r => r.status === 'akan_digunakan').length;
  const lateBookings = bookings.filter(b => b.status === 'terlambat').length;

  const totalEl = document.getElementById('stat-total');
  const availEl = document.getElementById('stat-available');
  const occEl = document.getElementById('stat-occupied');
  const upcEl = document.getElementById('stat-upcoming');
  const lateEl = document.getElementById('stat-late');

  if (totalEl) totalEl.textContent = totalRooms;
  if (availEl) availEl.textContent = availableRooms;
  if (occEl) occEl.textContent = occupiedRooms;
  if (upcEl) upcEl.textContent = upcomingRooms;
  if (lateEl) lateEl.textContent = lateBookings;
}

// System Hardware Status Indicator
function renderSystemStatus() {
  const container = document.getElementById('system-status-container');
  if (!container) return;

  const statuses = [
    { name: 'Kiosk KEYNEX', sub: 'Touchscreen Ready', icon: 'fa-desktop', status: 'Online', color: '#22C55E' },
    { name: 'Raspberry Pi 4', sub: 'IP: 192.168.1.105', icon: 'fa-microchip', status: 'Terhubung', color: '#22C55E' },
    { name: 'Solenoid Driver', sub: '16 Slot Active', icon: 'fa-lock', status: 'Standby', color: '#06B6D4' },
    { name: 'Sensor Kunci', sub: 'IR Photo-interrupter', icon: 'fa-bullseye', status: 'Normal', color: '#22C55E' }
  ];

  container.innerHTML = statuses.map(s => `
    <div class="system-status-card">
      <div class="system-info-left">
        <i class="fa-solid ${s.icon}"></i>
        <div>
          <div class="system-name">${s.name}</div>
          <div class="system-sub">${s.sub}</div>
        </div>
      </div>
      <div class="status-badge" style="background: rgba(255,255,255,0.05); color: ${s.color}; border: 1px solid ${s.color}">
        <span class="status-dot" style="background:${s.color}"></span> ${s.status}
      </div>
    </div>
  `).join('');
}

// Render Room Cards Grid on Dashboard
function renderActiveRoomCards() {
  const container = document.getElementById('dashboard-rooms-grid');
  if (!container) return;

  const rooms = KEYNEXStore.getRooms();
  const bookings = KEYNEXStore.getBookings();
  const lockers = KEYNEXStore.getLockers();

  container.innerHTML = rooms.map(room => {
    const locker = lockers.find(l => l.slot === room.slot);
    const activeBooking = bookings.find(b => b.ruangan === room.kode && (b.status === 'sedang digunakan' || b.status === 'terlambat'));
    
    let statusClass = room.status;
    let statusText = room.status.replace('_', ' ').toUpperCase();
    if (activeBooking && activeBooking.status === 'terlambat') {
      statusClass = 'terlambat';
      statusText = `TERLAMBAT (${activeBooking.minutes_late || 15}m)`;
    }

    let occupantHtml = '';
    if (activeBooking) {
      occupantHtml = `
        <div class="detail-row"><span class="detail-label">Peminjam:</span><span class="detail-val">${activeBooking.nama}</span></div>
        <div class="detail-row"><span class="detail-label">NIM:</span><span class="detail-val">${activeBooking.nim}</span></div>
        <div class="detail-row"><span class="detail-label">Kelas:</span><span class="detail-val">${activeBooking.kelas}</span></div>
        <div class="detail-row"><span class="detail-label">Sampai:</span><span class="detail-val" style="color:var(--accent-yellow)">${activeBooking.jam_selesai}</span></div>
      `;
    } else {
      occupantHtml = `
        <div class="detail-row"><span class="detail-label">Status Ruangan:</span><span class="detail-val" style="color:var(--accent-green)">Siap Digunakan</span></div>
        <div class="detail-row"><span class="detail-label">Kapasitas:</span><span class="detail-val">${room.kapasitas} Kursi</span></div>
        <div class="detail-row"><span class="detail-label">Lantai:</span><span class="detail-val">Lantai ${room.lantai}</span></div>
      `;
    }

    const keyTaken = locker ? !locker.sensor : false;
    const keyBadge = keyTaken
      ? `<span style="color:var(--accent-red)"><i class="fa-solid fa-key"></i> Diambil</span>`
      : `<span style="color:var(--accent-green)"><i class="fa-solid fa-key"></i> Tersedia di Slot ${String(room.slot).padStart(2,'0')}</span>`;

    return `
      <div class="room-card">
        <div class="room-header">
          <div class="room-title">${room.nama}</div>
          <span class="room-slot-tag">SLOT ${String(room.slot).padStart(2, '0')}</span>
        </div>
        <div class="status-badge ${statusClass}">
          <span class="status-dot ${statusClass}"></span> ${statusText}
        </div>
        <div class="room-details">
          ${occupantHtml}
        </div>
        <div class="room-footer">
          <span class="detail-label">Kunci:</span>
          <div class="key-indicator">${keyBadge}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Activity Log Feed
function renderActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  const logs = KEYNEXStore.getActivity().slice(0, 6);

  container.innerHTML = logs.map(log => {
    let icon = 'fa-info-circle';
    let iconColor = 'var(--accent-blue)';

    if (log.type === 'key_pickup') { icon = 'fa-key'; iconColor = 'var(--accent-yellow)'; }
    if (log.type === 'key_return') { icon = 'fa-check-circle'; iconColor = 'var(--accent-green)'; }
    if (log.type === 'booking_success') { icon = 'fa-calendar-plus'; iconColor = 'var(--accent-cyan)'; }
    if (log.type === 'overdue_warning') { icon = 'fa-exclamation-triangle'; iconColor = 'var(--accent-red)'; }

    return `
      <div style="display:flex; gap:14px; padding:12px 0; border-bottom:1px solid var(--border-light); align-items:flex-start;">
        <div style="width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:${iconColor}">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:600; color:var(--text-main);">${log.message}</div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${log.timestamp}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Chart.js Visualizations
function initCharts() {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
      datasets: [{
        label: 'Ruangan Digunakan',
        data: [2, 5, 8, 10, 7, 4, 1],
        backgroundColor: '#06B6D4',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94A3B8' } }
      },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
      }
    }
  });
}

// KIOSK HARDWARE SIMULATOR MODAL CONTROLLER
function initKioskModal() {
  const openBtn = document.getElementById('open-kiosk-btn');
  const modal = document.getElementById('kiosk-modal');
  const closeBtn = document.getElementById('close-kiosk-btn');
  const display = document.getElementById('kiosk-pin-display');
  const statusMsg = document.getElementById('kiosk-status-text');

  if (!modal) return;

  let enteredPin = '';

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      enteredPin = '';
      updateDisplay();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.target.dataset.val;

      if (val === 'clear') {
        enteredPin = '';
        statusMsg.textContent = 'MASUKKAN 6-DIGIT KODE ACCESS PIN';
        statusMsg.style.color = 'var(--text-muted)';
      } else if (val === 'submit') {
        if (enteredPin.length !== 6) {
          statusMsg.textContent = 'PIN HARUS 6 DIGIT!';
          statusMsg.style.color = 'var(--accent-red)';
          return;
        }

        const res = KEYNEXStore.verifyPinAndUnlock(enteredPin);
        if (res.success) {
          statusMsg.textContent = res.message;
          statusMsg.style.color = 'var(--accent-green)';
          display.textContent = 'OPEN!';

          setTimeout(() => {
            modal.classList.remove('active');
            renderStats();
            renderActiveRoomCards();
            renderActivityFeed();
          }, 2000);
        } else {
          statusMsg.textContent = res.message;
          statusMsg.style.color = 'var(--accent-red)';
        }
      } else {
        if (enteredPin.length < 6) {
          enteredPin += val;
        }
      }
      updateDisplay();
    });
  });

  function updateDisplay() {
    if (display) {
      display.textContent = enteredPin.padEnd(6, '•');
    }
  }
}
