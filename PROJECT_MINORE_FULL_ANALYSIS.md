# Project Minore — Full Architecture Analysis & Implementation Plan

> **Status:** Complete analysis of frontend (React/TypeScript) and backend (FastAPI/Python) codebases.
> **Analysis Date:** 2026-07-16
> **Analyst:** Lead Software Engineer

---

## 1. Overall Architecture

### Backend Stack
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy 2.0 (async-compatible via `scalars`)
- **Database:** PostgreSQL (via `psycopg2-binary`)
- **Migrations:** Alembic
- **Auth:** API Key (optional, `X-API-Key` header) + placeholder JWT on frontend
- **Middleware:** CORS, TrustedHost, GZip, Rate Limiting, Security Headers, Logging

### Frontend Stack
- **Framework:** React 18 + TypeScript, Vite
- **Routing:** React Router v6
- **Data Fetching:** TanStack React Query v5
- **HTTP Client:** Axios (with bearer token interceptor)
- **UI:** Tailwind CSS, Lucide icons, Framer Motion, Recharts
- **Form:** React Hook Form + Zod
- **Graph Visualization:** ReactFlow + Dagre
- **Toasts:** react-hot-toast

### Database Models (11 tables)
`project`, `source`, `claim`, `concept`, `association`, `conflict`, `claim_conflict`, `interpretation`, `reconsideration_trigger`, `research_question`, `hypothesis`

---

## 2. Complete API Endpoint Map

### Backend Routes (prefix: `/api/v1`, all protected by `verify_api_key`)

