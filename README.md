# Ketoprakin Aja - Aplikasi Warung Ketoprak Mas Edo

Platform pemesanan digital untuk Warung Ketoprak Mas Edo, dengan frontend React dan backend API Hono.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Buka browser di `http://localhost:5173`. Untuk menjalankan API secara lokal, buka terminal lain lalu jalankan `cd backend`, `npm install`, dan `npm run dev`.

## 📱 Features

### Customer (Pelanggan)
- **Menu & Kustomisasi:** Pilih menu ketoprak, atur level pedas (0-20), bawang putih, kekentalan bumbu
- **Guest Checkout:** Pesan tanpa akun dengan nama dan nomor WhatsApp Indonesia
- **Order Tracking:** Pantau status pesanan real-time (Menunggu → Nguleg → Siap Diambil)
- **Pembayaran Digital:** UI untuk QRIS, GoPay, OVO, Dana

### Merchant (Mas Edo)
- **Kitchen Display System (KDS):** Layar pesanan masuk dengan instruksi khusus
- **Laporan Keuangan:** Omzet, pengeluaran, laba bersih harian
- **Manajemen Stok:** Toggle ketersediaan menu
- **Buku Kasbon:** Catat utang pelanggan

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** (build tool)
- **Tailwind CSS v4** (styling)
- **shadcn/ui** (component library)
- **React Router DOM** (routing)
- **Lucide React** (icons)

## 📂 Project Structure

```
frontend/                # React + Vite application
├── src/
│   ├── components/ui/  # shadcn components
│   ├── pages/          # Customer and merchant pages
│   ├── data/           # Mock data
│   ├── types/          # TypeScript types
│   └── lib/            # Utilities and API client
├── public/             # Static assets
└── package.json
backend/                 # Hono API and database code
├── src/
│   ├── routes/         # API endpoints
│   └── db/             # Drizzle schema and connection
└── package.json
```

## 📖 Documentation

- [PRD](docs/PRD.md) - Product Requirements Document
- [Tech Stack](docs/TECH_STACK.md) - Architecture & implementation details

## 🎨 Design

- **Primary Color:** Green (tema ketoprak)
- **Responsive:** Mobile-first design
- **Theme:** Light/Dark mode support

## 🚧 Status

Backend API, PostgreSQL, authentication, and Socket.IO support are included. Payment gateway integration remains to be completed for production.

### Production frontend configuration

For a separately hosted frontend such as Vercel, configure `VITE_API_URL` with the HTTPS API base ending in `/api` and `VITE_SOCKET_URL` with the HTTPS backend origin. The repository intentionally contains no HTTP rewrite to the VPS. The Docker deployment uses same-origin Nginx proxying and does not require these variables.

## 📄 License

MIT
