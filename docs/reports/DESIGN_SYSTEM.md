# PROJECT MINORE — DESIGN SYSTEM

> **Phase 1.2** | Dark-First · Premium SaaS · Responsive · Accessible

---

## TABLE OF CONTENTS

1. [Foundations](#1-foundations)
2. [Typography](#2-typography)
3. [Color Palette](#3-color-palette)
4. [Spacing & Grid](#4-spacing--grid)
5. [Elevation & Borders](#5-elevation--borders)
6. [Animation](#6-animation)
7. [Component Library](#7-component-library)
8. [Component Specifications](#8-component-specifications)
9. [Accessibility](#9-accessibility)

---

## 1. FOUNDATIONS

### 1.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Dark-first** | Default theme is dark. Light mode is secondary. All colors defined as HSL for dynamic theme switching. |
| **Progressive disclosure** | Show essential controls first. Advanced options on expand. Never overwhelm. |
| **Information density** | Bloomberg Terminal density without the noise. Tight spacing, compact tables, meaningful whitespace. |
| **Glassmorphism** | Subtle backdrop blur on overlays, modals, and floating panels. |
| **Motion with purpose** | Animations communicate state changes, never decorative. 200-300ms, spring physics. |

### 1.2 Design Tokens

All design tokens are defined as CSS custom properties in `index.css` and mapped to Tailwind utility classes via `tailwind.config.js`.

**Token Categories:**

| Category | Prefix | Example |
|----------|--------|---------|
| Surface | `--bg-*`, `--card`, `--popover` | `--background`, `--card` |
| Text | `--*-foreground` | `--foreground`, `--muted-foreground` |
| Interactive | `--primary`, `--secondary` | `--primary`, `--ring` |
| Status | `--success`, `--warning`, `--destructive` | `--success`, `--destructive` |
| Charts | `--chart-1` through `--chart-5` | `--chart-1`, `--chart-2` |
| Effects | `--glass`, `--shadow-*` | `--glass`, `--shadow-lg` |
| Sidebar | `--sidebar-*` | `--sidebar`, `--sidebar-active` |

### 1.3 Dark/Light Mode

Toggle via `.dark` class on `<html>`. Stored in `localStorage`, respected by `prefers-color-scheme`.

```
:root          → Light mode defaults
.dark          → Dark mode overrides
```

---

## 2. TYPOGRAPHY

### 2.1 Font Family

| Usage | Font | Fallback |
|-------|------|----------|
| UI Text | **Inter** | `system-ui, sans-serif` |
| Code/Data | **JetBrains Mono** | `Fira Code, monospace` |

Loaded via Google Fonts at the document level. Weight range: 400-700 for Inter, 400-500 for JetBrains Mono.

### 2.2 Type Scale

```css
/* Tailwind defaults (rem): */
/* text-xs:   0.75rem (12px) */
/* text-sm:   0.875rem (14px) */
/* text-base: 1rem (16px) */
/* text-lg:   1.125rem (18px) */
/* text-xl:   1.25rem (20px) */
/* text-2xl:  1.5rem (24px) */
/* text-3xl:  1.875rem (30px) */
```

### 2.3 Type Hierarchy

| Element | Class | Weight | Size | Letter-spacing |
|---------|-------|--------|------|----------------|
| Page title (h1) | `text-xl font-semibold tracking-tight` | 600 | 20px | -0.01em |
| Section title (h2) | `text-lg font-semibold` | 600 | 18px | normal |
| Card title (h3) | `text-base font-semibold` | 600 | 16px | normal |
| Subheading | `text-sm font-medium` | 500 | 14px | normal |
| Body | `text-sm` | 400 | 14px | normal |
| Description | `text-sm text-muted-foreground` | 400 | 14px | normal |
| Data value | `text-xl font-bold tracking-tight` | 700 | 20px | -0.01em |
| Data label | `text-xs font-medium text-muted-foreground` | 500 | 12px | normal |
| Meta (table head) | `text-xs font-medium text-muted-foreground` | 500 | 12px | normal |
| Badge | `text-xs font-medium` | 500 | 12px | normal |
| KPI value | `text-2xl font-bold tracking-tight` | 700 | 24px | -0.01em |
| KPI label | `text-xs font-medium text-muted-foreground` | 500 | 12px | normal |

### 2.4 Line Height

| Use | Value |
|-----|-------|
| Headings | `leading-none` (1) or `leading-tight` (1.25) |
| Body | `leading-normal` (1.5) |
| Dense data | `leading-none` |

### 2.5 Font Features

```css
font-feature-settings: "rlig" 1, "calt" 1;  /* Inter contextual ligatures */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## 3. COLOR PALETTE

### 3.1 Semantic Colors

All colors use HSL values for dynamic light/dark switching.

| Token | Light (hsl) | Dark (hsl) | Usage |
|-------|-------------|------------|-------|
| `--background` | `0 0% 100%` | `222.2 84% 4.9%` | Page background |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Primary text |
| `--card` | `0 0% 100%` | `222.2 47.4% 11.2%` | Card surface |
| `--card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Card text |
| `--popover` | `0 0% 100%` | `222.2 47.4% 11.2%` | Dropdown/dialog surface |
| `--popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Popover text |
| `--primary` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | Primary actions, links |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | Text on primary |
| `--secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Secondary surfaces |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on secondary |
| `--muted` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Muted backgrounds |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 20.2% 65.1%` | Secondary text, placeholders |
| `--accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Hover/active states |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on accent |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Errors, dangerous actions |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Text on destructive |
| `--success` | `142.1 76.2% 36.3%` | `142.1 70.6% 45.3%` | Win, profit, positive |
| `--success-foreground` | `210 40% 98%` | `210 40% 98%` | Text on success |
| `--warning` | `38 92% 50%` | `38 92% 50%` | Warnings, breakeven |
| `--warning-foreground` | `210 40% 98%` | `210 40% 98%` | Text on warning |
| `--border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | Borders, dividers |
| `--input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | Input borders |
| `--ring` | `221.2 83.2% 53.3%` | `224.3 76.3% 48%` | Focus ring |

### 3.2 Chart Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--chart-1` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` | Primary series (blue) |
| `--chart-2` | `142.1 76.2% 36.3%` | `142.1 70.6% 45.3%` | Success series (green) |
| `--chart-3` | `262.1 83.3% 57.8%` | `262.1 73.3% 66.8%` | Tertiary (purple) |
| `--chart-4` | `346.8 77.2% 49.8%` | `346.8 77.2% 49.8%` | Destructive series (red) |
| `--chart-5` | `24.6 95% 53.1%` | `24.6 95% 53.1%` | Accent series (orange) |

### 3.3 Sidebar Colors

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `222.2 47.4% 11.2%` | `222.2 84% 4.9%` |
| `--sidebar-foreground` | `210 40% 98%` | `210 40% 98%` |
| `--sidebar-muted` | `217.2 32.6% 17.5%` | `215 25% 27%` |
| `--sidebar-active` | `221.2 83.2% 53.3%` | `217.2 91.2% 59.8%` |
| `--sidebar-accent` | `217.2 32.6% 17.5%` | `217.2 32.6% 17.5%` |

### 3.4 Glass Effects

```css
--glass:         0 0% 100% / 0.7        /* light */;
                 222.2 47.4% 11.2% / 0.6   /* dark */
--glass-border: 0 0% 100% / 0.1        /* light */;
                 217.2 32.6% 17.5% / 0.5   /* dark */

.glass {
  background: hsl(var(--glass));
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--glass-border));
}
```

### 3.5 Color Usage Rules

| Element | Token | Example |
|---------|-------|---------|
| Page background | `bg-background` | `<div className="bg-background">` |
| Card surface | `bg-card` | `<Card>` |
| Primary button | `bg-primary text-primary-foreground` | `<Button variant="default">` |
| Success badge | `bg-success/10 text-success` | `<Badge variant="success">` |
| Error text | `text-destructive` | `<p className="text-destructive">` |
| Muted text | `text-muted-foreground` | `<p className="text-muted-foreground">` |
| Chart series | `hsl(var(--chart-1))` | recharts `<Area fill="hsl(var(--chart-1))">` |
| Divider | `border-border` | `<div className="border-b border-border">` |
| Focus ring | `focus-visible:ring-ring` | Default in all interactive elements |

---

## 4. SPACING & GRID

### 4.1 Spacing Scale

Based on 4px grid, mapped to Tailwind's spacing scale.

```
px-1:   4px    (0.25rem)
px-2:   8px    (0.5rem)
px-3:   12px   (0.75rem)
px-4:   16px   (1rem)
px-5:   20px   (1.25rem)
px-6:   24px   (1.5rem)
px-8:   32px   (2rem)
px-10:  40px   (2.5rem)
px-12:  48px   (3rem)
px-16:  64px   (4rem)
```

**Card padding**: `p-5` (20px) — Header/Content/Footer  
**Compact card padding**: `p-3` (12px) — KPI cards  
**Table cell padding**: `p-3` (12px) horizontal, `py-2` (8px) vertical in compact mode

### 4.2 Grid System

No framework grid — use Tailwind grid utilities.

```jsx
// 3-column card grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>

// KPI row (responsive)
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  <KpiCard /> <KpiCard /> ...
</div>

// Two-column layout
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">Main content</div>
  <div className="lg:col-span-1">Side panel</div>
</div>
```

**Breakpoints:**

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop (sidebar expanded) |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

### 4.3 Content Max-Width

```
.PageContent {
  @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
}
```

---

## 5. ELEVATION & BORDERS

### 5.1 Border Radius

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| Sharp | `rounded-sm` | `calc(var(--radius) - 4px)` | Compact tables, badges |
| Default | `rounded-md` | `calc(var(--radius) - 2px)` | Buttons, inputs |
| Card | `rounded-lg` | `var(--radius)` = 8px | Cards, modals |
| XL | `rounded-xl` | `calc(var(--radius) + 4px)` = 12px | Main containers |
| Full | `rounded-full` | `9999px` | Badges, avatars |

`--radius: 0.5rem` = 8px base

### 5.2 Shadows

| Level | Token | Usage |
|-------|-------|-------|
| None | `shadow-none` | Content backgrounds |
| XS | `shadow-xs` | Subtle container separation |
| SM | `shadow-sm` | Cards |
| DEFAULT | `shadow` | Cards with interaction |
| MD | `shadow-md` | Dropdowns, popovers |
| LG | `shadow-lg` | Modals, drawers |
| XL | `shadow-xl` | Floating panels, overlays |
| 2XL | `shadow-2xl` | Highest emphasis (rare) |

Dark mode shadows use larger opacity values to maintain depth perception.

### 5.3 Border Patterns

```css
/* Standard borders — applied globally */
*, *::before, *::after { border-color: hsl(var(--border)); }

/* Glass border */
border: 1px solid hsl(var(--glass-border));

/* Accent border left */
@apply border-l-2 border-l-primary;
```

---

## 6. ANIMATION

### 6.1 Timing & Easing

| Context | Duration | Easing |
|---------|----------|--------|
| Page elements entering | 300ms | `ease-out` |
| Hover/tap feedback | 150ms | `ease-out` |
| Drawer slide | Spring (stiffness: 300, damping: 30) | Spring physics |
| Modal open | 200ms | `ease-out` (scale-in) |
| Skeleton shimmer | 2s loop | `linear` infinite |
| Spinner | 1s loop | `linear` infinite |

### 6.2 Keyframe Animations

| Name | Effect | When to Use |
|------|--------|-------------|
| `fade-in` | Opacity 0→1 | Any element appearing |
| `fade-up` | Opacity 0→1, translateY(8px)→0 | Cards, list items |
| `fade-down` | Opacity 0→1, translateY(-8px)→0 | Page headers |
| `slide-in` | translateX(-8px)→0 | Sidebar items |
| `slide-in-right` | translateX(8px)→0 | Notifications, toasts |
| `scale-in` | Scale 0.95→1 | Modals, dialogs |
| `pulse-subtle` | Opacity 1→0.8→1 | Live indicators |
| `shimmer` | Background position -200%→200% | Skeleton loading |

### 6.3 Framer Motion Defaults

```tsx
// Page-level enter animation
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Spring drawer
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}

// Hover scale
whileHover={{ scale: 1.01 }}
whileTap={{ scale: 0.98 }}
```

---

## 7. COMPONENT LIBRARY

### 7.1 Component Inventory

| Component | Status | File |
|-----------|--------|------|
| Button | ✅ Complete | `ui/Button.tsx` |
| Badge | ✅ Complete | `ui/badge.tsx` |
| Card | ✅ Complete | `ui/Card.tsx` |
| Input | ✅ Complete | `ui/input.tsx` |
| KpiCard | ✅ Complete | `ui/KpiCard.tsx` |
| DataTable | ✅ Complete | `ui/DataTable.tsx` |
| Table | ✅ Complete | `ui/table.tsx` |
| Skeleton / SkeletonCard / SkeletonTable | ✅ Complete | `ui/skeleton.tsx` |
| LoadingSpinner / ErrorState / EmptyState | ✅ Complete | `ui/Feedback.tsx` |
| Dialog | ✅ Complete | `ui/dialog.tsx` |
| ConfirmDialog | ✅ Complete | `ui/ConfirmDialog.tsx` |
| DropdownMenu | ✅ Complete | `ui/dropdown-menu.tsx` |
| Tabs | ✅ Complete | `ui/tabs.tsx` |
| Tooltip | ✅ Complete | `ui/tooltip.tsx` |
| Avatar | ✅ Complete | `ui/avatar.tsx` |
| Breadcrumb | ✅ Complete | `Breadcrumb.tsx` |
| ScrollArea | ✅ Complete | `ui/scroll-area.tsx` |
| Separator | ✅ Complete | `ui/separator.tsx` |
| Label | ✅ Complete | `ui/label.tsx` |
| Spinner / PageLoader | ✅ Complete | `ui/Spinner.tsx` |
| ErrorFallback | ✅ Complete | `ui/ErrorFallback.tsx` |
| PageHeader | ✅ Complete | `PageHeader.tsx` |
| **Toast** | 🔧 New | `ui/toast.tsx` |
| **CommandPalette** | 🔧 New | `ui/CommandPalette.tsx` |
| **Alert** | 🔧 New | `ui/alert.tsx` |
| **Select** | 🔧 New | `ui/select.tsx` |
| **DateRangePicker** | ❌ Future | `ui/DateRangePicker.tsx` |
| **FileInput** | ❌ Future | `ui/FileInput.tsx` |

---

## 8. COMPONENT SPECIFICATIONS

### 8.1 Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'success' \| 'warning' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'xl' \| 'icon' \| 'icon-sm' \| 'icon-lg'` | `'default'` | Size preset |
| `isLoading` | `boolean` | `false` | Shows spinner, disables |
| `asChild` | `boolean` | `false` | Radix Slot for custom children |
| `disabled` | `boolean` | — | Native disabled |

**States:** default, hover, active (scale `[0.97]`), focus-visible (ring), disabled (opacity 50%)

**Loading behavior:** Button text stays visible, spinner appears before text. Width locked during load.

**Example usage:**
```tsx
<Button>Default</Button>
<Button variant="primary">Primary</Button>
<Button variant="destructive" isLoading>Delete</Button>
<Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
```

### 8.2 Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'success' \| 'warning' \| 'info' \| 'outline'` | `'default'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Size preset |

**Color mapping:** success → green, warning → amber, destructive → red, info → blue, default → primary

**Example usage:**
```tsx
<Badge variant="success">WIN</Badge>
<Badge variant="destructive">LOSS</Badge>
<Badge variant="warning">BREAKEVEN</Badge>
<Badge variant="info">ICT</Badge>
<Badge size="sm">Compact</Badge>
```

### 8.3 Card

| Sub-component | Props | Description |
|---------------|-------|-------------|
| `Card` | `className` | Container: `rounded-xl border bg-card text-card-foreground shadow-sm` |
| `CardHeader` | `className` | `flex flex-col space-y-1.5 p-5` |
| `CardTitle` | `className` | `h3 font-semibold leading-none tracking-tight` |
| `CardDescription` | `className` | `p text-sm text-muted-foreground` |
| `CardContent` | `className` | `div p-5 pt-0` |
| `CardFooter` | `className` | `div flex items-center p-5 pt-0` |

**Example usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Performance Summary</CardTitle>
    <CardDescription>Last 30 days of trading</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here...</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### 8.4 Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `boolean` | `false` | Toggles destructive border/ring |
| All native `input` props | — | — | Passed through |

**Height:** `h-9` (36px), **Rounding:** `rounded-lg`  
**States:** default, focus-visible (ring), error (red border + ring), disabled (opacity)

**Example usage:**
```tsx
<Input placeholder="Email" error={!!formErrors.email} />
<Input type="file" className="...file:..." />
```

### 8.5 KpiCard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Metric label |
| `value` | `string \| number` | required | Metric value |
| `icon` | `LucideIcon` | — | Icon in colored container |
| `trend` | `{ value: number; positive?: boolean }` | — | Trend indicator |
| `subtitle` | `string` | — | Additional context |
| `onClick` | `() => void` | — | Makes card clickable |
| `variant` | `'default' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Variant for icon/border |
| `size` | `'sm' \| 'default'` | `'default'` | Size preset |

**Entries:** Framer Motion `fade-up` on mount.  
**Hover:** `scale: 1.01, y: -1` only if `onClick` is provided.

**Example usage:**
```tsx
<KpiCard
  title="Total P&L"
  value="+$4,230"
  icon={TrendingUp}
  variant="success"
  trend={{ value: 12.5, positive: true }}
  onClick={() => navigate('/statistics')}
/>
```

### 8.6 DataTable

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Row data |
| `columns` | `Column<T>[]` | required | Column definitions |
| `keyExtractor` | `(row: T) => string` | `row.id` | Row key |
| `searchable` | `boolean` | `true` | Show search input |
| `searchFields` | `string[]` | string columns | Fields searched |
| `searchPlaceholder` | `string` | `'Search...'` | Search placeholder |
| `emptyMessage` | `string` | `'No results found.'` | Empty state title |
| `emptyDescription` | `string` | — | Empty state description |
| `onRowClick` | `(row: T) => void` | — | Row click handler |
| `isLoading` | `boolean` | — | Loading state |
| `pageSize` | `number` | `50` | Default page size |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Page size options |
| `stickyHeader` | `boolean` | `true` | Sticky header |
| `compact` | `boolean` | `false` | Compact row mode |

**Column definition:**
```tsx
interface Column<T> {
  id: string;
  header: string;
  accessor: string | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  hideable?: boolean;
  width?: string;
}
```

**Features:** Client-side search, column sort, pagination (first/prev/next/last + page size selector), compact mode, sticky header.

### 8.7 Feedback Components

#### LoadingSpinner
| Prop | Type | Default |
|------|------|---------|
| `message` | `string` | — |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` |

#### ErrorState
| Prop | Type | Default |
|------|------|---------|
| `message` | `string` | `'Something went wrong'` |
| `description` | `string` | — |
| `onRetry` | `() => void` | — |

#### EmptyState
| Prop | Type | Default |
|------|------|---------|
| `icon` | `ReactNode` | `Inbox` |
| `title` | `string` | `'No data'` |
| `description` | `string` | — |
| `action` | `ReactNode` | — |

**Example usage:**
```tsx
{isLoading && <LoadingSpinner message="Loading trades..." />}
{isError && <ErrorState onRetry={refetch} />}
{isEmpty && <EmptyState title="No trades found" action={<Button>New Trade</Button>} />}
```

### 8.8 Skeleton

| Variant | Description |
|---------|-------------|
| `Skeleton` | Generic shimmer block |
| `SkeletonCard` | 3-line card skeleton |
| `SkeletonTable` | Table skeleton (`rows`/`columns` props) |

**Animation:** Shimmer gradient moving left-to-right, 2s loop.

### 8.9 Dialog & ConfirmDialog

#### Dialog (Primitive)
```
Dialog.Root → Dialog.Trigger → Dialog.Portal → Dialog.Overlay + Dialog.Content
  → DialogHeader (Title + Description) → DialogFooter → Dialog.Close
```

#### ConfirmDialog (Convenience)
| Prop | Type | Default |
|------|------|---------|
| `isOpen` | `boolean` | required |
| `title` | `string` | required |
| `message` | `string` | required |
| `onConfirm` | `() => void` | required |
| `onCancel` | `() => void` | required |
| `confirmLabel` | `string` | `'Confirm'` |
| `variant` | `'danger' \| 'default'` | `'danger'` |

**Overlay:** `bg-black/40 backdrop-blur-sm` with `animate-fade-in`  
**Content:** `animate-scale-in` with spring physics

### 8.10 Toast (New)

```tsx
// Usage
import { toast } from '@/components/ui/toast';

// Imperative API
toast.success('Trade saved successfully');
toast.error('Failed to save trade');
toast.warning('API rate limit approaching');
toast.info('Research complete');

// Component API
<ToastProvider>
  <Toast
    open={showToast}
    onOpenChange={setShowToast}
    variant="success"
    title="Trade Saved"
    description="Your trade has been recorded."
  />
</ToastProvider>
```

**Specification:**

| Variant | Icon | Color | Auto-dismiss |
|---------|------|-------|-------------|
| `success` | CheckCircle | success | 3s |
| `error` | AlertCircle | destructive | 5s |
| `warning` | AlertTriangle | warning | 4s |
| `info` | Info | primary | 3s |

**Position:** Bottom-right, stacked.  
**Animation:** Slide-in-right + fade.  
**Behavior:** Manual dismiss via X button. Auto-dismiss after timeout. Stack max 5.

### 8.11 Command Palette (New)

```tsx
// Usage
<CommandPalette
  open={isOpen}
  onClose={() => setIsOpen(false)}
  groups={[
    {
      label: 'Pages',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onSelect: () => navigate('/dashboard') },
        { id: 'trades', label: 'Trades', icon: TrendingUp, onSelect: () => navigate('/trades') },
      ],
    },
    {
      label: 'Actions',
      items: [
        { id: 'new-trade', label: 'New Trade', icon: Plus, onSelect: () => openNewTrade() },
      ],
    },
  ]}
/>
```

**Trigger:** `⌘K` / `Ctrl+K` global keyboard shortcut.  
**Overlay:** Full-screen backdrop with `backdrop-blur-sm`.  
**Input:** Centered search bar with placeholder "Search pages, actions, or anything..."  
**Results:** Filtered groups with icons + keyboard shortcut hints.  
**Navigation:** Arrow keys to select, Enter to execute, Escape to close.  
**Animation:** Scale-in on open, fade on close.

### 8.12 Alert (New)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Alert style |
| `title` | `string` | — | Bold title |
| `children` | `ReactNode` | — | Description content |
| `onClose` | `() => void` | — | Show dismiss button |

**Example usage:**
```tsx
<Alert variant="warning" title="API Rate Limit">
  You are approaching the rate limit for TradingView webhooks.
</Alert>
<Alert variant="success" title="Sync Complete" onClose={dismiss}>
  All trades have been synchronized from MT5.
</Alert>
```

### 8.13 Select (New)

Based on Radix `@radix-ui/react-select` (already in dependencies).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string }[]` | required | Select options |
| `value` | `string` | — | Controlled value |
| `onChange` | `(value: string) => void` | — | Change handler |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `error` | `boolean` | `false` | Error state |
| `disabled` | `boolean` | `false` | Disabled state |

**Style:** Matches Input styling (`h-9 rounded-lg border border-input bg-background`).  
**Dropdown:** `bg-popover border shadow-md animate-scale-in`.

### 8.14 PageHeader

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title |
| `description` | `string` | — | Subtitle |
| `actions` | `ReactNode` | — | Action buttons (right side) |
| `onBack` | `string \| () => void` | — | Back button |

**Layout:** Flex row, title left, actions right.  
**Animation:** Fade-down 300ms.  
**Note:** `children` prop supported for backward compatibility.

### 8.15 Page Layout Standard

```tsx
// Template for all pages
export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Page Title"
        description="Brief description of what this page does."
        actions={<Button>Primary Action</Button>}
      />

      {/* Optional filter bar */}
      <div className="flex items-center gap-2">
        <Input placeholder="Search..." className="max-w-xs" />
        <Select options={filterOptions} />
      </div>

      {/* Content area - can be 1-col or 2-col */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Primary content: table, cards, charts */}
        </div>
        <div className="lg:col-span-1">
          {/* Optional right panel: detail view, context */}
        </div>
      </div>
    </div>
  );
}
```

---

## 9. ACCESSIBILITY

### 9.1 Color Contrast

All text/background combinations meet WCAG 2.1 AA minimum:
- Normal text (<18px): 4.5:1 contrast ratio
- Large text (≥18px): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### 9.2 Focus Management

```css
/* Visible focus ring on all interactive elements */
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
```

- Modals trap focus (Radix handles this)
- Drawers auto-focus first input
- Command palette returns focus to triggering element on close

### 9.3 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate interactive elements in order |
| `Shift+Tab` | Reverse navigation |
| `Enter` / `Space` | Activate element |
| `Escape` | Close modal/drawer/palette |
| `⌘K` / `Ctrl+K` | Open Command Palette |
| Arrow keys | Navigate select/dropdown/palette results |

### 9.4 ARIA Attributes

- `role="status"` on loading spinners
- `aria-label` on icon-only buttons
- `aria-describedby` on error messages
- Radix primitives handle their own ARIA

---

## APPENDIX A: File Organization

```
src/components/
├── ui/                          # Design System primitives
│   ├── Button.tsx
│   ├── badge.tsx
│   ├── Card.tsx
│   ├── input.tsx
│   ├── KpiCard.tsx
│   ├── DataTable.tsx
│   ├── table.tsx
│   ├── skeleton.tsx
│   ├── Feedback.tsx
│   ├── dialog.tsx
│   ├── ConfirmDialog.tsx
│   ├── toast.tsx                # NEW
│   ├── CommandPalette.tsx       # NEW
│   ├── alert.tsx                # NEW
│   ├── select.tsx               # NEW
│   ├── dropdown-menu.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   ├── avatar.tsx
│   ├── scroll-area.tsx
│   ├── separator.tsx
│   ├── label.tsx
│   └── Spinner.tsx
├── PageHeader.tsx
├── Breadcrumb.tsx
├── Topbar.tsx
├── Sidebar.tsx
├── ErrorBoundary.tsx
├── graphs/                      # Graph viz components
├── KpiCard.tsx                  # → re-export from ui/KpiCard
└── StatCard.tsx                 # DEPRECATED → use KpiCard
```

## APPENDIX B: Migration Notes

| Component | Action | Reason |
|-----------|--------|--------|
| `StatCard.tsx` | **Deprecate** — replace with `KpiCard` | Duplicate, less feature-rich |
| `SourceDrawer.tsx` | **Migrate** to spring-animated drawer | Inconsistent pattern |
| `ConceptDrawer.tsx` | **Migrate** to spring-animated drawer | Inconsistent pattern |
| `InterpretationDrawer.tsx` | **Migrate** to spring-animated drawer | Inconsistent pattern |
| `ConflictDrawer.tsx` | **Migrate** to spring-animated drawer | Inconsistent pattern |
| Hardcoded colors | **Replace** with CSS tokens throughout | All pages must use `bg-card`, `text-foreground`, etc. |

---

*End of Design System*