| Method | Endpoint | Module | Frontend Service | Status |
|--------|----------|--------|-----------------|--------|
| POST | `/projects` | Project | `projectService.create` | ✅ |
| GET | `/projects` | Project | `projectService.list` | ✅ |
| GET | `/projects/{id}` | Project | `projectService.get` | ✅ |
| PUT | `/projects/{id}` | Project | `projectService.update` | ✅ |
| DELETE | `/projects/{id}` | Project | `projectService.remove` | ✅ |
| GET | `/dashboard` | Dashboard | `dashboardService.stats` | ⚠️ PATH MISMATCH |
| GET | `/projects/{project_id}/sources` | Source | `sourceService.list` | ✅ |
| GET | `/projects/{project_id}/sources/{id}` | Source | `sourceService.get` | ✅ |
| POST | `/projects/{project_id}/sources` | Source | `sourceService.create` | ✅ |
| PUT | `/projects/{project_id}/sources/{id}` | Source | `sourceService.update` | ✅ |
| DELETE | `/projects/{project_id}/sources/{id}` | Source | `sourceService.remove` | ✅ |
| POST | `/projects/{project_id}/sources/upload` | Source | `sourceService.upload` | ✅ |
| POST | `/projects/{project_id}/sources/{source_id}/extract-claims` | Source | `sourceService.extractClaims` | ✅ |
| POST | `/projects/{project_id}/sources/{source_id}/detect-conflicts` | Source | `sourceService.detectConflicts` | ✅ |
| GET | `/projects/{project_id}/claims` | Claim | `claimService.list` | ✅ |
| GET | `/projects/{project_id}/claims/{id}` | Claim | `claimService.get` | ✅ |
| POST | `/projects/{project_id}/claims` | Claim | `claimService.create` | ✅ |
| PUT | `/projects/{project_id}/claims/{id}` | Claim | `claimService.update` | ✅ |
| DELETE | `/projects/{project_id}/claims/{id}` | Claim | `claimService.remove` | ✅ |
| POST | `/projects/{project_id}/claims/{claim_id}/extract-concepts` | Claim | `claimService.extractConcepts` | ✅ |
| POST | `/projects/{project_id}/claims/{claim_id}/interpret` | Claim | `claimService.interpret` | ✅ |
| GET | `/projects/{project_id}/claims/{claim_id}/graph` | Claim | `claimService.graph` | ✅ |
| GET | `/projects/{project_id}/concepts` | Concept | `conceptService.list` | ✅ |
| GET | `/projects/{project_id}/concepts/{id}` | Concept | `conceptService.get` | ✅ |
| GET | `/projects/{project_id}/concepts/{id}/claims` | Concept | `conceptService.claims` | ✅ |
| GET | `/projects/{project_id}/concepts/{id}/interpretations` | Concept | `conceptService.interpretations` | ✅ |
| POST | `/projects/{project_id}/concepts` | Concept | `conceptService.create` | ✅ |
| PUT | `/projects/{project_id}/concepts/{id}` | Concept | `conceptService.update` | ✅ |
| DELETE | `/projects/{project_id}/concepts/{id}` | Concept | `conceptService.remove` | ✅ |
| GET | `/projects/{project_id}/associations` | Association | `associationService.list` | ✅ |
| GET | `/projects/{project_id}/associations/{id}` | Association | `associationService.get` | ✅ |
| POST | `/projects/{project_id}/associations` | Association | `associationService.create` | ⚠️ MODEL MISMATCH |
| PUT | `/projects/{project_id}/associations/{id}` | Association | `associationService.update` | ✅ |
| DELETE | `/projects/{project_id}/associations/{id}` | Association | `associationService.remove` | ✅ |
| GET | `/projects/{project_id}/conflicts` | Conflict | `conflictService.list` | ✅ |
| GET | `/projects/{project_id}/conflicts/{id}` | Conflict | `conflictService.get` | ✅ |
| POST | `/projects/{project_id}/conflicts` | Conflict | `conflictService.create` | ✅ |
| PUT | `/projects/{project_id}/conflicts/{id}` | Conflict | `conflictService.update` | ✅ |
| DELETE | `/projects/{project_id}/conflicts/{id}` | Conflict | `conflictService.remove` | ✅ |
| GET | `/projects/{project_id}/conflicts/{id}/claims` | Conflict | `conflictService.claims` | ✅ |
| POST | `/projects/{project_id}/conflicts/{conflict_id}/generate-question` | Conflict | `conflictService.generateQuestion` | ✅ |
| GET | `/projects/{project_id}/interpretations` | Interpretation | `interpretationService.list` | ✅ |
| GET | `/projects/{project_id}/interpretations/{id}` | Interpretation | `interpretationService.get` | ✅ |
| DELETE | `/projects/{project_id}/interpretations/{id}` | Interpretation | `interpretationService.remove` | ✅ |
| GET | `/projects/{project_id}/triggers` | ReconsiderationTrigger | ❌ No frontend | ⚠️ |
| POST/GET/PUT/DELETE | `/projects/{project_id}/triggers/{id}` | ReconsiderationTrigger | ❌ No frontend | ⚠️ |
| GET | `/projects/{project_id}/questions` | ResearchQuestion | `researchQuestionService.list` | ✅ |
| GET | `/projects/{project_id}/questions/{id}` | ResearchQuestion | `researchQuestionService.get` | ✅ |
| POST | `/projects/{project_id}/questions` | ResearchQuestion | ❌ Missing `create` | ⚠️ |
| PUT | `/projects/{project_id}/questions/{id}` | ResearchQuestion | ❌ Missing `update` | ⚠️ |
| DELETE | `/projects/{project_id}/questions/{id}` | ResearchQuestion | `researchQuestionService.remove` | ✅ |
| POST | `/projects/{project_id}/questions/{rq_id}/generate-hypothesis` | ResearchQuestion | `researchQuestionService.generateHypothesis` | ✅ |
| GET | `/projects/{project_id}/hypotheses` | Hypothesis | `hypothesisService.list` | ✅ |
| GET | `/projects/{project_id}/hypotheses/{id}` | Hypothesis | `hypothesisService.get` | ✅ |
| POST | `/projects/{project_id}/hypotheses` | Hypothesis | ❌ Missing `create` | ⚠️ |
| PUT | `/projects/{project_id}/hypotheses/{id}` | Hypothesis | ❌ Missing `update` | ⚠️ |
| DELETE | `/projects/{project_id}/hypotheses/{id}` | Hypothesis | `hypothesisService.remove` | ✅ |
| GET | `/projects/{project_id}/search?q=` | Search | `searchService.query` | ✅ |

