import os
import subprocess
import sys


def main():
    # ── Diagnostics ────────────────────────────────────────────────────
    raw_url = os.environ.get("DATABASE_URL", "")
    safe_url = raw_url[:raw_url.rfind("@") + 1] + "***" if "@" in raw_url else "(not set)"
    host = raw_url.split("@")[-1].split(":")[0] if "@" in raw_url else "unknown"
    print(f"[entrypoint] DATABASE_URL = {safe_url}")
    print(f"[entrypoint] host = {host}")

    if "railway.internal" not in raw_url and "localhost" not in raw_url and "host.docker" not in raw_url:
        print(f"[entrypoint] WARNING: DATABASE_URL host is '{host}' — expected railway.internal or localhost")

    # ── Database migrations ────────────────────────────────────────────
    print("Running database migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=False,
    )
    if result.returncode != 0:
        print("Migrations failed. Exiting.")
        sys.exit(result.returncode)
    print("Migrations complete.")

    # ── Start uvicorn on the port Railway provides ─────────────────────
    port = os.environ.get("PORT", "8000")
    print(f"Starting uvicorn on 0.0.0.0:{port}...")
    os.execvp("uvicorn", ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", port])


if __name__ == "__main__":
    main()
