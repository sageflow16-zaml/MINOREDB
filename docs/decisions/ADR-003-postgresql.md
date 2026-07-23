# ADR-003: PostgreSQL as Primary Database

**Status:** Accepted
**Date:** 2026

## Context

Need a database for trading data with complex relationships, flexible schemas for ICT/broker configurations, vector search for knowledge graph, and JSON support for semi-structured broker data.

## Decision

Use **PostgreSQL 16** with **SQLAlchemy 2.0** ORM.

## Consequences

**Positive:**
- JSONB columns for flexible broker configurations and raw trade data
- UUID primary keys for distributed-friendly IDs
- Rich indexing (B-tree, GiST, GIN)
- ACID compliance for financial data integrity
- Excellent tooling (Alembic, pgAdmin, pg_dump)
- Hosted options: Railway, RDS, Supabase
- Full-text search via tsvector

**Negative:**
- Heavier resource usage than SQLite
- Requires running a server process
- Connection pooling management needed
- Migration management overhead

## Alternatives Considered

- **MongoDB:** Lacks ACID across documents, weaker query capabilities
- **SQLite:** No concurrent write support, limited JSON functions
- **TimescaleDB:** Overkill for current scale, consider if tick data becomes primary
- **MySQL:** Weaker JSON support, less consistent with async ORMs
