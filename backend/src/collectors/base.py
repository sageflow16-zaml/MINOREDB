from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID
from typing import Optional


class CollectorResult:
    def __init__(
        self,
        status: str,
        records_collected: int = 0,
        errors_count: int = 0,
        error_message: Optional[str] = None,
        duration_ms: int = 0,
    ):
        self.status = status
        self.records_collected = records_collected
        self.errors_count = errors_count
        self.error_message = error_message
        self.duration_ms = duration_ms


class BaseCollector(ABC):
    def __init__(self, project_id: UUID):
        self._project_id = project_id
        self._name = self.__class__.__name__
        self._description = ""

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    @abstractmethod
    def run(self) -> CollectorResult:
        pass

    @abstractmethod
    def validate(self) -> bool:
        pass

    @abstractmethod
    def store(self, data: list[dict]) -> int:
        pass
