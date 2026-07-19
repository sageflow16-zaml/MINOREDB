"""Merge retrieved evidence into a single structured context, ordered by relevance."""

from uuid import UUID


# Max total characters for the context sent to the LLM
MAX_CONTEXT_CHARS = 12000

EVIDENCE_WEIGHTS: dict[str, int] = {
    "trade_debrief": 10,
    "trade_memory": 10,
    "personal_rule": 10,
    "trader_profile": 10,
    "personal_pattern": 9,
    "knowledge_rules": 9,
    "similarity": 8,
    "patterns": 8,
    "knowledge_graph": 7,
    "statistics": 6,
    "macro": 5,
    "learning": 4,
    "institutional_knowledge": 9,
}


def _truncate(obj, char_limit: int) -> str:
    """Convert object to string and truncate."""
    text = str(obj)
    if len(text) > char_limit:
        return text[:char_limit] + "... [truncated]"
    return text


def build_context(evidence: dict[str, object], question: str) -> str:
    """Merge all evidence into a ranked, formatted context string."""
    ranked = sorted(
        evidence.items(),
        key=lambda kv: EVIDENCE_WEIGHTS.get(kv[0], 0),
        reverse=True,
    )

    parts = [f"User Question: {question}", ""]
    total_chars = len(parts[0])

    for name, data in ranked:
        if not data:
            continue
        if name == "statistics":
            section = _format_statistics(data)
        elif name == "knowledge_rules":
            section = _format_rules(data)
        elif name == "knowledge_graph":
            section = _format_graph(data)
        elif name == "patterns":
            section = _format_patterns(data)
        elif name == "trade_memory":
            section = _format_memories(data)
        elif name == "similarity":
            section = _format_similarity(data)
        elif name == "macro":
            section = _format_macro(data)
        elif name == "institutional_knowledge":
            section = _format_institutional(data)
        elif name == "learning":
            section = _format_learning(data)
        elif name == "trade_debrief":
            section = _format_trade_debriefs(data)
        elif name == "personal_pattern":
            section = _format_personal_patterns(data)
        elif name == "personal_rule":
            section = _format_personal_rules(data)
        elif name == "trader_profile":
            section = _format_trader_profile(data)
        else:
            section = f"[{name}]\n{_truncate(data, 2000)}"

        if total_chars + len(section) > MAX_CONTEXT_CHARS:
            continue
        parts.append(section)
        total_chars += len(section)

    return "\n".join(parts)


def _format_statistics(data: dict) -> str:
    o = data.get("overview", {})
    r = data.get("risk", {})
    lines = ["[STATISTICS]"]
    if o.get("total_trades"):
        lines.append(f"Total trades: {o['total_trades']} | Wins: {o.get('wins',0)} | Losses: {o.get('losses',0)}")
        wr = o.get('win_rate', 0) or 0
        if wr > 1:
            wr = wr / 100
        lines.append(f"Win rate: {wr*100:.1f}% | Avg R:R: {o.get('avg_rr') or 0:.2f}")
        lines.append(f"Expectancy: {o.get('expectancy') or 0:.2f} | Profit factor: {r.get('profit_factor') or 0:.2f}")
        lines.append(f"Total P&L: {o.get('total_pnl') or 0:.2f} | Max drawdown: {r.get('max_drawdown') or 0:.2f}")
    return "\n".join(lines)


def _format_rules(data: list) -> str:
    lines = ["[KNOWLEDGE RULES]"]
    for r in data[:5]:
        wr = (r.get("win_rate", 0) or 0) * 100
        lines.append(f"- {r.get('title','?')}: {r.get('occurrences',0)} occurrences, {wr:.0f}% WR, avg R:R {r.get('avg_rr') or 0:.2f}, confidence {r.get('confidence') or 0:.1f}")
    return "\n".join(lines)


def _format_graph(data: dict) -> str:
    lines = ["[KNOWLEDGE GRAPH]"]
    lines.append(f"Nodes: {data.get('total_nodes',0)} | Edges: {data.get('total_edges',0)}")
    snap = data.get("snapshot")
    if snap and snap.get("summary"):
        lines.append(f"Summary: {snap['summary']}")
    return "\n".join(lines)


def _format_patterns(data: list) -> str:
    lines = ["[PATTERNS]"]
    for p in data[:5]:
        wr = (p.get("win_rate", 0) or 0) * 100
        lines.append(f"- {p.get('name','?')}: {p.get('total_occurrences',0)} occurrences, {wr:.0f}% WR, expectancy {p.get('expectancy') or 0:.2f}, confidence {p.get('confidence_score') or 0:.1f}")
    return "\n".join(lines)


def _format_memories(data: list) -> str:
    lines = ["[TRADE MEMORIES]"]
    for m in data[:5]:
        lines.append(f"- {m.get('pair','?')} {m.get('direction','?')} | Session: {m.get('session','?')} | Result: {m.get('result','?')}")
        lines.append(f"  RR: {m.get('rr','?')} | P&L: {m.get('pnl','?')} | Confidence: {m.get('confidence','?')}")
        if m.get("summary"):
            lines.append(f"  Summary: {m['summary']}")
    return "\n".join(lines)


def _format_similarity(data: list) -> str:
    lines = ["[SIMILAR TRADES]"]
    for s in data[:3]:
        lines.append(f"- Trade {s.get('trade_id','?')[:8]}... | Score: {s.get('similarity_score') or 0:.2f} | Result: {s.get('trade_result','?')} | RR: {s.get('rr','?')}")
    return "\n".join(lines)


