# Common Workflows — Project Minore

## 1. Adding a New API Endpoint

```python
# 1. Create route file (if new domain)
# backend/src/api/routes/my_domain.py
router = APIRouter()

@router.get("/items")
def list_items(project_id: UUID, db: Session = Depends(get_db)):
    return service.list(project_id)

# 2. Register in router.py
from src.api.routes.my_domain import router as my_domain_router
api_router.include_router(my_domain_router, prefix="/projects/{project_id}/my-domain")

# 3. Add frontend API service
# frontend/src/api/myDomain.ts
export const myDomainApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/my-domain/items`),
};

# 4. Add frontend hook
# frontend/src/hooks/useMyDomain.ts
export function useMyDomain(projectId: string) {
  return useQuery({ queryKey: ['myDomain', projectId], queryFn: () => myDomainApi.list(projectId) });
}
```

## 2. Running ICT Analysis

```python
# Backend: ICT engine is triggered via API
# POST /api/v1/projects/{id}/ict/analyze
# Body: { "symbol": "EURUSD", "timeframe": "1h", "data": [...] }

# The flow:
# 1. routes.py receives request
# 2. ICTAnalyzer orchestrates all engines
# 3. Each engine processes OHLC data independently
# 4. Scoring engine computes confluence
# 5. Results stored in PostgreSQL
# 6. Response returned: structures, events, setups, bias
```

## 3. Syncing Broker Trades

```python
# 1. User connects broker via /api/v1/projects/{id}/broker/connections
# 2. POST /connections/{id}/sync triggers SyncEngine.sync_all_accounts()
# 3. SyncEngine:
#    a. Creates provider from registry (e.g., BinanceProvider)
#    b. Connects using stored credentials
#    c. Fetches accounts
#    d. For each account: syncs trade history
#    e. Deduplicates via import_hash (SHA256 of external_id + symbol + times)
#    f. Updates broker_account balances
#    g. Records sync history
# 4. Frontend polls sync status via GET /connections/{id}/sync
```

## 4. Trade Journal with AI Enrichment

```typescript
// 1. User creates a trade entry
const { data } = await api.post(`/projects/${id}/trades`, tradeData);

// 2. Backend stores trade and triggers brain analysis
// Brain engines run asynchronously:
//   - DecisionEngine: evaluates trade quality
//   - LearningEngine: detects learning observations
//   - InsightsEngine: generates insights
//   - SimilarityEngine: finds similar historical trades
//   - MemoryEngine: stores in long-term memory
//   - DNAEngine: updates trader profile

// 3. Trade memory enriched:
const tradeMemory = await api.get(`/projects/${id}/memories/${tradeId}`);
// Returns: session context, entry model, strengths, weaknesses, lessons, tags

// 4. User views enriched trade in frontend
```

## 5. Knowledge Graph Navigation

```typescript
// 1. Get graph data
const { nodes, edges } = await api.get(`/projects/${id}/graph`);

// 2. Frontend renders with React Flow
// Nodes: trades, concepts, claims, strategies
// Edges: relationships (related_to, caused, supports, contradicts)

// 3. Click a node to see details
const nodeDetails = await api.get(`/projects/${id}/graph/nodes/${nodeId}`);

// 4. Refresh graph (re-index)
await api.post(`/projects/${id}/graph/refresh`);
```

## 6. Debugging a New ICT Engine

```python
# 1. Create engine file in src/ict/
# class MyEngine:
#     def detect(self, data: list[OHLCBar]) -> list[MyResult]:
#         ...

# 2. Add model + migration
# 3. Add schema
# 4. Integrate into ICTAnalyzer (ict/services.py)
# 5. Add API endpoint
# 6. Test via pytest
# 7. Frontend visualization in ICTSmartEngine.tsx
```

## 7. Adding a Frontend Test

```typescript
// frontend/src/tests/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../../components/ui/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## 8. Debugging Authentication Issues

```bash
# 1. Check if JWT_SECRET_KEY is set
echo $JWT_SECRET_KEY

# 2. Verify token validity
# Decode token (without verification) at jwt.io or:
python -c "import jwt; print(jwt.decode('TOKEN', options={'verify_signature': False}))"

# 3. Check rate limiting
# If getting 429, check RATE_LIMIT_PER_MINUTE setting

# 4. Check CORS
# If getting CORS errors in browser:
# - Verify CORS_ORIGINS includes your frontend URL
# - Check frontend VITE_API_URL matches backend

# 5. Check database connectivity
curl http://localhost:8000/readiness
# Should return: {"status": "ready", "database": "connected"}
```
