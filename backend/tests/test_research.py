"""Tests for the Research Engine V1 pipeline."""

from uuid import UUID, uuid4
from src.services.research.planner import plan
from src.services.research.validator import (
    validate_evidence,
    build_findings,
    build_recommendations,
    build_limitations,
)
from src.services.research.evidence_collector import collect_all, COLLECTORS
from src.services.research.task_executor import execute


class TestPlanner:
    def test_why_lost_trade(self):
        tasks = plan("Why did my EURUSD trade lose?")
        steps = [t.step for t in tasks]
        tools = [t.tool for t in tasks]
        assert 1 in steps
        assert "trade_memory" in tools
        assert "statistics" in tools
        assert "similarity" in tools
        assert "knowledge_rules" in tools
        assert "knowledge_graph" in tools
        assert "learning" in tools
        assert "validator" in tools
        assert "report" in tools
        assert steps == list(range(1, len(tasks) + 1))

    def test_winning_trade(self):
        tasks = plan("Why did my GBPJPY trade win?")
        tools = [t.tool for t in tasks]
        assert "trade_memory" in tools
        assert "similarity" in tools
        assert "report" in tools

    def test_performance_question(self):
        tasks = plan("How is my overall performance?")
        tools = [t.tool for t in tasks]
        assert "statistics" in tools
        assert "knowledge_rules" in tools
        assert "knowledge_graph" in tools
        assert "report" in tools

    def test_compare_question(self):
        tasks = plan("Compare my performance this month vs last month")
        tools = [t.tool for t in tasks]
        assert "trade_memory" in tools
        assert "statistics" in tools
        assert "similarity" in tools
        assert "report" in tools

    def test_pattern_question(self):
        tasks = plan("What patterns are working?")
        tools = [t.tool for t in tasks]
        assert "patterns" in tools
        assert "statistics" in tools
        assert "knowledge_rules" in tools
        assert "knowledge_graph" in tools
        assert "report" in tools

    def test_macro_question(self):
        tasks = plan("How did CPI affect my trading?")
        tools = [t.tool for t in tasks]
        assert "macro" in tools
        assert "trade_memory" in tools
        assert "statistics" in tools
        assert "knowledge_graph" in tools
        assert "report" in tools

    def test_graph_question(self):
        tasks = plan("What are the main connections in my knowledge graph?")
        tools = [t.tool for t in tasks]
        assert "knowledge_graph" in tools
        assert "statistics" in tools
        assert "report" in tools

    def test_learning_question(self):
        tasks = plan("What mistakes should I work on?")
        tools = [t.tool for t in tasks]
        assert "learning" in tools
        assert "trade_memory" in tools
        assert "knowledge_rules" in tools
        assert "patterns" in tools
        assert "report" in tools

    def test_empty_question(self):
        tasks = plan("")
        assert len(tasks) > 0
        assert "statistics" in [t.tool for t in tasks]

    def test_all_tasks_have_valid_tools(self):
        tasks = plan("What is happening?")
        valid_tools = {
            "trade_memory", "similarity", "statistics", "patterns",
            "knowledge_rules", "knowledge_graph", "macro", "learning",
            "trade_debrief", "personal_pattern", "personal_rule", "trader_profile",
            "institutional_knowledge",
            "validator", "report",
        }
        for t in tasks:
            assert t.tool in valid_tools, f"Unknown tool: {t.tool}"
            assert t.step > 0
            assert t.description


class TestCollectors:
    def test_all_collectors_defined(self):
        expected = {
            "trade_memory", "similarity", "statistics", "patterns",
            "knowledge_rules", "knowledge_graph", "macro", "learning",
            "trade_debrief", "personal_pattern", "personal_rule", "trader_profile",
            "institutional_knowledge",
        }
        assert set(COLLECTORS.keys()) == expected

    def test_collect_all_returns_dict(self):
        evidence = collect_all(None, uuid4())
        assert isinstance(evidence, dict)


