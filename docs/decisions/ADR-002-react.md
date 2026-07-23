# ADR-002: React + TypeScript for Frontend

**Status:** Accepted
**Date:** 2026

## Context

Need a frontend framework for a complex trading dashboard with 98+ pages, real-time charting, knowledge graph visualization, and extensive interactivity.

## Decision

Use **React 18** with **TypeScript 5**, built with **Vite 5**.

## Consequences

**Positive:**
- Component-based architecture suits complex UIs
- TypeScript prevents class of runtime errors in large codebase
- Vite provides fast HMR and optimized production builds
- `React.lazy()` enables route-level code splitting
- Large ecosystem (React Query, Recharts, React Flow, Framer Motion)
- Strong typing matches Pydantic backend models

**Negative:**
- Boilerplate for state management (no built-in solution)
- JSX syntax has learning curve
- Bundle size requires careful optimization (lazy loading, code splitting)
- Frequent breaking changes in ecosystem dependencies

## Alternatives Considered

- **Vue 3:** Less ecosystem support for complex visualization libraries
- **Svelte:** Smaller ecosystem, fewer job candidates
- **Next.js:** SSR not needed (SPA with JWT auth), adds complexity
- **SolidJS:** Too new, smaller ecosystem
