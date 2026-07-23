# Contributing to Project Minore

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## Getting Started

1. Read the [README](../../README.md) and [Architecture Guide](../architecture/OVERVIEW.md)
2. Set up [Local Development](../deployment/LOCAL.md)
3. Review open issues for good first bugs
4. Join discussions on pull requests

## Development Workflow

```
1. Pick an issue or feature
2. Create a feature branch: git checkout -b feat/my-feature
3. Make changes with tests
4. Run tests locally
5. Push and open a pull request
6. Address review feedback
7. Merge after approval
```

## Branch Naming

| Pattern | Purpose |
|---------|---------|
| `feat/description` | New features |
| `fix/description` | Bug fixes |
| `refactor/description` | Code restructuring |
| `docs/description` | Documentation |
| `test/description` | Test additions |
| `chore/description` | Maintenance |

## Commit Convention

We use conventional commits:

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`

**Examples:**
```
feat(broker): add Binance provider implementation
fix(auth): handle expired refresh token gracefully
security(api): encrypt broker credentials at rest
docs(architecture): update system overview diagram
```

## Coding Standards

### Python (Backend)

- **Formatter:** Black (default config)
- **Imports:** isort (google-style)
- **Typing:** Use type hints everywhere
- **Naming:** `snake_case` for functions/variables, `PascalCase` for classes, `UPPER_CASE` for constants
- **Docstrings:** Google-style docstrings for public APIs
- **Patterns:** Services handle business logic, routes are thin wrappers, CRUD files for DB queries

### TypeScript/React (Frontend)

- **Formatter:** Prettier (default config)
- **Naming:** `PascalCase` for components/files, `camelCase` for functions/variables, `UPPER_CASE` for constants
- **Typing:** Avoid `any` - use proper types or `unknown`
- **Components:** Functional components with hooks, no class components
- **State:** React Query for server state, Context for auth/project, local state for UI
- **CSS:** Tailwind utility classes, no custom CSS unless necessary

## Pull Request Checklist

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No new warnings
- [ ] Documentation updated if API/behavior changed
- [ ] Commit messages follow convention

## Testing Requirements

- **Bug fixes:** Add a test that catches the bug
- **New features:** Add tests for the new code
- **UI components:** Add component tests via Testing Library
- **Backend logic:** Add pytest integration tests

## Security

- Never commit secrets, API keys, or passwords
- Never log sensitive data (passwords, tokens, credentials)
- All credentials in environment variables, never hardcoded
- Run `git diff --staged` before commit to check for secrets
- Report security issues privately
