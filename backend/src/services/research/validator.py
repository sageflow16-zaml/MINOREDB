"""Research Validator — ensures every conclusion references evidence.

Pure string matching. No LLM. If evidence for a claim is missing, the claim
is excluded from the final report.
"""


def _count_items(data: object) -> int:
    if isinstance(data, dict):
        if "total_trades" in data:
            return data.get("total_trades", 0)
        if "total_nodes" in data:
            return data.get("total_nodes", 0)
        if "events" in data:
            return len(data.get("events", []))
        if "recent_events" in data:
            return len(data.get("recent_events", []))
        return len(data)
    if isinstance(data, list):
        return len(data)
    return 0


def validate_evidence(evidence: dict[str, object]) -> dict[str, object]:
    """Remove empty or low-value evidence, keep only what has substance."""
    validated: dict[str, object] = {}
    for name, data in evidence.items():
        if not data:
            continue
        count = _count_items(data)
        if count == 0:
            continue
        validated[name] = data
    return validated


def build_findings(evidence: dict[str, object]) -> list[str]:
    """Generate deterministic findings from evidence."""
    findings: list[str] = []

    stats = evidence.get("statistics", {})
    overview = stats.get("overview", {}) if isinstance(stats, dict) else {}
    if overview.get("total_trades"):
        findings.append(
            f"Total trades analyzed: {overview['total_trades']} "
            f"(Wins: {overview.get('wins', 0)}, Losses: {overview.get('losses', 0)})"
        )
        findings.append(
            f"Win rate: {overview.get('win_rate', 0):.1f}%, "
            f"Avg R:R: {overview.get('avg_rr', 0):.2f}, "
            f"Expectancy: {overview.get('expectancy', 0):.2f}"
        )

    rules = evidence.get("knowledge_rules", [])
    if isinstance(rules, list) and rules:
        top = rules[0]
        wr = (top.get("win_rate", 0) or 0) * 100
        findings.append(
            f"Top knowledge rule: \"{top.get('title', '?')}\" "
            f"({top.get('occurrences', 0)} occurrences, {wr:.0f}% WR)"
        )

    patterns = evidence.get("patterns", [])
    if isinstance(patterns, list) and patterns:
        top_p = patterns[0]
        p_wr = (top_p.get("win_rate", 0) or 0) * 100
        findings.append(
            f"Top pattern: \"{top_p.get('name', '?')}\" "
            f"({top_p.get('total_occurrences', 0)} occurrences, {p_wr:.0f}% WR)"
        )

    graph = evidence.get("knowledge_graph", {})
    if isinstance(graph, dict) and graph.get("total_nodes"):
        findings.append(
            f"Knowledge graph: {graph['total_nodes']} nodes, "
            f"{graph['total_edges']} edges"
        )

    macro = evidence.get("macro", {})
    events = macro.get("recent_events", []) if isinstance(macro, dict) else []
    if events:
        findings.append(f"Recent macro events: {len(events)} events loaded")

    learning = evidence.get("learning", {})
    snap = learning.get("latest_snapshot") if isinstance(learning, dict) else None
    if snap:
        findings.append(
            f"Learning snapshot: {snap.get('total_trades', 0)} trades tracked, "
            f"knowledge growth {snap.get('knowledge_growth', 0)}"
        )

    debriefs = evidence.get("trade_debrief", [])
    if isinstance(debriefs, list) and debriefs:
        total = len(debriefs)
        ratings = [d.get("overall_rating", 0) or 0 for d in debriefs]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        findings.append(f"Personal trade debriefs: {total} analyzed, average rating {avg_rating:.1f}/10")

    personal_rules = evidence.get("personal_rule", [])
    if isinstance(personal_rules, list) and personal_rules:
        approved = [r for r in personal_rules if r.get("status") == "approved"]
        findings.append(f"Personal rules: {len(personal_rules)} total ({len(approved)} approved)")

    profile = evidence.get("trader_profile", {})
    if isinstance(profile, dict) and profile.get("discipline_score") is not None:
        findings.append(f"Trader discipline score: {profile['discipline_score']:.1f}/100")
        if profile.get("strengths"):
            strengths = profile["strengths"]
            if isinstance(strengths, list) and strengths:
                findings.append(f"Top strengths: {', '.join(strengths[:3])}")

    return findings


