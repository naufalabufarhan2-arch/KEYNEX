/**
 * KEYNEX Data Store & State Manager
 * Dynamic LocalStorage synchronization with JSON initial seeds.
 */

const KEYNEXStore = {
  KEYS: {
    ROOMS: 'keynex_rooms',
    BOOKINGS: 'keynex_bookings',
    LOCKERS: 'keynex_lockers',
    ACTIVITY: 'keynex_activity',
    USERS: 'keynex_users'
  },

  async init() {
    try {
      if (!localStorage.getItem(this.KEYS.ROOMS)) {
        const res = await fetch('./data/rooms.json');
        const data = await res.json();
        localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(data));
      }

      if (!localStorage.getItem(this.KEYS.BOOKINGS)) {
        const res = await fetch('./data/bookings.json');
        const data = await res.json();
        localStorage.setItem(this.KEYS.BOOKINGS, JSON.stringify(data));
      }

      if (!localStorage.getItem(this.KEYS.LOCKERS)) {
        const res = await fetch('./data/lockers.json');
        const data = await res.json();
        localStorage.setItem(this.KEYS.LOCKERS, JSON.stringify(data));
      }

      if (!localStorage.getItem(this.KEYS.ACTIVITY)) {
        const res = await fetch('./data/activity.json');
        const data = await res.json();
        localStorage.setItem(this.KEYS.ACTIVITY, JSON.stringify(data));
      }

      if (!localStorage.getItem(this.KEYS.USERS)) {
        const res = await fetch('./data/users.json');
        const data = await res.json();
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(data));
      }

      this.checkOverdueBookings();
    } catch (err) {
      console.error('KEYNEX Store initialization error:', err);
    }
  },

  getRooms() {
    return JSON.parse(localStorage.getItem(this.KEYS.ROOMS) || '[]');
  },

  getBookings() {
    return JSON.parse(localStorage.getItem(this.KEYS.BOOKINGS) || '[]');
  },

  getLockers() {
    return JSON.parse(localStorage.getItem(this.KEYS.LOCKERS) || '[]');
  },

  getActivity() {
    return JSON.parse(localStorage.getItem(this.KEYS.ACTIVITY) || '[]');
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
  },

  saveRooms(rooms) {
    localStorage.setItem(this.KEYS.ROOMS, JSON.stringify(rooms));
  },

  saveBookings(bookings) {
    localStorage.setItem(this.KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  saveLockers(lockers) {
    localStorage.setItem(this.KEYS.LOCKERS, JSON.stringify(lockers));
  },

  saveActivity(activity) {
    localStorage.setItem(this.KEYS.ACTIVITY, JSON.stringify(activity));
  },

  addActivity(type, message, details = {}) {
    const activityList = this.getActivity();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const newLog = {
      id: 'ACT-' + Date.now().toString().slice(-5),
      timestamp,
      type,
      message,
      ...details
    };

    activityList.unshift(newLog);
    if (activityList.length > 50) activityList.pop();
    this.saveActivity(activityList);
    return newLog;
  },

  // Check if room is available for given room code, date, and time range
  checkAvailability(roomCode, dateStr, startTime, endTime) {
    const bookings = this.getBookings();
    const reqStart = this.parseTimeString(startTime);
    const reqEnd = this.parseTimeString(endTime);

    const conflicts = bookings.filter(b => {
      if (b.ruangan !== roomCode || b.tanggal !== dateStr) return false;
      if (b.status === 'dibatalkan' || b.status === 'selesai') return false;

      const bStart = this.parseTimeString(b.jam_mulai);
      const bEnd = this.parseTimeString(b.jam_selesai);

      // Overlap condition: reqStart < bEnd && reqEnd > bStart
      return (reqStart < bEnd && reqEnd > bStart);
    });

    return conflicts.length === 0;
  },

  parseTimeString(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  createBooking(bookingData) {
    const bookings = this.getBookings();
    bookings.unshift(bookingData);
    this.saveBookings(bookings);

    // Update locker & room status if booking is for today
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingData.tanggal === todayStr) {
      this.syncRoomAndLockerStates();
    }

    this.addActivity('booking_success', `Booking baru ${bookingData.booking_id} (${bookingData.ruangan}) oleh ${bookingData.nama}`, {
      ruangan: bookingData.ruangan,
      nim: bookingData.nim,
      nama: bookingData.nama
    });

    return bookingData;
  },

  // Verify PIN on Kiosk Touchscreen & Unlock Solenoid
  verifyPinAndUnlock(pinCode) {
    const bookings = this.getBookings();
    const activeBooking = bookings.find(b => b.pin === pinCode && (b.status === 'menunggu' || b.status === 'sedang digunakan'));

    if (!activeBooking) {
      return { success: false, message: 'Kode PIN Tidak Valid atau Booking Tidak Ditemukan.' };
    }

    const lockers = this.getLockers();
    const rooms = this.getRooms();

    const room = rooms.find(r => r.kode === activeBooking.ruangan);
    const slotNum = room ? room.slot : 1;
    const locker = lockers.find(l => l.slot === slotNum);

    if (!locker) {
      return { success: false, message: 'Slot loker untuk ruangan tidak ditemukan.' };
    }

    // Solenoid driver triggers unlock
    locker.solenoid = true; 
    
    if (activeBooking.status === 'menunggu') {
      // User is picking up key
      activeBooking.status = 'sedang digunakan';
      locker.key_status = 'digunakan';
      locker.sensor = false; // key taken
      if (room) room.status = 'digunakan';

      this.addActivity('key_pickup', `PIN ${pinCode} terverifikasi. Solenoid Slot ${slotNum} Terbuka. Kunci ${activeBooking.ruangan} diambil.`, {
        ruangan: activeBooking.ruangan,
        nim: activeBooking.nim,
        nama: activeBooking.nama,
        slot: slotNum
      });
    }

    this.saveBookings(bookings);
    this.saveLockers(lockers);
    this.saveRooms(rooms);

    return {
      success: true,
      booking: activeBooking,
      slot: slotNum,
      message: `PIN BERHASIL! Solenoid Slot ${String(slotNum).padStart(2, '0')} Terbuka. Silakan Ambil Kunci.`
    };
  },

  // Simulate Key Return (Sensor reads key inserted back into slot)
  returnKeyBySlot(slotNum) {
    const lockers = this.getLockers();
    const rooms = this.getRooms();
    const bookings = this.getBookings();

    const locker = lockers.find(l => l.slot === slotNum);
    if (!locker) return false;

    const roomCode = locker.ruangan;
    const room = rooms.find(r => r.kode === roomCode);

    // Update locker hardware state
    locker.sensor = true; // Key inserted
    locker.solenoid = false; // Lock solenoid engaged
    locker.key_status = 'tersedia';

    if (room) {
      room.status = 'tersedia';
    }

    // Find active booking for this room and mark as selesai
    const activeBooking = bookings.find(b => b.ruangan === roomCode && (b.status === 'sedang digunakan' || b.status === 'terlambat'));
    if (activeBooking) {
      activeBooking.status = 'selesai';
    }

    this.saveLockers(lockers);
    this.saveRooms(rooms);
    this.saveBookings(bookings);

    this.addActivity('key_return', `Sensor mendeteksi kunci ${roomCode} di Slot ${String(slotNum).padStart(2,'0')}. Solenoid Mengunci. Status: TERSEDIA.`, {
      ruangan: roomCode,
      slot: slotNum
    });

    return true;
  },

  // Automatic overdue (TERLAMBAT) check
  checkOverdueBookings() {
    const bookings = this.getBookings();
    const rooms = this.getRooms();
    const lockers = this.getLockers();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let updated = false;

    bookings.forEach(b => {
      if (b.tanggal === todayStr && b.status === 'sedang digunakan') {
        const endMinutes = this.parseTimeString(b.jam_selesai);
        if (currentMinutes > endMinutes) {
          b.status = 'terlambat';
          b.minutes_late = currentMinutes - endMinutes;
          updated = true;

          this.addActivity('overdue_warning', `PERINGATAN TERLAMBAT! Ruang ${b.ruangan} dipinjam oleh ${b.nama} melebihi batas jam (${b.jam_selesai}).`, {
            ruangan: b.ruangan,
            nim: b.nim,
            nama: b.nama
          });
        }
      }
    });

    if (updated) {
      this.saveBookings(bookings);
    }
  },

  syncRoomAndLockerStates() {
    const rooms = this.getRooms();
    const bookings = this.getBookings();
    const lockers = this.getLockers();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    rooms.forEach(r => {
      const locker = lockers.find(l => l.slot === r.slot);
      const activeB = bookings.find(b => b.ruangan === r.kode && b.tanggal === todayStr && (b.status === 'sedang digunakan' || b.status === 'terlambat'));

      if (activeB) {
        r.status = 'digunakan';
        if (locker) {
          locker.key_status = 'digunakan';
          locker.sensor = false;
        }
      } else {
        const upcomingB = bookings.find(b => b.ruangan === r.kode && b.tanggal === todayStr && b.status === 'menunggu');
        if (upcomingB) {
          const startMin = this.parseTimeString(upcomingB.jam_mulai);
          if (startMin - currentMinutes <= 30 && startMin > currentMinutes) {
            r.status = 'akan_digunakan';
            if (locker) locker.key_status = 'akan_digunakan';
          }
        }
      }
    });

    this.saveRooms(rooms);
    this.saveLockers(lockers);
  }
};
