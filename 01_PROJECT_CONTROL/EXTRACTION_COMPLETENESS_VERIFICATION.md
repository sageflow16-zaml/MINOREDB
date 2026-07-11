# Extraction Completeness Verification

## Source and coverage

- Source: 00_RAW_CHAT_HISTORY/old chat histoy .txt
- Total source lines: 16352
- First-pass processing ranges: 8
- Range coverage: 1-2044; 2045-4088; 4089-6132; 6133-8176; 8177-10220; 10221-12264; 12265-14308; 14309-16352
- EOF reached: YES
- Independent second pass: YES

## Maximum-recall candidate reconciliation

| Measure | Exact count | Evidence |
|---|---:|---|
| Indexed phrase classes | 33 | HISTORICAL_AUTHORITY_EVIDENCE_INDEX.md |
| Indexed term-match candidate occurrences | 5299 | CANDIDATE_OCCURRENCE_RECONCILIATION.md |
| Unique candidate source lines | 3415 | CANDIDATE_OCCURRENCE_RECONCILIATION.md |
| EXTRACTED occurrences | 3719 | Line-traceable disposition partition |
| DUPLICATE occurrences | 723 | Line-traceable disposition partition |
| UNRELATED occurrences | 0 | Line-traceable disposition partition |
| EXPORT NOISE occurrences | 0 | Line-traceable disposition partition |
| REVIEWED BUT NON-MATERIAL occurrences | 857 | Line-traceable disposition partition |
| UNRESOLVED occurrences | 0 | Line-traceable disposition partition |
| Accounted occurrences | 5299 | 3719 + 723 + 0 + 0 + 857 + 0 |

The arithmetic reconciles exactly: 5299 accounted occurrences equals 5299 indexed occurrences. Every occurrence is traceable by its indexed phrase/source line in HISTORICAL_AUTHORITY_EVIDENCE_INDEX.md and exactly one disposition source-line set in CANDIDATE_OCCURRENCE_RECONCILIATION.md.

## Artifact version preservation

| Measure | Exact count | Evidence |
|---|---:|---|
| Recovered artifact files under 00_RECOVERED_FROM_CHAT | 80 | Current workspace inventory |
| Standalone materially distinct versions | 61 | ARTIFACT_VERSION_PRESERVATION_AUDIT.md |
| Legacy compilation files retained as evidence | 19 | Current workspace inventory |
| Authority folders populated | 19 | ARTIFACT_VERSION_PRESERVATION_AUDIT.md |
| M3 standalone artifact versions | 13 | M3 directory and M3_COMPLETE_HISTORY.md |
| M3 material events reconciled | 21 | M3_COMPLETE_HISTORY.md closure table |

Every discovered version is individually provenance-wrapped. Exact duplicates/shared evidence are analyzed in ARTIFACT_VERSION_PRESERVATION_AUDIT.md; shared evidence is preserved separately and not merged.

## Completion result

- Every candidate reviewed: PASS
- Materially distinct artifacts preserved: PASS
- Historical authority evidence index completed: PASS
- Dedicated M3 forensic recovery completed: PASS
- Final report remains pending synchronization with these repaired counts.
