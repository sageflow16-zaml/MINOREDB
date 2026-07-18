import os
import subprocess
import sys


def main():
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