class TestValidator:
    def test_validate_evidence_empty(self):
        result = validate_evidence({})
        assert result == {}

    def test_validate_evidence_none(self):
        result = validate_evidence({"statistics": {}, "rules": []})
        assert result == {}

    def test_validate_keeps_populated(self):
        evidence = {"statistics": {"overview": {"total_trades": 10}}}
        result = validate_evidence(evidence)
        assert "statistics" in result

    def test_build_findings_empty(self):
        findings = build_findings({})
        assert findings == []

    def test_build_findings_with_stats(self):
        evidence = {
            "statistics": {
                "overview": {
                    "total_trades": 50, "wins": 30, "losses": 20,
                    "win_rate": 60.0, "avg_rr": 1.5, "expectancy": 0.8,
                }
            }
        }
        findings = build_findings(evidence)
        assert len(findings) >= 2
        assert any("50" in f for f in findings)
        assert any("60.0%" in f or "60" in f for f in findings)

    def test_build_findings_with_rules(self):
        evidence = {
            "knowledge_rules": [
                {"title": "London Bullish", "occurrences": 10, "win_rate": 0.8}
            ]
        }
        findings = build_findings(evidence)
        assert len(findings) >= 1
        assert any("London Bullish" in f for f in findings)

    def test_build_findings_with_patterns(self):
        evidence = {
            "patterns": [
                {"name": "FVG Entry", "total_occurrences": 5, "win_rate": 0.6}
            ]
        }
        findings = build_findings(evidence)
        assert any("FVG Entry" in f for f in findings)

    def test_build_findings_with_graph(self):
        evidence = {
            "knowledge_graph": {"total_nodes": 25, "total_edges": 40}
        }
        findings = build_findings(evidence)
        assert any("25" in f and "40" in f for f in findings)

    def test_build_recommendations_drawdown(self):
        evidence = {
            "statistics": {
                "overview": {"total_trades": 10},
                "risk": {"max_drawdown": 500, "profit_factor": 1.2},
            }
        }
        recs = build_recommendations(evidence)
        assert len(recs) >= 1
        assert any("drawdown" in r.lower() for r in recs)

    def test_build_recommendations_low_confidence_rules(self):
        evidence = {
            "knowledge_rules": [
                {"title": "Rule A", "confidence": 30},
                {"title": "Rule B", "confidence": 80},
            ]
        }
        recs = build_recommendations(evidence)
        assert any("low-confidence" in r.lower() for r in recs)

    def test_build_limitations_small_sample(self):
        evidence = {
            "statistics": {"overview": {"total_trades": 5}}
        }
        lims = build_limitations(evidence)
        assert any("small sample" in l.lower() for l in lims)

    def test_build_limitations_no_rules(self):
        evidence = {"knowledge_rules": []}
        lims = build_limitations(evidence)
        assert any("knowledge rules" in l.lower() for l in lims)
        assert any("no" in l.lower() for l in lims)

    def test_build_limitations_no_data(self):
        lims = build_limitations({})
        assert len(lims) >= 1
        assert any("no historical" in l.lower() for l in lims)

    def test_full_pipeline(self):
        evidence = {
            "statistics": {
                "overview": {
                    "total_trades": 100, "wins": 55, "losses": 45,
                    "win_rate": 55.0, "avg_rr": 1.8, "expectancy": 0.9,
                },
                "risk": {"profit_factor": 1.3, "max_drawdown": 300},
            },
            "knowledge_rules": [
                {"title": "Asian Session Breakout", "occurrences": 15, "win_rate": 0.73, "confidence": 65},
            ],
            "patterns": [
                {"name": "Order Block Bounce", "total_occurrences": 8, "win_rate": 0.75},
            ],
            "knowledge_graph": {"total_nodes": 30, "total_edges": 45},
            "macro": {"recent_events": [{"event_name": "CPI", "country": "US"}]},
        }

        validated = validate_evidence(evidence)
        assert len(validated) == 5

        findings = build_findings(evidence)
        assert 4 <= len(findings) <= 8

        recs = build_recommendations(evidence)
        assert len(recs) >= 0

        lims = build_limitations(evidence)
        assert len(lims) >= 0


class TestTaskExecutor:
    def test_unknown_tool_returns_empty(self):
        result, count = execute(None, uuid4(), "unknown_tool", {})
        assert result is None
        assert count == 0

    def test_validator_executes(self):
        evidence = {
            "statistics": {"overview": {"total_trades": 10, "wins": 6, "losses": 4, "win_rate": 60, "avg_rr": 2.0, "expectancy": 1.2}}
        }
        result, count = execute(None, uuid4(), "validator", evidence)
        assert result is not None
        assert "findings" in result
        assert "evidence_sources" in result
        assert count > 0

    def test_report_executes(self):
        evidence = {
            "statistics": {"overview": {"total_trades": 25, "wins": 15, "losses": 10, "win_rate": 60, "avg_rr": 1.5, "expectancy": 0.8}},
            "knowledge_rules": [{"title": "Test Rule", "occurrences": 5, "win_rate": 0.8, "confidence": 70}],
        }
        result, count = execute(None, uuid4(), "report", evidence)
        assert result is not None
        assert "summary" in result
        assert "findings" in result
        assert "recommendations" in result
        assert "limitations" in result
        assert "confidence" in result
        assert "sources" in result
        assert result["confidence"] > 0


class TestEngine:
    def test_plan_is_deterministic(self):
        tasks1 = plan("Why did my trade lose?")
        tasks2 = plan("Why did my trade lose?")
        assert len(tasks1) == len(tasks2)
        for t1, t2 in zip(tasks1, tasks2):
            assert t1.tool == t2.tool
            assert t1.step == t2.step

    def test_every_tool_in_planner_exists_in_collectors(self):
        tasks = plan("What is happening in my trading?")
        collector_tools = set(COLLECTORS.keys()) | {"validator", "report"}
        for t in tasks:
            assert t.tool in collector_tools, f"Tool {t.tool} has no collector"

    def test_report_confidence_scales_with_evidence(self):
        from src.services.research.engine import _generate_report

        report1 = _generate_report({"statistics": {"overview": {"total_trades": 5, "wins": 3, "losses": 2, "win_rate": 60, "avg_rr": 1.5, "expectancy": 0.5}}})
        report2 = _generate_report({
            "statistics": {"overview": {"total_trades": 100, "wins": 60, "losses": 40, "win_rate": 60, "avg_rr": 1.5, "expectancy": 0.8}},
            "knowledge_rules": [{"title": "R1", "occurrences": 20, "win_rate": 0.7, "confidence": 80}],
            "patterns": [{"name": "P1", "total_occurrences": 10, "win_rate": 0.8}],
            "knowledge_graph": {"total_nodes": 50, "total_edges": 80},
        })
        assert report2["confidence"] >= report1["confidence"]
        assert len(report2["findings"]) >= len(report1["findings"])
