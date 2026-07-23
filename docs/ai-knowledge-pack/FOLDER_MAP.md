# Project Folder Map

## Backend (`backend/src/`)

```
src/
├── main.py                  # App entry: middleware, routes, exception handlers
├── core/                    # Cross-cutting concerns
│   ├── config.py            # All env vars + validation
│   ├── jwt.py               # JWT create/decode
│   ├── security.py          # bcrypt, CORS, TrustedHost
│   ├── crypto.py            # Fernet credential encryption
│   ├── audit.py             # Security event logging
│   └── logging.py           # JSON/Human log formatters
├── api/                     # HTTP layer
│   ├── deps.py              # DI: DB, auth, project
│   ├── middleware.py         # 4 middleware classes
│   ├── handlers.py           # Exception handlers
│   ├── router.py             # Aggregates 46 route modules
│   └── routes/               # 46 endpoint modules
├── db/                      # Database
│   ├── session.py            # Engine + Session + Base
│   └── base.py               # Model imports for Alembic
├── models/                   # 38 SQLAlchemy models
├── schemas/                  # 31 Pydantic schemas
├── crud/                     # 21 CRUD modules
├── services/                 # Business logic
│   ├── ai/                  # LLM, RAG, embeddings (18 files)
│   └── research/            # Research engine (6 files)
├── agents/                   # 8 AI agents + orchestrator
├── brain/                    # 7 trading brain engines
├── ict/                      # 8 ICT detection engines
├── broker/                   # Broker abstraction
│   └── providers/           # 11 provider implementations
└── collectors/               # Data collectors
    └── macro/               # Macroeconomic collector
```

## Frontend (`frontend/src/`)

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root + routing
├── auth/                    # Auth context + token storage
├── api/                     # 45 API service modules
├── services/
│   └── api.ts               # Axios instance + interceptors
├── hooks/                   # 41 custom hooks
├── components/              # UI components
│   ├── ui/                  # 47 design system components
│   ├── chart/               # Chart rendering
│   ├── graph/               # Knowledge graph
│   ├── ict/                 # ICT controls
│   ├── panels/              # Side panels
│   └── workspace/           # Workspace layout
├── pages/                   # 98 page components
├── layouts/                 # Layout components
├── routes/                  # Route definitions
├── context/                 # React contexts
├── theme/                   # Theme provider
├── types/                   # TypeScript types
├── lib/                     # Utilities
└── tests/                   # 11 test files
```

## Key Coding Patterns

### Backend Route Pattern
```python
@router.get("/resource")
def list_resources(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Authorization check
    project = get_project_or_404(project_id, db)
    if project.user_id != current_user.id:
        raise HTTPException(403, "Forbidden")
    # Business logic
    return service.list(project_id)
```

### Frontend Hook Pattern
```typescript
export function useTrades(projectId: string) {
  return useQuery({
    queryKey: ['trades', projectId],
    queryFn: () => api.getTrades(projectId),
    enabled: !!projectId,
  });
}
```

### Service Pattern
- Routes are thin (request validation + call service)
- Services contain business logic
- CRUD files contain database query logic
- Models define table structure only

### Naming Conventions
- **Python:** `snake_case` for functions/variables, `PascalCase` for classes
- **TypeScript:** `camelCase` for functions/variables, `PascalCase` for components/files
- **Files:** Match the primary export name (lowercase for utils, PascalCase for components)
- **Database:** `snake_case` table/column names
