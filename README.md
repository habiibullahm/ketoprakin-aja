# Ketoprakin Aja - Aplikasi Warung Ketoprak Mas Edo

Platform pemesanan digital untuk Warung Ketoprak Mas Edo. Frontend-only implementation menggunakan React, TypeScript, Tailwind CSS, dan shadcn/ui.

## 🚀 Quick Start

```bash
cd /home/ubuntu/projects/ketoprakin-aja
npm install
npm run dev
```

Buka browser di `http://localhost:5173`

## 📱 Features

### Customer (Pelanggan)
- **Menu & Kustomisasi:** Pilih menu ketoprak, atur level pedas (0-20), bawang putih, kekentalan bumbu
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
src/
├── components/ui/      # shadcn components
├── pages/
│   ├── customer/       # Customer-facing pages
│   └── merchant/       # Merchant dashboard
├── data/               # Mock data
├── types/              # TypeScript types
└── lib/                # Utilities
```

## 📖 Documentation

- [PRD](docs/PRD.md) - Product Requirements Document
- [Tech Stack](docs/TECH_STACK.md) - Architecture & implementation details

## 🎨 Design

- **Primary Color:** Green (tema ketoprak)
- **Responsive:** Mobile-first design
- **Theme:** Light/Dark mode support

## 🚧 Status

**Frontend-only** - Semua data menggunakan mock. Untuk production, perlu:
- Backend API (Node.js/Express/Next.js)
- Database (PostgreSQL/MongoDB)
- Payment gateway integration
- Real-time updates (WebSocket)
- Authentication system

## 📄 License

MIT
