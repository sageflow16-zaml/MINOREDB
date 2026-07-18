import os
import subprocess
import sys
import time


def main():
    # ── Diagnostics ────────────────────────────────────────────────────
    raw_url = os.environ.get("DATABASE_URL", "")
    safe_url = raw_url[:raw_url.rfind("@") + 1] + "***" if "@" in raw_url else "(not set)"
    host = raw_url.split("@")[-1].split(":")[0] if "@" in raw_url else "unknown"
    print(f"[entrypoint] DATABASE_URL = {safe_url}")
    print(f"[entrypoint] host = {host}")

    port = os.environ.get("PORT", "8000")
    import socket
    hostname = socket.gethostname()
    try:
        addrs = socket.getaddrinfo(hostname, None)
        ips = sorted(set(a[4][0] for a in addrs if a[0] == socket.AF_INET))
    except Exception:
        ips = []
    rail_vars = {k: v for k, v in os.environ.items()
                 if k.startswith("RAILWAY_") or k in ("PORT", "HOSTNAME", "HOME")}
    print(f"[entrypoint] PORT={port} HOSTNAME={hostname} IPs={ips}")
    print(f"[entrypoint] Railway env: {rail_vars}")

    # ── Start uvicorn FIRST so the health check can succeed ────────────
    print(f"[entrypoint] Starting uvicorn on 0.0.0.0:{port}...")
    import threading

    uvicorn_ready = threading.Event()

    def _wait_for_uvicorn():
        import urllib.request
        for _ in range(30):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=2)
                uvicorn_ready.set()
                return
            except Exception:
                time.sleep(1)
        print("[entrypoint] WARNING: uvicorn did not respond to health check within 30s")

    t = threading.Thread(target=_wait_for_uvicorn, daemon=True)
    t.start()

    proc = subprocess.Popen(
        ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", port]
    )

    t.join(timeout=35)
    if not uvicorn_ready.is_set():
        # uvicorn likely crashed — capture its exit status
        rc = proc.poll()
        print(f"[entrypoint] CRITICAL: uvicorn exited with code {rc}. See stderr above for traceback.")
        sys.exit(1)

    print("[entrypoint] uvicorn is healthy and responding.")

    # ── Migrations in foreground (app is already listening) ────────────
    print("[entrypoint] Running database migrations...")
    result = subprocess.run(["alembic", "upgrade", "head"], capture_output=False)
    if result.returncode != 0:
        print("[entrypoint] WARNING: Migrations failed, but uvicorn continues.")
    else:
        print("[entrypoint] Migrations complete.")

    # Wait for uvicorn
    proc.wait()


if __name__ == "__main__":
    main()
