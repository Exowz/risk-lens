# CLAUDE.md -- frontend/

This file contains frontend-specific rules for RiskLens.
Read the root CLAUDE.md first, then this file.

---

## PACKAGE MANAGER

Use bun exclusively -- never npm or yarn.

```bash
bun add <package>        # install dependency
bun add -d <package>     # install dev dependency
bunx <command>           # execute package binary
bun dev                  # start dev server
bun run build            # production build
bun run lint             # eslint
```

Never commit package-lock.json or yarn.lock -- only bun.lockb.

---

## FRONTEND ARCHITECTURE REMINDERS

- App Router only -- no Pages Router patterns
- proxy.ts NOT middleware.ts (Next.js 16)
- Next.js NEVER connects to PostgreSQL -- all data via FastAPI
- Server Components by default -- use "use client" only when necessary (charts, forms, stores)
- All fetch calls go through TanStack Query hooks in /lib/api/ -- never inline in components

---

## COMPONENT RULES

### Layer responsibilities

/components/ui/
  - shadcn/ui primitives only
  - No business logic, no API calls, no Zustand access
  - Pure presentational -- props in, JSX out

/components/charts/
  - One file per chart type
  - Recharts for all charts except efficient-frontier.tsx
  - D3.js used ONLY in efficient-frontier.tsx -- nowhere else
  - Every chart accepts typed props -- no raw any[] data
  - Must handle loading and empty states internally

/components/portfolio/
/components/risk/
/components/stress/
  - Feature-specific components
  - May access Zustand store and TanStack Query hooks
  - No direct fetch calls -- use /lib/api/ hooks

/components/shared/
  - Reusable across features
  - kpi-card.tsx: ReactBits animations allowed here only
  - loading-skeleton.tsx: used by all async components
  - error-boundary.tsx: wrap all async data sections

---

## STYLING RULES

- Tailwind utility classes only -- no custom CSS files, no inline style={{}}
- shadcn/ui as the base component system
- Aceternity UI: landing page (app/page.tsx) and auth pages ONLY
  - Never import Aceternity components inside (dashboard)/
- ReactBits: kpi-card.tsx ONLY
- Dark mode supported via Tailwind dark: prefix
- No hardcoded color hex values -- use Tailwind tokens

---

## DATA FETCHING RULES

Every API call follows this pattern:

1. Define the fetch function in /lib/api/<feature>.ts
2. Wrap it in a TanStack Query hook (useQuery or useMutation)
3. Consume the hook in the component -- never call fetch directly

Example structure:

/lib/api/risk.ts
  - fetchVaR(portfolioId, params) -- raw fetch function
  - useVaR(portfolioId, params) -- useQuery hook
  - useRunMonteCarlo() -- useMutation hook

/lib/api/client.ts injects the BetterAuth session token into every request
header automatically. Never manually add Authorization headers anywhere else.

---

## STATE MANAGEMENT RULES

Zustand stores in /lib/store/:

portfolio-store.ts
  - activePortfolioId: string | null
  - activePortfolio: Portfolio | null
  - setActivePortfolio(id): void
  - Used by dashboard layout and all feature pages

ui-store.ts
  - sidebarOpen: boolean
  - activeModal: string | null
  - Pure UI state -- no business data

Rules:
- Never put server data in Zustand -- that belongs in TanStack Query cache
- Zustand = client UI state only (which portfolio is selected, sidebar open/closed)
- TanStack Query = all server data (portfolio data, risk results, etc.)

---

## FORM RULES

All forms use React Hook Form + Zod:

1. Define Zod schema in /lib/validators/<feature>.schema.ts
2. Infer TypeScript type from schema: type PortfolioInput = z.infer<typeof portfolioSchema>
3. Pass schema to useForm via zodResolver
4. Never validate manually -- let Zod handle it

Portfolio weight validation (critical):
- Weights must sum to 1.0 (+/- 0.001)
- Enforce in Zod schema with .refine()
- Show clear error message: "Weights must sum to 100%"

---

## TYPESCRIPT RULES

- strict: true -- no exceptions
- No any -- use unknown + type guards if needed
- All backend response types in /types/ mirroring Pydantic schemas exactly
- Use z.infer<> to derive form types from Zod schemas
- Naming:
    camelCase: functions, variables, hook names
    PascalCase: components, interfaces, type aliases
    kebab-case: file names

Shared type pattern:
  backend Pydantic schema --> /frontend/types/<feature>.ts interface
  Keep them in sync manually when backend schemas change.

---

## CHART-SPECIFIC RULES

Recharts (all charts except efficient frontier):
- Wrap in ResponsiveContainer width="100%" for responsiveness
- Always provide loading and empty state fallbacks
- Typed data props -- no raw object arrays

D3.js (efficient-frontier.tsx ONLY):
- Use useRef for SVG element
- Use useEffect for D3 rendering
- Clean up on unmount: return () => d3.select(ref.current).selectAll("*").remove()
- Tooltip via plain HTML div positioned absolutely -- not D3 DOM manipulation

---

## NEVER IN FRONTEND

- middleware.ts (use proxy.ts)
- Direct PostgreSQL connection
- Direct fetch() calls in components (use /lib/api/ hooks)
- Aceternity imports inside (dashboard)/
- D3 imports outside of efficient-frontier.tsx
- Hardcoded API URLs (use process.env.NEXT_PUBLIC_API_URL)
- console.log in production code (use error boundaries)
- any TypeScript type