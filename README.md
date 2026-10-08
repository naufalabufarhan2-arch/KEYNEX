# KEYNEX - Smart Key Management & Room Occupancy System

Website dashboard commercial-grade untuk sistem peminjaman ruangan dan pengelolaan kunci elektronik otomatis berbasis kode access PIN 6-digit.

Designed for direct hosting on **GitHub Pages** without any SQL database, PHP, or Node.js server.

---

## 🚀 Alur Kerja Sistem KEYNEX

```
Booking Website (HTML+CSS+JS) 
      ↓
Generate Data Booking & Kode PIN 6-Digit
      ↓
Data Tersimpan di Prototype / Browser Cache (JSON / LocalStorage)
      ↓
Pengguna Datang ke Kiosk Hardware KEYNEX
      ↓
Masukkan Kode PIN melalui Touchscreen Kiosk
      ↓
PIN Diverifikasi oleh System / Raspberry Pi
      ↓
Raspberry Pi Menentukan Slot Loker Kunci
      ↓
Solenoid Driver Aktif & Solenoid Lock Terbuka
      ↓
Pengguna Mengambil Kunci
      ↓
Sensor IR/Limit Switch membaca kunci telah diambil
      ↓
Status Ruangan Otomatis Menjadi: SEDANG DIGUNAKAN
      ↓
Pengembalian: Kunci dimasukkan kembali -> Sensor Mendeteksi -> Solenoid Mengunci -> Status: TERSEDIA
```

---

## 📁 Struktur Folder Project

```
KEYNEX/
│
├── index.html            # Dashboard Utama (Statistik, Status Alat, Kiosk Simulator, Chart.js)
├── dashboard.html        # Entry point alternative Dashboard
├── booking.html          # Form Peminjaman Ruangan, Cek Ketersediaan & Generate PIN Receipt
├── rooms.html            # Grid Status Okupansi Ruangan & Filter Status
├── lockers.html          # Matrix 16-Slot Loker Kunci, Testing Solenoid & Sensor Kunci
├── history.html          # Tabel Riwayat Peminjaman (Filter Ruangan, Tanggal, Status, Search)
│
├── assets/
│   ├── css/
│   │   └── style.css     # Dark Navy Commercial IoT Theme & Responsive Layout
│   ├── js/
│   │   ├── store.js      # Core Data Manager (JSON Loader & LocalStorage State Manager)
│   │   ├── dashboard.js  # Controller Dashboard, Realtime Clock, Kiosk PIN Simulator
│   │   ├── booking.js    # Form Validator, Check Availability & PIN Generator
│   │   ├── rooms.js      # Controller Visual Ruangan & Status Badges
│   │   ├── lockers.js    # Controller 16 Slot Loker & Hardware Toggle Simulation
│   │   └── history.js    # Controller Tabel Riwayat Peminjaman & Live Search
│   └── img/              # Asset Gambar & Logo
│
└── data/
    ├── users.json        # Data prototype mahasiswa/pengguna
    ├── rooms.json        # Data 12 ruangan kampus
    ├── bookings.json     # Data awal booking & status peminjaman
    ├── lockers.json      # Data 16 slot loker kunci & status hardware
    └── activity.json     # Log aktivitas sistem & log hardware
```

---

## 📤 1. Cara Upload Project ke GitHub

