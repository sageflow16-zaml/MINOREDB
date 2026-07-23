from fastapi import APIRouter
from src.api.routes import (
    project,
    source,
    claim,
    concept,
    association,
    conflict,
    interpretation,
    reconsideration_trigger,
    research_question,
    hypothesis,
    trade,
    market_structure,
    collector,
    search,
    dashboard,
    statistics,
    pattern,
    similarity,
    decision,
    learning,
    macro,
    mt5,
    tradingview,
    trade_memory,
    knowledge_rule,
    knowledge_graph,
    knowledge,
    analyst,
    research,
    replay,
    trader_intelligence,
    strategy,
    risk,
    planning,
    ai_foundation,
    obsidian,
    market_intelligence,
    rag_copilot,
    quant_research,
    automation,
    portfolio,
    broker,
    ict,
    brain,
    agents,
)

api_router = APIRouter()

api_router.include_router(project.router, prefix="/projects", tags=["Projects"])
api_router.include_router(strategy.router, prefix="/projects/{project_id}/strategies", tags=["Strategies"])
api_router.include_router(dashboard.router, prefix="/projects/{project_id}/dashboard", tags=["Dashboard"])
api_router.include_router(source.router, prefix="/projects/{project_id}/sources", tags=["Sources"])
api_router.include_router(claim.router, prefix="/projects/{project_id}/claims", tags=["Claims"])
api_router.include_router(concept.router, prefix="/projects/{project_id}/concepts", tags=["Concepts"])
api_router.include_router(association.router, prefix="/projects/{project_id}/associations", tags=["Associations"])
api_router.include_router(conflict.router, prefix="/projects/{project_id}/conflicts", tags=["Conflicts"])
api_router.include_router(interpretation.router, prefix="/projects/{project_id}/interpretations", tags=["Interpretations"])
api_router.include_router(reconsideration_trigger.router, prefix="/projects/{project_id}/triggers", tags=["Triggers"])
api_router.include_router(research_question.router, prefix="/projects/{project_id}/questions", tags=["Questions"])
api_router.include_router(hypothesis.router, prefix="/projects/{project_id}/hypotheses", tags=["Hypotheses"])
api_router.include_router(trade.router, prefix="/projects/{project_id}/trades", tags=["Trades"])
api_router.include_router(market_structure.router, prefix="/projects/{project_id}/market-structures", tags=["Market Structures"])
api_router.include_router(collector.router, prefix="/projects/{project_id}/collectors", tags=["Collectors"])
api_router.include_router(statistics.router, prefix="/projects/{project_id}/statistics", tags=["Statistics"])
api_router.include_router(pattern.router, prefix="/projects/{project_id}/patterns", tags=["Patterns"])
api_router.include_router(search.router, prefix="/projects/{project_id}/search", tags=["Search"])
api_router.include_router(similarity.router, prefix="/projects/{project_id}/similarity", tags=["Similarity"])
api_router.include_router(decision.router, prefix="/projects/{project_id}/decision", tags=["Decision Support"])
api_router.include_router(learning.router, prefix="/projects/{project_id}/learning", tags=["Continuous Learning"])
api_router.include_router(trade_memory.router, prefix="/projects/{project_id}/memories", tags=["Trade Memories"])
api_router.include_router(knowledge_rule.router, prefix="/projects/{project_id}/knowledge", tags=["Knowledge Rules"])
api_router.include_router(knowledge_graph.router, prefix="/projects/{project_id}/graph", tags=["Knowledge Graph"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Library"])
api_router.include_router(analyst.router, prefix="/projects/{project_id}/analyst", tags=["AI Analyst"])
api_router.include_router(research.router, prefix="/projects/{project_id}/research", tags=["Research Engine"])
api_router.include_router(replay.router, prefix="/projects/{project_id}/replay", tags=["Historical Replay"])
api_router.include_router(trader_intelligence.router, prefix="/projects/{project_id}/trader-intelligence", tags=["Trader Intelligence"])
api_router.include_router(macro.router, prefix="/macro", tags=["Macro Intelligence"])
api_router.include_router(mt5.router, prefix="/mt5", tags=["MT5 Integration"])
api_router.include_router(tradingview.router, prefix="/tradingview", tags=["TradingView"])
api_router.include_router(risk.router, prefix="/projects/{project_id}/risk", tags=["Risk Management"])
api_router.include_router(planning.router, prefix="/projects/{project_id}/planning", tags=["Planning & Calendar"])
api_router.include_router(ai_foundation.router, prefix="/projects/{project_id}/ai", tags=["AI Foundation"])
api_router.include_router(obsidian.router, prefix="/projects/{project_id}/obsidian", tags=["Obsidian Integration"])
api_router.include_router(market_intelligence.router, prefix="/projects/{project_id}/market-intel", tags=["Market Intelligence"])
api_router.include_router(rag_copilot.router, prefix="/projects/{project_id}/copilot", tags=["AI Research Copilot"])
api_router.include_router(quant_research.router, prefix="/projects/{project_id}/quant-research", tags=["Quantitative Research"])
api_router.include_router(automation.router, prefix="/projects/{project_id}/automation", tags=["Automation & Workflow"])
api_router.include_router(portfolio.router, prefix="/projects/{project_id}/portfolio", tags=["Portfolio Management"])
api_router.include_router(broker.router, prefix="/projects/{project_id}/broker", tags=["Broker Integration"])
api_router.include_router(brain.router, prefix="/projects/{project_id}/brain", tags=["AI Trading Brain"])
api_router.include_router(ict.router, prefix="/projects/{project_id}/ict", tags=["ICT Smart Engine"])
api_router.include_router(agents.router, prefix="/projects/{project_id}/agents", tags=["Intelligence Agents"])