def _format_macro(data: dict) -> str:
    lines = ["[MACRO EVENTS]"]
    for e in data.get("recent_events", [])[:5]:
        lines.append(f"- {e.get('event_name','?')} ({e.get('country','?')}) importance={e.get('importance','?')} actual={e.get('actual','?')} forecast={e.get('forecast','?')}")
    return "\n".join(lines)


def _format_institutional(data: dict) -> str:
    lines = ["[INSTITUTIONAL KNOWLEDGE]"]
    results = data.get("results", [])
    if results:
        for r in results[:5]:
            lines.append(f"- {r.get('title','?')} [{r.get('category','?')}]: {r.get('summary','') or r.get('definition','')}")
    rels = data.get("relationships", [])
    if rels:
        lines.append("")
        lines.append("Relationships:")
        for r in rels[:5]:
            lines.append(f"  {r.get('source','?')} --[{r.get('relationship_type','?')}]--> {r.get('target','?')}")
    examples = data.get("examples", [])
    if examples:
        lines.append("")
        lines.append("Examples:")
        for e in examples[:3]:
            lines.append(f"  {e.get('title','?')} ({e.get('pair','?')} {e.get('timeframe','?')})")
    summary = data.get("summary", {})
    if summary:
        lines.append(f"Total published concepts: {summary.get('total_concepts',0)}")
    return "\n".join(lines)


def _format_learning(data: dict) -> str:
    lines = ["[LEARNING EVENTS]"]
    for e in data.get("events", [])[:3]:
        lines.append(f"- {e.get('event_type','?')}: {e.get('summary','?')} (status={e.get('status','?')})")
    snap = data.get("latest_snapshot")
    if snap:
        lines.append(f"Snapshot: {snap.get('total_trades',0)} trades, {snap.get('win_rate',0)*100:.0f}% WR, growth={snap.get('knowledge_growth',0)}")
    return "\n".join(lines)


def _format_trade_debriefs(data: list) -> str:
    lines = ["[PERSONAL TRADE DEBRIEFS]"]
    for d in data[:3]:
        lines.append(f"- Trade {d.get('trade_id','?')[:8]}... | Rating: {d.get('overall_rating','?')}/10")
        if d.get("summary"):
            lines.append(f"  Summary: {d['summary']}")
        if d.get("lessons_learned"):
            lessons = d["lessons_learned"]
            if isinstance(lessons, list):
                for l in lessons[:2]:
                    lines.append(f"  Lesson: {l}")
        if d.get("mistakes"):
            mistakes = d["mistakes"]
            if isinstance(mistakes, list):
                for m in mistakes[:2]:
                    lines.append(f"  Mistake: {m}")
        if d.get("improvements"):
            improvements = d["improvements"]
            if isinstance(improvements, list):
                for i in improvements[:2]:
                    lines.append(f"  Improvement: {i}")
    return "\n".join(lines)


def _format_personal_patterns(data: list) -> str:
    lines = ["[PERSONAL PATTERNS]"]
    for p in data[:5]:
        wr = (p.get("win_count", 0) / max(p.get("occurrence_count", 1), 1)) * 100
        lines.append(f"- {p.get('name','?')} ({p.get('category','?')}): {p.get('occurrence_count',0)} occurrences, {wr:.0f}% WR, avg R:R {p.get('avg_rr') or 0:.2f}, confidence {p.get('confidence') or 0:.1f}")
    return "\n".join(lines)


def _format_personal_rules(data: list) -> str:
    lines = ["[PERSONAL RULES]"]
    for r in data[:5]:
        status = r.get("status", "?")
        lines.append(f"- {r.get('title','?')} [{r.get('category','?')}] v{r.get('version',1)} ({status})")
        if r.get("description"):
            lines.append(f"  {r['description']}")
        stats = r.get("supporting_stats") or {}
        if stats:
            lines.append(f"  WR: {stats.get('win_rate', '?')}, R:R: {stats.get('avg_rr', '?')}, confidence: {stats.get('confidence', '?')}")
    return "\n".join(lines)


def _format_trader_profile(data: dict) -> str:
    lines = ["[TRADER PROFILE]"]
    if data.get("strengths"):
        strengths = data["strengths"]
        if isinstance(strengths, list):
            lines.append(f"Strengths: {', '.join(strengths[:3])}")
    if data.get("weaknesses"):
        weaknesses = data["weaknesses"]
        if isinstance(weaknesses, list):
            lines.append(f"Weaknesses: {', '.join(weaknesses[:3])}")
    if data.get("discipline_score") is not None:
        lines.append(f"Discipline score: {data['discipline_score']:.1f}/100")
    if data.get("rule_adherence"):
        ra = data["rule_adherence"]
        if isinstance(ra, dict):
            lines.append(f"Rule adherence: {ra}")
    if data.get("performance_trends"):
        pt = data["performance_trends"]
        if isinstance(pt, dict):
            lines.append(f"Performance trends: {pt}")
    lines.append(f"Trades analyzed: {data.get('total_trades_analyzed',0)} | Debriefs: {data.get('total_debriefs',0)} | Active patterns: {data.get('active_patterns',0)} | Approved rules: {data.get('approved_rules',0)}")
    if data.get("improvement_suggestions"):
        suggestions = data["improvement_suggestions"]
        if isinstance(suggestions, list):
            for s in suggestions[:3]:
                lines.append(f"Suggestion: {s}")
    return "\n".join(lines)
