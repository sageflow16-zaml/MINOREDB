import time
import logging
from datetime import datetime, timezone, timedelta
from uuid import UUID
from sqlalchemy.orm import Session
from src.collectors.base import BaseCollector, CollectorResult
from src.collectors.registry import list_collector_classes, instantiate_collectors
from src.models.collector import CollectorStatus, CollectorLog, CollectorSchedule
from src.crud import collector as collector_crud

logger = logging.getLogger(__name__)


class CollectorManager:
    def __init__(self, project_id: UUID, db: Session):
        self._project_id = project_id
        self._db = db
        self._collectors: dict[str, BaseCollector] = {}
        self._ensure_status_records()

    def _ensure_status_records(self):
        existing = collector_crud.get_statuses(self._db, project_id=self._project_id)
        existing_names = {s.name for s in existing}
        for name in list_collector_classes():
            if name not in existing_names:
                collector_crud.create_status(
                    self._db, project_id=self._project_id, name=name
                )

    def register(self, name: str, collector: BaseCollector):
        self._collectors[name] = collector

    def get_collector(self, name: str) -> BaseCollector | None:
        return self._collectors.get(name)

    def list_statuses(self) -> list[CollectorStatus]:
        return collector_crud.get_statuses(self._db, project_id=self._project_id)

    def get_status(self, name: str) -> CollectorStatus | None:
        return collector_crud.get_status_by_name(
            self._db, project_id=self._project_id, name=name
        )

    def execute(self, name: str) -> CollectorResult:
        collector = self._collectors.get(name)
        if not collector:
            collectors = instantiate_collectors(self._project_id)
            if name not in collectors:
                return CollectorResult(
                    status="error",
                    error_message=f"Collector '{name}' not found",
                )
            collector = collectors[name]
            self._collectors[name] = collector

        if not collector.validate():
            return CollectorResult(
                status="error",
                error_message=f"Collector '{name}' validation failed",
            )

        logger.info("Starting collector: %s", name)
        start = time.time()

        try:
            result = collector.run()
        except Exception as e:
            duration = int((time.time() - start) * 1000)
            logger.error("Collector %s failed: %s", name, str(e))
            self._log_execution(name, "error", 0, 1, str(e), start, duration)
            self._update_status_after_run(name, "error", 0, 1, str(e))
            return CollectorResult(
                status="error",
                error_message=str(e),
                duration_ms=duration,
            )

        duration = int((time.time() - start) * 1000)
        self._log_execution(
            name, result.status, result.records_collected,
            result.errors_count, result.error_message, start, duration
        )
        self._update_status_after_run(
            name, result.status, result.records_collected,
            result.errors_count, result.error_message
        )
        return result

    def execute_all(self) -> dict[str, CollectorResult]:
        if not self._collectors:
            self._collectors = instantiate_collectors(self._project_id)
        results = {}
        for name in self._collectors:
            results[name] = self.execute(name)
        return results

    def _log_execution(
        self, name: str, status: str, records: int,
        errors: int, error_msg: str | None, start_time: float, duration_ms: int
    ):
        started_at = datetime.fromtimestamp(start_time, tz=timezone.utc)
        log_entry = CollectorLog(
            project_id=self._project_id,
            collector_name=name,
            status=status,
            records_count=records,
            errors_count=errors,
            error_message=error_msg,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
            duration_ms=duration_ms,
        )
        self._db.add(log_entry)
        self._db.commit()

    def _update_status_after_run(
        self, name: str, status: str, records: int,
        errors: int, error_msg: str | None
    ):
        db_status = collector_crud.get_status_by_name(
            self._db, project_id=self._project_id, name=name
        )
        if db_status:
            now = datetime.now(timezone.utc)
            schedule = collector_crud.get_schedule_by_name(
                self._db, project_id=self._project_id, name=name
            )
            next_run = None
            if schedule and schedule.enabled:
                next_run = now + timedelta(minutes=schedule.interval_minutes)

            update_data = {
                "status": status,
                "last_run_at": now,
                "next_run_at": next_run,
                "records_collected": (db_status.records_collected or 0) + records,
                "errors": (db_status.errors or 0) + errors,
            }
            if error_msg:
                update_data["last_error_message"] = error_msg

            collector_crud.update_status(
                self._db, status_id=db_status.id, obj_in=update_data
            )

    def get_logs(self, limit: int = 50) -> list[CollectorLog]:
        return collector_crud.get_logs(
            self._db, project_id=self._project_id, limit=limit
        )

    def update_enabled(self, name: str, enabled: bool) -> CollectorStatus | None:
        return collector_crud.update_status_by_name(
            self._db, project_id=self._project_id, name=name, enabled=enabled
        )

    def get_schedules(self) -> list[CollectorSchedule]:
        return collector_crud.get_schedules(
            self._db, project_id=self._project_id
        )
