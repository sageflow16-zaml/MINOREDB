from uuid import UUID
from src.collectors.base import BaseCollector
from src.collectors.implementations import (
    MarketCollector,
    EconomicCalendarCollector,
    MT5Collector,
    NewsCollector,
    HistoricalCollector,
)

_collector_classes: dict[str, type[BaseCollector]] = {}


def register_collector(name: str, cls: type[BaseCollector]):
    _collector_classes[name] = cls


def get_collector_class(name: str) -> type[BaseCollector] | None:
    return _collector_classes.get(name)


def list_collector_classes() -> dict[str, type[BaseCollector]]:
    return dict(_collector_classes)


def instantiate_collectors(project_id: UUID) -> dict[str, BaseCollector]:
    return {
        name: cls(project_id) for name, cls in _collector_classes.items()
    }


register_collector("MarketCollector", MarketCollector)
register_collector("EconomicCalendarCollector", EconomicCalendarCollector)
register_collector("MT5Collector", MT5Collector)
register_collector("NewsCollector", NewsCollector)
register_collector("HistoricalCollector", HistoricalCollector)
