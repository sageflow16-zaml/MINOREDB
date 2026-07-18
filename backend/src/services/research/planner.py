"""Research Planner — converts a user question into a sequence of research tasks.

No LLM. Pure deterministic mapping based on question keywords.
"""

import re
from dataclasses import dataclass


@dataclass
class ResearchTaskDef:
    step: int
    tool: str
    description: str


_PATTERNS: list[tuple[re.Pattern, list[ResearchTaskDef]]] = [
    (
        re.compile(r"(institutional|methodology|concept|what is|define|explain).*(ict|market.?structure|liquidity|order.?flow|execution|risk.?management|psychology|macro|quarter.?theory)"),
        [
            ResearchTaskDef(1, "institutional_knowledge", "Search institutional knowledge library for relevant concepts"),
            ResearchTaskDef(2, "knowledge_rules", "Retrieve related knowledge rules from user data"),
            ResearchTaskDef(3, "knowledge_graph", "Check graph connections for related concepts"),
            ResearchTaskDef(4, "statistics", "Compute statistics for context"),
            ResearchTaskDef(5, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(6, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(why|reason|explain).*(lose|lost|loss|loser|red)"),
        [
            ResearchTaskDef(1, "trade_memory", "Load recent losing trades"),
            ResearchTaskDef(2, "statistics", "Compute statistics for losing trades"),
            ResearchTaskDef(3, "similarity", "Find similar losing trades"),
            ResearchTaskDef(4, "knowledge_rules", "Retrieve relevant knowledge rules"),
            ResearchTaskDef(5, "knowledge_graph", "Retrieve graph connections for losses"),
            ResearchTaskDef(6, "learning", "Check learning events for losing patterns"),
            ResearchTaskDef(7, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(8, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(why|reason|explain).*(win|won|winner|green|profitable)"),
        [
            ResearchTaskDef(1, "trade_memory", "Load recent winning trades"),
            ResearchTaskDef(2, "statistics", "Compute statistics for winning trades"),
            ResearchTaskDef(3, "similarity", "Find similar winning trades"),
            ResearchTaskDef(4, "knowledge_rules", "Retrieve winning knowledge rules"),
            ResearchTaskDef(5, "knowledge_graph", "Retrieve graph connections for wins"),
            ResearchTaskDef(6, "learning", "Check learning events for winning patterns"),
            ResearchTaskDef(7, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(8, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(compare|vs|versus|difference|better|worse)"),
        [
            ResearchTaskDef(1, "trade_memory", "Load trades for comparison"),
            ResearchTaskDef(2, "statistics", "Compute comparative statistics"),
            ResearchTaskDef(3, "patterns", "Compare pattern performance"),
            ResearchTaskDef(4, "knowledge_rules", "Compare knowledge rules across periods"),
            ResearchTaskDef(5, "similarity", "Find similar contexts for comparison"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(performance|overall|how am i|summary|progress)"),
        [
            ResearchTaskDef(1, "statistics", "Compute overall performance statistics"),
            ResearchTaskDef(2, "knowledge_rules", "Retrieve top knowledge rules"),
            ResearchTaskDef(3, "knowledge_graph", "Analyze knowledge graph structure"),
            ResearchTaskDef(4, "patterns", "Identify active trading patterns"),
            ResearchTaskDef(5, "learning", "Check learning progression"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(pattern|setup|recurring|strategy)"),
        [
            ResearchTaskDef(1, "patterns", "Load all detected patterns"),
            ResearchTaskDef(2, "statistics", "Compute per-pattern statistics"),
            ResearchTaskDef(3, "knowledge_rules", "Retrieve pattern-related knowledge rules"),
            ResearchTaskDef(4, "knowledge_graph", "Map pattern connections in graph"),
            ResearchTaskDef(5, "similarity", "Find similar pattern occurrences"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(macro|cpi|nfp|fomc|news|economic|event)"),
        [
            ResearchTaskDef(1, "macro", "Load macro economic events"),
            ResearchTaskDef(2, "trade_memory", "Load trades around macro events"),
            ResearchTaskDef(3, "statistics", "Compute event-adjacent statistics"),
            ResearchTaskDef(4, "knowledge_graph", "Map macro-to-trade connections"),
            ResearchTaskDef(5, "knowledge_rules", "Retrieve event-related knowledge rules"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(graph|connect|relation|node|edge|network)"),
        [
            ResearchTaskDef(1, "knowledge_graph", "Load full knowledge graph"),
            ResearchTaskDef(2, "statistics", "Compute graph-level statistics"),
            ResearchTaskDef(3, "knowledge_rules", "Retrieve rules connected to graph"),
            ResearchTaskDef(4, "trade_memory", "Load trades connected in graph"),
            ResearchTaskDef(5, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(6, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(learn|mistake|lesson|improve|weakness|strength)"),
        [
            ResearchTaskDef(1, "learning", "Load learning events and snapshots"),
            ResearchTaskDef(2, "trade_memory", "Load trades with mistakes/weaknesses"),
            ResearchTaskDef(3, "knowledge_rules", "Retrieve improvement-related rules"),
            ResearchTaskDef(4, "patterns", "Identify mistake patterns"),
            ResearchTaskDef(5, "statistics", "Compute improvement metrics"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(month|weekly|daily|period|trend|since|over time)"),
        [
            ResearchTaskDef(1, "statistics", "Compute time-period statistics"),
            ResearchTaskDef(2, "trade_memory", "Load time-period trades"),
            ResearchTaskDef(3, "knowledge_rules", "Check rule evolution over time"),
            ResearchTaskDef(4, "knowledge_graph", "Check graph evolution over time"),
            ResearchTaskDef(5, "learning", "Check learning progression over time"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(debrief|review|how did (my|i)|what (did|happened) (in|with|on) (that|my|the) trade)"),
        [
            ResearchTaskDef(1, "trade_debrief", "Load personal trade debriefs"),
            ResearchTaskDef(2, "trade_memory", "Load trade memories for context"),
            ResearchTaskDef(3, "knowledge_rules", "Retrieve relevant knowledge rules"),
            ResearchTaskDef(4, "statistics", "Compute trade statistics"),
            ResearchTaskDef(5, "learning", "Check learning state"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(my pattern|personal pattern|what pattern|recurring setup|my setup|what setup (works|suits|fits))"),
        [
            ResearchTaskDef(1, "personal_pattern", "Load personal trading patterns"),
            ResearchTaskDef(2, "patterns", "Load system-detected patterns"),
            ResearchTaskDef(3, "statistics", "Compute per-pattern statistics"),
            ResearchTaskDef(4, "knowledge_rules", "Retrieve pattern-related rules"),
            ResearchTaskDef(5, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(6, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(my rule|personal rule|what rule|trading rule|rule (i|do|should|must|follow)|rule (approve|reject|edit|generate))"),
        [
            ResearchTaskDef(1, "personal_rule", "Load personal trading rules"),
            ResearchTaskDef(2, "knowledge_rules", "Retrieve system knowledge rules"),
            ResearchTaskDef(3, "trade_debrief", "Check debrief evidence for rules"),
            ResearchTaskDef(4, "statistics", "Compute rule-supporting statistics"),
            ResearchTaskDef(5, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(6, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r"(profile|what kind of trader|trading personality|trader profile|my (strength|weakness|improve|growth|journey|style)|discipline|rule.adherence)"),
        [
            ResearchTaskDef(1, "trader_profile", "Load trader profile"),
            ResearchTaskDef(2, "trade_debrief", "Load debriefs for profile context"),
            ResearchTaskDef(3, "personal_rule", "Load personal rules for adherence check"),
            ResearchTaskDef(4, "statistics", "Compute profile statistics"),
            ResearchTaskDef(5, "learning", "Check learning progression"),
            ResearchTaskDef(6, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(7, "report", "Generate research report"),
        ],
    ),
    (
        re.compile(r".*"),
        [
            ResearchTaskDef(1, "statistics", "Compute overall statistics"),
            ResearchTaskDef(2, "trade_memory", "Load recent trades"),
            ResearchTaskDef(3, "knowledge_rules", "Retrieve top knowledge rules"),
            ResearchTaskDef(4, "knowledge_graph", "Analyze knowledge graph"),
            ResearchTaskDef(5, "patterns", "Detect active patterns"),
            ResearchTaskDef(6, "macro", "Check recent macro events"),
            ResearchTaskDef(7, "learning", "Check learning state"),
            ResearchTaskDef(8, "institutional_knowledge", "Search institutional knowledge library"),
            ResearchTaskDef(9, "validator", "Cross-validate findings against evidence"),
            ResearchTaskDef(10, "report", "Generate research report"),
        ],
    ),
]


def plan(question: str) -> list[ResearchTaskDef]:
    q = question.strip().lower()
    for pattern, tasks in _PATTERNS:
        if pattern.search(q):
            return tasks
    return [
        ResearchTaskDef(1, "statistics", "Compute overall statistics"),
        ResearchTaskDef(2, "knowledge_rules", "Retrieve top knowledge rules"),
        ResearchTaskDef(3, "report", "Generate research report"),
    ]
