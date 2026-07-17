from datetime import datetime, timezone
from uuid import uuid4
from src.collectors.base import BaseCollector, CollectorResult


class MarketCollector(BaseCollector):
    def __init__(self, project_id):
        super().__init__(project_id)
        self._description = "Collects market structure data for configured pairs and timeframes"

    def run(self) -> CollectorResult:
        import time
        start = time.time()
        mock_data = self._fetch_mock_data()
        stored = self.store(mock_data)
        duration = int((time.time() - start) * 1000)
        return CollectorResult(
            status="success",
            records_collected=stored,
            duration_ms=duration,
        )

    def validate(self) -> bool:
        return True

    def store(self, data: list[dict]) -> int:
        return len(data)

    def _fetch_mock_data(self) -> list[dict]:
        return [
            {
                "pair": "EURUSD",
                "timeframe": "H1",
                "weekly_bias": "BULLISH",
                "daily_bias": "BULLISH",
                "market_phase": "MARKUP",
                "trend": "UPTREND",
                "premium_discount": "PREMIUM",
                "key_level": 1.1234,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            {
                "pair": "GBPUSD",
                "timeframe": "H1",
                "weekly_bias": "BEARISH",
                "daily_bias": "NEUTRAL",
                "market_phase": "DISTRIBUTION",
                "trend": "DOWNTREND",
                "premium_discount": "DISCOUNT",
                "key_level": 1.2876,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        ]


class EconomicCalendarCollector(BaseCollector):
    def __init__(self, project_id):
        super().__init__(project_id)
        self._description = "Collects economic calendar events and their impact levels"

    def run(self) -> CollectorResult:
        import time
        start = time.time()
        mock_data = self._fetch_mock_data()
        stored = self.store(mock_data)
        duration = int((time.time() - start) * 1000)
        return CollectorResult(
            status="success",
            records_collected=stored,
            duration_ms=duration,
        )

    def validate(self) -> bool:
        return True

    def store(self, data: list[dict]) -> int:
        return len(data)

    def _fetch_mock_data(self) -> list[dict]:
        return [
            {
                "event_name": "FOMC Interest Rate Decision",
                "country": "US",
                "date": "2026-07-30",
                "time": "18:00 GMT",
                "forecast": "5.50%",
                "previous": "5.50%",
                "impact": "HIGH",
                "currency": "USD",
            },
            {
                "event_name": "Non-Farm Payrolls",
                "country": "US",
                "date": "2026-08-01",
                "time": "12:30 GMT",
                "forecast": "185K",
                "previous": "206K",
                "impact": "HIGH",
                "currency": "USD",
            },
            {
                "event_name": "CPI YoY",
                "country": "UK",
                "date": "2026-08-14",
                "time": "06:00 GMT",
                "forecast": "2.1%",
                "previous": "2.3%",
                "impact": "MEDIUM",
                "currency": "GBP",
            },
        ]


class MT5Collector(BaseCollector):
    def __init__(self, project_id):
        super().__init__(project_id)
        self._description = "Collects trade execution data from MetaTrader 5 terminal"

    def run(self) -> CollectorResult:
        import time
        start = time.time()
        mock_data = self._fetch_mock_data()
        stored = self.store(mock_data)
        duration = int((time.time() - start) * 1000)
        return CollectorResult(
            status="success",
            records_collected=stored,
            duration_ms=duration,
        )

    def validate(self) -> bool:
        return True

    def store(self, data: list[dict]) -> int:
        return len(data)

    def _fetch_mock_data(self) -> list[dict]:
        return [
            {
                "ticket": 12345678,
                "pair": "EURUSD",
                "direction": "BUY",
                "volume": 0.1,
                "open_price": 1.1200,
                "close_price": 1.1250,
                "open_time": "2026-07-16 08:00:00",
                "close_time": "2026-07-16 16:00:00",
                "profit": 50.00,
                "swap": -0.50,
                "commission": -1.00,
                "magic_number": 1001,
                "comment": "London session breakout",
            },
            {
                "ticket": 12345679,
                "pair": "GBPUSD",
                "direction": "SELL",
                "volume": 0.15,
                "open_price": 1.2900,
                "close_price": 1.2860,
                "open_time": "2026-07-17 06:00:00",
                "close_time": "2026-07-17 12:00:00",
                "profit": 60.00,
                "swap": -0.30,
                "commission": -1.50,
                "magic_number": 1001,
                "comment": "Asian range breakout",
            },
        ]


class NewsCollector(BaseCollector):
    def __init__(self, project_id):
        super().__init__(project_id)
        self._description = "Collects financial news and sentiment data from major sources"

    def run(self) -> CollectorResult:
        import time
        start = time.time()
        mock_data = self._fetch_mock_data()
        stored = self.store(mock_data)
        duration = int((time.time() - start) * 1000)
        return CollectorResult(
            status="success",
            records_collected=stored,
            duration_ms=duration,
        )

    def validate(self) -> bool:
        return True

    def store(self, data: list[dict]) -> int:
        return len(data)

    def _fetch_mock_data(self) -> list[dict]:
        return [
            {
                "title": "Fed Holds Rates Steady, Signals Potential Cut",
                "source": "Reuters",
                "published_at": "2026-07-17 18:00:00",
                "sentiment": "NEUTRAL",
                "summary": "Federal Reserve maintains current rate, hints at possible easing.",
                "currencies_affected": ["USD"],
                "relevance_score": 0.95,
            },
            {
                "title": "UK Inflation Falls More Than Expected",
                "source": "Bloomberg",
                "published_at": "2026-07-17 06:30:00",
                "sentiment": "BULLISH_GBP",
                "summary": "UK CPI drops to 2.1%, below forecast of 2.3%.",
                "currencies_affected": ["GBP"],
                "relevance_score": 0.88,
            },
            {
                "title": "ECB Officials Split on Next Policy Move",
                "source": "Financial Times",
                "published_at": "2026-07-16 14:00:00",
                "sentiment": "BEARISH_EUR",
                "summary": "Growing division among ECB policymakers on rate trajectory.",
                "currencies_affected": ["EUR"],
                "relevance_score": 0.82,
            },
        ]


class HistoricalCollector(BaseCollector):
    def __init__(self, project_id):
        super().__init__(project_id)
        self._description = "Collects historical price data for backtesting and pattern analysis"

    def run(self) -> CollectorResult:
        import time
        start = time.time()
        mock_data = self._fetch_mock_data()
        stored = self.store(mock_data)
        duration = int((time.time() - start) * 1000)
        return CollectorResult(
            status="success",
            records_collected=stored,
            duration_ms=duration,
        )

    def validate(self) -> bool:
        return True

    def store(self, data: list[dict]) -> int:
        return len(data)

    def _fetch_mock_data(self) -> list[dict]:
        return [
            {
                "pair": "EURUSD",
                "timeframe": "D1",
                "date": "2026-07-10",
                "open": 1.1180,
                "high": 1.1240,
                "low": 1.1160,
                "close": 1.1220,
                "volume": 125000,
            },
            {
                "pair": "EURUSD",
                "timeframe": "D1",
                "date": "2026-07-11",
                "open": 1.1220,
                "high": 1.1260,
                "low": 1.1190,
                "close": 1.1250,
                "volume": 132000,
            },
            {
                "pair": "EURUSD",
                "timeframe": "D1",
                "date": "2026-07-12",
                "open": 1.1250,
                "high": 1.1280,
                "low": 1.1210,
                "close": 1.1230,
                "volume": 118000,
            },
            {
                "pair": "GBPUSD",
                "timeframe": "D1",
                "date": "2026-07-10",
                "open": 1.2850,
                "high": 1.2910,
                "low": 1.2830,
                "close": 1.2890,
                "volume": 98000,
            },
            {
                "pair": "GBPUSD",
                "timeframe": "D1",
                "date": "2026-07-11",
                "open": 1.2890,
                "high": 1.2930,
                "low": 1.2860,
                "close": 1.2900,
                "volume": 105000,
            },
        ]
