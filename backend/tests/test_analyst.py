"""Tests for the AI Research Analyst pipeline."""

from src.services.ai.planner import plan
from src.services.ai.context_builder import build_context
from src.services.ai.validator import validate
from src.services.ai.llm import _fallback_answer, _clean_json


class TestPlanner:
    def test_why_lost_trade(self):
        engines = plan("Why did my last EURUSD trade lose?")
        assert "trade_memory" in engines
        assert "similarity" in engines
        assert "knowledge_rules" in engines
        assert "statistics" in engines

    def test_best_setup(self):
        engines = plan("What is my best setup?")
        assert "knowledge_rules" in engines
        assert "patterns" in engines
        assert "statistics" in engines

    def test_cpi_question(self):
        engines = plan("What changed after CPI?")
        assert "macro" in engines
        assert "statistics" in engines
        assert "knowledge_graph" in engines

    def test_performance_summary(self):
        engines = plan("How am I performing overall?")
        assert "statistics" in engines

    def test_pattern_question(self):
        engines = plan("What patterns are working for me?")
        assert "patterns" in engines

    def test_empty_question(self):
        engines = plan("")
        assert len(engines) > 0

    def test_learning_question(self):
        engines = plan("What mistakes am I making?")
        assert "knowledge_rules" in engines
        assert "trade_memory" in engines


class TestContextBuilder:
    def test_builds_string(self):
        evidence = {
            "statistics": {"overview": {"total_trades": 10, "wins": 6, "losses": 4, "win_rate": 0.6, "avg_rr": 2.0, "expectancy": 1.2, "total_pnl": 500}, "risk": {"profit_factor": 1.5, "max_drawdown": 100}},
            "knowledge_rules": [{"title": "London Bullish", "occurrences": 5, "win_rate": 0.8, "avg_rr": 2.5, "confidence": 75}],
            "knowledge_graph": {"total_nodes": 10, "total_edges": 20, "snapshot": {"summary": "Graph summary"}},
        }
        context = build_context(evidence, "How am I doing?")
        assert "[STATISTICS]" in context
        assert "[KNOWLEDGE RULES]" in context
        assert "[KNOWLEDGE GRAPH]" in context
        assert "How am I doing?" in context

    def test_empty_evidence(self):
        context = build_context({}, "test")
        assert "User Question: test" in context


class TestValidator:
    def test_keeps_grounded_answer(self):
        context = "Total trades: 10. Win rate: 60.0%. Expectancy: 1.20"
        answer = "Based on the data: total trades 10, win rate 60.0%, expectancy 1.20."
        result = validate(answer, context)
        assert result == answer

    def test_removes_unsubstantiated_number(self):
        context = "Total trades: 10"
        answer = "Total trades 10. Win rate 90%."
        result = validate(answer, context)
        assert "90%" not in result
        assert "10" not in result  # whole line removed due to unsubstantiated 90%

    def test_empty_result(self):
        context = "No data"
        answer = "The moon phase was bearish"
        result = validate(answer, context)
        assert result == "There is insufficient historical evidence."


class TestLLMFallback:
    def test_fallback_with_stats(self):
        context = "[STATISTICS]\nTotal trades: 10 | Wins: 6 | Losses: 4\nWin rate: 60.0% | Avg R:R: 2.00\nExpectancy: 1.20"
        result = _fallback_answer(context)
        assert "Statistics" in result.get("sources", [])
        assert result.get("confidence", 0) > 0
        assert "60.0%" in result.get("answer", "")
        assert "1.20" in result.get("answer", "")

    def test_fallback_empty(self):
        result = _fallback_answer("nothing relevant here")
        assert "insufficient historical evidence" in result.get("answer", "").lower()


class TestCleanJSON:
    def test_clean_with_fences(self):
        raw = "```json\n{\"answer\": \"test\", \"confidence\": 50, \"sources\": []}\n```"
        cleaned = _clean_json(raw)
        assert cleaned.startswith("{")
        assert "answer" in cleaned

    def test_clean_plain(self):
        raw = '{"answer": "test", "confidence": 50, "sources": ["stats"]}'
        cleaned = _clean_json(raw)
        assert cleaned == raw

    def test_cleans_without_fences(self):
        raw = "Some text before\n{\"answer\": \"nested\", \"confidence\": 10, \"sources\": []}\nsome text after"
        cleaned = _clean_json(raw)
        assert cleaned.startswith("{")
        assert "nested" in cleaned
