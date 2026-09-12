# Product Requirements Document (PRD): Aplikasi Warung Ketoprak Mas Edo

## 1. Meta Information
* **Project Name:** Ketoprakin Aja (Aplikasi Warung Ketoprak Mas Edo)
* **Document Version:** 1.1 (Updated with Financial Module)
* **Date:** September 2026

## 2. Product Overview
**Problem Statement:**
Warung Ketoprak Mas Edo menghadapi antrean panjang di jam sibuk, rawan kesalahan pesanan karena tingkat kustomisasi yang tinggi, dan belum memiliki pencatatan keuangan (laba/rugi) yang sistematis sehingga modal dan keuntungan sering tercampur.

**Product Vision:**
Membangun platform pemesanan digital (berbasis Web App/PWA) yang memudahkan pelanggan melakukan *pre-order* dan kustomisasi pesanan, sekaligus membantu Mas Edo mengelola antrean, operasional dapur, dan arus kas keuangan warung secara akurat.

## 3. Target Audience
1. **Pelanggan (Customer):** Karyawan kantor, mahasiswa, dan warga sekitar.
2. **Pemilik/Admin (Merchant - Mas Edo):** Pengelola warung.

## 4. Key Features & Requirements

### 4.1. Customer Application (Pelanggan)
| Feature | Description | Priority |
| :--- | :--- | :--- |
| **Kustomisasi "Ulekan"** | Memilih jumlah cabai (0-20), takaran bawang putih, kekentalan bumbu, dan topping. | High |
| **Sistem Order & Pick-Up** | Opsi *Dine-in* atau *Pick-up* dengan estimasi waktu. | High |
| **Pembayaran Digital** | Integrasi QRIS dan E-Wallet (GoPay, OVO, Dana). | High |
| **Live Order Tracking** | Status pesanan: "Menunggu" -> "Nguleg" -> "Siap Diambil". | Medium |
| **Loyalty Program** | Sistem stempel digital (Beli 10 porsi gratis 1 porsi). | Low |

### 4.2. Merchant Application (Mas Edo)
| Feature | Description | Priority |
| :--- | :--- | :--- |
| **Kitchen Display System (KDS)** | Layar daftar pesanan masuk dengan *highlight* instruksi khusus. | High |
| **Manajemen Stok** | Tombol on/off (toggle) jika stok bahan habis. | High |
| **Pencatatan Keuangan (Pemasukan & Pengeluaran)** | Input manual untuk belanja pasar harian (Bahan Baku, Gas, Plastik) dan otomatisasi pencatatan omzet harian. | High |
| **Laporan Laba/Rugi (Profit & Loss)** | Kalkulasi otomatis omzet harian/bulanan dikurangi pengeluaran operasional. Menampilkan margin keuntungan bersih. | High |
| **Pencairan Dana (Settlement)** | Penarikan saldo dari pembayaran digital ke rekening bank pribadi Mas Edo. | High |
| **Pencatatan Kasbon (Buku Utang)** | Buku utang digital sederhana untuk mencatat pelanggan tetap yang belum bayar. | Medium |

## 5. User Flow

### Customer Flow (Pick-up):
1. Scan QR Code atau buka *link* PWA.
2. Pilih menu, sesuaikan kustomisasi, dan pilih "Pick-Up".
3. Bayar via QRIS/E-Wallet (Uang masuk ke sistem).
4. Pantau *Live Tracking* dan ambil pesanan saat status "Siap Diambil".

### Merchant Flow (Operasional & Keuangan):
1. **Pagi (Persiapan):** Mas Edo input total pengeluaran belanja pasar di aplikasi.
2. **Siang (Operasional):** Menerima pesanan masuk di KDS, nguleg, dan menekan tombol "Selesai" untuk update status pelanggan.
3. **Malam (Tutup Warung):** Membuka menu Keuangan untuk melihat total laba bersih hari ini, lalu klik "Tarik Dana" (Settlement) ke rekening pribadi.

## 6. Non-Functional Requirements
* **Platform:** Progressive Web App (PWA) ringan untuk pelanggan (tanpa instalasi), Native/Web App untuk Merchant.
* **Performance:** *Load time* di bawah 3 detik agar lancar di koneksi seluler standar.
* **Reliability:** Server stabil dan *real-time sync* tanpa delay di jam sibuk makan siang (11.30 - 13.30).

## 7. Future Phase (Phase 2)
* Integrasi pengiriman *third-party* (GoSend/GrabExpress).
* *Broadcast* promo via WhatsApp Business API.
* Laporan pajak UMKM terotomatisasi.
