"""Run Alembic migrations against the Neon database.

Usage:
    python scripts/run_migrations.py

Requires DATABASE_URL to be set in the environment (e.g. via `.env` or export).

This script must be run locally or in CI **before** deploying to Vercel,
because Vercel Serverless Functions cannot run Alembic migrations at runtime.
"""
import os
import sys
import subprocess


def main():
    if not os.getenv("DATABASE_URL"):
        sys.stderr.write(
            "ERROR: DATABASE_URL environment variable is not set.\n"
            "Set it to your Neon PostgreSQL connection string.\n"
        )
        sys.exit(1)

    backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
    os.chdir(backend_dir)
    sys.stderr.write("Running Alembic migrations...\n")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    sys.stderr.write(result.stdout)
    if result.stderr:
        sys.stderr.write(result.stderr)
    if result.returncode != 0:
        sys.stderr.write(f"Migration failed (exit code {result.returncode}).\n")
        sys.exit(result.returncode)
    sys.stderr.write("Migrations applied successfully.\n")


if __name__ == "__main__":
    main()
