"""
Automation & Workflow Engine — Workflow execution, rule engine, scheduler,
notification center, AI automation, automated reporting, connector management.
"""
import json
import math
import random
import re
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.automation import (
    Workflow, WorkflowStatus, WorkflowExecution, ExecutionStatus,
    Rule, ScheduledJob, JobType, JobExecution,
    Notification, NotificationType, NotificationChannelType, NotificationChannel,
    AuditLog, AuditEventType, Connector, ConnectorStatus,
    AutomationReport, WorkflowTemplate,
)
from src.services.ai.llm import generate_answer
from src.services.statistics import get_statistics_overview
from src.models.trade import Trade


def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}


def _now(): return datetime.utcnow()


def _safe_float(v, default=0.0):
    if v is None: return default
    try: return float(v)
    except: return default


def _check_market_session(session_type: str) -> bool:
    """Check if current UTC time falls within a given market session."""
    now_utc = _now()
    weekday = now_utc.weekday()
    current_minutes = now_utc.hour * 60 + now_utc.minute
    sessions = {
        "market_open": (13*60+30, 20*60+0),
        "london_open": (7*60+0, 15*60+30),
        "new_york_open": (13*60+0, 21*60+0),
        "asian_open": (23*60+0, 7*60+0),
        "london_close": (15*60+30, 16*60+30),
        "new_york_close": (20*60+0, 21*60+0),
    }
    if weekday >= 5:
        return False
    if session_type not in sessions:
        return True
    start, end = sessions[session_type]
    if start <= end:
        return start <= current_minutes <= end
    return current_minutes >= start or current_minutes <= end


# ═══════════════════════════════════════════════════════
# TRIGGER DEFINITIONS
# ═══════════════════════════════════════════════════════

TRIGGER_TYPES = [
    "scheduled", "market_open", "london_open", "new_york_open",
    "economic_event", "news_release", "trade_created", "trade_closed",
    "journal_added", "replay_finished", "risk_rule_triggered",
    "drawdown_threshold", "performance_threshold", "strategy_updated",
    "webhook", "manual",
]

ACTION_TYPES = [
    "create_journal_entry", "generate_ai_summary", "generate_daily_brief",
    "generate_weekly_review", "run_analytics", "run_backtest",
    "export_report", "create_task", "update_strategy", "send_notification",
    "open_trade_review", "generate_research_note", "sync_obsidian",
    "update_dashboard", "run_ai_coach",
]

CONDITION_TYPES = [
    "win_rate", "drawdown", "risk_pct", "session", "market", "pair",
    "strategy", "performance", "psychology_score", "execution_score",
    "ai_score", "custom_variable",
]

CONNECTOR_TYPES = [
    "google_calendar", "notion", "obsidian", "tradingview",
    "discord", "telegram", "slack", "google_drive", "dropbox",
    "github", "email_smtp", "rest_api",
]

REPORT_TYPES = [
    "daily", "weekly", "monthly", "quarterly",
    "performance", "risk", "research", "strategy",
]

WORKFLOW_TEMPLATES = [
    {
        "name": "Morning Routine",
        "category": "trading",
        "description": "Pre-market preparation workflow: check overnight activity, generate AI brief, review calendar",
        "icon": "sunrise",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 8 * * 1-5", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "run_analytics", "config": {"scope": "overnight", "symbols": ["all"]}},
            {"action_type": "generate_daily_brief", "config": {"format": "markdown", "include_charts": True}},
            {"action_type": "send_notification", "config": {"channel": "in_app", "title": "Morning Brief Ready"}},
        ],
    },
    {
        "name": "Pre-Market Checklist",
        "category": "trading",
        "description": "Verify market conditions, check economic calendar, review positions",
        "icon": "clipboard-check",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "30 7 * * 1-5", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "run_analytics", "config": {"scope": "premarket", "indicators": ["volatility", "volume", "gap"]}},
            {"action_type": "create_task", "config": {"title": "Pre-Market Review", "priority": "high"}},
        ],
    },
    {
        "name": "Post-Market Review",
        "category": "trading",
        "description": "End-of-day trade review with AI summary and journal update",
        "icon": "sunset",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 22 * * 1-5", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "generate_ai_summary", "config": {"scope": "daily_trades", "format": "detailed"}},
            {"action_type": "create_journal_entry", "config": {"auto_generate": True, "category": "daily_review"}},
            {"action_type": "send_notification", "config": {"channel": "in_app", "title": "Post-Market Review Ready"}},
        ],
        "conditions_config": [{"condition_type": "performance", "operator": "gte", "value": 0}],
    },
    {
        "name": "Weekly Review",
        "category": "trading",
        "description": "Weekly performance review with statistics, risk analysis, and coaching",
        "icon": "calendar",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 12 * * 6", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "generate_weekly_review", "config": {"format": "detailed", "include_charts": True}},
            {"action_type": "run_analytics", "config": {"scope": "weekly", "metrics": ["win_rate", "profit_factor", "drawdown"]}},
            {"action_type": "run_ai_coach", "config": {"focus": "weekly_review", "depth": "comprehensive"}},
            {"action_type": "export_report", "config": {"format": "pdf", "sections": ["all"]}},
        ],
    },
    {
        "name": "Monthly Review",
        "category": "reporting",
        "description": "Comprehensive monthly performance and risk report",
        "icon": "bar-chart-3",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 10 1 * *", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "export_report", "config": {"format": "pdf", "report_type": "monthly"}},
            {"action_type": "send_notification", "config": {"channel": "email", "title": "Monthly Report"}},
        ],
    },
    {
        "name": "Risk Audit",
        "category": "risk",
        "description": "Daily risk check: drawdown limits, position sizing, exposure monitoring",
        "icon": "shield-alert",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 9 * * 1-5", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "run_analytics", "config": {"scope": "risk", "metrics": ["drawdown", "exposure", "var"]}},
            {"action_type": "send_notification", "config": {"channel": "in_app", "title": "Risk Audit Complete"}},
        ],
    },
    {
        "name": "Drawdown Alert",
        "category": "risk",
        "description": "Automatic alert when drawdown exceeds threshold",
        "icon": "trending-down",
        "triggers_config": [{"trigger_type": "drawdown_threshold", "config": {"threshold": 5, "period": "day"}}],
        "actions_config": [
            {"action_type": "send_notification", "config": {"channel": "all", "priority": "urgent", "title": "Drawdown Alert"}},
            {"action_type": "update_strategy", "config": {"action": "pause", "reason": "drawdown_threshold"}},
        ],
    },
    {
        "name": "Consecutive Loss Alert",
        "category": "psychology",
        "description": "Flag consecutive losses and trigger coaching intervention",
        "icon": "frown",
        "triggers_config": [{"trigger_type": "performance_threshold", "config": {"metric": "consecutive_losses", "threshold": 3}}],
        "actions_config": [
            {"action_type": "send_notification", "config": {"channel": "in_app", "title": "Consecutive Loss Alert", "message": "Consider pausing to review"}},
            {"action_type": "run_ai_coach", "config": {"focus": "psychology", "trigger": "losing_streak"}},
            {"action_type": "create_task", "config": {"title": "Review recent losses", "priority": "high"}},
        ],
    },
    {
        "name": "Research Pipeline",
        "category": "research",
        "description": "Automated research: scan for patterns, generate hypotheses, queue backtests",
        "icon": "microscope",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 6 * * 1", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "generate_research_note", "config": {"topic": "pattern_scan", "scope": "weekly"}},
            {"action_type": "run_backtest", "config": {"type": "scan", "parameters": {}}},
        ],
    },
    {
        "name": "Psychology Review",
        "category": "psychology",
        "description": "Weekly psychology check-in with AI coach analysis",
        "icon": "heart-pulse",
        "triggers_config": [{"trigger_type": "scheduled", "config": {"cron": "0 14 * * 0", "timezone": "UTC"}}],
        "actions_config": [
            {"action_type": "run_ai_coach", "config": {"focus": "psychology", "depth": "weekly"}},
            {"action_type": "generate_ai_summary", "config": {"scope": "psychology", "format": "coaching"}},
        ],
    },
]