1. Buat Repository baru di GitHub:
   - Buka [GitHub](https://github.com/new)
   - Beri nama repository: `KEYNEX`
   - Pilih **Public**
   - Jangan centang "Initialize this repository with a README" (karena sudah ada README ini).

2. Buka terminal pada folder project `KEYNEX`, lalu jalankan perintah git berikut:

```bash
git init
git add .
git commit -m "Initial commit KEYNEX Smart Key Management System"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/KEYNEX.git
git push -u origin main
```

*(Ganti `USERNAME_ANDA` dengan username GitHub Anda)*.

---

## 🌐 2. Cara Mengaktifkan GitHub Pages

1. Masuk ke halaman repository **KEYNEX** di GitHub.
2. Klik tab **Settings** (Pengaturan).
3. Di menu sebelah kiri, pilih **Pages**.
4. Pada bagian **Build and deployment** -> **Source**:
   - Pilih **Deploy from a branch**.
   - Select Branch: **`main`** / Folder: **`/ (root)`**.
5. Klik **Save**.
6. Tunggu 1–2 menit, GitHub akan memberikan URL publik website Anda:
   `https://USERNAME_ANDA.github.io/KEYNEX/`

---

## 📝 3. Cara Mengubah Data JSON

File JSON berada di folder `data/`:

1. **Format Booking (`data/bookings.json`)**:
   ```json
   [
     {
       "booking_id": "BK-20261008-001",
       "nim": "4242401024",
       "nama": "Naufal Abu Farhan",
       "no_hp": "081234567890",
       "kelas": "TRE-PAGI A",
       "ruangan": "A-202",
       "tanggal": "2026-10-08",
       "jam_mulai": "13:00",
       "jam_selesai": "15:00",
       "pin": "482951",
       "status": "sedang digunakan",
       "keperluan": "Praktikum IoT & Embedded System"
     }
   ]
   ```

2. **Format Ruangan (`data/rooms.json`)**:
   ```json
   [
     {
       "id": 1,
       "kode": "A-201",
       "nama": "Ruang A-201",
       "slot": 1,
       "status": "tersedia",
       "kapasitas": 30
     }
   ]
   ```

3. **Format 16 Slot Loker (`data/lockers.json`)**:
   ```json
   [
     {
       "slot": 1,
       "ruangan": "A-201",
       "key_status": "tersedia",
       "sensor": true,
       "solenoid": false
     }
   ]
   ```

---

## 🔌 4. Cara Menghubungkan Sistem dengan Raspberry Pi

Untuk menghubungkan website ini dengan fisik Raspberry Pi & Solenoid Lock:

1. **Jalur Integrasi API (HTTP Fetch / Webhook)**:
   - Raspberry Pi dapat menjalankan script Python sederhana yang secara berkala mengambil data booking dari repository GitHub / Endpoint API (`data/bookings.json` atau REST Endpoint).
   - Ketika pengguna memasukkan PIN di Touchscreen Kiosk KEYNEX (atau layar fisik Raspberry Pi), script Python memverifikasi kode PIN 6-digit.

2. **Contoh Code Python pada Raspberry Pi (GPIO Solenoid & Sensor IR)**:

```python
import RPi.GPIO as GPIO
import time
import requests

# Set Pin Mode
GPIO.setmode(GPIO.BCM)

# Relay Solenoid Pin (Slot 02 -> Room A-202)
SOLENOID_PIN_SLOT2 = 17
# Sensor IR Kunci (High = Kunci ada, Low = Kunci diambil)
SENSOR_PIN_SLOT2 = 27

GPIO.setup(SOLENOID_PIN_SLOT2, GPIO.OUT)
GPIO.setup(SENSOR_PIN_SLOT2, GPIO.IN)

def unlock_solenoid(pin_slot):
    print("PIN Valid! Buka Solenoid Lock...")
    GPIO.output(pin_slot, GPIO.HIGH) # Solenoid terbuka
    time.sleep(5) # Buka selama 5 detik untuk pengambilan kunci
    GPIO.output(pin_slot, GPIO.LOW)  # Kunci kembali

def check_key_returned(sensor_pin):
    if GPIO.input(sensor_pin) == GPIO.HIGH:
        return True # Kunci ada di dalam slot
    return False

# Contoh eksekusi verifikasi PIN dari Touchscreen
user_pin_input = "482951"
# Verifikasi PIN dari data JSON / API
if user_pin_input == "482951":
    unlock_solenoid(SOLENOID_PIN_SLOT2)
```

---

## ⚡ Fitur Utama & Kepatuhan Spesifikasi

- ❌ **Tanpa SQL / MySQL / Database SQL**
- ❌ **Tanpa PHP / Node.js Server Lokal**
- ❌ **Tanpa RFID** (Gunakan 6-Digit PIN Akses)
- ✅ **GitHub Pages Ready** (Semua path menggunakan Relative Path)
- ✅ **16 Slot Visual Loker Kunci**
- ✅ **Deteksi Keterlambatan Otomatis** (Jam sekarang > Jam selesai)
- ✅ **Kiosk Touchscreen Simulator Modal**
