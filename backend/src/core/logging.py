import json
import logging
import sys
import os


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production use."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


class HumanFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    def format(self, record: logging.LogRecord) -> str:
        return f"{self.formatTime(record)} - {record.name} - {record.levelname} - {record.getMessage()}"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        env = os.getenv("ENVIRONMENT", "development")
        if env == "production":
            handler.setFormatter(JSONFormatter())
        else:
            handler.setFormatter(HumanFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