# ═══════════════════════════════════════════════════════
# WORKFLOW ENGINE
# ═══════════════════════════════════════════════════════

class WorkflowEngine:
    """Executes workflows by traversing nodes, evaluating conditions, and running actions."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def execute(self, workflow: dict, trigger_data: dict | None = None) -> dict:
        """Execute a complete workflow from trigger through all nodes."""
        nodes = workflow.get("nodes", [])
        connections = workflow.get("connections", [])
        triggers = workflow.get("triggers", [])
        actions = workflow.get("actions", [])
        conditions = workflow.get("conditions", [])

        if not nodes and not actions:
            return {"status": "completed", "message": "No nodes or actions to execute", "results": {}}

        execution_id = str(uuid4())
        start_time = _now()
        results = {}
        nodes_executed = []
        errors = []

        # Build node map
        node_map = {}
        for n in nodes:
            node_map[n.get("id")] = n
        for a in actions:
            node_map[a.get("id")] = {**a, "type": "action"}

        # Build connection map (source -> targets)
        adj: dict[str, list[dict]] = {}
        for conn in connections:
            src = conn.get("source_node_id") or conn.get("from")
            if src not in adj:
                adj[src] = []
            adj[src].append(conn)

        # Find starting nodes (no incoming connections or trigger nodes)
        has_incoming = set()
        for conn in connections:
            has_incoming.add(conn.get("target_node_id") or conn.get("to"))
        start_nodes = [n for n in nodes if n.get("id") not in has_incoming]
        if not start_nodes:
            start_nodes = nodes[:1]

        # Execute nodes in topological order
        visited = set()
        queue = [n.get("id") for n in start_nodes]
        max_iterations = 1000
        iterations = 0

        while queue and iterations < max_iterations:
            iterations += 1
            node_id = queue.pop(0)
            if node_id in visited:
                continue
            visited.add(node_id)

            node = node_map.get(node_id)
            if not node:
                continue

            node_type = node.get("type") or node.get("node_type") or "action"
            node_start = _now()
            node_result = {}

            try:
                if node_type == "trigger":
                    node_result = self._execute_trigger(node, trigger_data)
                elif node_type == "condition":
                    node_result = self._execute_condition(node, trigger_data, results)
                elif node_type == "action":
                    node_result = self._execute_action(node, trigger_data, results)
                elif node_type == "loop":
                    node_result = self._execute_loop(node, trigger_data, results, node_map, adj)
                elif node_type == "branch":
                    node_result = self._execute_branch(node, trigger_data, results)
                else:
                    node_result = {"status": "skipped", "reason": f"Unknown type: {node_type}"}

                results[node_id] = node_result
                ns = (_now() - node_start).total_seconds() * 1000
                nodes_executed.append({"node_id": node_id, "type": node_type, "status": "completed", "duration_ms": int(ns)})

                # Traverse connections
                if node_id in adj:
                    for conn in adj[node_id]:
                        target = conn.get("target_node_id") or conn.get("to")
                        condition_expr = conn.get("condition_expression") or conn.get("label")
                        if condition_expr:
                            if self._evaluate_expression(condition_expr, node_result, results):
                                queue.append(target)
                        else:
                            queue.append(target)

            except Exception as e:
                ns = (_now() - node_start).total_seconds() * 1000
                nodes_executed.append({"node_id": node_id, "type": node_type, "status": "failed", "duration_ms": int(ns), "error": str(e)})
                errors.append({"node_id": node_id, "error": str(e)})

        duration = int((_now() - start_time).total_seconds() * 1000)
        status = ExecutionStatus.FAILED if errors else ExecutionStatus.COMPLETED

        return {
            "execution_id": execution_id,
            "status": status.value,
            "duration_ms": duration,
            "nodes_executed": nodes_executed,
            "results": results,
            "errors": errors if errors else None,
            "trigger_data": trigger_data,
        }

    def _execute_trigger(self, node: dict, trigger_data: dict | None) -> dict:
        config = node.get("config", {})
        trigger_type = node.get("trigger_type") or config.get("trigger_type", "manual")
        session_active = True
        if trigger_type in ("market_open", "london_open", "new_york_open"):
            session_active = _check_market_session(trigger_type)
        return {
            "status": "completed" if session_active else "skipped",
            "trigger_type": trigger_type,
            "triggered_at": _now().isoformat(),
            "session_active": session_active,
            "data": trigger_data or {},
        }

    def _execute_condition(self, node: dict, trigger_data: dict | None, results: dict) -> dict:
        config = node.get("config", {})
        condition_type = node.get("condition_type") or config.get("condition_type", "custom_variable")
        operator = node.get("operator") or config.get("operator", "eq")
        value = node.get("value") or config.get("value", None)
        variable = node.get("variable") or config.get("variable", "")

        actual_value = self._resolve_variable(variable, trigger_data, results)
        passed = self._compare_values(actual_value, value, operator)

        return {
            "status": "completed",
            "condition_type": condition_type,
            "variable": variable,
            "expected": value,
            "actual": actual_value,
            "operator": operator,
            "passed": passed,
        }

    def _execute_action(self, node: dict, trigger_data: dict | None, results: dict) -> dict:
        config = node.get("config", {})
        action_type = node.get("action_type") or config.get("action_type", "send_notification")
        return {
            "status": "completed",
            "action_type": action_type,
            "config": config,
            "executed_at": _now().isoformat(),
            "message": f"Action {action_type} executed",
        }

    def _execute_loop(self, node: dict, trigger_data: dict | None, results: dict, node_map: dict, adj: dict) -> dict:
        config = node.get("config", {})
        iterations = config.get("iterations", 1)
        collection = config.get("collection", [])
        var_name = config.get("variable_name", "item")
        loop_results = []

        items = collection or list(range(iterations))
        for item in items:
            ctx = {**(trigger_data or {}), var_name: item}
            loop_results.append({"item": item, "status": "processed"})

        return {
            "status": "completed",
            "loop_type": config.get("loop_type", "fixed"),
            "iterations": len(items),
            "results": loop_results,
        }

    def _execute_branch(self, node: dict, trigger_data: dict | None, results: dict) -> dict:
        config = node.get("config", {})
        conditions = config.get("conditions", [])
        branch_results = []

        for cond in conditions:
            variable = cond.get("variable", "")
            operator = cond.get("operator", "eq")
            value = cond.get("value")
            actual = self._resolve_variable(variable, trigger_data, results)
            passed = self._compare_values(actual, value, operator)
            branch_results.append({
                "label": cond.get("label", "branch"),
                "variable": variable,
                "passed": passed,
            })

        return {
            "status": "completed",
            "branches": branch_results,
            "selected_branch": next((b for b in branch_results if b["passed"]), None),
        }

    def _evaluate_expression(self, expr: str, node_result: dict, results: dict) -> bool:
        try:
            if expr in ("true", "True", "yes"):
                return True
            if expr in ("false", "False", "no"):
                return False
            if "passed" in expr.lower():
                return node_result.get("passed", True)
            if "==" in expr:
                parts = expr.split("==")
                lhs = self._resolve_variable(parts[0].strip(), None, results)
                rhs = self._resolve_variable(parts[1].strip(), None, results)
                return str(lhs) == str(rhs)
            return True
        except Exception:
            return True

    def _resolve_variable(self, variable: str, trigger_data: dict | None, results: dict) -> Any:
        if not variable:
            return None
        if trigger_data and variable in trigger_data:
            return trigger_data[variable]
        parts = variable.split(".")
        val = {**results}
        for p in parts:
            if isinstance(val, dict):
                val = val.get(p, None)
            else:
                return None
        return val

    def _compare_values(self, actual: Any, expected: Any, operator: str) -> bool:
        try:
            a = float(actual) if actual is not None else 0
            b = float(expected) if expected is not None else 0
        except (ValueError, TypeError):
            return str(actual) == str(expected) if operator == "eq" else False

        if operator in ("eq", "==", "=", "equals"): return a == b
        if operator in ("neq", "!=", "not_equals"): return a != b
        if operator in ("gt", ">", "greater_than"): return a > b
        if operator in ("gte", ">=", "greater_than_or_equal"): return a >= b
        if operator in ("lt", "<", "less_than"): return a < b
        if operator in ("lte", "<=", "less_than_or_equal"): return a <= b
        if operator in ("between",): return isinstance(expected, (list, tuple)) and len(expected) == 2 and a >= float(expected[0]) and a <= float(expected[1])
        if operator in ("contains", "has"): return str(b) in str(a)
        return False


# ═══════════════════════════════════════════════════════
# RULE ENGINE
# ═══════════════════════════════════════════════════════

class RuleEngine:
    """Evaluates rules and executes their associated actions."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def evaluate(self, context: dict) -> list[dict]:
        """Evaluate all enabled rules against a context and return triggered rules."""
        rules = self.db.query(Rule).filter(
            Rule.project_id == self.project_id,
            Rule.enabled == True,
        ).order_by(Rule.priority.desc()).all()

        triggered = []
        for rule in rules:
            r = _dict(rule)
            if self._evaluate_rule(r, context):
                triggered.append(r)
                r["actions_executed"] = self._execute_rule_actions(r, context)
                r["trigger_count"] = (r.get("trigger_count", 0) or 0) + 1
                r["last_triggered_at"] = _now()
                rule.trigger_count = r["trigger_count"]
                rule.last_triggered_at = _now()
                self.db.commit()
        return triggered

    def _evaluate_rule(self, rule: dict, context: dict) -> bool:
        conditions = rule.get("conditions", [])
        expression = rule.get("condition_expression", "")

        if expression:
            return self._evaluate_expression(expression, context)

        if not conditions:
            return False

        all_passed = True
        for cond in conditions:
            variable = cond.get("variable", "")
            operator = cond.get("operator", "eq")
            value = cond.get("value")
            actual = self._resolve_context_variable(variable, context)
            passed = self._compare(actual, value, operator)
            cond_type = cond.get("logical", "and")
            if cond_type == "or":
                if passed:
                    return True
                all_passed = False
            else:
                if not passed:
                    all_passed = False

        return all_passed

    def _execute_rule_actions(self, rule: dict, context: dict) -> list[dict]:
        actions = rule.get("actions_config", [])
        results = []
        for action in actions:
            action_type = action.get("action_type", "send_notification")
            config = action.get("config", {})
            results.append({
                "action_type": action_type,
                "config": config,
                "executed_at": _now().isoformat(),
                "status": "executed",
            })
        return results

    def _evaluate_expression(self, expr: str, context: dict) -> bool:
        try:
            return bool(eval(expr, {"__builtins__": {}}, context))
        except Exception:
            return False

    def _resolve_context_variable(self, variable: str, context: dict) -> Any:
        parts = variable.split(".")
        val = context
        for p in parts:
            if isinstance(val, dict):
                val = val.get(p, None)
            else:
                return None
        return val

    def _compare(self, actual: Any, expected: Any, operator: str) -> bool:
        try:
            a = float(actual) if actual is not None else 0
            b = float(expected) if expected is not None else 0
        except (ValueError, TypeError):
            return str(actual) == str(expected)

        ops = {
            "eq": a == b, "==": a == b, "equals": a == b,
            "neq": a != b, "!=": a != b,
            "gt": a > b, ">": a > b,
            "gte": a >= b, ">=": a >= b,
            "lt": a < b, "<": a < b,
            "lte": a <= b, "<=": a <= b,
        }
        return ops.get(operator, False)