def build_recommendations(evidence: dict[str, object]) -> list[str]:
    """Generate deterministic recommendations from evidence."""
    recommendations: list[str] = []

    stats = evidence.get("statistics", {})
    overview = stats.get("overview", {}) if isinstance(stats, dict) else {}
    risk = stats.get("risk", {}) if isinstance(stats, dict) else {}
    if risk.get("max_drawdown") and risk["max_drawdown"] > 0:
        recommendations.append(
            f"Monitor drawdown (current: {risk['max_drawdown']:.2f})"
        )

    rules = evidence.get("knowledge_rules", [])
    if isinstance(rules, list):
        low_conf = [r for r in rules if (r.get("confidence") or 0) < 50]
        if low_conf:
            recommendations.append(
                f"Review {len(low_conf)} low-confidence knowledge rules "
                f"for possible refinement"
            )

    patterns = evidence.get("patterns", [])
    if isinstance(patterns, list) and len(patterns) < 3:
        recommendations.append("Limited pattern diversity — consider scanning for new setups")

    learning = evidence.get("learning", {})
    events = learning.get("events", []) if isinstance(learning, dict) else []
    if events:
        failed = [e for e in events if e.get("status") == "failed"]
        if failed:
            recommendations.append(
                f"Address {len(failed)} failed learning events"
            )

    debriefs = evidence.get("trade_debrief", [])
    if isinstance(debriefs, list) and debriefs:
        low_rated = [d for d in debriefs if (d.get("overall_rating") or 0) < 5]
        if low_rated:
            recommendations.append(
                f"Review {len(low_rated)} low-rated trades for improvement opportunities"
            )

    profile = evidence.get("trader_profile", {})
    if isinstance(profile, dict):
        ds = profile.get("discipline_score")
        if ds is not None and ds < 60:
            recommendations.append(
                f"Focus on discipline improvement (current score: {ds:.1f}/100)"
            )

    personal_rules = evidence.get("personal_rule", [])
    if isinstance(personal_rules, list) and personal_rules:
        draft = [r for r in personal_rules if r.get("status") == "draft"]
        if draft:
            recommendations.append(
                f"Review {len(draft)} draft personal rules pending approval"
            )

    return recommendations


def build_limitations(evidence: dict[str, object]) -> list[str]:
    """Identify limitations in the available evidence."""
    limitations: list[str] = []

    if not evidence:
        return ["No historical evidence available for analysis."]

    stats = evidence.get("statistics", {})
    overview = stats.get("overview", {}) if isinstance(stats, dict) else {}
    total = overview.get("total_trades", 0)
    if total < 10:
        limitations.append(f"Small sample size ({total} trades) — conclusions may not be statistically significant")

    rules = evidence.get("knowledge_rules", [])
    if isinstance(rules, list) and not rules:
        limitations.append("No knowledge rules have been generated yet")

    patterns = evidence.get("patterns", [])
    if isinstance(patterns, list) and not patterns:
        limitations.append("No trading patterns have been detected yet")

    macro = evidence.get("macro", {})
    events = macro.get("recent_events", []) if isinstance(macro, dict) else []
    if not events:
        limitations.append("No macro event data available")

    debriefs = evidence.get("trade_debrief", [])
    if isinstance(debriefs, list) and not debriefs:
        limitations.append("No personal trade debriefs have been created yet")

    personal_rules = evidence.get("personal_rule", [])
    if isinstance(personal_rules, list) and not personal_rules:
        limitations.append("No personal trading rules have been generated yet")

    profile = evidence.get("trader_profile", {})
    if not isinstance(profile, dict) or not profile.get("total_trades_analyzed"):
        limitations.append("Trader profile has not been built yet — limited personal intelligence available")

    return limitations
