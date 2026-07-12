# BACKEND PROJECT STRUCTURE
## Project Minore

**Status:** PROPOSED

```
backend/
├── alembic/
│   ├── versions/
│   └── __init__.py
├── src/
│   ├── api/
│   │   ├── v1/
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── core/
│   │   └── __init__.py
│   ├── crud/
│   │   └── __init__.py
│   ├── db/
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   └── __init__.py
└── tests/
    ├── api/
    │   └── __init__.py
    ├── crud/
    │   └── __init__.py
    ├── services/
    │   └── __init__.py
    └── __init__.py
```