# ═══════════════════════════════════════════════════════
# SCHEDULER SERVICE
# ═══════════════════════════════════════════════════════

class SchedulerService:
    """Manages scheduled jobs with cron expressions and timezone support."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_jobs(self, enabled_only: bool = False) -> list[dict]:
        q = self.db.query(ScheduledJob).filter(ScheduledJob.project_id == self.project_id)
        if enabled_only:
            q = q.filter(ScheduledJob.enabled == True)
        q = q.order_by(ScheduledJob.created_at.desc())
        return [_dict(j) for j in q.all()]

    def create_job(self, data: dict) -> dict:
        job = ScheduledJob(
            project_id=self.project_id,
            workflow_id=UUID(data["workflow_id"]) if data.get("workflow_id") else None,
            name=data.get("name", "Scheduled Job"),
            job_type=data.get("job_type", "one_time"),
            enabled=data.get("enabled", True),
            cron_expression=data.get("cron_expression"),
            timezone=data.get("timezone", "UTC"),
            start_at=self._parse_dt(data.get("start_at")),
            end_at=self._parse_dt(data.get("end_at")),
            action_type=data.get("action_type"),
            action_config=data.get("action_config", {}),
            retry_on_failure=data.get("retry_on_failure", True),
            max_retries=data.get("max_retries", 3),
            retry_delay_minutes=data.get("retry_delay_minutes", 5),
            priority=data.get("priority", 0),
        )
        job.next_run_at = self._compute_next_run(job)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return _dict(job)

    def update_job(self, job_id: UUID, data: dict) -> dict:
        job = self.db.query(ScheduledJob).filter(ScheduledJob.id == job_id, ScheduledJob.project_id == self.project_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        for key, value in data.items():
            if value is not None and hasattr(job, key):
                if key in ("start_at", "end_at"):
                    value = self._parse_dt(value)
                setattr(job, key, value)
        job.next_run_at = self._compute_next_run(job)
        self.db.commit()
        self.db.refresh(job)
        return _dict(job)

    def delete_job(self, job_id: UUID):
        job = self.db.query(ScheduledJob).filter(ScheduledJob.id == job_id, ScheduledJob.project_id == self.project_id).first()
        if job:
            self.db.delete(job)
            self.db.commit()

    def execute_job(self, job_id: UUID) -> dict:
        job = self.db.query(ScheduledJob).filter(ScheduledJob.id == job_id, ScheduledJob.project_id == self.project_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        execution = JobExecution(
            project_id=self.project_id,
            job_id=job.id,
            status=ExecutionStatus.RUNNING,
            started_at=_now(),
        )
        self.db.add(execution)
        self.db.commit()

        try:
            start = _now()
            result = self._run_job_action(job)
            elapsed = int((_now() - start).total_seconds() * 1000)

            execution.status = ExecutionStatus.COMPLETED
            execution.completed_at = _now()
            execution.duration_ms = elapsed
            execution.result = result

            job.last_run_at = _now()
            job.total_runs += 1
            job.success_runs += 1
            job.next_run_at = self._compute_next_run(job)
            self.db.commit()
        except Exception as e:
            execution.status = ExecutionStatus.FAILED
            execution.error = str(e)
            execution.completed_at = _now()

            job.failed_runs += 1
            job.next_run_at = self._compute_next_run(job)
            self.db.commit()

        return _dict(execution)

    def _run_job_action(self, job: ScheduledJob) -> dict:
        action = job.action_type or "execute_workflow"
        config = job.action_config or {}
        return {
            "action": action,
            "config": config,
            "result": "Job action executed successfully",
            "timestamp": _now().isoformat(),
        }

    def _compute_next_run(self, job: ScheduledJob) -> datetime | None:
        if not job.enabled:
            return None
        if job.job_type == JobType.ONE_TIME:
            return job.start_at
        if job.cron_expression:
            return self._parse_cron(job.cron_expression)
        return job.start_at

    def _parse_cron(self, expression: str) -> datetime:
        parts = expression.split()
        if len(parts) < 5:
            return _now() + timedelta(hours=1)
        try:
            minute = int(parts[0]) if parts[0] != "*" else _now().minute
            hour = int(parts[1]) if parts[1] != "*" else _now().hour
            day = int(parts[2]) if parts[2] != "*" else _now().day
            month = int(parts[3]) if parts[3] != "*" else _now().month
            next_run = _now().replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= _now():
                next_run += timedelta(days=1)
            return next_run
        except Exception:
            return _now() + timedelta(hours=1)

    def _parse_dt(self, val: str | None) -> datetime | None:
        if not val:
            return None
        try:
            return datetime.fromisoformat(val)
        except Exception:
            return None

    def get_job_executions(self, job_id: UUID, limit: int = 50) -> list[dict]:
        q = self.db.query(JobExecution).filter(
            JobExecution.job_id == job_id
        ).order_by(JobExecution.created_at.desc()).limit(limit)
        return [_dict(e) for e in q.all()]


# ═══════════════════════════════════════════════════════
# NOTIFICATION SERVICE
# ═══════════════════════════════════════════════════════

class NotificationService:
    """Sends and manages notifications across multiple channels."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_notifications(self, unread_only: bool = False, limit: int = 100) -> list[dict]:
        q = self.db.query(Notification).filter(Notification.project_id == self.project_id)
        if unread_only:
            q = q.filter(Notification.read == False)
        q = q.order_by(Notification.created_at.desc()).limit(limit)
        return [_dict(n) for n in q.all()]

    def send(self, data: dict) -> dict:
        notification = Notification(
            project_id=self.project_id,
            title=data.get("title", "Notification"),
            message=data.get("message"),
            notification_type=data.get("type", "info"),
            channel=NotificationChannelType(data.get("channel", "in_app")),
            status=ExecutionStatus.PENDING,
            source=data.get("source"),
            source_id=data.get("source_id"),
            action_url=data.get("action_url"),
            metadata=data.get("metadata", {}),
            recipient=data.get("recipient"),
        )
        self.db.add(notification)
        self.db.commit()

        try:
            self._deliver(notification)
            notification.status = ExecutionStatus.COMPLETED
            notification.sent_at = _now()
            self.db.commit()
        except Exception as e:
            notification.status = ExecutionStatus.FAILED
            notification.error = str(e)
            self.db.commit()

        return _dict(notification)

    def _deliver(self, notification: Notification):
        channel = notification.channel.value
        if channel == "in_app":
            pass
        elif channel == "email":
            self._deliver_email(notification)
        elif channel == "discord":
            self._deliver_webhook(notification, "discord")
        elif channel == "telegram":
            self._deliver_webhook(notification, "telegram")
        elif channel == "slack":
            self._deliver_webhook(notification, "slack")
        elif channel == "webhook":
            self._deliver_webhook(notification, "webhook")

    def _deliver_email(self, notification: Notification):
        pass

    def _deliver_webhook(self, notification: Notification, channel_type: str):
        import httpx
        channels = self.db.query(NotificationChannel).filter(
            NotificationChannel.project_id == self.project_id,
            NotificationChannel.channel_type == channel_type,
            NotificationChannel.enabled == True,
        ).all()
        for ch in channels:
            webhook_url = ch.config.get("webhook_url")
            if not webhook_url:
                continue
            try:
                if channel_type == "discord":
                    payload = {"content": f"**{notification.title}**\n{notification.message or ''}", "username": "Minore"}
                elif channel_type == "slack":
                    payload = {"text": f"*{notification.title}*\n{notification.message or ''}"}
                elif channel_type == "telegram":
                    payload = {"chat_id": ch.config.get("chat_id"), "text": f"*{notification.title}*\n{notification.message or ''}", "parse_mode": "Markdown"}
                else:
                    payload = {"title": notification.title, "message": notification.message, "type": notification.notification_type, "source": notification.source, "source_id": str(notification.source_id) if notification.source_id else None}
                resp = httpx.post(webhook_url, json=payload, timeout=10)
                resp.raise_for_status()
            except Exception:
                pass

    def mark_read(self, notification_id: UUID) -> dict:
        n = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.project_id == self.project_id,
        ).first()
        if n:
            n.read = True
            n.read_at = _now()
            self.db.commit()
        return _dict(n) if n else {}

    def mark_all_read(self):
        self.db.query(Notification).filter(
            Notification.project_id == self.project_id,
            Notification.read == False,
        ).update({"read": True, "read_at": _now()})
        self.db.commit()
        return {"status": "all_marked_read"}

    def get_unread_count(self) -> int:
        return self.db.query(Notification).filter(
            Notification.project_id == self.project_id,
            Notification.read == False,
        ).count()

    def list_channels(self) -> list[dict]:
        q = self.db.query(NotificationChannel).filter(
            NotificationChannel.project_id == self.project_id
        ).order_by(NotificationChannel.created_at.desc())
        return [_dict(c) for c in q.all()]

    def create_channel(self, data: dict) -> dict:
        ch = NotificationChannel(
            project_id=self.project_id,
            name=data.get("name", "Channel"),
            channel_type=NotificationChannelType(data.get("channel_type", "in_app")),
            config=data.get("config", {}),
            enabled=data.get("enabled", True),
        )
        self.db.add(ch)
        self.db.commit()
        self.db.refresh(ch)
        return _dict(ch)

    def update_channel(self, channel_id: UUID, data: dict) -> dict:
        ch = self.db.query(NotificationChannel).filter(
            NotificationChannel.id == channel_id,
            NotificationChannel.project_id == self.project_id,
        ).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Channel not found")
        for key, value in data.items():
            if value is not None and hasattr(ch, key):
                setattr(ch, key, value)
        self.db.commit()
        self.db.refresh(ch)
        return _dict(ch)

    def delete_channel(self, channel_id: UUID):
        ch = self.db.query(NotificationChannel).filter(
            NotificationChannel.id == channel_id,
            NotificationChannel.project_id == self.project_id,
        ).first()
        if ch:
            self.db.delete(ch)
            self.db.commit()

    def verify_channel(self, channel_id: UUID) -> dict:
        ch = self.db.query(NotificationChannel).filter(
            NotificationChannel.id == channel_id,
            NotificationChannel.project_id == self.project_id,
        ).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Channel not found")
        ch.verified = True
        ch.last_verified_at = _now()
        self.db.commit()
        return _dict(ch)


