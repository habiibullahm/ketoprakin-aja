# Ketoprakin Aja - Warung Ketoprak Mas Edo

Aplikasi pemesanan digital dengan frontend React/Vite dan backend Hono/Drizzle. UI customer dan merchant mengikuti Paper design, sedangkan QRIS masih mock/non-scannable.

## Quick Start

### 1. Install dependency

```powershell
cd frontend
npm install
cd ..\backend
npm install
```

### 2. Configure backend

Buat `backend/.env` dari `backend/.env.example`, lalu isi connection string PostgreSQL/Neon:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=change-this-in-development
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
NOTIFICATION_PROVIDER=none
```

Jangan commit `backend/.env` atau connection string. Untuk lokal, gunakan PostgreSQL yang dapat diakses dari `DATABASE_URL`; untuk production, gunakan pooled Neon connection string.

### 3. Initialize database

```powershell
cd backend
npm run db:init
```

Perintah ini membuat schema dan seed akun merchant/menu default.

Default merchant:

```text
Email: masedo@ketoprakin.com
Password: password123
URL: http://localhost:5173/merchant/login
```

### 4. Run backend dan frontend

Terminal backend:

```powershell
cd backend
npm run dev
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Buka `http://localhost:5173`.
Backend health check: `http://localhost:3000/health`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL/Neon connection string. Gunakan pooled Neon URL untuk API production. |
| `JWT_SECRET` | Yes | Secret signing JWT; generate dengan `openssl rand -hex 32`. |
| `PORT` | No | Port API, default `3000`. |
| `NODE_ENV` | No | `development` atau `production`. |
| `CORS_ORIGIN` | Yes | Origin frontend yang diizinkan, misalnya `http://localhost:5173`. |
| `NOTIFICATION_PROVIDER` | No | Default `none`; notifikasi eksternal belum diperlukan. |

### Frontend (`frontend/.env`)

Untuk dev, frontend memakai backend lokal secara eksplisit melalui `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Jika file ini tidak ada, client memakai fallback URL yang sama saat `import.meta.env.DEV` aktif. Restart Vite setelah mengubah env. Untuk production dengan frontend dan API pada host yang sama, kedua variable frontend dapat dikosongkan karena client memakai `/api` dan `/socket.io` melalui proxy. Jika API berada di origin berbeda, isi dengan URL publik HTTPS API.

## Features

### Customer

- Paper mobile-first menu dengan hero, menu card, customization, cart, dan checkout.
- Customization cabai `0-20`, bawang, kekentalan bumbu, topping, pickup/dine-in.
- Order tracking dengan polling/socket existing.
- QRIS mock dengan label yang jelas; belum ada payment provider nyata.

Routes utama:

- `/`
- `/customer/login`
- `/customer/tracking`
- `/track/:trackingToken`

### Merchant

- Paper sidebar dan merchant shell.
- KDS: konfirmasi payment dan transisi order.
- Dashboard KPI dari `GET /api/merchant/dashboard`.
- Stok memakai toggle availability; schema belum menyimpan quantity inventory.
- Keuangan memakai dashboard dan CRUD expenses.
- Kasbon memakai CRUD debts.

Routes utama:

- `/merchant/login`
- `/merchant/kitchen`
- `/merchant/stock`
- `/merchant/financial`
- `/merchant/debt`

## Tech Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4, shadcn/ui, Lucide React
- Hono, Drizzle ORM, PostgreSQL/Neon
- Socket.IO, JWT, Zod

## Validation

```powershell
cd frontend
npm run build

cd ..\backend
npm run build
npm test
git diff --check
```

## Production Notes

- Production saat ini berjalan di VPS melalui Docker Compose:
  - Frontend: `http://43.157.227.176/`
  - Backend internal: `127.0.0.1:3000`
  - Health check: `http://43.157.227.176/health`
- Database production menggunakan Neon Serverless, bukan container PostgreSQL lokal.
- Root cause koneksi Neon dari container sebelumnya adalah resolver Node mencoba IPv6 sementara VPS hanya dapat keluar melalui IPv4. Backend sekarang memaksa IPv4 untuk koneksi Neon pooler, menonaktifkan prepared statements, dan memakai pool kecil dengan timeout.
- Jangan memakai `https://43.157.227.176/` sebelum SSL/domain dikonfigurasi.
- Deploy/update VPS:

```bash
git pull origin main
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f backend
```

- `db-init` menjalankan schema/seed terhadap `DATABASE_URL` yang ada di `.env` VPS. Pastikan URL tersebut menunjuk ke Neon sebelum menjalankan compose.
- Vercel frontend memakai root `vercel.json`, dengan build dari `frontend/`:

```text
Install: npm --prefix frontend ci
Build:   npm --prefix frontend run build
Output:  frontend/dist
```

- Deployment Vercel aktif: https://ketoprakin-k7qt9t3kh-habiibullahms-projects.vercel.app/
- Settlement remains simulation-only and does not create a permanent ledger entry.

## Documentation

- [PRD](docs/PRD.md)
- [Tech Stack](docs/TECH_STACK.md)

## License

MIT


