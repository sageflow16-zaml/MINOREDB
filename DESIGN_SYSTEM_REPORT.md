# Design System Report — Phase 1.2

## Files Modified (17 files, +300/−154)

| File | Change |
|------|--------|
| `frontend/src/index.css` | Expanded tokens from ~50 to ~100+ across 7 categories |
| `frontend/tailwind.config.js` | Added info color, z-index scale, extended border-radius, typography anim tokens |
| `frontend/src/components/ui/chart.tsx` | Unified tooltip style via shared `lib/chart.ts` constant |
| `frontend/src/components/ui/CommandPalette.tsx` | Fixed `z-[100]` → `z-popover` |
| `frontend/src/components/ErrorBoundary.tsx` | Replaced hardcoded `gray-*`/`blue-*` → design tokens |
| `frontend/src/components/OfflineBanner.tsx` | Replaced `bg-yellow-500 text-white` → `bg-warning text-warning-foreground` + `z-toast` |
| `frontend/src/components/ComingSoon.tsx` | Replaced `brand-*`/`slate-*` → `primary`/`foreground`/`muted-foreground` |
| `frontend/src/components/graph/Node.tsx` | Replaced `bg-white dark:bg-slate-800` + hardcoded border colors → `bg-card` + `border-chart-*` |
| `frontend/src/components/graph/DetailsDrawer.tsx` | Replaced `text-[11px]`/`text-[10px]` → `text-xs`/`text-caption` |
| `frontend/src/components/SourceDrawer.tsx` | Replaced `bg-white dark:bg-slate-900`/`bg-slate-100` → `bg-card`/`bg-muted` + `z-overlay` |
| `frontend/src/components/InterpretationDrawer.tsx` | Same token modernization |
| `frontend/src/components/ConceptDrawer.tsx` | Same token modernization |
| `frontend/src/components/ConflictDrawer.tsx` | Same token modernization |
| `frontend/src/components/KpiCard.tsx` | **Removed** — legacy duplicate; all 7 consumers already use `components/ui/KpiCard` |
| `frontend/src/main.tsx` | Replaced hardcoded toast hex colors → `!bg-card !text-card-foreground !border-border` |
| `frontend/src/pages/Research.tsx` | Consolidated `CheckCircle2` → `CheckCircle` |
| `frontend/src/pages/Register.tsx` | Consolidated `CheckCircle2` → `CheckCircle` |

## Files Created (2 files)

| File | Purpose |
|------|---------|
| `frontend/src/lib/chart.ts` | Shared `chartTooltipStyle` constant used by `chart.tsx` and available for page-level recharts |
| *(existing)* `frontend/src/components/ui/` | All 32 components remain; no new components added in this phase |

## Design Tokens Created

### Colors (new)
- `--info` / `--info-foreground` — semantic info color (light/dark)

### Border Radius (expanded)
- `--radius-sm` (0.375rem), `--radius-lg` (0.75rem), `--radius-xl` (1rem)
- `--radius-2xl` (1.5rem), `--radius-full` (9999px)

### Typography Scale
- `--text-xs` through `--text-6xl` (0.75rem–3.75rem)
- `--font-normal` through `--font-bold` (400–700)
- `--tracking-tight` through `--tracking-wider`
- `--leading-none` through `--leading-relaxed`

### Spacing Scale
- `--space-0` through `--space-40` (0px–10rem)

### Z-Index Scale
- `--z-dropdown` (50), `--z-sticky` (60), `--z-fixed` (70)
- `--z-overlay` (80), `--z-modal` (90), `--z-popover` (100)
- `--z-toast` (110), `--z-tooltip` (120)

### Animation
- `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-slow` (300ms), `--duration-slower` (500ms)
- `--ease-out`, `--ease-in`, `--ease-in-out`, `--ease-spring`

## Typography Utility Classes
- `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-h4`
- `.text-body-large`, `.text-body`, `.text-body-small`
- `.text-caption`, `.text-label`, `.text-code`
- `.transition-fast`, `.transition-normal`, `.transition-slow`, `.transition-spring`

## Components Standardized

| Component | Standardization |
|-----------|----------------|
| **KpiCard** | Duplicate removed; unified to `components/ui/KpiCard` |
| **ErrorBoundary** | Hardcoded `gray-*`/`blue-*` → `foreground`/`muted-foreground`/`primary`/`destructive` |
| **OfflineBanner** | `bg-yellow-500` → `bg-warning`; added `z-toast` |
| **ComingSoon** | `brand-*`/`slate-*` → `primary`/`foreground`/`muted-foreground` |
| **Graph Nodes** | `bg-white dark:bg-slate-800` → `bg-card`; hardcoded `border-{color}-500` → `border-chart-*` |
| **DetailsDrawer** | Arbitrary `text-[11px]`/`text-[10px]` → `text-xs`/`text-caption` |
| **Legacy Drawers** (4) | `bg-white dark:bg-slate-900` → `bg-card` + `bg-muted`; `z-50` → `z-overlay` |
| **CommandPalette** | `z-[100]` → `z-popover` |
| **Chart tooltips** | `borderRadius: '8px'` → `var(--radius-lg)` via shared constant |
| **Toast styles** | Hardcoded `#1e293b`/`#fff`/`#334155` → CSS design tokens |

## Iconography Standardized

| Inconsistency | Fix |
|--------------|-----|
| `CheckCircle2` used in 2 files vs `CheckCircle` in 5 files | Consolidated to `CheckCircle` everywhere |
| `components/KpiCard.tsx` (legacy) | Removed; `components/ui/KpiCard.tsx` retained |

## Remaining Inconsistencies (not addressed in this phase)

| Issue | Location | Note |
|-------|----------|------|
| Hardcoded hex colors for chart types | `pages/KnowledgeGraph.tsx` TYPE_COLORS map | Graph-specific; needs token mapping |
| Hardcoded lightweight-charts colors | `pages/Replay.tsx` | Canvas-based; needs manual migration |
| `text-[10px]`/`text-[11px]` arbitrary sizes | ~100 instances across all pages | Gradual migration to `.text-caption` |
| Duplicate inline tooltip `borderRadius: '8px'` | 7 page files with recharts directly | Can use shared `lib/chart.ts` constant |
| `Brain` vs `BrainCircuit` | Sidebar vs TraderIntelligence | Intentional — TraderIntelligence uses circuitry variant |
| Legacy drawer components not using `RightPanel` | SourceDrawer, ConceptDrawer, ConflictDrawer, InterpretationDrawer | Can be migrated to `RightPanel` in future |

## Build Status
- `npx tsc --noEmit` — passes clean
- `npx vite build` — succeeds