---

## 3. React Query Hooks Map

| Hook Name | Query Key | Used In | Status |
|-----------|-----------|---------|--------|
| `useProjects` | `['projects']` | Projects, Sidebar | ✅ |
| `useCreateProject` | Mutation | Projects | ✅ |
| `useUpdateProject` | Mutation | Projects | ✅ |
| `useDeleteProject` | Mutation | Projects | ✅ |
| `useDashboardStats` | `['dashboard-stats', projectId]` | Dashboard, Analytics | ⚠️ BROKEN |
| `useSources` | `['sources', projectId]` | Sources, Dashboard | ✅ |
| `useUploadSource` | Mutation | Sources | ✅ |
| `useExtractClaims` | Mutation | Sources | ✅ |
| `useDetectConflicts` | Mutation | Sources | ✅ |
| `useDeleteSource` | Mutation (optimistic) | Sources | ✅ |
| `useClaims` | `['claims', projectId]` | Claims, Dashboard | ✅ |
| `useExtractConcepts` | Mutation | Claims | ✅ |
| `useDeleteClaim` | Mutation (optimistic) | Claims | ✅ |
| `useInterpretClaim` | Mutation | Claims | ✅ |
| `useConcepts` | `['concepts', projectId]` | Concepts | ✅ |
| `useConceptClaims` | `['concept-claims', projectId, conceptId]` | ConceptDrawer, ClaimCount | ✅ |
| `useConceptInterpretations` | `['concept-interpretations', projectId, conceptId]` | ConceptDrawer | ✅ |
| `useDeleteConcept` | Mutation (optimistic) | Concepts | ✅ |
| `useAssociations` | `['associations', projectId]` | Associations | ✅ |
| `useCreateAssociation` | Mutation | Associations | ⚠️ TYPE ANY |
| `useDeleteAssociation` | Mutation | Associations | ✅ |
| `useConflicts` | `['conflicts', projectId]` | Conflicts | ✅ |
| `useConflictClaims` | `['conflict-claims', projectId, conflictId]` | ConflictDrawer | ✅ |
| `useDeleteConflict` | Mutation (optimistic) | Conflicts | ✅ |
| `useGenerateRQ` | Mutation | Conflicts | ✅ |
| `useInterpretations` | `['interpretations', projectId]` | Interpretations | ✅ |
| `useDeleteInterpretation` | Mutation (optimistic) | Interpretations | ✅ |
| `useResearchQuestions` | `['questions', projectId]` | ResearchQuestions | ✅ |
| `useGenerateHypothesis` | Mutation | ResearchQuestions | ✅ |
| `useDeleteRQ` | Mutation | ResearchQuestions | ✅ |
| `useHypotheses` | `['hypotheses', projectId]` | Hypotheses | ✅ |
| `useDeleteHypothesis` | Mutation | Hypotheses | ✅ |
| `useSearch` | `['search', projectId, query]` | Search | ✅ |
| `useGraphData` | `['graph', projectId, claimId]` | GraphExplorer | ✅ |

---

## 4. Critical Runtime Issues

### 🔴 ISSUE 1: Dashboard API Path Mismatch (BROKEN)
- **Frontend:** `api.get('/dashboard', { params: { project_id: projectId } })` → resolves to `/api/v1/dashboard?project_id=xxx`
- **Backend expects:** `/api/v1/dashboard` with `project_id` from URL path parameter
- **Backend route:** `dashboard.router` mounted at `/dashboard` WITHOUT `{project_id}` prefix
- **Result:** Dashboard stats will always return empty or 404. The backend endpoint has no `project_id` filtering capability via query param.
- **Fix needed:** Either re-mount dashboard under `/{project_id}/dashboard` or add `project_id` query param support.

