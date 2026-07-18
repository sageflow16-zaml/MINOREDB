# Frontend

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS (shadcn/ui design system)
- **State**: React Query + Auth Context
- **Charts**: Recharts
- **Routing**: React Router v6
- **Animation**: Framer Motion

## Project Structure

```
frontend/
└── src/
    ├── api/           # API service modules (30+)
    ├── auth/          # Auth context, token storage
    ├── components/    # UI components
    │   └── ui/        # shadcn-style primitives
    ├── hooks/         # React Query hooks (20+)
    ├── layouts/       # MainLayout, Sidebar, Topbar
    ├── lib/           # Utility functions
    ├── pages/         # 30+ route pages
    └── routes/        # AppRoutes configuration
```

## Design System

The UI uses a custom shadcn/ui theme with CSS variable-based colors. Key components:

- `Button` — CVA variants: default, destructive, outline, secondary, ghost, link
- `Card` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Dialog` — Modal dialogs with overlay
- `DataTable` — Generic sortable/searchable table
- `KpiCard` — Metric display with trend indicator
- `PageHeader` — Page title with back navigation and actions
- `Tabs` — Radix-based tab navigation
- `DropdownMenu` — Context menus
- `Skeleton` — Loading states
- `Feedback` — LoadingSpinner, ErrorState, EmptyState

## Key Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPI grid, pipeline chart, recent activity |
| `/trades` | Trades | Trade history with filters |
| `/analyst` | AI Analyst | Trade debrief generation |
| `/knowledge` | Knowledge | Knowledge rules and library |
| `/graph` | Knowledge Graph | D3/React-force-graph visualization |
| `/research` | Research | Research engine |
| `/replay` | Replay | Historical trade replay |
| `/similarity` | Similarity | Pattern matching |
| `/decision` | Decision Support | Trade decision evaluation |
| `/statistics` | Statistics | Performance analytics |

## Build

```bash
cd frontend
npm install
npm run build    # Output: dist/
npm run dev      # Development server on :3000
```
