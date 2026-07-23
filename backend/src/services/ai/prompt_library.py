"""Prompt Library and Workflow Engine for the AI Trading Copilot."""

import re
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from src.models.rag_copilot import (
    AISavedPrompt,
    AIPromptFolder,
    AIWorkflow,
    AIWorkflowExecution,
)

# ---------------------------------------------------------------------------
# Predefined prompts
# ---------------------------------------------------------------------------

PREDEFINED_PROMPTS: list[dict[str, Any]] = [
    {
        "title": "Review today's trades",
        "content": (
            "Review all trades taken today ({{date}}). For each trade, evaluate "
            "the entry rationale, exit execution, and adherence to the trading plan. "
            "Highlight what went well and what could be improved."
        ),
        "category": "review",
        "agent_type": "analyst",
        "description": "Get a detailed recap of your day's trading activity.",
        "tags": ["daily", "review", "trades"],
    },
    {
        "title": "Explain today's losses",
        "content": (
            "Analyze today's losing trades ({{date}}). Identify the primary "
            "reason for each loss — was it setup quality, market conditions, "
            "execution error, or psychological factors? Suggest specific "
            "adjustments to avoid repeating these mistakes."
        ),
        "category": "analysis",
        "agent_type": "analyst",
        "description": "Understand why your losing trades happened today.",
        "tags": ["losses", "analysis", "mistakes"],
    },
    {
        "title": "Summarize my journal",
        "content": (
            "Read through my recent journal entries (last {{days}} days) and "
            "produce a concise summary. Extract recurring themes, emotional "
            "patterns, key lessons, and shifts in mindset or strategy."
        ),
        "category": "journal",
        "agent_type": "analyst",
        "description": "Get an AI summary of your trading journal entries.",
        "tags": ["journal", "summary", "reflection"],
    },
    {
        "title": "Compare Strategy A vs B",
        "content": (
            "Compare strategy \"{{strategy_a}}\" and strategy \"{{strategy_b}}\" "
            "across win rate, average R:R, profit factor, expectancy, and "
            "maximum drawdown. Use data from the last {{days}} days. Which "
            "strategy performs better in current market conditions and why?"
        ),
        "category": "analysis",
        "agent_type": "analyst",
        "description": "Head-to-head comparison of two trading strategies.",
        "tags": ["strategies", "comparison", "performance"],
    },
    {
        "title": "Find repeated mistakes",
        "content": (
            "Scan my trade history (last {{days}} days) and identify recurring "
            "mistakes or patterns that lead to losses. Group similar errors, "
            "rank them by frequency and impact, and propose a corrective plan "
            "for the top three."
        ),
        "category": "analysis",
        "agent_type": "analyst",
        "description": "Detect patterns in your trading mistakes.",
        "tags": ["mistakes", "patterns", "improvement"],
    },
    {
        "title": "Create a weekly review",
        "content": (
            "Generate a comprehensive weekly trading review for the week ending "
            "{{end_date}}. Include: P&L summary, win rate, average R:R, "
            "best/worst trades, strategy breakdown, emotional state trends, "
            "and actionable goals for next week."
        ),
        "category": "review",
        "agent_type": "analyst",
        "description": "Build a structured weekly performance review.",
        "tags": ["weekly", "review", "performance"],
    },
    {
        "title": "Generate a market briefing",
        "content": (
            "Provide a market briefing for {{pairs}}. Cover: current trend "
            "structure, key support/resistance levels, upcoming economic events, "
            "volatility regime, and potential trading opportunities. Base this "
            "on recent price action and available market context data."
        ),
        "category": "briefing",
        "agent_type": "analyst",
        "description": "Get a structured market context briefing.",
        "tags": ["market", "briefing", "context"],
    },
    {
        "title": "Analyze my psychology",
        "content": (
            "Review my trading journal and trade history for the last {{days}} "
            "days. Identify psychological patterns — fear of missing out, "
            "revenge trading, overconfidence, hesitation, etc. Score my "
            "psychological state and suggest exercises or routines to improve "
            "trading discipline."
        ),
        "category": "psychology",
        "agent_type": "analyst",
        "description": "Deep dive into your trading psychology patterns.",
        "tags": ["psychology", "mindset", "discipline"],
    },
    {
        "title": "What's my win rate?",
        "content": (
            "Calculate my trading statistics for the period {{start_date}} to "
            "{{end_date}}. Show: total trades, wins, losses, breakevens, "
            "win rate, average R:R, profit factor, expectancy, maximum "
            "drawdown, and Sharpe ratio. Compare against the previous period."
        ),
        "category": "stats",
        "agent_type": "analyst",
        "description": "Quick performance statistics snapshot.",
        "tags": ["stats", "win-rate", "performance"],
    },
    {
        "title": "How can I improve?",
        "content": (
            "Based on my complete trading history, identify the three most "
            "impactful changes I can make to improve my trading performance. "
            "For each suggestion, provide: the expected impact, a concrete "
            "action plan, and how to measure success. Be brutally honest."
        ),
        "category": "improvement",
        "agent_type": "analyst",
        "description": "Get actionable improvement suggestions for your trading.",
        "tags": ["improvement", "actionable", "growth"],
    },
]