### 🔴 ISSUE 2: Association Model Mismatch (BROKEN)
- **Backend `Association` model:** Has `claim_id` and `concept_id` columns (links claims to concepts)
- **Frontend `AssociationCreate` type:** Uses `concept_a_id` and `concept_b_id` fields
- **Frontend UI:** Allows user to enter `concept_a_id` and `concept_b_id` which map to model fields
- **Result:** Creating associations from the frontend will never work correctly because the data shape doesn't match the backend model. The frontend assumes associations are between two concepts, but the backend model associates claims to concepts.

### 🔴 ISSUE 3: No Authentication Backend Endpoints
- **Frontend Login:** Uses `login('placeholder-token', { id: '1', email })` after 600ms timeout
- **Backend:** No auth endpoints exist (no `/auth/login`, `/auth/register`, `/auth/me`)
- **API Client:** Injects Bearer token but backend only validates via `X-API-Key`
- **Result:** Authentication is purely cosmetic. The token stored in localStorage is never validated by the backend. The JWT-based auth flow is non-functional.

### 🔴 ISSUE 4: Search Results Type Mismatch
- **Backend `search_knowledge`:** Returns a `dict` with keys (`sources`, `claims`, `concepts`, etc.)
- **Frontend `SearchResult`:** Typed as `Record<string, unknown>[]` (array)
- **Frontend rendering:** Maps over `data` as an array
- **Result:** Search page will not render results correctly. Backend returns object, frontend expects array.

### 🟡 ISSUE 5: Missing Frontend API Methods
- `researchQuestionService`: Missing `create` and `update` methods
- `hypothesisService`: Missing `create` and `update` methods
- `interpretationService`: Missing `create` and `update` methods
- These entities can only be created via backend service pipelines (e.g., conflict→question→hypothesis), not manually

### 🟡 ISSUE 6: Reconsideration Triggers — No Frontend Implementation
- Full CRUD backend exists for triggers
- No frontend routes, API service, hooks, or UI
- Sidebar has no "Triggers" nav item

### 🟡 ISSUE 7: ProtectedRoute Double Wrapping
- `App.tsx` wraps `AppRoutes` in `<ProtectedRoute>`
- `AppRoutes.tsx` wraps all routes in another `<ProtectedRoute>`
- Redundant, not harmful

### 🟡 ISSUE 8: Dashboard Nav Path Uses `any` Types
- `Projects.tsx` uses `any` for table row types
- `Associations.tsx` uses `any` for table row types
- `DetailsDrawer.tsx` uses `any` for node data

### 🟡 ISSUE 9: Graph Node Types Missing Source
- `GraphExplorer.tsx` registers `source` node type in `nodeTypes`
- But the graph data returned from backend only includes claim, concepts, interpretation, conflicts, RQs, hypotheses — no sources
- The `source` node type registration is declared but never used

### 🟡 ISSUE 10: ClaimCreate Schema Contains project_id
- `ClaimCreate` extends `ClaimBase` which has `project_id: Optional[UUID]`
- The `claim_pipeline.extract_claims_from_source` creates `ClaimCreate` with `project_id` set
- But `ClaimCreate` is not meant to have `project_id` in the create payload — it's set by the route from the URL
- This works because `crud.create` also sets `project_id`

### 🟡 ISSUE 11: Source Upload Form Accepts Non-TXT Files
- Frontend: `<input type="file" accept=".txt,.pdf,.docx" />` accepts `.pdf` and `.docx`
- Backend: Only `.txt` files supported (blocks PDF/DOCX)
- User confusion: Can select PDF/DOCX but will get 400 error on upload

---

## 5. Module-by-Module Report

---

### Module: Authentication
| Aspect | Detail |
|--------|--------|
| **Status** | 🔴 BROKEN (placeholder only) |
| **Backend** | No auth endpoints. Only `X-API-Key` header check. |
| **Frontend** | `AuthContext`, `tokenStorage`, `Login.tsx`, `ProtectedRoute.tsx` |
| **Dependencies** | None |
| **Runtime Issues** | Login uses placeholder token. No JWT validation. No user management. |
| **Estimated Effort** | 3-4 days (full auth system) |
| **Risk Level** | HIGH — security-critical |

