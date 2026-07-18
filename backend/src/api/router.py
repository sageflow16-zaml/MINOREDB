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
)

api_router = APIRouter()

api_router.include_router(project.router, prefix="/projects", tags=["Projects"])
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
