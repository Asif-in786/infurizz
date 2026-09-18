# INFURIZZ — Comprehensive Team Setup & Onboarding Guide

> **Official Tagline**: *"One Creator. Multiple Platforms. One Identity."*  
> **Long-Term Vision**: *"The intelligence layer between creators and brands."*  
> **Repository Target**: `master` / `main`

---

## Table of Contents
1. [What INFURIZZ Is](#1-what-infurizz-is)
2. [Current Architecture](#2-current-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository Structure](#4-repository-structure)
5. [Installation & Local Setup](#5-installation--local-setup)
6. [Environment Variables Configuration](#6-environment-variables-configuration)
7. [Supabase PostgreSQL Database Connection](#7-supabase-postgresql-database-connection)
8. [Prisma ORM & Client Generation](#8-prisma-orm--client-generation)
9. [Running the Development Server](#9-running-the-development-server)
10. [Running Lint](#10-running-lint)
11. [Running Production Build](#11-running-production-build)
12. [Running Test Suites](#12-running-test-suites)
13. [Authentication System](#13-authentication-system)
14. [Creator Flow](#14-creator-flow)
15. [Brand Flow](#15-brand-flow)
16. [Collaboration & Deal Desk Flow](#16-collaboration--deal-desk-flow)
17. [Social Integrations & Telemetry Architecture](#17-social-integrations--telemetry-architecture)
18. [Social Status: Real vs. Unavailable Connectors](#18-social-status-real-vs-unavailable-connectors)
19. [Important Safety & Security Rules](#19-important-safety--security-rules)
20. [Git & Branching Workflow](#20-git--branching-workflow)
21. [Completed Areas](#21-completed-areas)
22. [Intentionally Unimplemented Areas (Future Roadmap)](#22-intentionally-unimplemented-areas-future-roadmap)
23. [Known Limitations](#23-known-limitations)
24. [Performance Architecture & Latency Mitigations](#24-performance-architecture--latency-mitigations)
25. [Strict Anti-Fake Data Policy](#25-strict-anti-fake-data-policy)

---

## 1. What INFURIZZ Is
INFURIZZ is a production-grade creator-economy intelligence and collaboration platform. It unifies a creator's audience footprints across fragmented social platforms (Instagram, YouTube, X/Twitter, Facebook, LinkedIn, WhatsApp Channel) into a single verified identity and rate card, allowing verified brands to discover talent, propose structured sponsorship deals, negotiate deliverables, and manage collaboration lifecycles with real PostgreSQL persistence.

INFURIZZ is **NOT** a prototype and does **NOT** rely on mock data, fake metrics, or hardcoded profiles in production.

---

## 2. Current Architecture
INFURIZZ is built on a modern Next.js App Router architecture:
- **Presentation Layer**: React 19 Server Components (SSR) and Client Components with Tailwind CSS v4 styling.
- **API / Edge Layer**: Next.js Route Handlers (`src/app/api/*`) handling auth, onboarding, profile updates, deals, messages, and social syncing.
- **Data Access Layer**: Prisma ORM (v6.19) connecting to a hosted Supabase PostgreSQL cluster.
- **Connection Model**: Dual-URL PostgreSQL configuration:
  - `DATABASE_URL`: Connection pooler (port 6543) via PgBouncer for lightweight serverless and web traffic.
  - `DIRECT_URL`: Direct session connection (port 5432) for Prisma CLI schema pushes, migrations, and introspection.
- **State & Lifecycle**: Deterministic state machine managing collaboration lifecycle:
  `PENDING` $\rightarrow$ `ACCEPTED` / `REJECTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` / `CANCELLED`.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                       │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │   Creator Routes     │        │     Brand Routes      │  │
│  │  /creator/dashboard  │        │   /brand/dashboard    │  │
│  │  /creator/analytics  │        │   /brand/discover     │  │
│  │  /creator/profile    │        │   /brand/profile      │  │
│  │  /creator/collabs    │        │   /brand/collabs      │  │
│  │  /creator/messages   │        │   /brand/messages     │  │
│  └──────────┬───────────┘        └───────────┬───────────┘  │
│             │                                │              │
│             └────────────────┬───────────────┘              │
│                              ▼                              │
│                    Next.js API Handlers                     │
│                  /api/auth, /api/creators,                  │
│               /api/collaborations, /api/messages            │
│                              │                              │
│                              ▼                              │
│                      Prisma Client v6                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       DATABASE_URL (Port 6543)      DIRECT_URL (Port 5432)
        PgBouncer Pooler Mode         Direct PostgreSQL Mode
                │                             │
                └──────────────┬──────────────┘
                               ▼
                   Supabase PostgreSQL Cloud
```

---

## 3. Tech Stack
- **Framework**: Next.js 16.3.4 (with Turbopack bundler)
- **UI & Runtime**: React 19.2.8, React DOM 19.2.8
- **Database**: Supabase PostgreSQL 15+
- **ORM**: Prisma 6.19.3
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Validation**: Zod v4 schema enforcement
- **Icons**: Lucide React
- **Cryptography**: Node.js native `crypto.scrypt` password hashing (salt + key)
- **TypeScript**: TypeScript 5 with strict mode

---

## 4. Repository Structure
```
infurizz_v1/
├── .env.example                # Canonical template for all environment variables
├── .gitignore                  # Strict Git rules excluding secrets, databases & build artifacts
├── mcp_config.json             # Google Stitch MCP tooling configuration (token sanitized)
├── package.json                # Project dependencies and operational scripts
├── prisma/
│   ├── schema.prisma           # 11 PostgreSQL models, relations, enums and indexes
│   └── seed.ts                 # Seeding script (strictly protected against accidental prod runs)
├── public/                     # Static media and official INFURIZZ logo assets
│   ├── infurizz-logo.png
│   ├── infurizz-logo-badge.png
│   ├── infurizz-logo-cropped.png
│   └── infurizz-logo-transparent.png
├── scripts/                    # End-to-end verification, migration and audit suites
│   ├── clean_production_db.ts
│   ├── measure_timings.ts
│   ├── test_brand_journey.ts
│   ├── test_creator_journey.ts
│   ├── test_flows.ts
│   ├── test_hardened_flows.ts
│   ├── test_navigation_performance.ts
│   ├── test_production_audit.ts
│   └── verify_production_platform.ts
├── src/
│   ├── app/                    # Next.js App Router routes and API endpoints
│   │   ├── api/                # REST endpoints (/auth, /creators, /brands, /collaborations, etc.)
│   │   ├── brand/              # Brand dashboard, discovery, campaigns, collabs, deal desk
│   │   ├── creator/            # Creator dashboard, analytics, profile, channels, collabs
│   │   ├── login/              # Secure credential login page
│   │   ├── onboarding/         # Zero-state onboarding for creators & brands
│   │   ├── signup/             # Real user registration with role selection
│   │   ├── globals.css         # Global styling rules
│   │   ├── layout.tsx          # Root application layout
│   │   └── page.tsx            # Marketing landing page & identity showcase
│   ├── components/             # Modular UI components (common, creator, brand, ui)
│   ├── lib/
│   │   ├── analytics/          # Multi-platform audience aggregator
│   │   ├── auth/               # Session management & scrypt password hashing
│   │   ├── db/                 # Global Prisma client singleton
│   │   ├── env.ts              # Zod runtime environment validator
│   │   └── integrations/       # 6 social connectors with 3-state telemetry
│   └── types/                  # Shared TypeScript interfaces
└── TEAM_SETUP.md               # This onboarding document
```

---

## 5. Installation & Local Setup

### Step 1: Clone Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd infurizz_v1
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

Open `.env.local` and enter your Supabase PostgreSQL credentials provided by your project lead.

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Environment Variables Configuration

| Variable | Required | Description / Source |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | `"development"`, `"test"`, or `"production"` |
| `PORT` | Optional | Port number (default `3000`) |
| `APP_URL` | Yes | Canonical base URL (`http://localhost:3000` for local dev) |
| `DATABASE_URL` | **Yes** | Supabase PgBouncer pooler connection string (Port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | **Yes** | Supabase direct PostgreSQL connection string (Port 5432) |
| `NEXTAUTH_SECRET` | **Yes** | 32+ character random string for session tokens |
| `NEXTAUTH_URL` | Yes | Matching app URL (`http://localhost:3000`) |
| `ENABLE_MOCK_SOCIAL_DATA` | **Yes** | Strictly `"false"` for production. When `"false"`, connectors never fabricate data. |
| `STITCH_API_KEY` | Optional | Google Stitch API Bearer Token for Antigravity MCP tooling |
| `ALLOW_DEMO_SEED` | **Safety** | Keep `"false"` or unset to block accidental demo seeding |

---

## 7. Supabase PostgreSQL Database Connection
The Supabase PostgreSQL database is already structured with 11 relational models.

To obtain connection strings from Supabase:
1. Go to **Supabase Dashboard** $\rightarrow$ **Project Settings** $\rightarrow$ **Database**.
2. Under **Connection string**:
   - **Transaction Pooler (Port 6543)** $\rightarrow$ copy into `DATABASE_URL` and ensure `?pgbouncer=true` is appended.
   - **Direct Session (Port 5432)** $\rightarrow$ copy into `DIRECT_URL`.
3. Never commit `.env` or connection strings to GitHub.

---

## 8. Prisma ORM & Client Generation
- Schema file: [`prisma/schema.prisma`](file:///c:/Users/ABDUL%20ASIF%20BHELIM/infurizz_v1/prisma/schema.prisma).
- Check schema validity:
  ```bash
  npx prisma validate
  ```
- Generate TypeScript client:
  ```bash
  npx prisma generate
  ```
- Push schema updates (without running migrations):
  ```bash
  npx prisma db push
  ```
  > ⚠️ **CAUTION**: Never run `npx prisma migrate reset` against production, as it deletes data and triggers seeding.

---

## 9. Running the Development Server
```bash
npm run dev
```
The server runs with Turbopack on `http://localhost:3000`.

---

## 10. Running Lint
INFURIZZ enforces strict zero-warning, zero-error ESLint compliance:
```bash
npm run lint
```

---

## 11. Running Production Build
Verify that all 28 dynamic and static route segments compile cleanly:
```bash
npm run build
```

---

## 12. Running Test Suites
INFURIZZ includes comprehensive automated verification suites in `scripts/`:

```bash
# 1. Full Production Platform Verification (26 assertions covering DB, scrypt, deals & guardrails)
npx tsx scripts/verify_production_platform.ts

# 2. Navigation Performance & Demo Data Audit
npx tsx scripts/test_navigation_performance.ts

# 3. Database Audit
npx tsx scripts/test_production_audit.ts

# 4. Hardened Lifecycle Flows
npx tsx scripts/test_hardened_flows.ts
```

> **Testing Safety Rule**: The verification test suites (`verify_production_platform.ts` and `test_navigation_performance.ts`) create isolated temporary test records and clean up 100% of their test data upon completion, leaving 0 leftover rows in Supabase.

---

## 13. Authentication System
- **Registration**: Real user accounts created via `/signup` with role `CREATOR` or `BRAND`.
- **Password Encryption**: Handled in [`src/lib/auth/passwords.ts`](file:///c:/Users/ABDUL%20ASIF%20BHELIM/infurizz_v1/src/lib/auth/passwords.ts) using native `crypto.scrypt` with a cryptographically secure 16-byte salt:
  Format: `<hex_salt>:<hex_key>`.
- **Session Handling**: Stored in HTTP-only session cookie (`infurizz_user_id`).
- **Demo Switch / Shortcuts**: Completely removed. No fake 1-click demo logins.

---

## 14. Creator Flow
1. **Sign Up**: Register on `/signup` selecting `CREATOR`.
2. **Onboarding**: `/onboarding/creator` captures handle, display name, category, and bio.
   - *Starts with genuine 0 reach and 0 fake snapshots.*
3. **Dashboard**: `/creator/dashboard` shows live aggregated reach, connected channels, and inbound collaboration proposals.
4. **Channels**: `/creator/social-accounts` allows connecting social channels.
5. **Analytics**: `/creator/analytics` aggregates genuine impressions, engagement, and verified snapshots.
6. **Profile / Press Kit**: `/creator/profile` renders a clean public-facing editorial press kit.

---

## 15. Brand Flow
1. **Sign Up**: Register on `/signup` selecting `BRAND`.
2. **Onboarding**: `/onboarding/brand` captures company name, website, industry, and budget range.
   - *Starts with genuine 0 sample campaigns.*
3. **Dashboard**: `/brand/dashboard` displays active campaigns and sponsored talent roster.
4. **Discovery**: `/brand/discover` filters real registered creators by category, platform, and total reach.
5. **Campaign Management**: `/brand/campaigns` creates and tracks sponsorship budgets.

---

## 16. Collaboration & Deal Desk Flow
1. **Proposal**: Brand visits a creator profile or discovery card and clicks *"Propose Collaboration"*.
2. **Persistence**: Saved to Supabase `Collaboration` model with status `PENDING`.
   - Protected by `@@unique([brandId, creatorId, title])` to prevent accidental double-proposals.
3. **Notification**: Creator receives an in-app notification linking to the deal.
4. **Deal Desk**: Creator reviews deliverables and budget amount on `/creator/collaborations`.
5. **State Transition**: Creator can Accept (`ACCEPTED`) or Reject (`REJECTED`).
6. **Threaded Messaging**: An associated `Conversation` allows real-time deal negotiations on `/creator/messages` and `/brand/messages`.

---

## 17. Social Integrations & Telemetry Architecture
Social integrations are located in [`src/lib/integrations/connectors/`](file:///c:/Users/ABDUL%20ASIF%20BHELIM/infurizz_v1/src/lib/integrations/connectors/):
- `instagram.ts` (Instagram Graph API)
- `youtube.ts` (YouTube Data API v3)
- `x.ts` (X / Twitter API v2)
- `facebook.ts` (Meta Graph API)
- `linkedin.ts` (LinkedIn Community API)
- `whatsapp.ts` (WhatsApp Channel API)

Each connector implements the `SocialConnector` interface:
- `getStatus()`: Returns whether credentials are configured.
- `fetchMetrics()`: Queries external platform API.
- `verifyHandle()`: Confirms ownership.

---

## 18. Social Status: Real vs. Unavailable Connectors
- **Current Runtime Status**: Without live OAuth app credentials configured in `.env.local`, connectors report:
  `status: "UNCONFIGURED"` and `isConnected: false`.
- **UI Presentation**: The `/creator/social-accounts` page displays:
  - **Not Connected**: Clear status indicating API keys are required.
  - **Live Sync**: Disabled when unconfigured (throws informative error if forced).
- **Strict Rule**: Connectors will **NEVER** fabricate fake followers, fake engagement, or synthetic historical trajectories in production mode.

---

## 19. Important Safety & Security Rules
1. **NEVER commit `.env` or `.env.local`** to Git.
2. **NEVER hardcode API keys or database passwords** in source files.
3. **NEVER enable mock social data in production** (`ENABLE_MOCK_SOCIAL_DATA="false"`).
4. **NEVER reseed fake demo users** (Sarah Chen, Apex Audio, etc.).
5. **Always validate schema and types** before pushing (`npx prisma validate && npm run build`).

---

## 20. Git & Branching Workflow
- `master` / `main`: Production-ready, stable codebase.
- **Feature Branches**: All team work must be performed on feature branches:
  ```bash
  # Ensure you are on latest main
  git pull origin main

  # Create a dedicated branch
  git checkout -b feature/your-feature-name

  # Make changes, verify lint & build
  npm run lint
  npm run build

  # Stage and commit
  git add .
  git commit -m "feat: description of changes"

  # Push to GitHub
  git push -u origin feature/your-feature-name
  ```
- **Pull Requests**: Open a PR into `main` with a clear description and testing evidence.

---

## 21. Completed Areas
- [x] Full Next.js 16 + React 19 application structure
- [x] Supabase PostgreSQL connection & 11 relational Prisma models
- [x] Secure `crypto.scrypt` authentication & session cookies
- [x] Zero-state onboarding for creators and brands
- [x] Creator dashboard, analytics, channels, and profile
- [x] Brand overview, talent discovery, campaigns, and profile
- [x] In-platform collaboration proposals, state machine, and notifications
- [x] Deal Desk messaging with threaded conversations
- [x] Multi-platform audience aggregator
- [x] Root loading unmounts eliminated; optimized single-query server components
- [x] Zero demo data in production database

---

## 22. Intentionally Unimplemented Areas (Future Roadmap)
The following are long-term roadmap items and should **NOT** be built until prioritized:
1. **Creator DNA**: Vector embeddings and semantic clustering of content niches.
2. **Opportunity Engine**: Automated brand-to-creator opportunity recommendation algorithm.
3. **Compatibility Engine**: Algorithmic scoring evaluating audience overlap.
4. **Campaign Intelligence**: Predictive ROI forecasting.
5. **Creator Portfolio**: Public-facing embeddable media player widgets.
6. **Automated Stripe Payouts**: Escrow payments (currently agreed on-platform, settled via invoices).

---

## 23. Known Limitations
- **WAN Database Latency**: Supabase PostgreSQL is hosted in Seoul (`ap-northeast-2`). Single queries take ~600ms over WAN from India. Server pages use consolidated single-query Prisma fetches to keep latency low.
- **Third-Party Rate Limits**: Live social APIs have strict rate limits; periodic snapshot jobs should be throttled.

---

## 24. Performance Architecture & Latency Mitigations
- **No Full-Page Root Suspense**: Root `loading.tsx` has been removed to allow smooth React Transitions without blank screen flashes.
- **Single-Query Server Components**: Pages fetch authenticated profile data using `where: { userId }` with Prisma `include` rather than running sequential round trips.
- **Concurrent Client Fetching**: Client pages utilize `Promise.all` to fetch authentication and resources in parallel.
- **Navigation Bar Caching**: Auth and notification data in `CreatorNav` and `BrandNav` load on component mount rather than firing on every pathname change.

---

## 25. Strict Anti-Fake Data Policy
INFURIZZ is a genuine business product:
- **No Mock Profiles**: Never insert fake creators or brands into the database.
- **No Fabricated Followers**: If an account is not linked via verified OAuth/API, reach is strictly `0`.
- **No Synthesized History**: Audience snapshots reflect only genuine recorded sync points.
- **No Seeded Deal History**: Deal stats and revenue reflect only real agreements made on the platform.
