"""Register all available agents on import."""
from src.agents.core.registry import AgentRegistry
from src.agents.market_analyst.agent import MarketAnalystAgent
from src.agents.journal.agent import JournalReviewAgent
from src.agents.performance.agent import PerformanceMonitorAgent
from src.agents.coach.agent import CoachAgent
from src.agents.curator.agent import KnowledgeCuratorAgent
from src.agents.watcher.agent import MarketWatcherAgent
from src.agents.learner.agent import PatternLearnerAgent
from src.agents.researcher.agent import ResearcherAgent


def register_all_agents():
    AgentRegistry.register(MarketAnalystAgent)
    AgentRegistry.register(JournalReviewAgent)
    AgentRegistry.register(PerformanceMonitorAgent)
    AgentRegistry.register(CoachAgent)
    AgentRegistry.register(KnowledgeCuratorAgent)
    AgentRegistry.register(MarketWatcherAgent)
    AgentRegistry.register(PatternLearnerAgent)
    AgentRegistry.register(ResearcherAgent)
