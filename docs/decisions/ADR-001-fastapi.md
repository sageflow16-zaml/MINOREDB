# ADR-001: FastAPI as Backend Framework

**Status:** Accepted
**Date:** 2026

## Context

Need a Python web framework for a trading analytics platform with AI integration, real-time data processing, and extensive API surface (46+ route modules).

## Decision

Use **FastAPI** with Python 3.12+.

## Consequences

**Positive:**
- Native async support for I/O-bound operations
- Pydantic v2 integration for automatic request/response validation
- Auto-generated OpenAPI docs (Swagger/Redoc)
- High performance (on par with Node.js/Go)
- Dependency injection system simplifies auth and DB session management
- Large ecosystem compatible with Python data science stack (numpy, pandas)

**Negative:**
- Less mature than Django for large monolithic applications
- ORM-agnostic (requires separate SQLAlchemy setup)
- Smaller job market than Django/Flask
- No built-in admin interface

## Alternatives Considered

- **Django:** Too opinionated, heavy ORM coupling, synchronous by default
- **Flask:** Too minimal, requires significant boilerplate for large API surface
- **Starlette:** Lower-level than needed (FastAPI is built on Starlette)
