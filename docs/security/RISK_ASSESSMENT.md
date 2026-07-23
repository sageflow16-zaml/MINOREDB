# Risk Assessment & Mitigation Plan — Project Minore

**Date:** 2026-07-20

---

## Risk Heatmap

```
CRITICAL  │         │         │         │         │
HIGH      │   ① ② ③│         │         │         │
MEDIUM    │   ④ ⑤  │   ⑥ ⑦   │   ⑧     │         │
LOW       │   ⑨ ⑩  │   ⑪ ⑫   │   ⑬ ⑭   │         │
INFO      │         │   ⑮     │         │   ⑯     │
          ──────────────────────────────────────────
           IMMEDIATE  SHORT-TERM  MID-TERM  LONG-TERM
```

**Legend:**
1. Default JWT secret in production
2. Broker credentials in plaintext
3. `.env` file in version control
4. No rate limiting
5. No password complexity
6. No audit logging
7. Weak CORS defaults
8. No CSP in frontend
9. Docker as root
10. No security headers in nginx
11. In-memory rate limiter per-process
12. No role-based authorization
13. No secrets scanning in CI
14. No webhook auth bypass
15. API key dependency unused
16. Token revocation on logout

---

## Risk Register

| ID | Risk | Likelihood | Impact | Score | Status |
|----|------|-----------|--------|-------|--------|
| R1 | JWT secret brute-forced leading to token forgery | LOW | CRITICAL | HIGH | ✅ **Mitigated** — validation + production guard |
| R2 | Broker API keys leaked from DB | MEDIUM | HIGH | HIGH | ✅ **Mitigated** — encrypted at rest |
| R3 | Credentials in git history | MEDIUM | HIGH | HIGH | ✅ **Mitigated** — gitignored + CI scan |
| R4 | Brute force password attack | MEDIUM | MEDIUM | MEDIUM | ✅ **Mitigated** — rate limiting enabled |
| R5 | Weak password leading to account compromise | MEDIUM | MEDIUM | MEDIUM | ✅ **Mitigated** — password validation |
| R6 | XSS due to missing CSP | LOW | MEDIUM | MEDIUM | ✅ **Mitigated** — CSP added to HTML |
| R7 | Clickjacking attack | LOW | MEDIUM | MEDIUM | ✅ **Mitigated** — X-Frame-Options: DENY |
| R8 | ReDoS via request bodies | LOW | MEDIUM | LOW | ✅ **Mitigated** — request size limit |
| R9 | Container escape via root process | LOW | HIGH | MEDIUM | ✅ **Mitigated** — non-root user |
| R10 | Token replay after logout | LOW | MEDIUM | LOW | ⚠️ **Acknowledged** — stateless JWT |
| R11 | Project ID enumeration attack | LOW | MEDIUM | LOW | ⚠️ **Acknowledged** — needs ownership cross-check |
| R12 | Dependency with known CVE | LOW | HIGH | MEDIUM | ⚠️ **Monitoring** — CI audit in place |

---

## Mitigation Plan

### Immediate (Week 1)
| Action | Owner | Status |
|--------|-------|--------|
| Set strong JWT_SECRET_KEY in production | DevOps | ✅ Implemented |
| Rotate any exposed credentials | DevOps | ⚠️ Manual |
| Enable rate limiting in production | DevOps | ✅ Implemented |
| Verify CSP is not breaking functionality | FE | ⚠️ Test |

### Short-Term (Week 2-3)
| Action | Owner | Status |
|--------|-------|--------|
| Add Redis rate limiter for multi-instance | BE | ⏳ Planned |
| Webhook route: bypass JWT for TradingView | BE | ⏳ Planned |
| Add project ownership cross-check to all routes | BE | ⏳ Planned |
| Implement token blacklist store | BE | ⏳ Planned |

### Mid-Term (Month 2)
| Action | Owner | Status |
|--------|-------|--------|
| Add role-based access control | BE | 📋 Backlog |
| Pre-commit secrets scanning hook | DevOps | 📋 Backlog |
| Penetration testing | Security | 📋 Backlog |
| File upload type/size validation | BE | 📋 Backlog |

### Long-Term (Quarterly)
| Action | Owner | Status |
|--------|-------|--------|
| Bug bounty program | Security | 📋 Backlog |
| SOC 2 / ISO 27001 readiness | Compliance | 📋 Backlog |
| Audit logging dashboard | FE/BE | 📋 Backlog |
