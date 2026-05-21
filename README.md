<div align="center">

# Aura Engine

### Enterprise Inventory Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=flat-square&logo=vercel)](https://aura-engine-khaki.vercel.app)

A full-stack logistics dashboard for managing **50,000+ SKUs** with real-time analytics, filtering, and CRUD — all in a dark, enterprise-grade UI.

**Live:** [aura-engine-khaki.vercel.app](https://aura-engine-khaki.vercel.app) &nbsp;|&nbsp; **API:** [aura-engine-2sso.onrender.com](https://aura-engine-2sso.onrender.com/health)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security](#security)
- [Performance](#performance)

---

## Features

- **Secure Login** — credentials from environment variables, session guard on all pages, back-button blocked after sign-out
- **Inventory Grid** — 50k SKUs with pagination, full-text search, category/price/stock filters, sortable columns
- **Analytics Dashboard** — KPI cards, restock-priority bar chart, category valuation pie chart
- **CRUD** — Add, Edit, Delete products via a validated modal
- **User Profile** — 5-tab profile page (Overview, Activity, Permissions, Preferences, Security)
- **Compact Table Mode** — shrinks inventory rows; preference saved in `localStorage`
- **CSV Export** — export the current filtered view in one click

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Vanilla CSS with custom dark design system |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Seeder | Faker.js |

---

## Project Structure

```
aura-engine/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Inventory CRUD + analytics aggregations
│   │   ├── models/             # Mongoose schemas & indexes
│   │   ├── routes/             # Express routers
│   │   └── middleware/         # Zod validation
│   └── seed.js                 # Seeds 50,000 products
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/          # Login page with auto-fill demo hint
        │   ├── analytics/      # Dashboard with charts & KPIs
        │   ├── inventory/      # Data grid with filters
        │   └── profile/        # User profile (5 tabs)
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── ProductModal.tsx
        │   ├── CustomSelect.tsx # Animated dropdown (replaces native select)
        │   └── Toast.tsx
        └── hooks/
            ├── useDebounce.ts
            ├── useAuthGuard.ts
            └── useCompactMode.ts
```

---

## Quick Start

### Prerequisites
- Node.js **18+**
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Set up environment variables

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/aura-engine
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_password
NEXT_PUBLIC_ADMIN_NAME=Your Name
NEXT_PUBLIC_ADMIN_ROLE=Administrator
```

### 3. Seed the database

```bash
cd backend
npm run seed
# Inserts 50,000 products — takes about 30–60 seconds
```

### 4. Run the app

```bash
# Terminal 1
cd backend && npm run dev     # → http://localhost:5000

# Terminal 2
cd frontend && npm run dev    # → http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** — you'll be redirected to the login page.

---

## Environment Variables

### `backend/.env`

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) |
| `PORT` | Server port (default: `5000`) |

### `frontend/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:5000`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Login email |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Login password |
| `NEXT_PUBLIC_ADMIN_NAME` | Name shown in the sidebar & profile |
| `NEXT_PUBLIC_ADMIN_ROLE` | Role shown in the sidebar & profile |

> **Note:** If either `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing, the login form disables itself and shows a warning. No credentials are ever hardcoded in the app.

---

## API Reference

**Base URL (local):** `http://localhost:5000`  
**Base URL (production):** `https://aura-engine-2sso.onrender.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/inventory` | Paginated, filtered, sorted product list |
| `GET` | `/api/inventory/:id` | Single product |
| `POST` | `/api/inventory` | Create product |
| `PUT` | `/api/inventory/:id` | Update product |
| `DELETE` | `/api/inventory/:id` | Delete product |
| `GET` | `/api/analytics` | KPIs + chart data |

### Query parameters for `GET /api/inventory`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: `1`) |
| `limit` | number | Items per page (default: `50`, max: `200`) |
| `search` | string | Search product name or SKU |
| `category` | string | Filter by category |
| `sort` | string | Field to sort by |
| `order` | string | `asc` or `desc` |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `maxStock` | number | Maximum stock quantity |

---

## Security

| Control | Detail |
|---------|--------|
| HTTP Headers | `helmet` — removes fingerprinting, sets security headers |
| Rate Limiting | 200 requests / 15 min per IP |
| CORS | Configured origin whitelist |
| Validation | Zod schema on all write endpoints (`price >= cost`, `stock >= 0`) |
| Session | `sessionStorage` — clears on tab close |
| Sign-out | `router.replace()` removes protected pages from browser history |

---

## Performance

| Optimization | Detail |
|-------------|--------|
| Full-text search | MongoDB compound text index on `productName` + `sku` |
| Parallel queries | `Promise.all([find(), countDocuments()])` |
| Aggregation | `allowDiskUse: true` on all analytics pipelines |
| Debounced search | 500ms — prevents API floods on keystrokes |
| Debounced sliders | 400ms — price & stock range filters |
| Page size cap | Server enforces `max 200` per page |
| Batch seeder | 500-doc batches, `ordered: false` — 50k records in ~30s |
