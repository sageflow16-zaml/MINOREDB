#!/usr/bin/env python3
"""Database backup and restore utility for Minore.

Usage:
    python scripts/backup_db.py backup                    # Creates timestamped dump
    python scripts/backup_db.py restore <dump_file>       # Restores from dump
    python scripts/backup_db.py list                       # Lists available backups
    python scripts/backup_db.py verify                    # Verifies latest backup

Requires:
    - pg_dump / pg_restore in PATH (PostgreSQL 18 client tools)
    - DATABASE_URL environment variable (or --db-url arg)
"""
import argparse
import glob
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path(__file__).resolve().parent.parent / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# Default: DATABASE_URL from .env or environment
DEFAULT_DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://minore:minore@localhost:5432/minore")


def _strip_url(url: str) -> str:
    """Convert SQLAlchemy-style URL to native psql format."""
    url = url.replace("postgresql+psycopg://", "postgresql://")
    url = url.replace("postgresql+psycopg2://", "postgresql://")
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    return url


def _run(cmd: list[str], desc: str) -> bool:
    print(f"[{desc}] Running: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"[{desc}] OK")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[{desc}] FAILED\n{e.stderr}")
        return False


def backup(db_url: str) -> Path | None:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = BACKUP_DIR / f"minore_backup_{timestamp}.dump"
    native_url = _strip_url(db_url)
    cmd = ["pg_dump", "-Fc", "--no-owner", "--verbose", "-f", str(path), native_url]
    if _run(cmd, "backup"):
        print(f"  -> Saved: {path} ({path.stat().st_size / 1024:.0f} KB)")
        return path
    return None


def restore(dump_path: str, db_url: str) -> bool:
    native_url = _strip_url(db_url)
    cmd = ["pg_restore", "--clean", "--if-exists", "--no-owner", "-d", native_url, dump_path]
    return _run(cmd, "restore")


def list_backups() -> None:
    backups = sorted(BACKUP_DIR.glob("minore_backup_*.dump"))
    if not backups:
        print("No backups found.")
        return
    print(f"Backups in {BACKUP_DIR}:")
    for b in backups:
        size = b.stat().st_size
        print(f"  {b.name}  ({size / 1024:.0f} KB)")


def verify(dump_path: str | None = None, db_url: str = "") -> bool:
    if not dump_path:
        backups = sorted(BACKUP_DIR.glob("minore_backup_*.dump"))
        if not backups:
            print("No backups to verify.")
            return False
        dump_path = str(backups[-1])
    cmd = ["pg_restore", "--list", dump_path]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        lines = [l for l in result.stdout.split("\n") if l.strip() and not l.startswith(";")]
        print(f"  -> Dump is valid: {len(lines)} objects")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  -> INVALID: {e.stderr}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Minore DB backup/restore")
    parser.add_argument("action", choices=["backup", "restore", "list", "verify"])
    parser.add_argument("file", nargs="?", help="Dump file for restore")
    parser.add_argument("--db-url", default=DEFAULT_DB_URL, help="Database URL")
    args = parser.parse_args()

    if args.action == "backup":
        backup(args.db_url)
    elif args.action == "restore":
        if not args.file:
            print("Error: restore requires a dump file path")
            sys.exit(1)
        restore(args.file, args.db_url)
    elif args.action == "list":
        list_backups()
    elif args.action == "verify":
        verify(args.file, args.db_url)


if __name__ == "__main__":
    main()
