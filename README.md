# Arogya
### AI-Assisted Patient Case Taking

Arogya is a modern digital health case-taking and clinical triage platform designed for hospital MediKiosks and outpatient department (OPD) desks. It enables patients to describe their symptoms in everyday natural language, structures their complaints into standardized clinical attributes, runs deterministic safety screening, recommends clinical routing, and prepares physician-ready intake summaries before consultation.

---

## System Architecture

The project consists of two completely independent applications:

```
┌──────────────────────────┐          HTTP REST           ┌──────────────────────────┐
│         FRONTEND         │ ───────────────────────────> │         BACKEND          │
│   (Next.js App Router)   │ <─────────────────────────── │   (Express.js + Node)    │
│  http://localhost:3000   │                              │  http://localhost:5000   │
└──────────────────────────┘                              └────────────┬─────────────┘
                                                                       │
                                                       ┌───────────────┴───────────────┐
                                                       ▼                               ▼
                                            ┌────────────────────┐          ┌────────────────────┐
                                            │  MongoDB Database  │          │   Groq / AI LLM    │
                                            │    (Phase 3)       │          │     (Phase 4)      │
                                            └────────────────────┘          └────────────────────┘
```

- **Frontend (`frontend/`)**: Pure presentation, patient intake UI, provider clinical console, client-side state machine, and API communication layer (`src/lib/api/`).
- **Backend (`backend/`)**: Centralized REST API, session handling, database models, Groq AI extraction & summarization, deterministic safety engine, and clinical department question configurations.

---

## Directory Structure

```
Arogya/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── patient/            # Patient intake, kiosk, and history pages
│   │   │   ├── provider/           # Healthcare provider clinical console
│   │   │   ├── globals.css         # Healthcare design tokens
│   │   │   ├── layout.tsx          # Root layout & Arogya metadata
│   │   │   └── page.tsx            # SIH Demo Launchpad
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI primitives (Button, Card, Badge, Input)
│   │   │   ├── patient/            # 5-Step conversational intake components
│   │   │   ├── provider/           # Clinical dossier & triage table components
│   │   │   └── shared/             # Navbar, Footer, Spinner, EmptyState
│   │   ├── lib/
│   │   │   ├── api/                # Centralized backend HTTP client
│   │   │   └── mock/               # Patient demographic & case mock data
│   │   └── types/                  # Shared TypeScript interfaces
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/                 # Environment & DB configuration
│   │   ├── controllers/            # Request handlers (e.g. healthController)
│   │   ├── middleware/             # Error handling, auth & validation middleware
│   │   ├── models/                 # Mongoose database models (Phase 3)
│   │   ├── routes/                 # Express API routes (e.g. /api/health)
│   │   ├── services/               # Clinical business logic & Groq services
│   │   ├── utils/                  # Reusable utilities
│   │   └── server.ts               # Express server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Local Development Setup

### 1. Backend Service (`http://localhost:5000`)

```bash
cd backend
npm install
npm run dev
```

Check health status:
```bash
curl http://localhost:5000/api/health
# Response: {"success":true,"message":"Arogya backend is running"}
```

### 2. Frontend Application (`http://localhost:3000`)

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Ports & Communication

| Service | Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | Next.js Kiosk & Console UI |
| **Backend** | `5000` | Express REST API |

CORS is strictly configured on the backend to allow requests originating from `http://localhost:3000`.
