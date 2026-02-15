# Phase 3: Authentication & Multi-Device Sync - Research

**Researched:** 2026-02-15
**Domain:** User Authentication, Multi-Device Data Synchronization, Secure Per-User Data Isolation
**Confidence:** HIGH (verified with official docs and current implementations)

## Summary

Phase 3 requires integrating user authentication and enabling cross-device data synchronization. The recommended approach uses Supabase Auth for secure password-based authentication with email verification, combined with PostgreSQL Row-Level Security (RLS) for per-user data isolation. Supabase Realtime enables real-time synchronization across multiple devices through WebSocket connections listening to Postgres changes. Migration from localStorage to authenticated Supabase requires a staged approach: detect existing users, force authentication, lock new data entry during migration, and verify data transfer success. Next.js 16 requires middleware for secure token management, using cookie-based sessions (via @supabase/ssr) rather than localStorage to prevent XSS vulnerabilities.

**Primary recommendation:** Use Supabase Auth (email/password) with @supabase/ssr for cookie-based sessions, PostgreSQL RLS for data isolation, Supabase Realtime for multi-device sync, and implement a two-phase migration (new users to DB, existing users via bulk import + verification).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | Latest | Client SDK for auth and database access | Official Supabase client, designed for modern React/Next.js |
| @supabase/ssr | Latest | Server-side auth with cookie management | Enables secure SSR with Next.js, prevents token leakage |
| next | 16.1.6 | App framework with middleware support | Already in use, required for protected routes and middleware |
| zod | 4.3.6 | Schema validation for auth and data | Already in use, consistent with project validation approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date parsing and manipulation | Already in use, consistent for auth timestamps |
| @date-fns/tz | 1.4.1 | Timezone handling (Asia/Jakarta) | Already in use, required for consistent timestamps |
| crypto.subtle or jose | Latest | JWT verification on server | For advanced token validation if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | Auth0, Firebase Auth, NextAuth.js | Supabase integrates with PostgreSQL/RLS natively, reduces config; alternatives add extra layers |
| Cookie-based (@supabase/ssr) | localStorage (default @supabase/supabase-js) | Cookies are SSR-safe and XSS-resistant; localStorage simpler but vulnerable |
| PostgreSQL RLS | App-level authorization | RLS enforced at DB level (defense-in-depth); app-level can be bypassed if API compromised |
| Supabase Realtime | Polling or manual refresh | Realtime uses WebSockets (low-latency, real-time); polling causes UI lag and increased server load |

**Installation:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── middleware.ts                    # Token refresh & cookie management
│   ├── auth/
│   │   ├── signup/page.tsx             # New account creation
│   │   ├── login/page.tsx              # User login
│   │   └── callback/route.ts           # OAuth/magic link callback
│   ├── (dashboard)/                     # Protected routes group
│   │   ├── layout.tsx                  # User context provider
│   │   └── [other pages]               # Existing expense/income pages
│   └── layout.tsx                       # Root layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client
│   │   └── schema.ts                   # Zod schemas for DB validation
│   ├── db/
│   │   ├── migrations/                 # SQL migration files
│   │   └── rls-policies.sql            # RLS policy definitions
│   └── auth.ts                         # Auth utilities (login/logout/session)
├── types/
│   ├── index.ts                        # Existing types + Auth types
│   └── database.ts                     # PostgreSQL schema TypeScript types
└── middleware.ts                       # Token refresh (root level)
```

### Pattern 1: Secure Token Management (Next.js Middleware)

**What:** Middleware refreshes expired Auth tokens by calling `supabase.auth.getUser()`, stores refreshed tokens in cookies, and passes them to Server Components. This pattern prevents token leakage and ensures SSR compatibility.

**When to use:** Required for all Next.js 16 apps using Supabase Auth with Server Components.

**Example:**
```typescript
// middleware.ts (at root or src/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh token - this validates and updates the session
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)',
  ],
}
```
Source: [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Pattern 2: Per-User Data Isolation with RLS

**What:** Row-Level Security (RLS) enforces authorization rules at the PostgreSQL level. Every query automatically filters rows based on the authenticated user's ID. This creates an implicit WHERE clause that cannot be bypassed.

**When to use:** Required for all user-facing tables to prevent one user seeing another's data.

**Example:**
```sql
-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can insert only their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can update only their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can delete only their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Always index the user_id column for performance
CREATE INDEX transactions_user_id_idx ON transactions(user_id);
```
Source: [Supabase: Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pattern 3: Real-Time Multi-Device Sync

**What:** Supabase Realtime listens to Postgres WAL (Write-Ahead Log) changes via WebSocket. When data changes on one device, all connected clients receive instant notifications, triggering UI updates.

**When to use:** When you need live data synchronization across multiple devices without polling.

**Example:**
```typescript
// React Hook for subscribing to transaction changes
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Transaction } from '@/types'