# ---------------------------------------------------------------------------
# Predefined workflow templates
# ---------------------------------------------------------------------------

WORKFLOW_TEMPLATES: dict[str, dict[str, Any]] = {
    "daily_brief": {
        "name": "Daily Brief",
        "description": "Quick daily trading summary and market context.",
        "workflow_type": "daily_brief",
        "steps": [
            {
                "order": 1,
                "name": "Gather Context",
                "prompt_id": None,
                "prompt_text": "Collect today's market data and open positions.",
                "agent_type": "analyst",
                "output_var": "context",
            },
            {
                "order": 2,
                "name": "Analyze Activity",
                "prompt_id": None,
                "prompt_text": "Review today's trades and performance.",
                "agent_type": "analyst",
                "output_var": "activity",
            },
            {
                "order": 3,
                "name": "Generate Brief",
                "prompt_id": None,
                "prompt_text": (
                    "Synthesize context and activity into a concise daily brief. "
                    "Include: market conditions, trade summary, key metrics, "
                    "and focus points for the remainder of the session."
                ),
                "agent_type": "analyst",
                "output_var": "brief",
            },
        ],
        "config": {
            "time_range_days": 1,
            "include_market_context": True,
            "include_psychology": False,
        },
    },
    "weekly_review": {
        "name": "Weekly Review",
        "description": "Comprehensive weekly performance review.",
        "workflow_type": "weekly_review",
        "steps": [
            {
                "order": 1,
                "name": "Gather Data",
                "prompt_id": None,
                "prompt_text": "Collect all trades, journal entries, and market data for the week.",
                "agent_type": "analyst",
                "output_var": "data",
            },
            {
                "order": 2,
                "name": "Performance Analysis",
                "prompt_id": None,
                "prompt_text": "Calculate weekly KPIs: P&L, win rate, avg R:R, profit factor, expectancy.",
                "agent_type": "analyst",
                "output_var": "kpis",
            },
            {
                "order": 3,
                "name": "Trade-by-Trade Review",
                "prompt_id": None,
                "prompt_text": "Review each trade from the week. Categorize as good/bad setups, note execution quality.",
                "agent_type": "analyst",
                "output_var": "trade_review",
            },
            {
                "order": 4,
                "name": "Psychology Check",
                "prompt_id": None,
                "prompt_text": "Analyze journal entries for emotional patterns and discipline scores.",
                "agent_type": "analyst",
                "output_var": "psychology",
            },
            {
                "order": 5,
                "name": "Generate Review",
                "prompt_id": None,
                "prompt_text": (
                    "Synthesize all outputs into a structured weekly review. Include: "
                    "executive summary, KPI dashboard, key lessons, best/worst trades, "
                    "psychological assessment, and action items for next week."
                ),
                "agent_type": "analyst",
                "output_var": "review",
            },
        ],
        "config": {
            "time_range_days": 7,
            "include_market_context": True,
            "include_psychology": True,
        },
    },
    "monthly_review": {
        "name": "Monthly Review",
        "description": "In-depth monthly trading performance deep dive.",
        "workflow_type": "monthly_review",
        "steps": [
            {
                "order": 1,
                "name": "Gather Monthly Data",
                "prompt_id": None,
                "prompt_text": "Aggregate all trades, journal entries, strategies, and market data for the month.",
                "agent_type": "analyst",
                "output_var": "data",
            },
            {
                "order": 2,
                "name": "Performance Metrics",
                "prompt_id": None,
                "prompt_text": "Calculate comprehensive monthly KPIs including win rate, avg R:R, profit factor, expectancy, Sharpe ratio, max drawdown, and recovery factor.",
                "agent_type": "analyst",
                "output_var": "kpis",
            },
            {
                "order": 3,
                "name": "Strategy Breakdown",
                "prompt_id": None,
                "prompt_text": "Break down performance by strategy. Identify which strategies are working, which are declining, and which should be paused.",
                "agent_type": "analyst",
                "output_var": "strategy_breakdown",
            },
            {
                "order": 4,
                "name": "Pattern Discovery",
                "prompt_id": None,
                "prompt_text": "Scan for recurring patterns in winners and losers. Identify market conditions where each strategy thrives or struggles.",
                "agent_type": "analyst",
                "output_var": "patterns",
            },
            {
                "order": 5,
                "name": "Psychology & Discipline",
                "prompt_id": None,
                "prompt_text": "Comprehensive psychological analysis from journal entries. Score discipline, emotional regulation, and plan adherence.",
                "agent_type": "analyst",
                "output_var": "psychology",
            },
            {
                "order": 6,
                "name": "Generate Monthly Report",
                "prompt_id": None,
                "prompt_text": (
                    "Synthesize all analysis into a comprehensive monthly report. "
                    "Include: executive summary, KPI dashboard with trends, "
                    "strategy performance matrix, pattern findings, psychological "
                    "scorecard, goal progress tracking, and a tactical plan for "
                    "the next month."
                ),
                "agent_type": "analyst",
                "output_var": "report",
            },
        ],
        "config": {
            "time_range_days": 30,
            "include_market_context": True,
            "include_psychology": True,
            "include_strategy_comparison": True,
        },
    },
    "trade_review": {
        "name": "Trade Review",
        "description": "Single trade post-mortem analysis.",
        "workflow_type": "trade_review",
        "steps": [
            {
                "order": 1,
                "name": "Load Trade Data",
                "prompt_id": None,
                "prompt_text": "Load all data for the selected trade including entry/exit, screenshots, and notes.",
                "agent_type": "analyst",
                "output_var": "trade_data",
            },
            {
                "order": 2,
                "name": "Setup Evaluation",
                "prompt_id": None,
                "prompt_text": "Evaluate the trade setup against the strategy rules. Was the setup valid? Grade the entry quality.",
                "agent_type": "analyst",
                "output_var": "setup_eval",
            },
            {
                "order": 3,
                "name": "Execution Analysis",
                "prompt_id": None,
                "prompt_text": "Analyze execution: entry timing, stop placement, target management, and any deviations from plan.",
                "agent_type": "analyst",
                "output_var": "execution_eval",
            },
            {
                "order": 4,
                "name": "Generate Review",
                "prompt_id": None,
                "prompt_text": (
                    "Synthesize into a complete trade review. Include: trade summary, "
                    "setup grade, execution score, key lessons, and specific "
                    "adjustments for similar future setups."
                ),
                "agent_type": "analyst",
                "output_var": "review",
            },
        ],
        "config": {
            "include_chart_analysis": True,
            "include_psychology_notes": True,
        },
    },
    "market_preparation": {
        "name": "Market Preparation",
        "description": "Pre-market preparation and session planning.",
        "workflow_type": "market_preparation",
        "steps": [
            {
                "order": 1,
                "name": "Market Context",
                "prompt_id": None,
                "prompt_text": "Gather pre-market data: overnight action, economic calendar, news events, and overall market sentiment.",
                "agent_type": "analyst",
                "output_var": "market_context",
            },
            {
                "order": 2,
                "name": "Technical Landscape",
                "prompt_id": None,
                "prompt_text": "Analyze key levels, trends, and patterns across the assets you trade.",
                "agent_type": "analyst",
                "output_var": "technical",
            },
            {
                "order": 3,
                "name": "High-Probability Setups",
                "prompt_id": None,
                "prompt_text": "Identify specific high-probability setups or scenarios to watch. Define entry conditions, targets, and invalidation points.",
                "agent_type": "analyst",
                "output_var": "setups",
            },
            {
                "order": 4,
                "name": "Session Plan",
                "prompt_id": None,
                "prompt_text": (
                    "Create a clear session plan. Include: focus pairs/strategies, "
                    "risk limits for the session, pre-defined setups, and mental "
                    "reminders for discipline."
                ),
                "agent_type": "analyst",
                "output_var": "plan",
            },
        ],
        "config": {
            "include_calendar_events": True,
            "include_sentiment": True,
        },
    },
    "risk_assessment": {
        "name": "Risk Assessment",
        "description": "Portfolio risk check and exposure analysis.",
        "workflow_type": "risk_assessment",
        "steps": [
            {
                "order": 1,
                "name": "Portfolio Exposure",
                "prompt_id": None,
                "prompt_text": "Calculate current portfolio exposure across all open positions. Include: total risk, per-asset concentration, and correlation risks.",
                "agent_type": "analyst",
                "output_var": "exposure",
            },
            {
                "order": 2,
                "name": "Risk Metrics",
                "prompt_id": None,
                "prompt_text": "Compute key risk metrics: Value at Risk (VaR), max drawdown from peak, current drawdown, and risk of ruin.",
                "agent_type": "analyst",
                "output_var": "risk_metrics",
            },
            {
                "order": 3,
                "name": "Assessment & Recommendations",
                "prompt_id": None,
                "prompt_text": (
                    "Evaluate overall risk posture. Flag any positions or exposures "
                    "that exceed safe limits. Provide specific recommendations to "
                    "reduce risk where needed."
                ),
                "agent_type": "analyst",
                "output_var": "assessment",
            },
        ],
        "config": {
            "include_var": True,
            "include_correlation": True,
            "alert_thresholds": {"drawdown_pct": 15, "concentration_pct": 30},
        },
    },
    "strategy_audit": {
        "name": "Strategy Audit",
        "description": "Check a specific strategy's health and performance.",
        "workflow_type": "strategy_audit",
        "steps": [
            {
                "order": 1,
                "name": "Strategy Data",
                "prompt_id": None,
                "prompt_text": "Load all trades, rules, and metadata for the strategy {{strategy_name}}.",
                "agent_type": "analyst",
                "output_var": "strategy_data",
            },
            {
                "order": 2,
                "name": "Performance Metrics",
                "prompt_id": None,
                "prompt_text": "Calculate strategy-specific KPIs: win rate, avg R:R, profit factor, expectancy, Sharpe ratio, max drawdown, and number of trades.",
                "agent_type": "analyst",
                "output_var": "kpis",
            },
            {
                "order": 3,
                "name": "Market Condition Fit",
                "prompt_id": None,
                "prompt_text": "Analyze how the strategy performs in different market conditions (trending, ranging, volatile). Identify where it excels and struggles.",
                "agent_type": "analyst",
                "output_var": "condition_fit",
            },
            {
                "order": 4,
                "name": "Audit Report",
                "prompt_id": None,
                "prompt_text": (
                    "Generate a complete strategy audit. Include: performance "
                    "dashboard, condition matrix, recent trend analysis, suggested "
                    "optimizations, and a go/no-go recommendation."
                ),
                "agent_type": "analyst",
                "output_var": "report",
            },
        ],
        "config": {
            "time_range_days": 90,
            "include_condition_analysis": True,
        },
    },
    "psychology_review": {
        "name": "Psychology Review",
        "description": "Trading psychology and discipline check.",
        "workflow_type": "psychology_review",
        "steps": [
            {
                "order": 1,
                "name": "Journal Analysis",
                "prompt_id": None,
                "prompt_text": "Read recent journal entries and extract emotional states, discipline scores, and psychological themes.",
                "agent_type": "analyst",
                "output_var": "journal_insights",
            },
            {
                "order": 2,
                "name": "Behavioral Patterns",
                "prompt_id": None,
                "prompt_text": "Cross-reference journal insights with trade data. Identify behavioral patterns: revenge trading, FOMO, over-trading after wins, hesitating after losses.",
                "agent_type": "analyst",
                "output_var": "behavioral_patterns",
            },
            {
                "order": 3,
                "name": "Wellness Report",
                "prompt_id": None,
                "prompt_text": (
                    "Generate a psychology wellness report. Include: current "
                    "mental state assessment, pattern summary, risk areas to "
                    "watch, and personalized exercises or routines to strengthen "
                    "trading discipline."
                ),
                "agent_type": "analyst",
                "output_var": "report",
            },
        ],
        "config": {
            "time_range_days": 14,
            "include_trade_correlation": True,
        },
    },
}


