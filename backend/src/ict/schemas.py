from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OHLCBar(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


class SwingPoint(BaseModel):
    index: int
    timestamp: datetime
    price: float
    type: str  # swing_high | swing_low
    strength: float = 0.0


class StructureResult(BaseModel):
    type: str
    price: float
    timestamp: datetime
    bar_index: int
    strength_score: float = 0.0
    confidence_score: float = 0.0


class StructureAnalysis(BaseModel):
    swing_points: list[SwingPoint] = []
    structures: list[StructureResult] = []
    trend: str = "neutral"
    current_high: Optional[float] = None
    current_low: Optional[float] = None
    protected_high: Optional[float] = None
    protected_low: Optional[float] = None
    last_bos: Optional[dict] = None
    last_mss: Optional[dict] = None


class FVGResult(BaseModel):
    type: str
    top_price: float
    bottom_price: float
    gap_size: float
    midpoint: float
    timestamp: datetime
    bar_index: int
    status: str = "untouched"
    freshness_score: float = 0.0
    probability_score: float = 0.0
    reaction_strength: float = 0.0
    parent_fvg_id: Optional[str] = None


class FVGAnalysis(BaseModel):
    fvgs: list[FVGResult] = []
    bullish_count: int = 0
    bearish_count: int = 0
    best_fvg: Optional[FVGResult] = None


class OrderBlockResult(BaseModel):
    type: str
    top_price: float
    bottom_price: float
    midpoint: float
    timestamp: datetime
    bar_index: int
    touch_count: int = 0
    is_mitigated: bool = False
    validity_score: float = 0.0
    quality_score: float = 0.0
    reaction_strength: float = 0.0


class OrderBlockAnalysis(BaseModel):
    order_blocks: list[OrderBlockResult] = []
    bullish_count: int = 0
    bearish_count: int = 0
    best_block: Optional[OrderBlockResult] = None


class LiquidityResult(BaseModel):
    type: str
    top_price: float
    bottom_price: float
    peak_price: float = 0.0
    timestamp: datetime
    bar_index: int
    is_swept: bool = False
    strength_score: float = 0.0


class LiquidityAnalysis(BaseModel):
    zones: list[LiquidityResult] = []
    buy_side_liquidity: list[LiquidityResult] = []
    sell_side_liquidity: list[LiquidityResult] = []
    equal_highs: list[LiquidityResult] = []
    equal_lows: list[LiquidityResult] = []
    recent_sweeps: list[LiquidityResult] = []


class SessionResult(BaseModel):
    session_type: str
    date: str
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    range: float
    direction: Optional[str] = None
    start_time: datetime
    end_time: datetime


class SessionAnalysis(BaseModel):
    sessions: list[SessionResult] = []
    current_session: Optional[str] = None
    current_kill_zone: Optional[str] = None
    is_silver_bullet_window: bool = False
    opening_range_high: Optional[float] = None
    opening_range_low: Optional[float] = None


class ICTModelResult(BaseModel):
    model_type: str
    direction: str
    entry_price_min: Optional[float] = None
    entry_price_max: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_reward_ratio: Optional[float] = None
    timestamp: datetime
    bar_index: int
    components: list[str] = []
    quality_score: float = 0.0


class MultiTimeframeBias(BaseModel):
    weekly: str = "neutral"
    daily: str = "neutral"
    h4: str = "neutral"
    h1: str = "neutral"
    m15: str = "neutral"
    htf_bias: str = "neutral"
    ltf_confirmation: str = "neutral"
    confluence_score: float = 0.0
    premium_discount: str = "neutral"


class SetupScore(BaseModel):
    structure_score: float = 0.0
    liquidity_score: float = 0.0
    fvg_score: float = 0.0
    order_block_score: float = 0.0
    risk_score: float = 0.0
    session_score: float = 0.0
    confluence_score: float = 0.0
    overall_quality: float = 0.0


class ExecutionDecision(BaseModel):
    status: str = "wait"
    direction: Optional[str] = None
    entry: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_amount: Optional[float] = None
    reasoning: str = ""
    scores: SetupScore = SetupScore()


class MarketContext(BaseModel):
    symbol: str = ""
    current_price: float = 0.0
    htf_bias: str = "neutral"
    ltf_bias: str = "neutral"
    current_structure: Optional[dict] = None
    best_setup: Optional[dict] = None
    premium_discount: str = "neutral"
    key_levels: list[float] = []
    weak_areas: list[dict] = []
    invalidation_levels: list[float] = []
    confluence: float = 0.0
    session_info: Optional[dict] = None
    recent_events: list[dict] = []
    reasoning: str = ""


class ICTAnalysisRequest(BaseModel):
    symbol: str = "EURUSD"
    timeframe: str = "1h"
    bars: list[OHLCBar] = Field(default_factory=list)
    include_fvg: bool = True
    include_order_blocks: bool = True
    include_liquidity: bool = True
    include_sessions: bool = True
    include_models: bool = True
    include_scoring: bool = True
    detect_swing_bars: int = 5


class ICTAnalysisResponse(BaseModel):
    symbol: str
    timeframe: str
    structure: StructureAnalysis = StructureAnalysis()
    fvg: FVGAnalysis = FVGAnalysis()
    order_blocks: OrderBlockAnalysis = OrderBlockAnalysis()
    liquidity: LiquidityAnalysis = LiquidityAnalysis()
    sessions: SessionAnalysis = SessionAnalysis()
    models: list[ICTModelResult] = []
    multi_timeframe: MultiTimeframeBias = MultiTimeframeBias()
    scores: SetupScore = SetupScore()
    execution: ExecutionDecision = ExecutionDecision()
    market_context: MarketContext = MarketContext()
    analysis_time_ms: float = 0.0