---

### Module: API Client
| Aspect | Detail |
|--------|--------|
| **Status** | 🟡 PARTIAL |
| **Files** | `services/api.ts`, `api/*.ts` (12 service files), `lib/queryClient.ts` |
| **Dependencies** | axios, react-query |
| **Runtime Issues** | Dashboard path mismatch, Association model mismatch, Missing create/update for 3 modules |
| **Estimated Effort** | 1-2 days to fix all mismatches |
| **Risk Level** | LOW |

---

### Module: Projects
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | `CRUD /projects` |
| **Frontend Files** | `api/projects.ts`, `hooks/useProjects.ts`, `hooks/useProjectMutations.ts`, `pages/Projects.tsx` |
| **Dependencies** | Database (project table) |
| **Runtime Issues** | None identified |
| **Estimated Effort** | N/A |
| **Risk Level** | LOW |

---

### Module: Sources
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | CRUD + upload + extract-claims + detect-conflicts |
| **Frontend Files** | `api/sources.ts`, `hooks/useSources.ts`, `pages/Sources.tsx`, `components/SourceDrawer.tsx` |
| **Dependencies** | Projects |
| **Runtime Issues** | Minor: upload accept attribute mismatch (.pdf,.docx shown but only .txt supported) |
| **Estimated Effort** | < 1 day |
| **Risk Level** | LOW |

---

### Module: Claims
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | CRUD + extract-concepts + interpret + graph |
| **Frontend Files** | `api/claims.ts`, `hooks/useClaims.ts`, `pages/Claims.tsx` |
| **Dependencies** | Sources |
| **Runtime Issues** | None identified |
| **Estimated Effort** | N/A |
| **Risk Level** | LOW |

---

### Module: Concepts
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | CRUD + claims + interpretations |
| **Frontend Files** | `api/concepts.ts`, `hooks/useConcepts.ts`, `pages/Concepts.tsx`, `components/ConceptDrawer.tsx`, `components/ClaimCount.tsx` |
| **Dependencies** | Claims |
| **Runtime Issues** | None identified |
| **Estimated Effort** | N/A |
| **Risk Level** | LOW |

---

### Module: Associations
| Aspect | Detail |
|--------|--------|
| **Status** | 🔴 BROKEN (model mismatch) |
| **Backend Endpoints** | CRUD |
| **Frontend Files** | `api/associations.ts`, `hooks/useAssociations.ts`, `pages/Associations.tsx` |
| **Dependencies** | Concepts, Claims |
| **Runtime Issues** | Backend model uses `claim_id` + `concept_id` (links claims to concepts), but frontend sends `concept_a_id` + `concept_b_id` (assumes concept-to-concept). Creating from UI will send wrong data shape. |
| **Estimated Effort** | 2-3 days (redesign association semantics between frontend and backend) |
| **Risk Level** | HIGH — architectural mismatch |

---

### Module: Conflicts
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | CRUD + claims + generate-question |
| **Frontend Files** | `api/conflicts.ts`, `hooks/useConflicts.ts`, `pages/Conflicts.tsx`, `components/ConflictDrawer.tsx` |
| **Dependencies** | Claims, Sources |
| **Runtime Issues** | None identified |
| **Estimated Effort** | N/A |
| **Risk Level** | LOW |

---

### Module: Interpretations
| Aspect | Detail |
|--------|--------|
| **Status** | 🟡 PARTIAL |
| **Backend Endpoints** | GET list, GET one, DELETE only |
| **Frontend Files** | `api/interpretations.ts`, `hooks/useInterpretations.ts`, `pages/Interpretations.tsx`, `components/InterpretationDrawer.tsx` |
| **Dependencies** | Claims, Concepts |
| **Runtime Issues** | Missing frontend create/update methods. Interpretations are created only via `POST /claims/{id}/interpret` service pipeline. |
| **Estimated Effort** | < 1 day |
| **Risk Level** | LOW |

---

