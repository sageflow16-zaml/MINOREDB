"""Deterministic question planner — maps user questions to required data engines.

No LLM. Pure keyword + pattern matching against known trading concepts.
"""

import re
from typing import Literal

EngineName = Literal[
    "trade_memory", "similarity", "statistics", "patterns",
    "knowledge_rules", "knowledge_graph", "macro", "learning",
    "trade_debrief", "personal_pattern", "personal_rule", "trader_profile",
    "institutional_knowledge",
]

QUESTION_PATTERNS: list[tuple[re.Pattern, list[EngineName]]] = [
    # Why did trade lose / win
    (re.compile(r"(why|reason|explain).*(lose|lost|loss|loser|red)"), ["trade_memory", "similarity", "knowledge_rules", "knowledge_graph", "statistics"]),
    (re.compile(r"(why|reason|explain).*(win|won|winner|green|profitable)"), ["trade_memory", "similarity", "knowledge_rules", "knowledge_graph", "statistics"]),
    (re.compile(r"(why|reason|explain).*(trade|position|entry|setup)"), ["trade_memory", "similarity", "knowledge_rules", "knowledge_graph", "statistics"]),

    # Best / worst setup
    (re.compile(r"(best|top|highest).*(setup|pattern|strategy|configuration)"), ["knowledge_rules", "patterns", "statistics", "similarity"]),
    (re.compile(r"(worst|lowest|poorest).*(setup|pattern|strategy|configuration)"), ["knowledge_rules", "patterns", "statistics", "similarity"]),

    # What is my win rate / RR / expectancy
    (re.compile(r"(win.?rate|rr|risk.?reward|expectancy|profit.?factor)"), ["statistics", "knowledge_rules"]),
    (re.compile(r"(how am i|how are|performance|overall|summary)"), ["statistics", "knowledge_rules", "knowledge_graph"]),

    # Patterns
    (re.compile(r"(pattern|set.?up|recurring).*"), ["patterns", "knowledge_rules", "similarity"]),
    (re.compile(r"(similar|like|comparable).*"), ["similarity", "patterns", "knowledge_rules"]),
    (re.compile(r"(pattern|set.?up|recurring)"), ["patterns", "knowledge_rules", "similarity"]),

    # Macro / CPI / NFP / news
    (re.compile(r"(cpi|nfp|fomc|macro|news|event|economic|rate.?decision)"), ["macro", "statistics", "knowledge_graph"]),
    (re.compile(r"(dollar|dxy|fed|treasury|bond|yield)"), ["macro", "statistics", "knowledge_graph"]),

    # Institutional Knowledge
    (re.compile(r"(institutional|methodology|concept|principle|what is|define|explain).*(ict|market.?structure|liquidity|order.?flow|execution|risk.?management|psychology|macro|quarter.?theory|statistics|pattern)"), ["institutional_knowledge", "knowledge_rules", "knowledge_graph"]),
    (re.compile(r"(how does|what does|tell me about|describe).*(ict|market.?structure|liquidity|order.?block|fvg|mss|killzone|session|bias|draw.?on|liquidity.?pool)"), ["institutional_knowledge", "knowledge_rules"]),
    (re.compile(r"(institutional|methodology|library|reference|source|textbook)"), ["institutional_knowledge"]),

    # Market structure
    (re.compile(r"(market.?structure|phase|trend|bias|liquidity|sweep|mss|fvg|order.?block)"), ["knowledge_graph", "knowledge_rules", "patterns", "statistics"]),

    # Session / time
    (re.compile(r"(session|london|new.?york|asian|killzone)"), ["knowledge_graph", "knowledge_rules", "statistics"]),
    (re.compile(r"(this week|this month|recent|last .* trade)"), ["trade_memory", "statistics", "knowledge_rules"]),

    # Learning / improvement
    (re.compile(r"(learn|improve|mistake|lesson|weakness|strength)"), ["knowledge_rules", "trade_memory", "learning"]),

    # Graph / connections
    (re.compile(r"(graph|connect|relation|node|edge|network)"), ["knowledge_graph", "knowledge_rules"]),

    # Personal trading debrief / review
    (re.compile(r"(debrief|review|how did (my|i)|what (did|happened) (in|with|on) (that|my|the) trade)"), ["trade_debrief", "trade_memory", "knowledge_rules", "statistics"]),
    (re.compile(r"(lesson|what (did|have) i (learn|improve)|post.?trade|after.?trade|trade.?review)"), ["trade_debrief", "knowledge_rules", "learning", "trade_memory"]),

    # Personal patterns
    (re.compile(r"(my pattern|personal pattern|what pattern|custom pattern|recurring setup|my setup)"), ["personal_pattern", "patterns", "knowledge_rules", "statistics"]),
    (re.compile(r"(what setup (works|suits|fits)|which pattern|favorite setup|go.?to setup)"), ["personal_pattern", "patterns", "knowledge_rules", "statistics"]),

    # Personal rules
    (re.compile(r"(my rule|personal rule|what rule|trading rule|rule (i|do|should|must|follow))"), ["personal_rule", "knowledge_rules", "trade_debrief", "statistics"]),
    (re.compile(r"(rule (approve|reject|edit|create|generate|propose|suggest))"), ["personal_rule", "knowledge_rules"]),

    # Trader profile
    (re.compile(r"(profile|what kind of trader|trading personality|trader profile|my (strength|weakness|improve|growth|journey|style))"), ["trader_profile", "trade_debrief", "knowledge_rules", "statistics", "personal_rule"]),
    (re.compile(r"(discipline|rule.adherence|my discipline|am i improving|am i getting better)"), ["trader_profile", "trade_debrief", "personal_rule", "learning"]),

    # General fallback — broad analysis
    (re.compile(r".*"), ["statistics", "knowledge_rules", "knowledge_graph", "patterns", "institutional_knowledge"]),
]


def plan(question: str) -> list[EngineName]:
    """Return the ordered list of engines to query for a given question."""
    q = question.strip().lower()
    for pattern, engines in QUESTION_PATTERNS:
        if pattern.search(q):
            return engines
    return ["statistics", "knowledge_rules", "knowledge_graph", "patterns"]
