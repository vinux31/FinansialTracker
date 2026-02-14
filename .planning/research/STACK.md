# Technology Stack

**Project:** Personal Finance Tracker
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1+ (App Router) | Full-stack React framework | Industry standard for modern web apps in 2026. App Router with Server Components reduces client-side JavaScript. Built-in API routes eliminate need for separate backend. Optimized for Vercel free hosting. React 19 canary features included. |
| React | 19+ | UI library | Stable React 19 with Server Components, React Compiler (auto-optimization), and new hooks. Next.js 16 uses React canary with all stable React 19 features. Powers declarative UI with minimal re-renders. |
| TypeScript | 5.5+ | Type safety | 78% adoption rate among React developers (2026). Essential for finance apps to prevent calculation errors. Catches bugs at compile time. Full Next.js integration with auto-generated types. |
| Tailwind CSS | 4.1+ | Styling framework | V4.1 offers 100x faster incremental builds. Utility-first approach perfect for rapid dashboard development. Excellent ecosystem with shadcn/ui. Standard choice in 2026. |

### Database & Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase PostgreSQL | Latest | Primary database | **Best free tier for personal projects**: 500 MB database, 5 GB bandwidth, 50K MAUs, 1 GB file storage. PostgreSQL provides ACID compliance critical for financial data integrity. Built-in auth, real-time subscriptions, RESTful API auto-generated. Better free tier than Vercel Postgres for data-heavy apps. |
| Prisma ORM | 7.2+ | Database client & migrations | TypeScript-first ORM with excellent DX. Version 7 is Rust-free (faster, more compatible). Auto-generated types prevent database-code mismatches. Works seamlessly with Supabase PostgreSQL. Built-in migration system. |

**Note on Free Hosting Database Choice:**
- **Supabase**: 500 MB database, free forever (projects pause after 7 days inactivity)
- **Vercel Postgres**: Tighter free tier limits, better for low-data apps
- **Recommendation**: Supabase for personal finance tracker due to more generous storage and built-in features

### Infrastructure & Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Latest | Hosting & deployment | Best-in-class Next.js hosting (same creators). **Free tier 2026**: 100 GB bandwidth/month, 1M edge requests, automatic HTTPS, preview deployments, 4 CPU hours, 360 GB-hrs provisioned memory. Zero-config deployment from Git. Perfect for Next.js App Router. |

### Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | Latest (@supabase/ssr) | User authentication | Integrated with Supabase database. Supports multiple providers (Google, GitHub, email/password). Server-side auth with @supabase/ssr package for Next.js App Router. Cookie-based sessions. Free tier includes 50K MAUs. More straightforward than Auth.js v5 for Supabase stack. |

### State Management
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Query | 5.x+ | Server state management | Handles ~80% of app's data in modern 2026 setups. Auto-caching, background refetching, optimistic updates for expense data. Standard for API data fetching. Use for all Supabase queries. |
| Zustand | 5.x+ | Client state management | Lightweight global state (theme, UI preferences, form state). 40%+ adoption in 2026, 30% YoY growth. Simple API, no boilerplate. Use for non-server state only. |

**Why not Redux?** Redux Toolkit usage down to ~10% in new projects (2026). Overkill for personal finance tracker. TanStack Query + Zustand covers all needs with less code.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | Latest | UI component library | Copy-paste accessible components (forms, dialogs, tables, charts). Built on Radix UI + Tailwind. You own the code, full customization. Perfect for finance dashboards. Use consistent CSS variables for theming. |
| Recharts | 2.x+ | Data visualization | React-first charting library. Simple declarative API for line/bar/pie charts. Ideal for spending trends and category breakdowns. Works well with Tailwind theming. Better DX than ApexCharts for simple finance dashboards. |
| Zod | 3.x+ | Schema validation | TypeScript-first validation. Perfect with React Hook Form for expense entry forms. Runtime type safety for user inputs. Infer TypeScript types from schemas with z.infer. Security: sanitize inputs to prevent XSS. |
| React Hook Form | 7.x+ | Form management | Minimal re-renders, excellent performance for quick expense logging. Native Zod integration via @hookform/resolvers. Standard for Next.js forms in 2026. |
| date-fns | 3.x+ | Date manipulation | Functional, tree-shakeable date library. Essential for grouping expenses by day/month/year. 200+ functions. Better TypeScript support than day.js. Recommended over day.js for comprehensive date operations. |
| clsx + tailwind-merge | Latest | Conditional styling | Safe className merging for Tailwind. Prevents style conflicts in dynamic components. Standard pattern in shadcn/ui. |

### Development & Testing Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit testing | 10-20x faster than Jest on large codebases. Perfect for Next.js + ESM. Use with @testing-library/react. Note: Async Server Components not yet supported (use E2E tests for those). |
| React Testing Library | Component testing | User-focused component tests. Standard testing approach in 2026. Works with Vitest. |
| ESLint | Code linting | Use Next.js recommended config (`next lint`) |
| Prettier | Code formatting | Consistent formatting across team |
| TypeScript strict mode | Type safety | Enable `strict: true` in tsconfig.json for finance data safety |

