# Ketoprakin Aja - Tech Stack & Architecture

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (manual implementation)
- **Routing:** React Router DOM v7
- **Icons:** Lucide React

## Project Structure
```
src/
├── components/
│   └── ui/              # shadcn-style components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── data/
│   └── mock.ts          # Mock data (menu, orders, expenses, debts)
├── lib/
│   └── utils.ts         # Utility functions (cn helper)
├── pages/
│   ├── customer/
│   │   ├── CustomerMenu.tsx    # Menu & customization
│   │   └── OrderTracking.tsx   # Live order tracking
│   └── merchant/
│       ├── KitchenDisplay.tsx  # KDS for kitchen
│       ├── FinancialReport.tsx # P&L report
│       ├── StockManagement.tsx # Toggle menu availability
│       └── DebtBook.tsx        # Customer debt tracking
├── types/
│   └── index.ts         # TypeScript interfaces
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
└── index.css            # Tailwind + theme variables
```

## Features Implemented (Frontend Only)

### Customer Side
- ✅ Menu browsing with categories (ketoprak, minuman)
- ✅ Customization modal (spice level 0-20, garlic amount, sauce consistency)
- ✅ Shopping cart with quantity adjustment
- ✅ Order tracking with status steps (Menunggu → Nguleg → Siap Diambil)
- ✅ Payment method selection UI (QRIS, GoPay, OVO, Dana)

### Merchant Side
- ✅ Kitchen Display System (KDS) with real-time order cards
- ✅ Order status management (update workflow)
- ✅ Financial dashboard (daily revenue, expenses, profit)
- ✅ Expense input form (bahan baku, gas, plastik, lainnya)
- ✅ Settlement UI (withdraw funds)
- ✅ Stock management (toggle availability)
- ✅ Debt book (kasbon tracking)

## Routes
- `/` - Home page with navigation cards
- `/customer/menu` - Customer menu & ordering
- `/customer/tracking` - Order tracking
- `/merchant/kitchen` - Kitchen Display System
- `/merchant/financial` - Financial reports
- `/merchant/stock` - Stock management
- `/merchant/debt` - Debt book

## Design System
- **Primary Color:** Green (ketoprak theme) - oklch(0.65 0.18 140)
- **Theme:** Light/Dark mode support via CSS variables
- **Responsive:** Mobile-first design
- **Accessibility:** Focus states, semantic HTML

## Development
```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Next Steps (Backend Integration)
- Connect to real API for orders, payments, inventory
- Implement authentication for merchant
- Add real-time updates (WebSocket) for KDS
- Integrate payment gateway (Midtrans/Xendit)
- Add PWA manifest & service worker
- Implement loyalty program logic
