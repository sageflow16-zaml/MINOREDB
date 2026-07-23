# Changelog

All notable changes to Project Minore are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-20

### Added
- Phase 5.4: Security audit report, risk assessment, credential encryption
- Phase 5.4: Nginx security headers, CSP, Docker non-root user
- Phase 5.4: Password validation, JWT_SECRET_KEY startup validation
- Phase 5.5: 32 documentation files across architecture/backend/frontend/database/api/ai/ict/deployment/testing/development/decisions/plugins/ai-knowledge-pack
- Phase 5.5: 6 Architecture Decision Records (FastAPI, React, PostgreSQL, Multi-Agent, Knowledge Graph, ICT Engines)
- Phase 5.5: AI Knowledge Pack (project summary, folder map, common workflows)
- Phase 5.6: docker-compose.yml with PostgreSQL, backend, frontend, Redis services
- Phase 5.6: Multi-stage backend Dockerfile (builder pattern)
- Phase 5.6: VERSION file + semver bump script
- Phase 5.6: Prometheus metrics endpoint with request count, latency, in-flight gauges
- Phase 5.6: GitHub release workflow (Docker build/push to GHCR, GitHub Release)
- Phase 5.6: CHANGELOG.md (Keep a Changelog format)
- Phase 5.6: 6 DevOps documentation files (deployment pipeline, monitoring, backup, release management, dashboards)
- Phase 5.7: V1 Certification Report (11-domain audit, scorecard, risk register)

### Changed
- Security hardening across auth, API, database, secrets, infrastructure
- APP_VERSION reads from VERSION file instead of hardcoded string
- prometheus-client added to Python dependencies

### Certified
- Project Minore v1.1.0 — PASS WITH MINOR IMPROVEMENTS (Overall Score: 8.09/10)

## [1.0.0] - 2026-07-10

### Added
- Phase 5.3: 75 frontend tests across 11 files
- Phase 5.3: Backend pytest configuration with 70% coverage fail-under
- Phase 5.3: CI workflow with frontend/backend/security jobs

## [0.9.0] - 2026-06-25

### Added
- Phase 5.2: Frontend tests with vitest, testing-library, jsdom

## [0.8.0] - 2026-06-15

### Added
- Phase 5.1: Backend API test infrastructure

## [0.7.0] - 2026-06-01

### Added
- Phase 4: Multi-intelligence agent system with registry, factory, engine interfaces
- Phase 4: Knowledge graph integration
- Phase 4: ICT engine support

## [0.6.0] - 2026-05-15

### Added
- Phase 3: Core API routes and business logic
- Phase 3: Authentication with JWT
- Phase 3: Broker integration

## [0.5.0] - 2026-05-01

### Added
- Phase 2: Database schema and migrations
- Phase 2: SQLAlchemy models
- Phase 2: Alembic migration infrastructure

## [0.4.0] - 2026-04-15

### Added
- Phase 1: FastAPI application skeleton
- Phase 1: Project structure
- Phase 1: Dockerfile and deployment config

## [0.1.0] - 2026-04-01

### Added
- Initial project scaffolding