### Module: Research Questions
| Aspect | Detail |
|--------|--------|
| **Status** | 🟡 PARTIAL |
| **Backend Endpoints** | Full CRUD + generate-hypothesis |
| **Frontend Files** | `api/researchQuestions.ts`, `hooks/useResearch.ts`, `pages/ResearchQuestions.tsx` |
| **Dependencies** | Conflicts |
| **Runtime Issues** | Missing frontend create/update API methods. Questions created only via conflict→generate-question pipeline. |
| **Estimated Effort** | < 1 day |
| **Risk Level** | LOW |

---

### Module: Hypotheses
| Aspect | Detail |
|--------|--------|
| **Status** | 🟡 PARTIAL |
| **Backend Endpoints** | Full CRUD |
| **Frontend Files** | `api/hypotheses.ts`, `hooks/useResearch.ts`, `pages/Hypotheses.tsx` |
| **Dependencies** | Research Questions |
| **Runtime Issues** | Missing frontend create/update API methods. Hypotheses created only via question→generate-hypothesis pipeline. |
| **Estimated Effort** | < 1 day |
| **Risk Level** | LOW |

---

### Module: Search
| Aspect | Detail |
|--------|--------|
| **Status** | 🔴 BROKEN (type mismatch) |
| **Backend Endpoints** | `GET /projects/{id}/search?q=` |
| **Frontend Files** | `api/search.ts`, `hooks/useSearch.ts`, `pages/Search.tsx` |
| **Dependencies** | All entities |
| **Runtime Issues** | Backend returns `dict{ sources, claims, concepts, ... }` but frontend expects `SearchResult[]` (array). Rendering as array produces empty or broken UI. |
| **Estimated Effort** | 1 day |
| **Risk Level** | MEDIUM |

---

### Module: Dashboard
| Aspect | Detail |
|--------|--------|
| **Status** | 🔴 BROKEN (path mismatch) |
| **Backend Endpoints** | `GET /dashboard` (NO project_id path param) |
| **Frontend Files** | `api/dashboard.ts`, `hooks/useDashboard.ts`, `pages/Dashboard.tsx`, `components/StatCard.tsx` |
| **Dependencies** | All entities (for counts) |
| **Runtime Issues** | Frontend calls `/dashboard?project_id=xxx` but backend route is at `/dashboard` with no query param support. Will return wrong data or empty. |
| **Estimated Effort** | 1 day |
| **Risk Level** | HIGH — blocks main landing page |

---

### Module: Analytics
| Aspect | Detail |
|--------|--------|
| **Status** | 🟡 PARTIAL (depends on Dashboard fix) |
| **Backend Endpoints** | Same as Dashboard |
| **Frontend Files** | `pages/Analytics.tsx` |
| **Dependencies** | Dashboard stats |
| **Runtime Issues** | Same as Dashboard — stats endpoint broken |
| **Estimated Effort** | < 1 day (after Dashboard fix) |
| **Risk Level** | LOW |

---

### Module: Settings
| Aspect | Detail |
|--------|--------|
| **Status** | 🟢 PLACEHOLDER |
| **Backend Endpoints** | None |
| **Frontend Files** | `pages/Settings.tsx` (renders `<ComingSoon />`) |
| **Dependencies** | None |
| **Runtime Issues** | None — intentional placeholder |
| **Estimated Effort** | TBD (future feature) |
| **Risk Level** | NONE |

---

### Module: Reconsideration Triggers
| Aspect | Detail |
|--------|--------|
| **Status** | ⚠️ UNKNOWN (no frontend) |
| **Backend Endpoints** | Full CRUD |
| **Frontend Files** | None |
| **Dependencies** | All entities |
| **Runtime Issues** | No frontend implementation. Not in sidebar. No API service. No hooks. |
| **Estimated Effort** | 2-3 days (full implementation) |
| **Risk Level** | LOW (not blocking anything) |

---