export function useTransactionSync() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Initial load
    const loadTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })

      setTransactions(data || [])
    }

    loadTransactions()

    // Subscribe to changes
    const subscription = supabase
      .from('transactions')
      .on('*', (payload) => {
        // payload.eventType is 'INSERT', 'UPDATE', or 'DELETE'
        if (payload.eventType === 'INSERT') {
          setTransactions((prev) => [payload.new as Transaction, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTransactions((prev) =>
            prev.map((tx) => (tx.id === payload.new.id ? payload.new : tx))
          )
        } else if (payload.eventType === 'DELETE') {
          setTransactions((prev) => prev.filter((tx) => tx.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return transactions
}
```
Source: [Supabase: Realtime Documentation](https://supabase.com/docs/guides/realtime)

### Pattern 4: Authentication Flow (Signup/Login)

**What:** Email/password authentication using Supabase Auth with email verification. After signup, users receive a confirmation email. After login, an authenticated session is established with JWT tokens in cookies.

**When to use:** Primary authentication method for this phase.

**Example:**
```typescript
// lib/auth.ts - Authentication helpers
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
```
Source: [Supabase: Password-Based Auth Documentation](https://supabase.com/docs/guides/auth/passwords)

### Anti-Patterns to Avoid
- **Never use `getSession()` in server code:** It doesn't revalidate tokens. Always use `getUser()` in middleware/server actions to validate against Supabase Auth server.
- **Don't rely on localStorage for tokens:** Use cookie-based sessions (@supabase/ssr) to prevent XSS token theft.
- **Don't skip RLS on tables:** A single forgotten RLS policy exposes all users' data. RLS must be enabled on all public schema tables.
- **Don't index missing columns in RLS policies:** Missing indexes on `user_id` cause full table scans, killing performance.
- **Don't store sensitive data in JWT claims:** Keep claims minimal (user_id, email). Don't add password, phone, or personal details.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT token refresh logic | Custom refresh mechanism | @supabase/ssr with middleware | Handles edge cases (concurrent requests, expiration timing), prevents race conditions |
| Password hashing/validation | Custom crypto or bcrypt wrapper | Supabase Auth (uses argon2) | Industry-standard, automatically salted, resistant to timing attacks |
| Email verification | Custom email sending + verification token | Supabase Auth with email templates | Built-in email service with customizable templates, token management, rate limiting |
| Real-time sync engine | Custom WebSocket + state management | Supabase Realtime + react hooks | Complex CRDT/conflict resolution, connection recovery, browser compatibility |
| Per-user authorization | Custom middleware + query filtering | PostgreSQL RLS | Enforced at DB level, can't be bypassed, atomic with data operations |
| Session storage | Custom cookie serialization | @supabase/ssr helpers | Handles secure serialization, domain/path settings, same-site policies |

**Key insight:** Authentication, authorization, and real-time sync are deceptively complex domains with many subtle security and correctness issues. Hand-rolled solutions typically miss edge cases (token expiration during request, concurrent refreshes, XSS vectors, timezone bugs in validation). Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Relying on `getSession()` in Server Code
**What goes wrong:** Server code uses `supabase.auth.getSession()` to protect pages or API routes. An attacker with a spoofed cookie can access protected pages because `getSession()` doesn't revalidate the token with Supabase Auth server.

**Why it happens:** `getSession()` reads from cookies (which are client-controllable). It's designed for client-side use where the token was just verified during login. Developers often assume any authenticated cookie = valid user.

**How to avoid:** Always use `supabase.auth.getUser()` in server code (middleware, Server Components, Route Handlers). This makes an HTTP request to Supabase Auth, revalidating the JWT signature and expiration.

**Warning signs:** Page protection logic checks `session?.user` instead of calling `getUser()`. Middleware doesn't make any auth requests.

### Pitfall 2: Forgetting RLS on a Single Table
**What goes wrong:** All data in a table with RLS disabled is visible to all authenticated users. One misconfiguration = complete data breach. This happens gradually: initial tables get RLS, later someone adds a new table and forgets to enable it.

**Why it happens:** RLS is a per-table opt-in. PostgreSQL trusts the DBA to know which tables need it. Easy to miss during rapid iteration.

**How to avoid:**
1. Establish a convention: "All tables in public schema must have RLS enabled and at least one policy."
2. Write a SQL test that checks this:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
);
-- Should return empty result set
```
3. Add this check to your CI pipeline.

**Warning signs:** Postman/curl can fetch other users' data. Browser DevTools show API returning rows with other user_id values. New developer adds a table and forgets to add policies.

### Pitfall 3: Missing Indexes on RLS Policy Columns
**What goes wrong:** Queries are fast initially (small dataset). As data grows, RLS-filtered queries become slow because PostgreSQL scans the entire table to apply the policy. Eventually, queries timeout.

**Why it happens:** Developers add RLS policies but don't index the filter columns. Works fine at 100K rows, fails at 10M rows.

**How to avoid:** Every RLS policy that filters on a column must have an index on that column. For this app, that means:
```sql
CREATE INDEX transactions_user_id_idx ON transactions(user_id);
CREATE INDEX transactions_date_idx ON transactions(date);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
```

**Warning signs:** EXPLAIN ANALYZE shows "Seq Scan" instead of "Index Scan" on filtered queries. Response times increase non-linearly with data volume.

### Pitfall 4: Storing Tokens in localStorage
**What goes wrong:** XSS attack injects JavaScript that reads `localStorage.getItem('supabase.auth.token')` and sends it to attacker's server. Attacker now has the user's JWT and can impersonate them.

**Why it happens:** Default @supabase/supabase-js uses localStorage. It's convenient for simple apps. Developers think "our app is small, no one will hack it."

**How to avoid:** Use @supabase/ssr which stores tokens in HttpOnly cookies. These cannot be read by JavaScript (even malicious). Requires HTTPS in production but is worth it.

**Warning signs:** Auth tokens appear in `localStorage` when inspecting DevTools. App stores tokens in window.sessionStorage or window.localStorage. No `secure` or `httpOnly` flags on auth cookies.

### Pitfall 5: Insufficient Email Verification
**What goes wrong:** User signs up with `attacker@example.com` (typo for `defender@example.com`). The attacker now controls that account. Or: verification email is skipped in development, so the verification flow is never tested in production.

**Why it happens:** Email verification adds a step. Developers sometimes disable it for faster development and forget to re-enable it.

**How to avoid:**
1. In Supabase dashboard, confirm email verification is mandatory.
2. In development, use Mailpit (local email testing) to verify the full flow.
3. Test with multiple email addresses to catch typos.

**Warning signs:** Sign-up accepts emails instantly without confirmation. Email templates are uncustomized or broken. Verification doesn't work in production.

### Pitfall 6: Data Loss During Migration
**What goes wrong:** User has 500 transactions in localStorage. Migration script runs, but crashes halfway. New data is partially in Supabase, partially in localStorage. User doesn't know which is the source of truth. Attempts to re-run migration duplicate data.

**Why it happens:** localStorage-to-Supabase migration is transactional on the DB side but not on the app side. Developers assume "if the DB write succeeds, we're good," but don't account for app state, network failures, or multiple devices.

**How to avoid:**
1. **Lock the app during migration:** Prevent new data entry while migrating. Users see "Migrating your data..." message.
2. **Verify before clearing localStorage:**
```typescript
async function migrateUserData() {
  const localTxs = getTransactions() // from localStorage

  // Insert all at once
  const { error, data } = await supabase
    .from('transactions')
    .insert(localTxs)

  if (error) {
    console.error('Migration failed:', error)
    throw new Error('Could not migrate data. Please try again.')
  }

  // Verify count matches
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)

  if (count !== localTxs.length) {
    throw new Error('Verification failed: not all data was migrated')
  }

  // Only after verification, clear localStorage
  localStorage.removeItem('finance-tracker-transactions')
}
```

3. **Test on staging with real data:** Simulate various network failures during migration.

**Warning signs:** No verification step after DB insert. localStorage is cleared before verifying Supabase has the data. App doesn't show user a "migration in progress" state.

## Code Examples

Verified patterns from official sources:

### Setting Up Supabase Client (Browser and Server)

```typescript
// lib/supabase/client.ts - Browser client
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

```typescript
// lib/supabase/server.ts - Server client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle errors in server context
          }
        },
      },
    }
  )
}
```
Source: [Supabase: Creating a Supabase Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

### Schema Validation with Zod for Database Types

```typescript
// lib/supabase/schema.ts
import { z } from 'zod'
import { CATEGORIES } from '@/types'

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['expense', 'income']),
  amount: z.number().int().positive(),
  category: z.enum(CATEGORIES as [string, ...string[]]).or(z.literal('Income')),
  notes: z.string(),
  date: z.string().date(),
  timestamp: z.string().datetime(),
  created_at: z.string().datetime(),
})

