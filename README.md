# MedLink AI — Centralized Medicine Distribution and Intelligent Inventory Platform

MedLink AI connects verified medical stores, licensed pharmaceutical distributors, and platform administrators through a centralized medicine inventory, transaction-safe order fulfillment, explainable AI supplier recommendations, and demand forecasting with dynamic Safety Stock and Reorder Point (ROP) calculation.

---

## 1. System Architecture & Dedicated Dashboards

```text
Medi-Link-Project/
├── backend/                # Node.js, Express, TypeScript, Mongoose (MongoDB)
│   ├── src/
│   │   ├── models/         # 15 normalized Mongoose data models
│   │   ├── routes/         # Dedicated Auth & RBAC routes
│   │   ├── recommendationEngine.ts # Multi-factor ranking algorithm (Stock 40%, Price 25%, Reliability 20%, Speed 15%)
│   │   ├── mockData.ts     # Standby offline catalogue & distributor dataset
│   │   ├── firebaseAdmin.ts # Firebase Admin SDK initialization & token verifier
│   │   ├── db.ts           # MongoDB connection manager
│   │   └── index.ts        # Express REST API (Phase 4 & 5 endpoints)
│   ├── .env                # Port, JWT Secret, MongoDB URI, Firebase, AI Service URL
│   └── package.json
├── frontend/               # Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Portal Hub & Command Center (Modern Minimalist, No Gradients)
│   │   │   ├── login/page.tsx    # Dedicated Login & Registration Page (1-Click Demo & Credentials)
│   │   │   ├── store/page.tsx    # Dedicated Medical Store Dashboard (Catalogue, Orders, Stepper Tracking, Invoices)
│   │   │   ├── distributor/page.tsx # Dedicated Distributor Dashboard (Dispatch Pipeline, Batch Inventory, Stock Adjust)
│   │   │   ├── admin/page.tsx    # Dedicated Compliance Admin Dashboard (License Verification, Catalogue, Audit Logs)
│   │   │   └── ai-forecast/page.tsx # Dedicated AI Forecasting & Safety Stock Simulator
│   │   ├── components/
│   │   │   └── Header.tsx        # Shared Minimalist Topbar with session pill, quick switcher & API status
│   │   └── lib/
│   │       ├── auth.ts           # Centralized session storage & authentication helpers
│   │       └── firebase.ts       # Firebase Client SDK configuration
│   └── package.json
├── ai-service/             # Python FastAPI demand forecasting microservice
│   ├── main.py             # XGBoost/Baseline models & dynamic Safety Stock/ROP formulas
│   └── requirements.txt
└── README.md
```

---

## 2. Dedicated Dashboard Endpoints

| Portal Dashboard | Route | Role / Persona | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Command Portal Hub** | `/` | All Users | Executive platform telemetry, real-time statistics, active phase status |
| **Dedicated Login** | `/login` | Public / All | 1-Click instant demo roles, email/password JWT sign-in, pharmacy/distributor registration |
| **Medical Store** | `/store` | Retail Pharmacy (`Apollo Care Pharmacy`) | Drug catalogue search, multi-factor supplier comparison, live dispatch stepper, B2B tax invoices, AI reorder alerts |
| **Distributor** | `/distributor` | Logistics Partner (`MedVantage Logistics`) | Live fulfillment queue (Accept, Reject, Pack & Dispatch with AWB/courier), batch inwarding, stock adjustments |
| **Platform Compliance** | `/admin` | Administrator (`Compliance Officer`) | Drug License (Form 20B/21B) & GSTIN verification queue, master drug catalogue additions, immutable audit trail |
| **AI Demand Forecasting** | `/ai-forecast` | Operations & Analytics | 14-day projections, dynamic Safety Stock ($SS$) and Reorder Point ($ROP$) simulator, 1-click restock PO |

---

## 3. Pre-Configured Demo Credentials

| Role | User Email | Password | Organization / Entity | Drug License No. |
| :--- | :--- | :--- | :--- | :--- |
| **Medical Store** | `apollo.chemist@medlink.io` | `Password@123` | Apollo Care Pharmacy | `DL-2024-MH-APO8821` |
| **Distributor** | `medvantage.logistics@medlink.io` | `Password@123` | MedVantage Pharma Logistics | `WDL-2024-MVL-101` |
| **Administrator** | `admin@medlink.io` | `Admin@123` | MedLink Compliance Administrator | `REG-FDA-MH-2026` |

---

## 4. Modern Minimalist Design System (No Gradients)

The entire user interface strictly follows a modern, high-precision, flat minimalist design language:
- **No Gradients**: Zero color gradients (`from-...`, `to-...`, `bg-gradient-...`).
- **Monochrome & Solid Accents**: Crisp neutral backgrounds (`bg-slate-50`), clean white containers (`bg-white`), solid slate action buttons (`bg-slate-900`), and subtle solid semantic badges (Emerald for Pharmacy, Blue for Logistics, Amber for Pending, Rose for Critical).
- **Fine Borders & Micro-Elevation**: 1px subtle slate borders (`border-slate-200`) with clean `shadow-xs`.

---

## 5. Dual AI Engine Architecture (With AI or Without AI)

The forecasting and inventory recommendation engine operates under a fail-safe dual architecture:
1. **With AI Microservice**: When the Python FastAPI service (`http://localhost:8000`) is running, MedLink queries the XGBoost regression model.
2. **Without AI Microservice (Standby Active)**: If the Python service is offline, the backend seamlessly calculates projections using an internal statistical engine:
   - Safety Stock: $SS = \lceil Z \times \sigma \times \sqrt{L} \rceil$ where $Z = 1.65$ (95% Service Level) and $\sigma = 12.0$.
   - Reorder Point: $ROP = \lceil (D \times L) + SS \rceil$ where $D$ is average daily demand and $L$ is lead time in days.
   - Suggested Restock Quantity: $SuggestedRestock = \lceil (D \times 7) + SS \rceil$.
   - The platform never crashes or shows blank states when offline.

---

## 6. Implementation Lifecycle Summary

- [x] **Phase 1: Architecture & Core Foundation**: 15 Mongoose schemas, Express + TypeScript server, MongoDB connection, seed dataset.
- [x] **Phase 2: Authentication & Session Persistence**: Dedicated login screen, role-based access control, Firebase SDK configuration, session caching.
- [x] **Phase 3: Centralized Inventory & Catalogue**: Master medicine formulation additions, distributor batch inwarding, stock delta reconciliation.
- [x] **Phase 4: Order Lifecycle & Fulfillment Pipeline**: End-to-end ordering, state machine (Pending -> Confirmed -> Dispatched -> Delivered), courier partner assignment (Blue Dart, Delhivery), live AWB tracking stepper, and Form 20B/21B B2B tax invoices.
- [x] **Phase 5: Intelligent Demand Forecasting & Reorder Point**: 14-day projections, dynamic Safety Stock & ROP simulator, low stock alerts, and 1-click auto-restock purchase orders.