### Module: Graph Explorer
| Aspect | Detail |
|--------|--------|
| **Status** | ✅ FUNCTIONAL |
| **Backend Endpoints** | `GET /claims/{id}/graph` |
| **Frontend Files** | `pages/GraphExplorer.tsx`, `hooks/useGraph.ts`, `components/graph/Node.tsx`, `components/graph/DetailsDrawer.tsx` |
| **Dependencies** | Claims, Concepts, Conflicts, Interpretations, Research Questions, Hypotheses |
| **Runtime Issues** | Source node type registered but never used in graph data. Minor cosmetic issue. |
| **Estimated Effort** | < 1 day |
| **Risk Level** | LOW |

---

## 6. Dependency Graph (Data Flow)

```
Project
  ├── Source (belongs to project)
  │     ├── claim_pipeline.extract_claims_from_source → Claim[]
  │     └── conflict_engine.process_source_conflicts → Conflict[]
  │
  ├── Claim (belongs to project, belongs to source)
  │     ├── concept_extractor.process_claim_concepts → Concept[] + Association[]
  │     ├── interpretation_engine.process_claim_interpretation → Interpretation
  │     ├── graph_explorer.explore_claim → GraphResponse
  │     └── (via Associations) → Concept[]
  │
  ├── Concept (belongs to project)
  │     └── (via Associations) → Claim[] + Interpretation[]
  │
  ├── Association (links claim ↔ concept)
  │
  ├── Conflict (belongs to project)
  │     ├── claim_conflict (links claim ↔ conflict)
  │     └── research_question_engine.process_conflict_questions → ResearchQuestion
  │
  ├── Interpretation (belongs to project, belongs to concept)
  │
  ├── ResearchQuestion (belongs to project, belongs to conflict)
  │     └── hypothesis_engine.process_research_question_hypothesis → Hypothesis
  │
  ├── Hypothesis (belongs to project, belongs to RQ)
  │
  ├── ReconsiderationTrigger (belongs to project) — standalone
  │
  ├── Dashboard (aggregates counts from all entities)
  │
  └── Search (queries across all entities)
```

---

## 7. Implementation Priority Matrix

| Priority | Module | Issue | Effort | Risk |
|----------|--------|-------|--------|------|
| P0 | **Authentication** | No backend auth, placeholder login | 3-4d | 🔴 CRITICAL |
| P0 | **Dashboard** | API path mismatch → page broken | 1d | 🔴 CRITICAL |
| P0 | **Associations** | Model mismatch → create broken | 2-3d | 🔴 CRITICAL |
| P1 | **Search** | Type mismatch → results broken | 1d | 🟡 HIGH |
| P1 | **Analytics** | Depends on dashboard fix | 0.5d | 🟡 HIGH |
| P2 | **API Client** | Missing create/update for 3 modules | 1d | 🟢 MEDIUM |
| P2 | **Sources** | File accept attribute mismatch | 0.5d | 🟢 LOW |
| P2 | **Graph** | Minor: unused source node type | 0.5d | 🟢 LOW |
| P3 | **Reconsideration Triggers** | No frontend at all | 2-3d | 🟢 LOW |
| P3 | **Settings** | Placeholder only | TBD | 🟢 NONE |

---

## 8. Recommended Implementation Order

### Phase 1 — Critical Fixes (3-4 days)
1. **Authentication** — Add backend auth endpoints (login, register, me, refresh)
2. **Dashboard** — Fix route to include project_id in path
3. **Associations** — Reconcile frontend types with backend model

### Phase 2 — High Priority (1-2 days)
4. **Search** — Fix frontend to handle backend response structure
5. **Analytics** — Verify works after dashboard fix

### Phase 3 — Medium Priority (1-2 days)
6. **API Client** — Add missing create/update for RQ, Hypothesis, Interpretation
7. **Sources** — Fix upload accept attribute
8. **Graph** — Minor cleanup

### Phase 4 — Low Priority (2-3 days)
9. **Reconsideration Triggers** — Frontend implementation
10. **Settings** — Implement actual settings

---

**End of Analysis Report. Awaiting your approval to proceed with Phase 1 implementation.**