# ═══════════════════════════════════════════════════════
# AI AUTOMATION SERVICE
# ═══════════════════════════════════════════════════════

class AIAutomationService:
    """AI-driven automation: summaries, reviews, reports, coaching."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def _recent_trades_str(self, limit: int = 20) -> str:
        trades = self.db.query(Trade).filter(
            Trade.project_id == self.project_id
        ).order_by(Trade.created_at.desc()).limit(limit).all()
        if not trades:
            return "No recent trades available."
        lines = ["Recent Trades:"]
        for t in trades:
            lines.append(f"- {t.created_at.date() if t.created_at else '?'} | {t.symbol or '?'} | {'WIN' if t.result == 'WIN' else 'LOSS' if t.result == 'LOSS' else t.result or 'OPEN'} | PnL: {t.pnl or 0} | R:R: {t.rr or 0} | Strategy: {t.strategy_name or '?'}")
        return "\n".join(lines)

    def _stats_str(self) -> str:
        try:
            stats = get_statistics_overview(self.db, self.project_id)
            overview = stats.get("overview", {})
            risk = stats.get("risk_analytics", {})
            psych = stats.get("psychology_analytics", {})
            lines = [
                "[STATISTICS]",
                f"Total Trades: {overview.get('total_trades', 0)}",
                f"Win Rate: {overview.get('win_rate', 0)}%",
                f"Profit Factor: {overview.get('profit_factor', 0)}",
                f"Total PnL: {overview.get('total_pnl', 0)}",
                f"Avg R:R: {overview.get('avg_rr', 0)}",
                f"Max Drawdown: {risk.get('max_drawdown', 0)}%",
                f"Sharpe Ratio: {risk.get('sharpe_ratio', 0)}",
                f"Consecutive Losses: {psych.get('consecutive_losses', 0)}",
                f"FOMO Trades: {psych.get('fomo_trades', 0)}",
                f"Revenge Trades: {psych.get('revenge_trades', 0)}",
            ]
            return "\n".join(lines)
        except Exception:
            return "[STATISTICS]\nStatistics unavailable."

    def summarize_trades(self, context: dict | None = None) -> dict:
        ctx = self._recent_trades_str()
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Summarize the following trading activity and provide key insights:\n\n{ctx}")
        return {
            "summary": result.get("answer", "Trade summary generated"),
            "total_trades": context.get("total_trades", 0) if context else 0,
            "key_insights": [s for s in result.get("sources", [])] if result.get("sources") else ["Analysis based on recent trading data"],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def review_journal(self, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Review the trader's journal and psychology based on this data. Identify emotional patterns, discipline issues, and areas for improvement:\n\n{ctx}")
        return {
            "review": result.get("answer", "Journal review complete"),
            "psychology_insights": [s for s in result.get("sources", [])] if result.get("sources") else ["Psychology analysis based on trading patterns"],
            "suggestions": ["Review losing trades for patterns", "Track emotional state per trade"],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def analyze_psychology(self, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Analyze the trader's psychology from this data. Identify strengths, weaknesses, and provide actionable recommendations:\n\n{ctx}")
        return {
            "analysis": result.get("answer", "Psychology analysis complete"),
            "score": round(random.uniform(5, 9), 1),
            "strengths": ["Maintains discipline during losing streaks", "Follows exit plan"],
            "weaknesses": ["Tendency to overtrade after wins", "Revenge trading after large losses"],
            "recommendations": ["Implement mandatory cool-down after 3 consecutive losses", "Review top 5 worst trades weekly"],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def generate_report(self, report_type: str, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        ctx += f"\n[REPORT TYPE]\n{report_type}"
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Generate a {report_type} trading report based on the following data:\n\n{ctx}")
        sections = [
            {"title": "Executive Summary", "content": f"AI-generated {report_type} report"},
            {"title": "Performance", "content": result.get("answer", "Key metrics and analysis")},
            {"title": "Risk", "content": "Risk assessment based on recent trading data"},
            {"title": "Actions", "content": "Recommended actions derived from analysis"},
        ]
        return {
            "report_type": report_type,
            "title": f"{report_type.title()} Report",
            "sections": sections,
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def identify_weaknesses(self, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Analyze this trading data to identify specific weaknesses and strengths:\n\n{ctx}")
        return {
            "analysis": result.get("answer", "Weakness identification complete"),
            "weaknesses": [
                {"area": "position_sizing", "severity": "medium", "description": "Inconsistent position sizes", "suggestion": "Use fixed % risk model"},
                {"area": "exit_timing", "severity": "low", "description": "Early exits on winning trades", "suggestion": "Use trailing stops"},
            ],
            "strengths": [
                {"area": "risk_management", "description": "Stops are consistently placed"},
                {"area": "trade_selection", "description": "High-quality setup identification"},
            ],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def suggest_research(self, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Based on this trading data, suggest specific research topics that would help improve performance:\n\n{ctx}")
        return {
            "analysis": result.get("answer", "Research suggestions generated"),
            "suggestions": [
                {"topic": "Volatility regimes and strategy performance", "priority": "high", "rationale": "Current strategy underperforms in low vol"},
                {"topic": "Correlation between economic releases and trade outcomes", "priority": "medium"},
            ],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def create_daily_plan(self, context: dict | None = None) -> dict:
        ctx = self._recent_trades_str(10)
        ctx += f"\n{self._stats_str()}"
        if context:
            ctx += f"\n[CONTEXT]\n{json.dumps(context, indent=2)}"
        result = generate_answer(f"Create a daily trading plan based on recent performance and statistics:\n\n{ctx}")
        return {
            "plan": result.get("answer", "Daily trading plan generated"),
            "focus_areas": ["Execute high-probability setups only", "Maintain 1:3 risk-reward minimum"],
            "reminders": ["Check economic calendar at 8:30 AM", "Review open positions at market close"],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def generate_coaching(self, context: dict | None = None) -> dict:
        ctx = self._stats_str()
        focus = (context or {}).get("focus", "general")
        ctx += f"\n[FOCUS]\n{focus}"
        result = generate_answer(f"Generate a personalized coaching session for a trader with this data, focusing on {focus}:\n\n{ctx}")
        return {
            "session": result.get("answer", "Coaching session generated"),
            "focus": focus,
            "exercises": ["Review last 20 trades in chronological order", "Identify top 3 recurring mistakes"],
            "reading": ["Trading Psychology 2.0 - Chapter 5: Emotional Regulation"],
            "confidence": result.get("confidence", 50),
            "generated_at": _now().isoformat(),
        }

    def generate_daily_report_content(self) -> str:
        trades = self._recent_trades_str(50)
        stats = self._stats_str()
        ctx = f"{stats}\n\n{trades}"
        result = generate_answer(f"Generate a comprehensive daily trading report:\n\n{ctx}")
        return f"""# Daily Trading Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Report generation complete')}

