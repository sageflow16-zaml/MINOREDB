# Release Management

## Versioning

Project Minore follows [Semantic Versioning 2.0.0](https://semver.org/).

Given a version `MAJOR.MINOR.PATCH`:

- **MAJOR** — Incompatible API changes or breaking database migrations
- **MINOR** — New features in a backward-compatible manner
- **PATCH** — Bug fixes, security patches, non-functional improvements

### Version Storage

- Single source of truth: `VERSION` file at repository root
- Embedded in API: `GET /version` returns `{"version": "X.Y.Z"}`
- Build-time: `docker build` uses `VERSION` file for image labels

### Bumping

```bash
# Patch bump (1.1.0 → 1.1.1)
python scripts/bump_version.py patch

# Minor bump (1.1.0 → 1.2.0)
python scripts/bump_version.py minor

# Major bump (1.1.0 → 2.0.0)
python scripts/bump_version.py major
```

The script updates:
- `VERSION` file
- `APP_VERSION` in `backend/src/main.py`

## Release Process

### 1. Prepare Release

```bash
# Ensure you're on main with latest changes
git checkout main
git pull

# Bump version
python scripts/bump_version.py minor   # or patch / major

# Update CHANGELOG.md with release date and notes
# Commit the version bump
git add VERSION CHANGELOG.md backend/src/main.py
git commit -m "chore: bump version to $(cat VERSION)"

# Push to main
git push origin main
```

### 2. Tag Release

```bash
# Create and push tag
git tag -a "v$(cat VERSION)" -m "Release v$(cat VERSION)"
git push origin "v$(cat VERSION)"
```

### 3. CI/CD Trigger

The `release.yml` workflow automatically:

1. Verifies VERSION file matches git tag
2. Builds and pushes Docker images to GHCR
3. Creates GitHub Release with changelog excerpt

### 4. Post-Release

- Verify deployment in staging environment
- Monitor error rates and latency in production
- Announce release to team

## Hotfix Process

For critical bugs in production:

```bash
# Branch from the release tag
git checkout v1.1.0
git checkout -b hotfix/v1.1.1

# Apply fix
# Commit changes
git commit -m "fix: critical bug description"

# Bump patch version
python scripts/bump_version.py patch

# Merge to main and develop
git checkout main
git merge hotfix/v1.1.1
git push origin main

# Tag hotfix release
git tag -a "v$(cat VERSION)" -m "Hotfix v$(cat VERSION)"
git push origin "v$(cat VERSION)"

# Cleanup
git branch -d hotfix/v1.1.1
```

## Changelog

Maintained in `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

### Categories

- **Added** — New features, endpoints, modules
- **Changed** — Changes in existing functionality
- **Deprecated** — Soon-to-be-removed features
- **Removed** — Removed features
- **Fixed** — Bug fixes
- **Security** — Security patches

## Deployment Checklist

### Pre-Deployment

- [ ] All CI checks pass (tests, lint, security)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in VERSION file
- [ ] Docker images built and tagged
- [ ] Database migrations reviewed and tested
- [ ] Release notes drafted

### Deployment

- [ ] DB migration run (read-only first, then write)
- [ ] Backend deployed (staggered if multi-replica)
- [ ] Health check confirmed (`/health`, `/readiness`)
- [ ] Metrics and logs observed for 5 minutes
- [ ] Frontend deployed (cache-busting build)
- [ ] E2E smoke tests pass

### Post-Deployment

- [ ] Error rate < 1% over 15 minutes
- [ ] p95 latency < 2s
- [ ] All agents registered correctly
- [ ] Auth flow verified (login, register, refresh)
- [ ] Monitor dashboards for anomalies
