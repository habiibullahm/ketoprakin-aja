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

Jangan commit `backend/.env` atau connection string.

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

## Frontend Environment

Untuk dev, frontend memakai backend lokal secara eksplisit melalui `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Jika file ini tidak ada, client memakai fallback URL yang sama saat `import.meta.env.DEV` aktif. Restart Vite setelah mengubah env.

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

- Use a pooled Neon URL for normal API traffic where appropriate.
- Use a direct Neon URL for schema migration/admin operations when required by the migration tool.
- Set production `VITE_API_URL` and `VITE_SOCKET_URL` only when the backend is served from a public HTTPS origin. Same-origin proxying can leave them unset.
- Settlement remains simulation-only and does not create a permanent ledger entry.

## Documentation

- [PRD](docs/PRD.md)
- [Tech Stack](docs/TECH_STACK.md)

## License

MIT
