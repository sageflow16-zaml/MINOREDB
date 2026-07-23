# Authentication & Authorization — Backend

## Authentication

### Password Hashing

```python
# backend/src/core/security.py
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

### JWT Tokens

```python
# backend/src/core/jwt.py
# Access token: 30 min expiry, HS256, payload = {sub, exp, type: "access"}
# Refresh token: 7 day expiry, HS256, payload = {sub, exp, type: "refresh"}
# Tokens are rotated on every refresh
```

### Auth Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/register` | POST | None | Create account + return tokens |
| `/api/v1/auth/login` | POST | None | Authenticate + return tokens |
| `/api/v1/auth/refresh` | POST | None | Rotate tokens using refresh token |
| `/api/v1/auth/logout` | POST | JWT | Log audit event (stateless) |
| `/api/v1/auth/me` | GET | JWT | Return current user profile |

### Password Validation (Registration)

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- Email format validated (regex)

### Rate Limiting

- Default: 60 requests per minute per IP
- Applied to all routes via middleware
- Returns `429 Too Many Requests` with `Retry-After` header
- In-memory sliding window (per-process; use Redis for multi-instance)

## Authorization

### Model

- **Ownership-based**: Users own Projects; Projects own all child resources
- **Project CRUD**: Every endpoint checks `project.user_id == current_user.id`
- **Router-level JWT**: All `/api/v1/*` routes require `get_current_user` by default
- **No roles**: User model has no role/permissions field (single-tenant per user)

### Dependency Chain

```
get_current_user
  ├── HTTPBearer (checks Authorization header)
  ├── decode_token (validates JWT signature + expiry)
  ├── db.query(User).filter(User.id == payload.sub).first()
  └── user.is_active check (403 if disabled)
```

### API Key Auth (optional)

- `X-API-Key` header supported via `verify_api_key` dependency
- Constant-time comparison to prevent timing attacks
- Configured via `API_KEY` env var
- Currently available for future machine-to-machine use

## Audit Logging

Security events are logged via `src/core/audit.py`:

| Event | Trigger |
|-------|---------|
| `register` | New user registration |
| `login` | Successful authentication |
| `login_failed` | Failed authentication attempt |
| `logout` | Explicit logout |
| `token_refresh` | Token rotation |
| `account_disabled` | Disabled account access attempt |
