# LOGICAL INFORMATION MODEL
## Project Minore

**Status:** PROPOSED

---

## 1. Referenced Canonical Objects

The following objects from `CANONICAL_OBJECT_CATALOG.md` are utilized in this model:

- `Source`
- `Claim`
- `Concept`
- `Association`
- `Conflict`
- `Interpretation`
- `Reconsideration Trigger`
- `Research Question`
- `Hypothesis`

---

## 2. Explicitly Authorized Logical Relationships

### Relationship 1
- **Source Object**: `Source`
- **Target Object**: `Claim`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Source yields... extracted Claims"

### Relationship 2
- **Source Object**: `Claim`
- **Target Object**: `Concept`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Claim may be associated with... Concepts"

### Relationship 3
- **Source Object**: `Conflict`
- **Target Object**: `Claim`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Epistemic Conflict relationship exists between... Claims"

### Relationship 4
- **Source Object**: `Interpretation`
- **Target Object**: `Concept`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Concept has... Reference Interpretation"

### Relationship 5
- **Source Object**: `Interpretation`
- **Target Object**: `Reconsideration Trigger`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Interpretation’s current state is linked to... Trigger events"

### Relationship 6
- **Source Object**: `Hypothesis`
- **Target Object**: `Research Question`
- **Authority Source**: `PROJECT_DOMAIN_MODEL.md`
- **Evidence**: "Hypothesis is formulated in response to... Research Question"