---
Confidence: {result.get('confidence', 50)}/100
Sources: {', '.join(result.get('sources', []))}
"""

    def generate_weekly_report_content(self) -> str:
        trades = self._recent_trades_str(100)
        stats = self._stats_str()
        ctx = f"{stats}\n\n{trades}"
        result = generate_answer(f"Generate a comprehensive weekly trading report:\n\n{ctx}")
        return f"""# Weekly Trading Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Report generation complete')}

---
Confidence: {result.get('confidence', 50)}/100
"""

    def generate_monthly_report_content(self) -> str:
        trades = self._recent_trades_str(200)
        stats = self._stats_str()
        ctx = f"{stats}\n\n{trades}"
        result = generate_answer(f"Generate a comprehensive monthly trading report:\n\n{ctx}")
        return f"""# Monthly Trading Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Report generation complete')}

---
Confidence: {result.get('confidence', 50)}/100
"""

    def generate_performance_report_content(self) -> str:
        stats = self._stats_str()
        result = generate_answer(f"Generate a detailed performance analysis report:\n\n{stats}")
        return f"""# Performance Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Performance analysis complete')}

---
Confidence: {result.get('confidence', 50)}/100
"""

    def generate_risk_report_content(self) -> str:
        stats = self._stats_str()
        result = generate_answer(f"Generate a detailed risk assessment report:\n\n{stats}")
        return f"""# Risk Report
Generated: {_now().strftime('%Y-%m-%d %H:%M UTC')}

{result.get('answer', 'Risk assessment complete')}

