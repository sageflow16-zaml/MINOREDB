# Frontend Architecture — Project Minore

## Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS 3 + shadcn/ui
- **Routing:** React Router v6
- **Server state:** TanStack React Query v5
- **HTTP client:** Axios with JWT interceptors
- **Charts:** Recharts + TradingView Lightweight Charts
- **Graph:** React Flow
- **Animation:** Framer Motion 11
- **Testing:** Vitest + Testing Library + jsdom

## Directory Structure

```
frontend/src/
├── main.tsx                # Entry point
├── App.tsx                 # Root component + routing
├── index.css               # Global styles + Tailwind
├── auth/                   # Authentication
│   ├── AuthContext.tsx      # Auth state provider
│   └── tokenStorage.ts      # localStorage token management
├── api/                    # Axios API service modules (45 files)
│   └── index.ts             # Barrel exports
├── services/
│   └── api.ts              # Axios instance + interceptors
├── hooks/                  # Custom React hooks (41 files)
├── components/             # UI components
│   ├── ui/                 # 47 design system components
│   ├── chart/              # Chart components
│   ├── graph/              # Knowledge graph components
│   ├── ict/                # ICT-specific controls
│   ├── panels/             # Panel components
│   └── workspace/          # Workspace layout system
├── pages/                  # 98 page components
├── layouts/
│   └── MainLayout.tsx      # Shell layout with sidebar + topbar
├── routes/
│   ├── AppRoutes.tsx        # Route definitions
│   └── ProtectedRoute.tsx  # Auth guard wrapper
├── context/
│   └── ProjectContext.tsx   # Current project state
├── theme/
│   └── ThemeProvider.tsx    # Dark/light theme
├── types/                  # TypeScript type definitions
├── lib/                    # Utilities
└── tests/                  # Test files (11 files, 75 tests)
```

## State Management Strategy

| State Type | Solution | Purpose |
|-----------|----------|---------|
| Server state | React Query | API data caching, refetching, mutations |
| Auth state | Context (AuthContext) | User session, tokens |
| Project context | Context (ProjectContext) | Current project selection |
| UI state | Component-local `useState` | Forms, modals, toggles |
| Theme | Context (ThemeProvider) | Dark/light mode |

## Pages (98)

The frontend has 98 page components organized by domain:

| Domain | Pages | Description |
|--------|-------|-------------|
| Auth | Login, Register | Authentication |
| Dashboard | Dashboard, AIDashboard, MarketDashboard | Overview |
| Trading | Trades, TradeMemory, Replay | Trade management |
| ICT | ICTSmartEngine, MarketStructure, SessionAnalysis | Market analysis |
| Knowledge | Knowledge, Concepts, Claims, Sources | Knowledge management |
| Brain | BrainDashboard, DecisionSupport, AICoach | AI intelligence |
| Broker | BrokerHub, BrokerDetail, BrokerSetup | Exchange connections |
| Research | Research, QuantResearchDashboard, Analyst | Analysis |
| Portfolio | PortfolioDashboard, Risk, AllocationManager | Portfolio management |
| Automation | AutomationDashboard, WorkflowBuilder | Automation |
| Settings | Settings, ProjectSettings, Connectors | Configuration |

## Routing

All routes are lazy-loaded via `React.lazy()` for code splitting. Protected routes redirect to `/login` if unauthenticated. The route tree is defined in `AppRoutes.tsx`.

## API Communication

- Single Axios instance in `services/api.ts`
- Request interceptor attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor handles 401 with automatic token refresh
- Concurrent 401 requests are queued to avoid multiple refreshes
- Failed refresh clears tokens and redirects to login
- Base URL: `import.meta.env.VITE_API_URL` or `/api/v1`

## Theming

- Dark mode by default (`class="dark"` on `<html>`)
- Tailwind CSS dark mode via class strategy
- Theme persisted in localStorage
- ThemeProvider wraps entire app
