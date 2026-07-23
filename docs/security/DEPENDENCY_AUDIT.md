# Dependency Audit — Project Minore

**Date:** 2026-07-20

---

## Python Dependencies (`backend/requirements.txt`)

### Direct Dependencies

| Package | Version Range | Installed | Latest | CVEs | Risk | Notes |
|---------|--------------|-----------|--------|------|------|-------|
| fastapi | ≥0.115.0, <1.0.0 | 0.115.x | 0.115.x | None known | LOW | Actively maintained |
| python-multipart | ≥0.0.9, <1.0.0 | 0.0.x | 0.0.x | None known | LOW | Required for file uploads |
| uvicorn | ≥0.30.0, <1.0.0 | 0.30.x | 0.30.x | None known | LOW | Production ASGI server |
| sqlalchemy | ≥2.0.30, <3.0.0 | 2.0.x | 2.0.x | None known | LOW | ORM, actively maintained |
| psycopg2-binary | ≥2.9.9, <3.0.0 | 2.9.x | 2.9.x | None known | LOW | PostgreSQL driver |
| pydantic | ≥2.9.0, <3.0.0 | 2.9.x | 2.9.x | None known | LOW | Validation layer |
| pydantic-settings | ≥2.5.0, <3.0.0 | 2.5.x | 2.5.x | None known | LOW | Settings management |
| alembic | ≥1.13.0, <2.0.0 | 1.13.x | 1.13.x | None known | LOW | DB migrations |
| numpy | ≥2.0.0, <3.0.0 | 2.0.x | 2.0.x | None known | LOW | Numerical computing |
| bcrypt | ≥4.2.0, <5.0.0 | 4.2.x | 4.2.x | None known | LOW | Password hashing |
| PyJWT | ≥2.10.0, <3.0.0 | 2.10.x | 2.10.x | None known | LOW | JWT implementation |
| cryptography | ≥42.0.0, <44.0.0 | 42.0.x | 43.x | None known | LOW | **NEW** — credential encryption |
| pytest | ≥8.0.0, <9.0.0 | 8.x | 8.x | N/A | LOW | Dev dependency |
| httpx | ≥0.27.0, <1.0.0 | 0.27.x | 0.28.x | N/A | LOW | Test HTTP client |

### Transitive Dependencies (Notable)

| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| starlette | ≥0.40.0 | LOW | FastAPI dependency, actively maintained |
| anyio | ≥4.0.0 | LOW | Async runtime |
| certifi | latest | LOW | TLS certificate bundle |

### Python Action Items
- All dependencies are within major supported versions
- Consider adding `safety` or `pip-audit` to CI

---

## Node Dependencies (`frontend/package.json`)

### Core Runtime

| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| react | ^18.3.1 | LOW | LTS, actively maintained |
| react-dom | ^18.3.1 | LOW | LTS |
| react-router-dom | ^7.0.2 | LOW | Latest major |
| axios | ^1.7.7 | LOW | HTTP client, actively maintained |
| @tanstack/react-query | ^5.59.16 | LOW | Data fetching |
| recharts | ^2.13.3 | LOW | Charts |
| lightweight-charts | ^4.1.3 | LOW | Trading charts |
| framer-motion | ^11.11.17 | LOW | Animation |
| zustand | ^5.0.1 | LOW | State management |
| tailwindcss | ^3.4.14 | LOW | CSS framework |
| react-hook-form | ^7.53.2 | LOW | Forms |
| @radix-ui/* | various | LOW | UI primitives |

### Dev Dependencies (Security-Relevant)

| Package | Version | Risk | Notes |
|---------|---------|------|-------|
| typescript | ^5.6.3 | LOW | Type safety |
| vitest | ^4.1.10 | LOW | Test runner |
| @testing-library/react | ^16.3.2 | LOW | Testing utilities |
| jsdom | ^29.1.1 | LOW | DOM environment for tests |

### Dependency License Summary

| License | Count | Notes |
|---------|-------|-------|
| MIT | 200+ | Permissive, standard |
| Apache 2.0 | 20+ | Compatible with MIT |
| ISC | 10+ | Permissive, equivalent to MIT |
| BSD | 5+ | Permissive |
| Unlicense | 2+ | Public domain equivalent |
| **GPL** | **0** | ✅ No copyleft dependencies |

---

## Docker Images

| Image | Version | Risk | Notes |
|-------|---------|------|-------|
| python | 3.12-slim | LOW | Official, regularly patched |
| node | 20-alpine | LOW | Official, used only for build |
| nginx | alpine | LOW | Official, minimal surface |
| postgres | 16-alpine | LOW | Official (test/CI only) |

### Docker Action Items
- [ ] Pin image digests (not just tags) for production
- [ ] Add `docker scout` or `trivy` scan to CI
- [ ] Use distroless base image for production runtime

---

## Vulnerability Scanning

### Recommended Tools

| Tool | Target | When | Purpose |
|------|--------|------|---------|
| `npm audit` | Node packages | CI | Known CVE check |
| `pip-audit` or `safety` | Python packages | CI | Known CVE check |
| `trivy` | Docker images | CI | OS package CVEs |
| `gitleaks` | Git history | Pre-commit / CI | Secrets leak detection |
| `semgrep` | Source code | CI | SAST scanning |

### CI Integration Status

| Scan | Status | Notes |
|------|--------|-------|
| `npm audit` | ✅ **NEW** | Runs in CI `security` job |
| Secrets grep | ✅ **NEW** | Basic secret pattern checking in CI |
| `pip-audit` | ❌ | Requires CI setup |
| Trivy | ❌ | Requires CI setup |
| SAST | ❌ | Requires CI setup |

---

## Outdated Dependency Check

Key dependencies to watch for deprecation:
- `psycopg2-binary` → consider migrating to `psycopg` (v3) which is already in code via `postgresql+psycopg://`
- `@tanstack/react-query` v5 → v6 is available (breaking changes)
- `framer-motion` v11 → v12 available
- `recharts` 2.x → 3.x beta available