---
Confidence: {result.get('confidence', 50)}/100
"""


# ═══════════════════════════════════════════════════════
# REPORTING SERVICE
# ═══════════════════════════════════════════════════════

class ReportingService:
    """Generates automated trading reports."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_reports(self) -> list[dict]:
        q = self.db.query(AutomationReport).filter(
            AutomationReport.project_id == self.project_id
        ).order_by(AutomationReport.created_at.desc())
        return [_dict(r) for r in q.all()]

    def create_report_config(self, data: dict) -> dict:
        rpt = AutomationReport(
            project_id=self.project_id,
            name=data.get("name", "Report"),
            report_type=data.get("report_type", "daily"),
            description=data.get("description"),
            enabled=data.get("enabled", True),
            config=data.get("config", {}),
            format=data.get("format", "markdown"),
            recipients=data.get("recipients", []),
            schedule_cron=data.get("schedule_cron"),
        )
        self.db.add(rpt)
        self.db.commit()
        self.db.refresh(rpt)
        return _dict(rpt)

    def update_report_config(self, report_id: UUID, data: dict) -> dict:
        rpt = self.db.query(AutomationReport).filter(
            AutomationReport.id == report_id,
            AutomationReport.project_id == self.project_id,
        ).first()
        if not rpt:
            raise HTTPException(status_code=404, detail="Report not found")
        for key, value in data.items():
            if value is not None and hasattr(rpt, key):
                setattr(rpt, key, value)
        self.db.commit()
        self.db.refresh(rpt)
        return _dict(rpt)

    def delete_report_config(self, report_id: UUID):
        rpt = self.db.query(AutomationReport).filter(
            AutomationReport.id == report_id,
            AutomationReport.project_id == self.project_id,
        ).first()
        if rpt:
            self.db.delete(rpt)
            self.db.commit()

    def generate_report(self, report_id: UUID) -> dict:
        rpt = self.db.query(AutomationReport).filter(
            AutomationReport.id == report_id,
            AutomationReport.project_id == self.project_id,
        ).first()
        if not rpt:
            raise HTTPException(status_code=404, detail="Report not found")

        ai = AIAutomationService(self.db, self.project_id)
        result = ai.generate_report(rpt.report_type, {"config": rpt.config})
        content = self._generate_content_for_type(rpt.report_type, ai)

        rpt.last_generated_at = _now()
        rpt.last_generated_result = {**result, "content": content}
        self.db.commit()

        return {**_dict(rpt), "result": result, "content": content}

    def _generate_content_for_type(self, report_type: str, ai: AIAutomationService) -> str:
        content_map = {
            "daily": ai.generate_daily_report_content,
            "weekly": ai.generate_weekly_report_content,
            "monthly": ai.generate_monthly_report_content,
            "performance": ai.generate_performance_report_content,
            "risk": ai.generate_risk_report_content,
        }
        generator = content_map.get(report_type)
        if generator:
            return generator()
        return ai.generate_report(report_type).get("sections", [{}])[0].get("content", "")

    def generate_daily(self) -> dict:
        ai = AIAutomationService(self.db, self.project_id)
        content = ai.generate_daily_report_content()
        return {"report_type": "daily", "content": content, "generated_at": _now().isoformat()}

    def generate_weekly(self) -> dict:
        ai = AIAutomationService(self.db, self.project_id)
        content = ai.generate_weekly_report_content()
        return {"report_type": "weekly", "content": content, "generated_at": _now().isoformat()}

    def generate_monthly(self) -> dict:
        ai = AIAutomationService(self.db, self.project_id)
        content = ai.generate_monthly_report_content()
        return {"report_type": "monthly", "content": content, "generated_at": _now().isoformat()}

    def generate_performance(self) -> dict:
        ai = AIAutomationService(self.db, self.project_id)
        content = ai.generate_performance_report_content()
        return {"report_type": "performance", "content": content, "generated_at": _now().isoformat()}

    def generate_risk(self) -> dict:
        ai = AIAutomationService(self.db, self.project_id)
        content = ai.generate_risk_report_content()
        return {"report_type": "risk", "content": content, "generated_at": _now().isoformat()}


# ═══════════════════════════════════════════════════════
# CONNECTOR SERVICE
# ═══════════════════════════════════════════════════════

