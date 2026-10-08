/**
 * KEYNEX Booking Form Controller
 * Room Availability Checking, Booking ID & 6-Digit PIN Generation, Receipt Modal
 */

document.addEventListener('DOMContentLoaded', async () => {
  await KEYNEXStore.init();
  initBookingForm();
  populateRoomOptions();
  populateDefaultDate();
});

function populateRoomOptions() {
  const roomSelect = document.getElementById('ruangan');
  if (!roomSelect) return;

  const rooms = KEYNEXStore.getRooms();
  roomSelect.innerHTML = `<option value="">-- Pilih Ruangan --</option>` +
    rooms.map(r => `<option value="${r.kode}">${r.nama} (Slot ${String(r.slot).padStart(2,'0')}) - Kapasitas ${r.kapasitas}</option>`).join('');
}

function populateDefaultDate() {
  const dateInput = document.getElementById('tanggal');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

function initBookingForm() {
  const form = document.getElementById('booking-form');
  const checkBtn = document.getElementById('check-avail-btn');
  const submitBtn = document.getElementById('submit-booking-btn');
  const checkResultMsg = document.getElementById('check-result-msg');

  if (!form) return;

  let isVerifiedAvailable = false;

  // Check Availability Action
  if (checkBtn) {
    checkBtn.addEventListener('click', () => {
      const room = document.getElementById('ruangan').value;
      const date = document.getElementById('tanggal').value;
      const startTime = document.getElementById('jam_mulai').value;
      const endTime = document.getElementById('jam_selesai').value;

      if (!room || !date || !startTime || !endTime) {
        alert('Mohon lengkapi Ruangan, Tanggal, Jam Mulai, dan Jam Selesai untuk mengecek ketersediaan.');
        return;
      }

      const isAvailable = KEYNEXStore.checkAvailability(room, date, startTime, endTime);

      if (isAvailable) {
        checkResultMsg.innerHTML = `<div style="color:var(--accent-green); font-weight:700; font-size:14px; margin-top:10px;"><i class="fa-solid fa-circle-check"></i> Ruangan ${room} TERSEDIA pada jam tersebut! Silakan lanjutkan booking.</div>`;
        isVerifiedAvailable = true;
        if (submitBtn) submitBtn.disabled = false;
      } else {
        checkResultMsg.innerHTML = `<div style="color:var(--accent-red); font-weight:700; font-size:14px; margin-top:10px;"><i class="fa-solid fa-circle-xmark"></i> Ruangan sudah digunakan pada jam tersebut. Silakan pilih waktu/ruangan lain.</div>`;
        isVerifiedAvailable = false;
        if (submitBtn) submitBtn.disabled = true;
      }
    });
  }

  // Submit Booking Action
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nim = document.getElementById('nim').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const no_hp = document.getElementById('no_hp').value.trim();
    const kelas = document.getElementById('kelas').value.trim();
    const ruangan = document.getElementById('ruangan').value;
    const tanggal = document.getElementById('tanggal').value;
    const jam_mulai = document.getElementById('jam_mulai').value;
    const jam_selesai = document.getElementById('jam_selesai').value;
    const keperluan = document.getElementById('keperluan').value.trim();

    if (!isVerifiedAvailable) {
      const isAvailable = KEYNEXStore.checkAvailability(ruangan, tanggal, jam_mulai, jam_selesai);
      if (!isAvailable) {
        alert('Ruangan sudah digunakan pada jam tersebut.');
        return;
      }
    }

    // Generate Booking ID: BK-YYYYMMDD-XXX
    const dateFormatted = tanggal.replace(/-/g, '');
    const randomSeq = String(Math.floor(Math.random() * 900) + 100);
    const booking_id = `BK-${dateFormatted}-${randomSeq}`;

    // Generate 6-Digit Random PIN (e.g. 482951)
    const pin = String(Math.floor(100000 + Math.random() * 900000));

    const newBooking = {
      booking_id,
      nim,
      nama,
      no_hp,
      kelas,
      ruangan,
      tanggal,
      jam_mulai,
      jam_selesai,
      pin,
      status: 'menunggu',
      keperluan
    };

    KEYNEXStore.createBooking(newBooking);

    // Show Receipt Modal
    showReceiptModal(newBooking);
    form.reset();
    populateDefaultDate();
    isVerifiedAvailable = false;
    if (checkResultMsg) checkResultMsg.innerHTML = '';
  });
}

function showReceiptModal(booking) {
  const modal = document.getElementById('receipt-modal');
  if (!modal) return;

  document.getElementById('rc-id').textContent = booking.booking_id;
  document.getElementById('rc-nama').textContent = booking.nama;
  document.getElementById('rc-nim').textContent = booking.nim;
  document.getElementById('rc-kelas').textContent = booking.kelas;
  document.getElementById('rc-ruangan').textContent = booking.ruangan;
  document.getElementById('rc-jam').textContent = `${booking.jam_mulai} - ${booking.jam_selesai}`;
  document.getElementById('rc-pin').textContent = booking.pin;

  modal.classList.add('active');

  const closeBtn = document.getElementById('close-receipt-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('active');
    };
  }
}