export type Transaction = z.infer<typeof TransactionSchema>

// Use during migration to validate data
export async function validateAndInsert(transactions: unknown[]) {
  const validated = z.array(TransactionSchema).safeParse(transactions)

  if (!validated.success) {
    console.error('Validation errors:', validated.error.flatten())
    throw new Error('Invalid transaction data')
  }

  // Now we know data is safe to insert
  return validated.data
}
```

### Protected Page (Server Component with RLS)

```typescript
// app/(dashboard)/layout.tsx
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // Always use getUser() in server code, never getSession()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <div>
      <p>Welcome, {data.user.email}</p>
      {children}
    </div>
  )
}
```
Source: [Supabase: Build a User Management App with Next.js](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for auth tokens | Cookie-based sessions (@supabase/ssr) | 2023-2024 | XSS protection, SSR support, better security posture |
| Manual token refresh in useEffect | Middleware-based token refresh | 2023-2024 | Centralized, prevents race conditions, scales better |
| App-level authorization (WHERE clauses) | PostgreSQL RLS policies | Always, but gaining adoption | Enforced at DB level, can't be bypassed, defense-in-depth |
| Polling for data changes | Supabase Realtime WebSockets | 2022-ongoing | Low-latency (under 100ms), no server load from polling, real user experience |
| Custom JWT verification | Supabase Auth with native JWT support | Always | Supabase uses standard JWTs, clients can verify with public keys if needed |

**Deprecated/outdated:**
- **@supabase/auth-helpers-nextjs:** Replaced by @supabase/ssr (2023). Use ssr for new projects; auth-helpers still works but lacks improvements.
- **Implicit Flow for SSR:** Use PKCE Flow with @supabase/ssr for Next.js 16+. PKCE is more secure and handles server-side rendering properly.
- **`@supabase/supabase-js` for SSR:** This still works for client-side but requires custom cookie handling. Use @supabase/ssr to avoid boilerplate.

## Open Questions

1. **Data Migration Strategy for Existing Users**
   - What we know: Supabase recommends locking the app during migration, validating data transfer, then clearing localStorage.
   - What's unclear: How to handle concurrent writes if user opens app on multiple devices during migration. How long should migration take? What if user has 100K transactions?
   - Recommendation: Implement a staging approach: (1) Detect existing users with localStorage data, (2) Force them to log in, (3) Show "Migrating..." screen, (4) Insert all data in one batch, (5) Verify count matches, (6) Clear localStorage. Set a timeout (e.g., 30 seconds) and show error if migration stalls. For very large datasets (100K+ transactions), consider chunking the inserts.

2. **Offline Support and Sync Conflict Resolution**
   - What we know: Supabase Realtime broadcasts changes in under 100ms. RLS ensures users only see their own data.
   - What's unclear: What happens if user adds expense offline, then opens app on another device while offline? Which device's version is canonical? Should we use timestamps (Last-Write-Wins) or ask user to merge?
   - Recommendation: Phase 3 does NOT require offline support. Assume internet connectivity. If Phase 4/future adds offline, plan for Last-Write-Wins based on `timestamp` field (already present). User's local device always wins if timestamp is newer, server data wins if older.

3. **Email Verification and Production Setup**
   - What we know: Supabase provides default email service (2 emails/hour limit) for testing. Production requires custom SMTP.
   - What's unclear: What SMTP service? Should we use SendGrid, Resend, or self-hosted? What email template should we use?
   - Recommendation: For Phase 3, use Supabase's default email service (works for testing). Document that production deployment requires SMTP configuration (decision for Phase 3 plan or defer to Phase 4 if focusing on functionality). Supabase provides templates; customize with brand colors/logo if needed.

4. **Session Duration and Token Expiration**
   - What we know: Supabase default is 1 hour for access tokens, refresh tokens don't expire (but can only be used once).
   - What's unclear: Should we use shorter/longer durations? Should we add "remember me" for longer sessions?
   - Recommendation: Use Supabase defaults (1 hour) for Phase 3. This balances security (compromised token has limited lifetime) and UX (users stay logged in for typical session). Defer "remember me" to future phase if requested.

## Sources

### Primary (HIGH confidence)
- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Middleware pattern, cookie-based sessions, security guidance
- [Supabase: Creating a Supabase Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Browser/server client setup
- [Supabase: Password-Based Auth Documentation](https://supabase.com/docs/guides/auth/passwords) - Email/password signup, verification, configuration
- [Supabase: Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policies, per-user isolation, auth.uid() function
- [Supabase: Realtime Documentation](https://supabase.com/docs/guides/realtime) - WebSocket subscriptions, Postgres changes, broadcast
- [Supabase: User Sessions Documentation](https://supabase.com/docs/guides/auth/sessions) - Session structure, token management, refresh logic
- [PostgreSQL: Row Security Policies Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - Official PostgreSQL RLS semantics

### Secondary (MEDIUM confidence)
- [Supabase Review 2026](https://hackceleration.com/supabase-review/) - Current state of Supabase, realtime performance (under 100ms, 10K+ concurrent users)
- [2025 Guide: Next.js + Supabase Cookie-Based Auth](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1) - Practical implementation example
- [Production-Ready Next.js 16 + Supabase](https://github.com/gal1aoui/Next.js-Supabase-Authentication-System) - Full example with OTP, email templates, Zod validation
- [Supabase RLS Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security) - RLS performance, indexing, testing
- [Migrating Data from localStorage to Supabase](https://www.dineshs91.com/articles/migrating-data-from-local-storage-to-supabase) - Migration strategy for existing users, locking, verification
- [Connection Management & Performance](https://supabase.com/docs/guides/database/connection-management) - Connection pooling, realtime latency, scaling notes

### Tertiary (LOW confidence)
- None - all findings verified with official docs or production examples

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Verified with official Supabase docs, confirmed in production examples
- Architecture patterns: **HIGH** - All patterns from official tutorials and Supabase guides
- Pitfalls: **HIGH** - Based on documented security guidelines and common implementation patterns found across multiple sources
- Data migration: **MEDIUM** - Single source for localStorage-specific migration (needs validation during planning), but general migration patterns are well-documented
- Open questions: **HIGH** - Identified gaps are honest uncertainties; recommendations are based on best practices

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - Supabase updates monthly, Next.js/React stable, PostgreSQL features stable)