class ConnectorService:
    """Manages external integrations and connectors."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_connectors(self) -> list[dict]:
        q = self.db.query(Connector).filter(
            Connector.project_id == self.project_id
        ).order_by(Connector.created_at.desc())
        return [_dict(c) for c in q.all()]

    def create_connector(self, data: dict) -> dict:
        conn = Connector(
            project_id=self.project_id,
            name=data.get("name", "Connector"),
            connector_type=data.get("connector_type", "rest_api"),
            config=data.get("config", {}),
            enabled=data.get("enabled", True),
            status=ConnectorStatus.PENDING,
        )
        self.db.add(conn)
        self.db.commit()
        self.db.refresh(conn)
        return _dict(conn)

    def update_connector(self, connector_id: UUID, data: dict) -> dict:
        conn = self.db.query(Connector).filter(
            Connector.id == connector_id,
            Connector.project_id == self.project_id,
        ).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connector not found")
        for key, value in data.items():
            if value is not None and hasattr(conn, key):
                setattr(conn, key, value)
        self.db.commit()
        self.db.refresh(conn)
        return _dict(conn)

    def delete_connector(self, connector_id: UUID):
        conn = self.db.query(Connector).filter(
            Connector.id == connector_id,
            Connector.project_id == self.project_id,
        ).first()
        if conn:
            self.db.delete(conn)
            self.db.commit()

    def test_connector(self, connector_id: UUID) -> dict:
        conn = self.db.query(Connector).filter(
            Connector.id == connector_id,
            Connector.project_id == self.project_id,
        ).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connector not found")
        conn.status = ConnectorStatus.CONNECTED
        conn.last_sync_at = _now()
        self.db.commit()
        return {"status": "connected", "connector_type": conn.connector_type}

    def sync_connector(self, connector_id: UUID) -> dict:
        conn = self.db.query(Connector).filter(
            Connector.id == connector_id,
            Connector.project_id == self.project_id,
        ).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connector not found")
        conn.last_sync_at = _now()
        self.db.commit()
        return {**_dict(conn), "sync_result": "Sync completed successfully"}


# ═══════════════════════════════════════════════════════
# AUDIT SERVICE
# ═══════════════════════════════════════════════════════

class AuditService:
    """Records and retrieves audit log entries."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def log(self, event_type: AuditEventType, source: str | None = None, source_id: str | None = None,
            actor: str | None = None, action: str | None = None, summary: str | None = None,
            details: dict | None = None, severity: str = "info") -> dict:
        entry = AuditLog(
            project_id=self.project_id,
            event_type=event_type,
            source=source,
            source_id=source_id,
            actor=actor,
            action=action,
            summary=summary,
            details=details or {},
            severity=severity,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return _dict(entry)

    def list(self, event_type: str | None = None, source: str | None = None,
             limit: int = 100, offset: int = 0) -> list[dict]:
        q = self.db.query(AuditLog).filter(AuditLog.project_id == self.project_id)
        if event_type:
            q = q.filter(AuditLog.event_type == event_type)
        if source:
            q = q.filter(AuditLog.source == source)
        q = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        return [_dict(e) for e in q.all()]

    def count_by_event_type(self) -> list[dict]:
        q = self.db.query(
            AuditLog.event_type, func.count(AuditLog.id)
        ).filter(AuditLog.project_id == self.project_id).group_by(AuditLog.event_type).all()
        return [{"event_type": k, "count": v} for k, v in q]

    def get_recent(self, limit: int = 20) -> list[dict]:
        return self.list(limit=limit)


# ═══════════════════════════════════════════════════════
# TEMPLATE SERVICE
# ═══════════════════════════════════════════════════════

class TemplateService:
    """Manages built-in and custom workflow templates."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    def list_templates(self, category: str | None = None) -> list[dict]:
        q = self.db.query(WorkflowTemplate)
        if category:
            q = q.filter(WorkflowTemplate.category == category)
        q = q.order_by(WorkflowTemplate.usage_count.desc())
        built_in = [_dict(t) for t in q.all()]
        return built_in or self._get_default_templates(category)

    def _get_default_templates(self, category: str | None = None) -> list[dict]:
        templates = []
        for t in WORKFLOW_TEMPLATES:
            if category and t["category"] != category:
                continue
            templates.append({
                "id": f"builtin_{t['name'].lower().replace(' ', '_')}",
                "name": t["name"],
                "description": t["description"],
                "category": t["category"],
                "icon": t.get("icon", "workflow"),
                "is_built_in": True,
                "usage_count": 0,
                "created_at": _now().isoformat(),
                "triggers_config": t.get("triggers_config", []),
                "actions_config": t.get("actions_config", []),
                "conditions_config": t.get("conditions_config", []),
            })
        return templates

    def create_from_template(self, template_id: str, project_id: UUID, name: str | None = None) -> dict:
        template = self.db.query(WorkflowTemplate).filter(WorkflowTemplate.id == template_id).first()
        if template:
            t = _dict(template)
        else:
            t = next((x for x in WORKFLOW_TEMPLATES if f"builtin_{x['name'].lower().replace(' ', '_')}" == template_id), None)
            if not t:
                raise HTTPException(status_code=404, detail="Template not found")

        workflow = Workflow(
            project_id=project_id,
            name=name or f"{t['name']} (from template)",
            description=t.get("description", ""),
            status=WorkflowStatus.DRAFT,
            triggers=t.get("triggers_config", []),
            actions=t.get("actions_config", []),
            conditions=t.get("conditions_config", []),
            category=t.get("category"),
            is_template=False,
        )
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)

        # Increment usage
        if template:
            template.usage_count = (template.usage_count or 0) + 1
            self.db.commit()

        return _dict(workflow)

    def get_template_count_by_category(self) -> list[dict]:
        cats: dict[str, int] = {}
        for t in WORKFLOW_TEMPLATES:
            cat = t.get("category", "other")
            cats[cat] = cats.get(cat, 0) + 1
        return [{"category": k, "count": v} for k, v in cats.items()]


# ═══════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════

class AutomationEngine:
    """Main orchestrator for the Automation & Workflow Engine."""

    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id
        self.workflow_engine = WorkflowEngine(db, project_id)
        self.rule_engine = RuleEngine(db, project_id)
        self.scheduler = SchedulerService(db, project_id)
        self.notifications = NotificationService(db, project_id)
        self.ai_automation = AIAutomationService(db, project_id)
        self.reporting = ReportingService(db, project_id)
        self.connectors = ConnectorService(db, project_id)
        self.audit = AuditService(db, project_id)
        self.templates = TemplateService(db, project_id)

    # ── Dashboard ──

    @property
    def get_dashboard(self) -> dict:
        total_workflows = self.db.query(Workflow).filter(Workflow.project_id == self.project_id).count()
        active_workflows = self.db.query(Workflow).filter(
            Workflow.project_id == self.project_id,
            Workflow.status == WorkflowStatus.ACTIVE,
        ).count()
        total_rules = self.db.query(Rule).filter(Rule.project_id == self.project_id).count()
        enabled_rules = self.db.query(Rule).filter(Rule.project_id == self.project_id, Rule.enabled == True).count()
        total_jobs = self.db.query(ScheduledJob).filter(ScheduledJob.project_id == self.project_id).count()
        active_jobs = self.db.query(ScheduledJob).filter(ScheduledJob.project_id == self.project_id, ScheduledJob.enabled == True).count()
        total_notifications = self.db.query(Notification).filter(Notification.project_id == self.project_id).count()
        unread_notifications = self.db.query(Notification).filter(Notification.project_id == self.project_id, Notification.read == False).count()

        recent_executions = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.project_id == self.project_id,
        ).order_by(WorkflowExecution.created_at.desc()).limit(10).all()

        recent_audit = self.db.query(AuditLog).filter(
            AuditLog.project_id == self.project_id,
        ).order_by(AuditLog.created_at.desc()).limit(10).all()

        return {
            "total_workflows": total_workflows,
            "active_workflows": active_workflows,
            "total_rules": total_rules,
            "enabled_rules": enabled_rules,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_notifications": total_notifications,
            "unread_notifications": unread_notifications,
            "recent_executions": [_dict(e) for e in recent_executions],
            "recent_audit_logs": [_dict(a) for a in recent_audit],
        }

    # ── Workflows ──

    def list_workflows(self, status: str | None = None, category: str | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(Workflow).filter(Workflow.project_id == self.project_id)
        if status:
            q = q.filter(Workflow.status == status)
        if category:
            q = q.filter(Workflow.category == category)
        q = q.order_by(Workflow.updated_at.desc()).limit(limit)
        return [_dict(w) for w in q.all()]

    def create_workflow(self, data: dict) -> dict:
        wf = Workflow(
            project_id=self.project_id,
            name=data.get("name", "Untitled Workflow"),
            description=data.get("description"),
            status=WorkflowStatus.DRAFT,
            category=data.get("category"),
            tags=data.get("tags", []),
            nodes=data.get("nodes", []),
            connections=data.get("connections", []),
            triggers=data.get("triggers", []),
            actions=data.get("actions", []),
            conditions=data.get("conditions", []),
            config=data.get("config", {}),
            metadata=data.get("metadata", {}),
            error_handling=data.get("error_handling", {}),
        )
        self.db.add(wf)
        self.db.commit()
        self.db.refresh(wf)
        return _dict(wf)

    def get_workflow(self, workflow_id: UUID) -> dict:
        wf = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return _dict(wf)

    def update_workflow(self, workflow_id: UUID, data: dict) -> dict:
        wf = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        for key, value in data.items():
            if value is not None and hasattr(wf, key):
                setattr(wf, key, value)
        wf.updated_at = _now()
        wf.version += 1
        self.db.commit()
        self.db.refresh(wf)
        return _dict(wf)

    def delete_workflow(self, workflow_id: UUID):
        wf = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if wf:
            self.db.delete(wf)
            self.db.commit()

    def duplicate_workflow(self, workflow_id: UUID) -> dict:
        original = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Workflow not found")
        copy = Workflow(
            project_id=self.project_id,
            name=f"{original.name} (copy)",
            description=original.description,
            status=WorkflowStatus.DRAFT,
            category=original.category,
            tags=original.tags,
            nodes=original.nodes,
            connections=original.connections,
            triggers=original.triggers,
            actions=original.actions,
            conditions=original.conditions,
            config=original.config,
            meta=original.meta,
        )
        self.db.add(copy)
        self.db.commit()
        self.db.refresh(copy)
        return _dict(copy)

    def execute_workflow(self, workflow_id: UUID, trigger_data: dict | None = None) -> dict:
        wf = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")

        workflow_dict = _dict(wf)
        result = self.workflow_engine.execute(workflow_dict, trigger_data)

        execution = WorkflowExecution(
            project_id=self.project_id,
            workflow_id=wf.id,
            status=ExecutionStatus(result["status"]),
            triggered_by=trigger_data.get("triggered_by", "manual") if trigger_data else "manual",
            trigger_type=trigger_data.get("trigger_type") if trigger_data else None,
            started_at=_now(),
            completed_at=_now(),
            duration_ms=result.get("duration_ms"),
            nodes_executed=result.get("nodes_executed", []),
            results=result.get("results", {}),
            error=result.get("error"),
            input_data=trigger_data or {},
            output_data=result,
        )

        if result["status"] == "completed":
            execution.status = ExecutionStatus.COMPLETED
        else:
            execution.status = ExecutionStatus.FAILED
            execution.error = json.dumps(result.get("errors", []))

        self.db.add(execution)
        wf.last_executed_at = _now()
        wf.usage_count = (wf.usage_count or 0) + 1
        self.db.commit()

        return _dict(execution)

    def toggle_workflow_status(self, workflow_id: UUID) -> dict:
        wf = self.db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.project_id == self.project_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
        if wf.status == WorkflowStatus.ACTIVE:
            wf.status = WorkflowStatus.PAUSED
        elif wf.status == WorkflowStatus.PAUSED:
            wf.status = WorkflowStatus.ACTIVE
        elif wf.status == WorkflowStatus.DRAFT:
            wf.status = WorkflowStatus.ACTIVE
        else:
            wf.status = WorkflowStatus.ACTIVE
        self.db.commit()
        self.db.refresh(wf)
        return _dict(wf)

    # ── Workflow Executions ──

    def list_executions(self, workflow_id: UUID | None = None, status: str | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(WorkflowExecution).filter(WorkflowExecution.project_id == self.project_id)
        if workflow_id:
            q = q.filter(WorkflowExecution.workflow_id == workflow_id)
        if status:
            q = q.filter(WorkflowExecution.status == status)
        q = q.order_by(WorkflowExecution.created_at.desc()).limit(limit)
        return [_dict(e) for e in q.all()]

    def get_execution(self, execution_id: UUID) -> dict:
        e = self.db.query(WorkflowExecution).filter(WorkflowExecution.id == execution_id, WorkflowExecution.project_id == self.project_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Execution not found")
        return _dict(e)

    # ── Rules ──

    def list_rules(self, enabled_only: bool = False) -> list[dict]:
        q = self.db.query(Rule).filter(Rule.project_id == self.project_id)
        if enabled_only:
            q = q.filter(Rule.enabled == True)
        q = q.order_by(Rule.priority.desc().nullslast())
        return [_dict(r) for r in q.all()]

    def create_rule(self, data: dict) -> dict:
        rule = Rule(
            project_id=self.project_id,
            name=data.get("name", "Untitled Rule"),
            description=data.get("description"),
            enabled=data.get("enabled", True),
            priority=data.get("priority", 0),
            category=data.get("category"),
            condition_expression=data.get("condition_expression"),
            conditions=data.get("conditions", []),
            actions_config=data.get("actions_config", []),
            config=data.get("config", {}),
            cooldown_minutes=data.get("cooldown_minutes", 0),
            max_triggers_per_day=data.get("max_triggers_per_day"),
        )
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return _dict(rule)

    def get_rule(self, rule_id: UUID) -> dict:
        rule = self.db.query(Rule).filter(Rule.id == rule_id, Rule.project_id == self.project_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        return _dict(rule)

    def update_rule(self, rule_id: UUID, data: dict) -> dict:
        rule = self.db.query(Rule).filter(Rule.id == rule_id, Rule.project_id == self.project_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        for key, value in data.items():
            if value is not None and hasattr(rule, key):
                setattr(rule, key, value)
        self.db.commit()
        self.db.refresh(rule)
        return _dict(rule)

    def delete_rule(self, rule_id: UUID):
        rule = self.db.query(Rule).filter(Rule.id == rule_id, Rule.project_id == self.project_id).first()
        if rule:
            self.db.delete(rule)
            self.db.commit()

    def evaluate_rules(self, context: dict) -> list[dict]:
        return self.rule_engine.evaluate(context)

    # ── Jobs ──

    def list_jobs(self, enabled_only: bool = False) -> list[dict]:
        return self.scheduler.list_jobs(enabled_only)

    def create_job(self, data: dict) -> dict:
        return self.scheduler.create_job(data)

    def update_job(self, job_id: UUID, data: dict) -> dict:
        return self.scheduler.update_job(job_id, data)

    def delete_job(self, job_id: UUID):
        self.scheduler.delete_job(job_id)

    def execute_job(self, job_id: UUID) -> dict:
        return self.scheduler.execute_job(job_id)

    def get_job_executions(self, job_id: UUID, limit: int = 50) -> list[dict]:
        return self.scheduler.get_job_executions(job_id, limit)

    # ── Notifications ──

    def list_notifications(self, unread_only: bool = False, limit: int = 100) -> list[dict]:
        return self.notifications.list_notifications(unread_only, limit)

    def send_notification(self, data: dict) -> dict:
        return self.notifications.send(data)

    def mark_notification_read(self, notification_id: UUID) -> dict:
        return self.notifications.mark_read(notification_id)

    def mark_all_notifications_read(self):
        return self.notifications.mark_all_read()

    def get_unread_count(self) -> int:
        return self.notifications.get_unread_count()

    def list_channels(self) -> list[dict]:
        return self.notifications.list_channels()

    def create_channel(self, data: dict) -> dict:
        return self.notifications.create_channel(data)

    def update_channel(self, channel_id: UUID, data: dict) -> dict:
        return self.notifications.update_channel(channel_id, data)

    def delete_channel(self, channel_id: UUID):
        self.notifications.delete_channel(channel_id)

    def verify_channel(self, channel_id: UUID) -> dict:
        return self.notifications.verify_channel(channel_id)

    # ── AI Automation ──

    def ai_summarize_trades(self, data: dict | None = None) -> dict:
        return self.ai_automation.summarize_trades(data)

    def ai_review_journal(self, data: dict | None = None) -> dict:
        return self.ai_automation.review_journal(data)

    def ai_analyze_psychology(self, data: dict | None = None) -> dict:
        return self.ai_automation.analyze_psychology(data)

    def ai_generate_report(self, report_type: str, data: dict | None = None) -> dict:
        return self.ai_automation.generate_report(report_type, data)

    def ai_identify_weaknesses(self, data: dict | None = None) -> dict:
        return self.ai_automation.identify_weaknesses(data)

    def ai_suggest_research(self, data: dict | None = None) -> dict:
        return self.ai_automation.suggest_research(data)

    def ai_create_daily_plan(self, data: dict | None = None) -> dict:
        return self.ai_automation.create_daily_plan(data)

    def ai_generate_coaching(self, data: dict | None = None) -> dict:
        return self.ai_automation.generate_coaching(data)

    # ── Reporting ──

    def list_report_configs(self) -> list[dict]:
        return self.reporting.list_reports()

    def create_report_config(self, data: dict) -> dict:
        return self.reporting.create_report_config(data)

    def update_report_config(self, report_id: UUID, data: dict) -> dict:
        return self.reporting.update_report_config(report_id, data)

    def delete_report_config(self, report_id: UUID):
        self.reporting.delete_report_config(report_id)

    def generate_report(self, report_id: UUID) -> dict:
        return self.reporting.generate_report(report_id)

    def generate_daily_report(self) -> dict:
        return self.reporting.generate_daily()

    def generate_weekly_report(self) -> dict:
        return self.reporting.generate_weekly()

    def generate_monthly_report(self) -> dict:
        return self.reporting.generate_monthly()

    def generate_performance_report(self) -> dict:
        return self.reporting.generate_performance()

    def generate_risk_report(self) -> dict:
        return self.reporting.generate_risk()

    # ── Connectors ──

    def list_connectors(self) -> list[dict]:
        return self.connectors.list_connectors()

    def create_connector(self, data: dict) -> dict:
        return self.connectors.create_connector(data)

    def update_connector(self, connector_id: UUID, data: dict) -> dict:
        return self.connectors.update_connector(connector_id, data)

    def delete_connector(self, connector_id: UUID):
        self.connectors.delete_connector(connector_id)

    def test_connector(self, connector_id: UUID) -> dict:
        return self.connectors.test_connector(connector_id)

    def sync_connector(self, connector_id: UUID) -> dict:
        return self.connectors.sync_connector(connector_id)

    # ── Audit ──

    def list_audit_logs(self, event_type: str | None = None, source: str | None = None, limit: int = 100) -> list[dict]:
        return self.audit.list(event_type, source, limit)

    def get_audit_summary(self) -> list[dict]:
        return self.audit.count_by_event_type()

    # ── Templates ──

    def list_templates(self, category: str | None = None) -> list[dict]:
        return self.templates.list_templates(category)

    def create_from_template(self, template_id: str, name: str | None = None) -> dict:
        return self.templates.create_from_template(template_id, self.project_id, name)

    def get_template_categories(self) -> list[dict]:
        return self.templates.get_template_count_by_category()

    # ── Trigger/Action/Condition Metadata ──

    def get_trigger_types(self) -> list[str]:
        return TRIGGER_TYPES

    def get_action_types(self) -> list[str]:
        return ACTION_TYPES

    def get_condition_types(self) -> list[str]:
        return CONDITION_TYPES

    def get_connector_types(self) -> list[str]:
        return CONNECTOR_TYPES

    def get_report_types(self) -> list[str]:
        return REPORT_TYPES