# ---------------------------------------------------------------------------
# PromptLibrary
# ---------------------------------------------------------------------------


class PromptLibrary:
    """CRUD and rendering for saved prompt templates."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ---- prompts ----------------------------------------------------------

    def get_prompt(self, prompt_id: UUID) -> AISavedPrompt | None:
        return self.db.get(AISavedPrompt, prompt_id)

    def list_prompts(
        self, project_id: UUID, folder_id: UUID | None = None
    ) -> list[AISavedPrompt]:
        stmt = select(AISavedPrompt).where(
            AISavedPrompt.project_id == project_id
        )
        if folder_id is not None:
            stmt = stmt.where(AISavedPrompt.folder_id == folder_id)
        stmt = stmt.order_by(AISavedPrompt.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def create_prompt(self, project_id: UUID, data: dict[str, Any]) -> AISavedPrompt:
        prompt = AISavedPrompt(
            id=uuid4(),
            project_id=project_id,
            title=data["title"],
            content=data["content"],
            category=data.get("category"),
            agent_type=data.get("agent_type"),
            folder_id=data.get("folder_id"),
            tags=data.get("tags"),
            is_favorite=data.get("is_favorite", False),
            variables=data.get("variables"),
            description=data.get("description"),
        )
        self.db.add(prompt)
        self.db.flush()
        return prompt

    def update_prompt(
        self, prompt_id: UUID, data: dict[str, Any]
    ) -> AISavedPrompt | None:
        prompt = self.get_prompt(prompt_id)
        if prompt is None:
            return None
        for field in (
            "title",
            "content",
            "category",
            "agent_type",
            "folder_id",
            "tags",
            "is_favorite",
            "variables",
            "description",
        ):
            if field in data:
                setattr(prompt, field, data[field])
        self.db.flush()
        return prompt

    def delete_prompt(self, prompt_id: UUID) -> bool:
        prompt = self.get_prompt(prompt_id)
        if prompt is None:
            return False
        self.db.delete(prompt)
        self.db.flush()
        return True

    def get_by_category(
        self, project_id: UUID, category: str
    ) -> list[dict[str, Any]]:
        db_prompts = list(
            self.db.scalars(
                select(AISavedPrompt).where(
                    AISavedPrompt.project_id == project_id,
                    AISavedPrompt.category == category,
                )
            ).all()
        )
        if db_prompts:
            return [self._to_dict(p) for p in db_prompts]
        return [p for p in PREDEFINED_PROMPTS if p["category"] == category]

    def get_by_agent(
        self, project_id: UUID, agent_type: str
    ) -> list[dict[str, Any]]:
        db_prompts = list(
            self.db.scalars(
                select(AISavedPrompt).where(
                    AISavedPrompt.project_id == project_id,
                    AISavedPrompt.agent_type == agent_type,
                )
            ).all()
        )
        if db_prompts:
            return [self._to_dict(p) for p in db_prompts]
        return [p for p in PREDEFINED_PROMPTS if p["agent_type"] == agent_type]

    def increment_use(self, project_id: UUID, prompt_id: UUID) -> bool:
        prompt = self.get_prompt(prompt_id)
        if prompt is None:
            return False
        prompt.use_count = (prompt.use_count or 0) + 1
        self.db.flush()
        return True

    def render_prompt(self, prompt_id: UUID, variables: dict[str, str]) -> str | None:
        prompt = self.get_prompt(prompt_id)
        if prompt is None:
            return None
        return _render_template(prompt.content, variables)

    # ---- folders ----------------------------------------------------------

    def get_folder(self, folder_id: UUID) -> AIPromptFolder | None:
        return self.db.get(AIPromptFolder, folder_id)

    def list_folders(self, project_id: UUID) -> list[AIPromptFolder]:
        stmt = (
            select(AIPromptFolder)
            .where(AIPromptFolder.project_id == project_id)
            .order_by(AIPromptFolder.sort_order, AIPromptFolder.name)
        )
        return list(self.db.scalars(stmt).all())

    def create_folder(
        self, project_id: UUID, data: dict[str, Any]
    ) -> AIPromptFolder:
        folder = AIPromptFolder(
            id=uuid4(),
            project_id=project_id,
            name=data["name"],
            parent_id=data.get("parent_id"),
            sort_order=data.get("sort_order", 0),
        )
        self.db.add(folder)
        self.db.flush()
        return folder

    def update_folder(
        self, folder_id: UUID, data: dict[str, Any]
    ) -> AIPromptFolder | None:
        folder = self.get_folder(folder_id)
        if folder is None:
            return None
        for field in ("name", "parent_id", "sort_order"):
            if field in data:
                setattr(folder, field, data[field])
        self.db.flush()
        return folder

    def delete_folder(self, folder_id: UUID) -> bool:
        folder = self.get_folder(folder_id)
        if folder is None:
            return False
        self.db.delete(folder)
        self.db.flush()
        return True

    # ---- helpers ----------------------------------------------------------

    @staticmethod
    def _to_dict(prompt: AISavedPrompt) -> dict[str, Any]:
        return {
            "id": str(prompt.id),
            "title": prompt.title,
            "content": prompt.content,
            "category": prompt.category,
            "agent_type": prompt.agent_type,
            "folder_id": str(prompt.folder_id) if prompt.folder_id else None,
            "tags": prompt.tags or [],
            "is_favorite": prompt.is_favorite,
            "use_count": prompt.use_count,
            "variables": prompt.variables or [],
            "description": prompt.description,
            "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
            "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else None,
        }


# ---------------------------------------------------------------------------
# WorkflowEngine
# ---------------------------------------------------------------------------


class WorkflowEngine:
    """Executes and tracks multi-step AI workflows."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ---- workflows --------------------------------------------------------

    def get_workflow(self, workflow_id: UUID) -> AIWorkflow | None:
        return self.db.get(AIWorkflow, workflow_id)

    def list_workflows(
        self, project_id: UUID, workflow_type: str | None = None
    ) -> list[AIWorkflow]:
        stmt = select(AIWorkflow).where(AIWorkflow.project_id == project_id)
        if workflow_type:
            stmt = stmt.where(AIWorkflow.workflow_type == workflow_type)
        stmt = stmt.order_by(AIWorkflow.name)
        return list(self.db.scalars(stmt).all())

    def get_workflow_templates(
        self, project_id: UUID
    ) -> list[dict[str, Any]]:
        """Return saved workflows if they exist, otherwise predefined templates."""
        existing = self.list_workflows(project_id)
        if existing:
            return [
                {
                    "id": str(w.id),
                    "name": w.name,
                    "description": w.description,
                    "workflow_type": w.workflow_type,
                    "steps": w.steps,
                    "config": w.config,
                    "is_active": w.is_active,
                    "last_run_at": w.last_run_at.isoformat() if w.last_run_at else None,
                    "run_count": w.run_count,
                }
                for w in existing
            ]
        return list(WORKFLOW_TEMPLATES.values())

    def create_workflow(
        self, project_id: UUID, data: dict[str, Any]
    ) -> AIWorkflow:
        workflow = AIWorkflow(
            id=uuid4(),
            project_id=project_id,
            name=data["name"],
            description=data.get("description"),
            workflow_type=data.get("workflow_type", "custom"),
            steps=data.get("steps", []),
            config=data.get("config"),
            is_active=data.get("is_active", True),
        )
        self.db.add(workflow)
        self.db.flush()
        return workflow

    def update_workflow(
        self, workflow_id: UUID, data: dict[str, Any]
    ) -> AIWorkflow | None:
        workflow = self.get_workflow(workflow_id)
        if workflow is None:
            return None
        for field in (
            "name",
            "description",
            "workflow_type",
            "steps",
            "config",
            "is_active",
        ):
            if field in data:
                setattr(workflow, field, data[field])
        self.db.flush()
        return workflow

    def delete_workflow(self, workflow_id: UUID) -> bool:
        workflow = self.get_workflow(workflow_id)
        if workflow is None:
            return False
        self.db.delete(workflow)
        self.db.flush()
        return True

    # ---- executions -------------------------------------------------------

    def get_execution(self, execution_id: UUID) -> AIWorkflowExecution | None:
        return self.db.get(AIWorkflowExecution, execution_id)

    def list_executions(
        self, project_id: UUID, workflow_id: UUID | None = None
    ) -> list[AIWorkflowExecution]:
        stmt = select(AIWorkflowExecution).where(
            AIWorkflowExecution.project_id == project_id
        )
        if workflow_id:
            stmt = stmt.where(AIWorkflowExecution.workflow_id == workflow_id)
        stmt = stmt.order_by(AIWorkflowExecution.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def execute_workflow(
        self,
        project_id: UUID,
        workflow_id: UUID,
        variables: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Run a workflow and return execution results."""
        workflow = self.get_workflow(workflow_id)
        if workflow is None:
            return {
                "success": False,
                "error": f"Workflow {workflow_id} not found.",
            }

        execution = AIWorkflowExecution(
            id=uuid4(),
            project_id=project_id,
            workflow_id=workflow_id,
            status="running",
        )
        self.db.add(execution)
        self.db.flush()

        vars_: dict[str, str] = variables or {}
        step_results: list[dict[str, Any]] = []
        overall_error: str | None = None

        try:
            for step in workflow.steps:
                rendered = _render_template(
                    step.get("prompt_text", ""), vars_
                )
                step_results.append(
                    {
                        "order": step.get("order"),
                        "name": step.get("name"),
                        "agent_type": step.get("agent_type"),
                        "prompt": rendered,
                        "status": "completed",
                        "output_var": step.get("output_var"),
                    }
                )

            execution.status = "completed"
            execution.result = {
                "workflow_name": workflow.name,
                "workflow_type": workflow.workflow_type,
                "steps": step_results,
                "total_steps": len(workflow.steps),
            }
            execution.duration_ms = 0

            workflow.last_run_at = datetime.now(timezone.utc)
            workflow.run_count = (workflow.run_count or 0) + 1
            self.db.flush()

        except Exception as exc:
            overall_error = str(exc)
            execution.status = "failed"
            execution.error = overall_error
            self.db.flush()

        return {
            "success": execution.status == "completed",
            "execution_id": str(execution.id),
            "status": execution.status,
            "error": overall_error,
            "steps": step_results,
        }

    def get_workflow_progress(self, execution_id: UUID) -> dict[str, Any]:
        """Return the current progress / result of a workflow execution."""
        execution = self.get_execution(execution_id)
        if execution is None:
            return {"success": False, "error": "Execution not found."}

        return {
            "success": execution.status == "completed",
            "execution_id": str(execution.id),
            "workflow_id": str(execution.workflow_id),
            "status": execution.status,
            "result": execution.result,
            "error": execution.error,
            "duration_ms": execution.duration_ms,
            "created_at": execution.created_at.isoformat() if execution.created_at else None,
        }

    def delete_execution(self, execution_id: UUID) -> bool:
        execution = self.get_execution(execution_id)
        if execution is None:
            return False
        self.db.delete(execution)
        self.db.flush()
        return True


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

_VARIABLE_RE = re.compile(r"\{\{(\w+)\}\}")


def _render_template(template: str, variables: dict[str, str]) -> str:
    """Replace ``{{variable}}`` placeholders with values from *variables*."""

    def _replace(match: re.Match[str]) -> str:
        key = match.group(1)
        return variables.get(key, match.group(0))

    return _VARIABLE_RE.sub(_replace, template)