## Installation

```bash
# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest finance-tracker --typescript --tailwind --app --use-npm

# Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Database ORM
npm install @prisma/client
npm install -D prisma

# State management
npm install @tanstack/react-query zustand

# Form handling & validation
npm install zod react-hook-form @hookform/resolvers

# Data visualization
npm install recharts

# Date utilities
npm install date-fns

# Styling utilities
npm install clsx tailwind-merge

# UI components (shadcn/ui - installed via CLI)
npx shadcn@latest init
npx shadcn@latest add form button input card table select calendar

# Testing (dev dependencies)
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/dom
npm install -D eslint prettier
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix, SvelteKit | Next.js has best Vercel integration, largest ecosystem, mature Server Components. 2026 market leader for React full-stack. |
| Database | Supabase PostgreSQL | Vercel Postgres, MongoDB, SQLite | Supabase has best free tier (500 MB vs Vercel's tighter limits). MongoDB lacks ACID transactions needed for finance. SQLite poor for multi-user. |
| Hosting | Vercel | Netlify, Railway, Render | Vercel made Next.js, best optimization. Free tier generous (100 GB bandwidth). Netlify better for static sites only. Railway/Render require paid tier for databases. |
| State (server) | TanStack Query | Redux Toolkit, direct fetch | TanStack Query handles 80% of modern apps' server state. Redux overkill for personal project. Direct fetch lacks caching/refetching. |
| State (client) | Zustand | Redux Toolkit, Jotai | Zustand simplest API, 40% adoption. Redux Toolkit for enterprise only (5+ devs). Jotai similar to Zustand but smaller ecosystem. |
| Charts | Recharts | ApexCharts, Nivo, Victory | Recharts simplest for basic finance charts. ApexCharts complex API. Nivo overcomplicated. Victory less maintained. |
| Dates | date-fns | day.js, Luxon | date-fns more comprehensive (200+ functions). day.js smaller but less features. Luxon heavier bundle. |
| Auth | Supabase Auth | Auth.js v5, Clerk | Supabase Auth integrated with database. Auth.js v5 beta complex setup. Clerk paid for production features. |
| UI Components | shadcn/ui | MUI, Chakra UI, Ant Design | shadcn/ui copy-paste = full control. MUI/Chakra/Ant Design = package dependencies, harder customization. shadcn/ui dominant in 2026. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js Pages Router | Legacy pattern, no Server Components | Next.js App Router |
| MongoDB for finance data | No ACID guarantees, schema-less risks data integrity | PostgreSQL (Supabase) |
| Auth.js v4 (NextAuth v4) | Incompatible with App Router, requires hacks | Supabase Auth or Auth.js v5 |
| Moment.js | Deprecated since 2020, massive bundle size (67 KB) | date-fns (tree-shakeable) |
| Create React App | Unmaintained since 2023, no SSR | Next.js |
| Redux for small projects | Overkill, too much boilerplate | TanStack Query + Zustand |
| Client-side only auth | Insecure for financial data | Server-side auth (Supabase) |
| CSS-in-JS (Emotion, styled-components) | Performance overhead, React 19 compatibility issues | Tailwind CSS |
| Jest for new projects | Slower than Vitest, ESM issues | Vitest |

## Stack Patterns by Variant

**If building mobile-first version:**
- Consider React Native with Expo
- Use Expo Router (similar to Next.js App Router)
- Supabase works great with React Native
- SQLite acceptable for offline-first mobile

**If need offline-first:**
- Add PWA support via next-pwa
- TanStack Query has offline support built-in
- Supabase has offline-first libraries
- Sync to Postgres on reconnection

**If scaling beyond free tier:**
- Supabase Pro: $25/month (8 GB database, 250 GB bandwidth, daily backups)
- Add Supabase Edge Functions for complex operations
- Consider Vercel Pro if need more bandwidth ($20/month, 1 TB bandwidth)
- Use Supabase Realtime for live updates

**If adding bank integration:**
- Use Plaid API (industry standard for bank connections)
- Store tokens encrypted in PostgreSQL
- Use Next.js Server Actions for secure API calls
- Requires Plaid Launch ($5/month minimum)

## Free Hosting Strategy for Personal Finance Tracker

**Recommended Setup (100% Free):**
1. **Frontend + API**: Vercel Free (100 GB bandwidth, 1M edge requests)
2. **Database**: Supabase Free (500 MB, 5 GB bandwidth, pauses after 7 days inactivity)
3. **Authentication**: Supabase Auth (included, 50K MAUs)
4. **File Storage**: Supabase Storage (1 GB included)

**Free Tier Limitations to Consider:**
- Supabase projects pause after 7 days of inactivity (just visit to wake up)
- Vercel functions have 10-second timeout on free tier
- No daily backups on Supabase Free (manual exports recommended)
- 1-day log retention on Supabase Free

**When to Upgrade:**
- Supabase: When you hit 500 MB database or need daily backups → $25/month
- Vercel: When you exceed 100 GB bandwidth → $20/month
- For personal use, free tier should suffice indefinitely

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.1+ | React 19+, Node.js 18.18+ | Uses React canary with stable React 19 features |
| Prisma 7.2+ | TypeScript 5.5+, PostgreSQL 12+ | Rust-free version, faster builds |
| Supabase | PostgreSQL 15+ | Auto-managed, no version management needed |
| Tailwind CSS 4.1 | PostCSS 8+, Safari 16.4+, Chrome 111+ | Requires modern browsers (2023+) |
| React Hook Form 7 | React 18+, Zod 3+ | Use @hookform/resolvers for Zod integration |
| TanStack Query 5 | React 18+ | V5 stable, type-safe API |
| Vitest | Node.js 18+, Vite 5+ | ESM-first, doesn't support async Server Components yet |

## Confidence Assessment

| Technology | Confidence | Source |
|------------|-----------|---------|
| Next.js 16.1.6 | HIGH | Official Next.js docs (updated Feb 11, 2026) |
| React 19 | HIGH | Stable release, production-ready, integrated in Next.js 16 |
| Supabase | HIGH | Official docs, widely used for free hosting in 2026 |
| PostgreSQL | HIGH | Industry standard for finance apps, ACID compliance verified |
| Vercel Free Tier | HIGH | Official pricing page verified Feb 2026 |
| TanStack Query | HIGH | 80% adoption for server state (2026 surveys) |
| Zustand | HIGH | 40% adoption, 30% YoY growth (2026 npm trends) |
| Recharts | HIGH | Standard for React finance dashboards |
| shadcn/ui | HIGH | Dominant component library in 2026, extensive ecosystem |
| Vitest | HIGH | Officially recommended by Next.js for testing |
| date-fns | MEDIUM | Recommended over day.js but sources vary |
| Prisma 7.2 | HIGH | Latest stable, Rust-free version |

## Sources

**Official Documentation (HIGHEST confidence):**
- [Next.js 16.1.6 Docs](https://nextjs.org/docs) — Current stable version, App Router features
- [Supabase Pricing](https://supabase.com/pricing) — Free tier limits (500 MB, 5 GB bandwidth)
- [Vercel Pricing](https://vercel.com/pricing) — Free tier verified (100 GB bandwidth, 1M requests)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) — Official integration guide

**2026 Web Search Findings (MEDIUM-HIGH confidence):**
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/) — State management trends
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) — Redux 10%, Zustand 40%, TanStack Query 80%
- [Personal Finance App Stack 2026](https://www.amplework.com/blog/full-stack-development-for-creating-personal-finance-apps/) — Industry recommendations
- [Next.js Architecture 2026](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) — Server-first patterns
- [Top React Chart Libraries 2026](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries) — Recharts for finance dashboards
- [Zustand vs Redux 2026](https://www.bugragulculer.com/blog/good-bye-redux-how-react-query-and-zustand-re-wired-state-management-in-25) — Market adoption trends
- [shadcn/ui 2026](https://www.shadcn.io/) — Copy-paste component library
- [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest) — Official Next.js testing guide
- [TypeScript React Best Practices 2026](https://medium.com/@mernstackdevbykevin/typescript-with-react-best-practices-2026-78ce4546210b) — 78% adoption
- [Awesome Web Hosting 2026](https://github.com/iSoumyaDey/Awesome-Web-Hosting-2026) — Free tier comparison (Vercel, Netlify, Supabase)
- [Supabase Free Tier Guide](https://medium.com/@reliabledataengineering/making-the-most-of-supabases-free-tier-a-practical-guide-ef4817d84a26) — Limitations and best practices
- [React Hook Form + Zod 2026](https://practicaldev.online/blog/reactjs/react-hook-form-zod-validation-guide) — Form validation patterns
- [date-fns vs day.js](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries) — Date library comparison

**Key Insights from 2026 Research:**
- Next.js 16 is latest stable version (not 15.5)
- Supabase offers better free tier than Vercel Postgres for data-heavy personal projects
- TanStack Query + Zustand has replaced Redux in ~90% of new projects
- shadcn/ui is now the dominant React component library (copy-paste approach)
- Vitest is officially recommended by Next.js over Jest
- TypeScript adoption at 78% among React developers

---
*Stack research for: Personal Finance Tracker (Desktop Web App)*
*Researched: 2026-02-14*
*Overall Confidence: HIGH*
*Free Hosting Compatible: YES (Vercel + Supabase)*
