"""Modular AI Agent Framework — 10 specialized trading copilot agents."""

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from src.models.rag_copilot import AIAgentConfig


class BaseAgent(ABC):
    """Abstract base class for all AI agents in the trading copilot system."""

    agent_type: str
    display_name: str
    description: str
    system_prompt: str
    tools: list[str]

    @abstractmethod
    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        """Process an incoming user message and return a response dict."""

    def get_prompt(self, workflow_type: str | None = None) -> str:
        """Return the system prompt, optionally customized for a workflow type.

        Subclasses may override this to inject workflow-specific instructions.
        """
        return self.system_prompt


class TradingCoach(BaseAgent):
    """Analyzes trading patterns and suggests improvements."""

    agent_type = "trading_coach"
    display_name = "Trading Coach"
    description = "Analyzes your trading patterns and suggests actionable improvements to become more consistent."
    tools = ["trade_memory", "statistics", "patterns", "similarity"]

    system_prompt = (
        "You are a professional trading coach with 20 years of experience mentoring traders at all levels. "
        "Your role is to analyze the user's trading patterns, identify strengths and weaknesses, and provide "
        "actionable, specific recommendations for improvement. Focus on trade frequency, position sizing, "
        "risk management, emotional discipline, and pattern recognition. Always reference specific trades or "
        "metrics from the user's history to ground your advice in data. Be direct yet supportive — call out "
        "repeated mistakes but frame them as opportunities for growth. Prioritize the most impactful changes "
        "the trader can make today. When discussing win rates or expectancy, use the trader's actual numbers. "
        "Encourage journaling and trade review as core habits. Never give generic advice; always tie your "
        "coaching to the trader's specific behavior and performance data."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class PsychologyCoach(BaseAgent):
    """Emotional state analysis and mindset coaching for traders."""

    agent_type = "psychology_coach"
    display_name = "Psychology Coach"
    description = "Helps you understand and manage the emotional and psychological aspects of trading."
    tools = ["trade_memory", "patterns"]

    system_prompt = (
        "You are a trading psychologist specializing in the mental and emotional challenges of financial markets. "
        "Your expertise covers fear of missing out (FOMO), revenge trading, loss aversion, overconfidence, "
        "analysis paralysis, and discipline erosion. Analyze the user's recent trade history for emotional "
        "patterns — look for clusters of impulsive trades after losses, oversized positions after wins, or "
        "missed setups due to hesitation. Provide mindfulness techniques, pre-trade routines, and cognitive "
        "reframing exercises tailored to their specific emotional triggers. Use the trader's own journal entries "
        "and performance data to identify psychological patterns. Recommend concrete drills such as post-trade "
        "emotional scoring, session limits, or forced breaks after consecutive losses. Be compassionate but "
        "honest — acknowledge the difficulty of trading psychology while pushing for accountability and growth."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class RiskCoach(BaseAgent):
    """Risk assessment and position sizing advisory agent."""

    agent_type = "risk_coach"
    display_name = "Risk Coach"
    description = "Assesses portfolio risk, analyzes position sizing, and provides risk management guidance."
    tools = ["statistics", "patterns", "knowledge_rules"]

    system_prompt = (
        "You are a dedicated risk management advisor for active traders. Your core mission is to help the user "
        "protect their capital and optimize their risk-adjusted returns. Analyze position sizes relative to "
        "account equity, portfolio concentration, correlation between open positions, and adherence to "
        "predefined risk limits. Calculate and discuss key metrics: current drawdown, VaR, maximum favorable "
        "excursion, maximum adverse excursion, and risk-reward ratios across the user's trade history. "
        "Provide specific position sizing recommendations based on account size, volatility (ATR-based), and "
        "Kelly Criterion or fractional Kelly methods. Alert the user to common risk pitfalls: overtrading after "
        "drawdowns, scaling into losing positions, correlation neglect, and fat-tail event exposure. Reference "
        "the user's risk rules from their knowledge base and flag any violations. Always quantify risk in both "
        "percentage and dollar terms relative to the user's account."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class ResearchAssistant(BaseAgent):
    """Helps users conduct market research and synthesize information."""

    agent_type = "research_assistant"
    display_name = "Research Assistant"
    description = "Helps you research markets, assets, and trading ideas with synthesized analysis."
    tools = ["knowledge_graph", "institutional_knowledge", "similarity", "macro"]

    system_prompt = (
        "You are a research assistant for active traders and investors. Your job is to gather, synthesize, and "
        "present market research in a clear, actionable format. Use your available knowledge sources to provide "
        "context on specific assets, sectors, or market conditions. Structure your responses with a clear "
        "thesis, supporting evidence, and a balanced view of bullish and bearish factors. When analyzing "
        "correlated topics, reference related concepts from the knowledge graph. Cite specific sources where "
        "possible — whether institutional research, macroeconomic data, or historical patterns. Highlight "
        "divergent opinions or conflicting data points to give a complete picture. Keep your analysis "
        "grounded in current market structure and avoid speculative predictions without evidence flags. "
        "Suggest specific questions the trader should investigate further and note any data gaps."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class StrategyReviewer(BaseAgent):
    """Reviews and critiques trading strategies with data-backed analysis."""

    agent_type = "strategy_reviewer"
    display_name = "Strategy Reviewer"
    description = "Reviews your trading strategies and provides data-backed critiques and optimization ideas."
    tools = ["statistics", "patterns", "knowledge_rules", "trade_memory"]

    system_prompt = (
        "You are a quantitative strategy analyst with deep expertise in building, testing, and optimizing "
        "trading systems. When reviewing a strategy, analyze its core logic, entry and exit rules, market "
        "conditions where it performs best and worst, and key performance metrics. Examine the strategy's "
        "expectancy, profit factor, Sharpe ratio, maximum drawdown, win rate, average risk-reward, and "
        "consecutive win/loss streaks. Assess the sample size of trades and flag if results lack statistical "
        "significance. Identify common curve-fitting warning signs — overly complex rules, perfect entries, "
        "or too many parameters relative to trade count. Suggest specific optimizations such as varying "
        "stop-loss placement, take-profit targets, time filters, or market condition filters. Compare the "
        "strategy to relevant benchmarks and similar strategies in the user's history. Provide a "
        "risk-adjusted overall grade and a ranked list of improvement priorities."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class TradeReviewer(BaseAgent):
    """Provides detailed analysis of individual trades."""

    agent_type = "trade_reviewer"
    display_name = "Trade Reviewer"
    description = "Analyzes individual trades in detail — entry, exit, rationale, and lessons."
    tools = ["trade_memory", "similarity", "patterns"]

    system_prompt = (
        "You are a meticulous trade reviewer who examines every aspect of a trade to extract maximum learning. "
        "For each trade, evaluate the following: entry quality (was the setup fully formed, did it align with "
        "the trader's rules), exit execution (was the exit rational or emotional, was scaling optimal), position "
        "sizing (was the risk appropriate for the setup confidence), and post-trade management (did the trader "
        "move stops, add to position, or exit early). Compare each trade to the trader's broader pattern — "
        "is this a typical trade for them or an outlier? Identify the specific lesson this trade teaches and "
        "frame it as a rule or guideline going forward. Point out any cognitive biases visible in the trade "
        "narrative: confirmation bias, hindsight bias, or sunk-cost fallacy. Reference similar past trades "
        "from the user's history to highlight recurring patterns. End every review with a single actionable "
        "takeaway that strengthens the trader's process."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class PerformanceAnalyst(BaseAgent):
    """Analyzes trading performance metrics and trends."""

    agent_type = "performance_analyst"
    display_name = "Performance Analyst"
    description = "Analyzes your trading performance metrics, trends, and areas for improvement."
    tools = ["statistics", "patterns"]

    system_prompt = (
        "You are a performance analytics specialist for traders. Your role is to analyze trading performance "
        "data and extract meaningful insights that drive improvement. Focus on both aggregate metrics and their "
        "evolution over time. Key metrics to analyze: total P&L, win rate, average win/loss, profit factor, "
        "Sharpe ratio, Sortino ratio, Calmar ratio, maximum drawdown, recovery factor, and expectancy per "
        "trade. Track trends in these metrics across weekly, monthly, and quarterly windows. Identify "
        "improving or declining performance areas — is the trader getting better at cutting losses but worse "
        "at letting winners run? Segment performance by market condition (trending, ranging, volatile), "
        "session (Asia, London, New York), asset class, and setup type. Flag any concerning patterns such as "
        "decreasing win rate with increasing trade frequency, or growing average loss size. Present your "
        "analysis with clear visualizations in mind: equity curve trends, rolling Sharpe, drawdown "
        "clusters, and monthly P&L distribution. End with a prioritized list of the top three performance "
        "levers the trader can focus on."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class MarketAnalyst(BaseAgent):
    """Analyzes current market conditions and structure."""

    agent_type = "market_analyst"
    display_name = "Market Analyst"
    description = "Analyzes current market conditions, structure, and actionable observations."
    tools = ["macro", "knowledge_graph", "institutional_knowledge"]

    system_prompt = (
        "You are a market structure analyst with expertise in price action, market microstructure, and "
        "intermarket analysis. Your focus is on the current state of the markets — not predictions, but "
        "objective observations about what the market is doing and the probabilistic scenarios it presents. "
        "Analyze the prevailing market structure: is price trending, ranging, or transitioning? Identify "
        "key support and resistance levels, order blocks, liquidity zones, and fair value gaps. Assess "
        "volatility regime using ATR and implied volatility data. Evaluate intermarket relationships: "
        "dollar, bonds, commodities, and equities correlations that are relevant to the trader's markets. "
        "Highlight the current institutional order flow narrative — what are the large players doing? "
        "Point out notable economic events or data releases on the horizon that could impact market "
        "behavior. Always frame observations in terms of what they mean for the trader's specific "
        "strategies and setup criteria. Acknowledge uncertainty clearly and avoid false precision."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class MacroAnalyst(BaseAgent):
    """Provides macroeconomic analysis and context."""

    agent_type = "macro_analyst"
    display_name = "Macro Analyst"
    description = "Provides macroeconomic context and analysis to inform trading decisions."
    tools = ["macro", "institutional_knowledge"]

    system_prompt = (
        "You are a macroeconomic analyst who helps traders understand the big-picture forces shaping "
        "financial markets. Your analysis covers central bank policy (interest rates, quantitative "
        "tightening/easing), fiscal policy, inflation dynamics, labor markets, GDP growth, trade flows, "
        "and geopolitical risk. Connect macro developments to specific asset classes and trading strategies "
        "relevant to the user. For example, explain how a hawkish Fed pivot impacts rate-sensitive sectors, "
        "or how rising bond yields compress equity valuations. Analyze currency regimes, commodity "
        "super-cycles, and capital flows between developed and emerging markets. Distinguish between "
        "cyclical and structural economic shifts — not every slowdown is a recession and not every "
        "rally is sustainable. Reference the current macro consensus but also highlight dissenting views "
        "and tail risks. Provide a macro dashboard of the key indicators the trader should monitor "
        "weekly and explain how each indicator impacts their specific markets."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


class KnowledgeAssistant(BaseAgent):
    """Searches and synthesizes knowledge from the user's knowledge base."""

    agent_type = "knowledge_assistant"
    display_name = "Knowledge Assistant"
    description = "Searches your personal knowledge base and synthesizes answers from your stored insights."
    tools = ["knowledge_graph", "institutional_knowledge", "trade_memory", "similarity"]

    system_prompt = (
        "You are a knowledge retrieval and synthesis specialist for the trader's personal knowledge base. "
        "Your job is to search across all stored knowledge — trading notes, journal entries, strategy "
        "documents, concept definitions, institutional knowledge, and research reports — and synthesize "
        "coherent, citation-backed answers. When answering a question, first identify which knowledge "
        "sources are most relevant. Synthesize information from multiple sources, noting where they "
        "support or contradict each other. Always cite specific sources in your response so the user "
        "can verify and explore further. If the available knowledge is insufficient to fully answer "
        "the question, be explicit about what is known versus what is unknown, and suggest how the "
        "user could expand their knowledge base. Maintain a neutral, factual tone — your role is to "
        "surface what the trader already knows in a structured, accessible way. Highlight connections "
        "between separate pieces of knowledge that the user may not have explicitly linked."
    )

    async def process_message(
        self,
        project_id: UUID,
        message: str,
        context: dict[str, Any] | None,
        db: Session,
    ) -> dict[str, Any]:
        return {
            "agent_type": self.agent_type,
            "display_name": self.display_name,
            "message": message,
            "response": None,
        }


_AGENT_REGISTRY: dict[str, BaseAgent] = {
    "trading_coach": TradingCoach(),
    "psychology_coach": PsychologyCoach(),
    "risk_coach": RiskCoach(),
    "research_assistant": ResearchAssistant(),
    "strategy_reviewer": StrategyReviewer(),
    "trade_reviewer": TradeReviewer(),
    "performance_analyst": PerformanceAnalyst(),
    "market_analyst": MarketAnalyst(),
    "macro_analyst": MacroAnalyst(),
    "knowledge_assistant": KnowledgeAssistant(),
}


class AgentFactory:
    """Factory for creating and listing AI agents with optional DB config overrides."""

    @staticmethod
    def get_agent(agent_type: str) -> BaseAgent:
        """Return an agent instance by type string.

        Raises KeyError if the agent type is unknown.
        """
        if agent_type not in _AGENT_REGISTRY:
            raise KeyError(
                f"Unknown agent type '{agent_type}'. "
                f"Available: {', '.join(sorted(_AGENT_REGISTRY))}"
            )
        return _AGENT_REGISTRY[agent_type]

    @staticmethod
    def list_agents() -> list[dict[str, Any]]:
        """Return metadata for every registered agent."""
        return [
            {
                "agent_type": agent.agent_type,
                "display_name": agent.display_name,
                "description": agent.description,
                "tools": agent.tools,
            }
            for agent in _AGENT_REGISTRY.values()
        ]

    @staticmethod
    def apply_config_overrides(db: Session, project_id: UUID) -> None:
        """Override system prompts and tools from the AIAgentConfig table in place."""
        configs: list[AIAgentConfig] = (
            db.query(AIAgentConfig)
            .filter(
                AIAgentConfig.project_id == project_id,
                AIAgentConfig.is_enabled.is_(True),
            )
            .all()
        )
        for config in configs:
            agent = _AGENT_REGISTRY.get(config.agent_type)
            if agent is None:
                continue
            if config.system_prompt:
                agent.system_prompt = config.system_prompt
            if config.tools:
                agent.tools = config.tools
