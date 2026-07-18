# Architecture

## Overview

Project Minore follows a three-tier architecture:

1. **Frontend** — React SPA with shadcn/ui design system
2. **Backend** — FastAPI monolith with service-oriented internal architecture
3. **Extension** — Chrome Extension for FXReplay integration

## Backend Architecture

### Request Flow

```
Client → FastAPI → Middleware → Router → Dependency Injection → Route Handler → CRUD/Service → Database
```

### Service Layer

- **CRUD Layer**: Direct database operations per entity
- **Engines**: Domain logic (similarity, pattern discovery, decision support)
- **AI Services**: LLM-powered analysis (analyst, research)
- **Background Tasks**: Continuous learning pipeline

### Database

- PostgreSQL 16 with SQLAlchemy 2.0 ORM
- Alembic for schema migrations
- Foreign keys with cascade deletes
- UUID primary keys

## Frontend Architecture

### State Management

- React Query for server state (caching, invalidation, optimistic updates)
- React Context for auth state
- Local component state for UI state

### Routing

- React Router v6 with lazy-loaded routes
- 30+ pages organized by domain

## Extension Architecture

See [Extension.md](Extension.md).
