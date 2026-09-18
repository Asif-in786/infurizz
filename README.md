# INFURIZZ ⚡

> **Startup-Grade Platform Connecting Creators & Brands**

INFURIZZ allows multi-platform creators to aggregate follower reach and performance statistics from connected platforms into one unified creator profile, while enabling brands to discover vetted creators, inspect verified audience reach, and initiate collaboration proposals with direct in-platform messaging.

---

## 🏛️ System Architecture

INFURIZZ is engineered with a strict modular architecture separating frontend presentation, API route handlers, relational database models, authentication, pluggable social connectors, analytics aggregation, and future AI capabilities.

```
infurizz_v1/
├── prisma/
│   ├── schema.prisma            # Models: User (CREATOR/BRAND), Profiles, SocialAccounts, Collaborations, Messages
│   └── dev.db                   # Zero-dependency local SQLite database
├── src/
│   ├── app/                     # Next.js App Router (React 19, Server & Client Components)
│   │   ├── api/                 # REST / Route Handlers
│   │   │   ├── health/          # System health check (DB latency, environment, connectors)
│   │   │   ├── creators/        # Creator discovery & filter endpoints
│   │   │   ├── brands/          # Brand profile & campaign endpoints
│   │   │   └── integrations/    # Social connector status endpoints
│   │   ├── layout.tsx           # Global shell with dark theme & typography
│   │   ├── page.tsx             # Architectural foundation overview & aggregation preview
│   │   └── globals.css          # Tailwind CSS v4 design tokens
│   ├── components/              # Modular UI Component Architecture
│   │   ├── ui/                  # Reusable primitives (Button, Card, Badge, StatCard)
│   │   └── common/              # Global layout elements (Header, Footer)
│   ├── lib/                     # Core Business Logic & Infrastructure
│   │   ├── db/                  # Prisma ORM client singleton (connection-pool aware)
│   │   ├── env.ts               # Fail-fast Zod runtime environment variable validation
│   │   ├── integrations/        # Pluggable Social Connector Architecture (Adapter Pattern)
│   │   │   ├── types.ts         # SocialConnector interface & data contracts
│   │   │   ├── registry.ts      # Dynamic connector registry & provider lookup
│   │   │   ├── mock-data.ts     # Deterministic mock dataset (1.48M canonical reach example)
│   │   │   └── connectors/      # Instagram, YouTube, X, Facebook, LinkedIn, WhatsApp Channel
│   │   ├── analytics/           # Cross-platform audience & engagement aggregation engine
│   │   ├── auth/                # Auth provider contracts & session abstractions (CREATOR vs BRAND)
│   │   └── ai/                  # AI matching & audience quality analysis interfaces
│   └── types/                   # Domain TypeScript declarations (Creator, Brand, Collab, Metrics)
├── .env.example                 # Fully documented environment template
├── .gitignore                   # Production gitignore (protects secrets & db files)
├── tsconfig.json                # Strict TypeScript configuration
└── package.json                 # Dependencies and npm scripts
```

---

## 🧩 Core Architecture Concepts

### 1. Two First-Class User Types
- **CREATOR**: Connects social channels, tracks unified audience growth, manages collaboration offers.
- **BRAND**: Searches creator directory, filters by reach and engagement, sends direct collaboration proposals.

### 2. In-Platform Brand-to-Creator Communication
> **Critical Architectural Rule**: INFURIZZ does **NOT** scrape, monitor, or aggregate social media DMs.
> All brand-to-creator communication, negotiations, deliverables, and collaboration threads live **INSIDE INFURIZZ** via the dedicated `Message` and `Collaboration` models.

### 3. Pluggable Social Connector Pattern
Every social media network implements the `SocialConnector` adapter interface (`src/lib/integrations/types.ts`):

```typescript
export interface SocialConnector {
  readonly platform: SocialPlatform;
  readonly name: string;
  readonly isConfigured: boolean;

  getProfile(accountIdentifier: string): Promise<SocialProfileResult>;
  getMetrics(accountIdentifier: string): Promise<SocialMetricsResult>;
  syncAccount(creatorId: string, accountIdentifier: string): Promise<SocialSyncResult>;
}
```

New platforms (TikTok, Twitch, Threads, etc.) can be added by creating a new connector file in `src/lib/integrations/connectors/` and registering it in `src/lib/integrations/registry.ts` with zero changes to existing core business logic.

When API credentials are not set, connectors automatically fall back to clearly marked development/mock data without breaking development workflows.

### 4. Unified Audience Aggregation
The `AudienceAggregator` (`src/lib/analytics/aggregator.ts`) calculates:
- Combined follower count across all connected networks (e.g. 600K Instagram + 30K YouTube + 120K X + 250K Facebook + 80K LinkedIn + 400K WhatsApp Channel = **~1.48M Reach**).
- Weighted average engagement rate.
- Platform distribution percentages.

### 5. Type-Safe Environment Handling
Environment variables are strictly validated at application startup using Zod in `src/lib/env.ts`. Any missing or malformed configuration fails immediately with clear diagnostic error messages.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher (tested on Node.js v24.x)
- npm 9.x or higher

### Installation

1. Clone or navigate to the repository:
   ```bash
   cd infurizz_v1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open your browser:
   - Web App: [http://localhost:3000](http://localhost:3000)
   - API Health Check: [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - Integrations API: [http://localhost:3000/api/integrations](http://localhost:3000/api/integrations)
   - Prisma Studio (DB GUI): `npx prisma studio`

---

## 🛠️ Verification & Build Commands

- **Build Application:** `npm run build`
- **Lint Codebase:** `npm run lint`
- **Validate Prisma Schema:** `npx prisma validate`
- **View Database GUI:** `npx prisma studio`

---

## 🗺️ Next Milestones
1. Creator & Brand Authentication & Onboarding Flows.
2. Creator Social Connection OAuth linking wizard.
3. Brand Creator Discovery Catalog with interactive multi-attribute filters.
4. Collaboration Request Dispatcher & In-Platform Chat UI.
5. AI Creator-Brand Compatibility Scoring Integration.
