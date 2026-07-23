# Backup & Disaster Recovery Plan — Project Minore

**Date:** 2026-07-20
**Version:** 1.0

---

## 1. Database Backup Strategy

### PostgreSQL Backup Schedule

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Full backup | Daily | 30 days | `pg_dump` with custom format |
| WAL archiving | Continuous | 7 days | `archive_command` or `pg_receivewal` |
| Logical backup | Weekly | 90 days | `pg_dumpall` or `pg_dump --format=plain` |
| Point-in-time recovery | N/A | 7 days of WAL | WAL replay |

### Automated Backup Script

Create as `backend/scripts/backup_db.py`:

```python
#!/usr/bin/env python3
"""Automated PostgreSQL backup script."""
import os
import subprocess
import datetime
import sys
from pathlib import Path

BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", "/var/backups/minore"))
RETENTION_DAYS = int(os.environ.get("BACKUP_RETENTION_DAYS", "30"))
DB_URL = os.environ.get("DATABASE_URL", "")

def parse_db_url(url: str) -> dict:
    parts = url.replace("postgresql+psycopg://", "postgresql://").split("://")[1]
    user_pass, host_port_db = parts.split("@", 1)
    user, password = user_pass.split(":", 1)
    host_port, dbname = host_port_db.split("/", 1)
    host, port = host_port.split(":", 1) if ":" in host_port else (host_port, "5432")
    return {"user": user, "password": password, "host": host, "port": port, "dbname": dbname}

def backup():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    config = parse_db_url(DB_URL)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"minore_{config['dbname']}_{timestamp}.dump"
    filepath = BACKUP_DIR / filename

    env = os.environ.copy()
    env["PGPASSWORD"] = config["password"]

    cmd = [
        "pg_dump",
        "--format=custom",
        "--compress=9",
        f"--host={config['host']}",
        f"--port={config['port']}",
        f"--username={config['user']}",
        f"--dbname={config['dbname']}",
        "--no-owner",
        "--no-acl",
        f"--file={filepath}",
    ]

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Backup failed: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    # Verify backup
    verify = subprocess.run(
        ["pg_restore", "--list", str(filepath)],
        capture_output=True, text=True
    )
    if verify.returncode != 0:
        print(f"Backup verification failed: {verify.stderr}", file=sys.stderr)
        sys.exit(1)

    print(f"Backup completed: {filepath} ({filepath.stat().st_size / 1024 / 1024:.2f} MB)")

    # Cleanup old backups
    cleanup()

def cleanup():
    cutoff = datetime.datetime.now() - datetime.timedelta(days=RETENTION_DAYS)
    for f in BACKUP_DIR.glob("*.dump"):
        if datetime.datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
            f.unlink()
            print(f"Removed old backup: {f}")

if __name__ == "__main__":
    backup()
```

### Automation (Cron / Systemd Timer)

```systemd
# /etc/systemd/system/minore-backup.service
[Unit]
Description=Minore Database Backup
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /app/backend/scripts/backup_db.py
Environment=BACKUP_DIR=/var/backups/minore
Environment=BACKUP_RETENTION_DAYS=30
User=appuser
```

```systemd
# /etc/systemd/system/minore-backup.timer
[Unit]
Description=Daily Minore Backup
Requires=minore-backup.service

[Timer]
OnCalendar=daily
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

---

## 2. Snapshot Strategy (Infrastructure)

| Provider | Method | Frequency | Notes |
|----------|--------|-----------|-------|
| Railway | Automatic volumes | Daily | PostgreSQL add-on includes automatic backups |
| AWS RDS | Automated snapshots | Daily | 35-day retention |
| Self-hosted | Filesystem snapshots | Daily | LVM/ZFS snapshots before pg_dump |

---

## 3. Backup Verification

After each backup:
1. Run `pg_restore --list` to verify archive integrity
2. Check file size (should be > 1 KB for non-empty DBs)
3. Log success/failure to the application's audit logger
4. Weekly: restore backup to a test environment and run `SELECT count(*)` on all tables

---

## 4. Restore Procedure

### Point-in-Time Recovery

```bash
# 1. Restore base backup
pg_restore --dbname=minore --clean --if-exists \
  --host=localhost --port=5432 --username=minore \
  minore_production_20260720_000000.dump

# 2. Apply WAL to desired point
# Configure recovery.conf or recovery.signal
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '2026-07-20 14:30:00 UTC'
```

### Full Restore

```bash
# Stop the application
systemctl stop minore

# Drop and recreate database
dropdb minore
createdb minore

# Restore from dump
pg_restore --dbname=minore --clean --if-exists \
  --host=localhost --port=5432 --username=minore \
  --no-owner --no-acl \
  /var/backups/minore/minore_production_latest.dump

# Run any pending migrations
alembic upgrade head

# Start the application
systemctl start minore
```

### Automated Restore Script

```python
#!/usr/bin/env python3
"""Restore Minore database from backup."""
import subprocess
import sys
from pathlib import Path

def restore(backup_path: str, db_url: str):
    if not Path(backup_path).exists():
        print(f"Backup not found: {backup_path}", file=sys.stderr)
        sys.exit(1)

    cmd = [
        "pg_restore",
        "--clean", "--if-exists",
        "--no-owner", "--no-acl",
        "--dbname", db_url,
        backup_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Restore failed: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    print(f"Restore completed from: {backup_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: restore.py <backup_path>", file=sys.stderr)
        sys.exit(1)
    restore(sys.argv[1], os.environ.get("DATABASE_URL", ""))
```

---

## 5. Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Component | RTO | RPO | Method |
|-----------|-----|-----|--------|
| Database | 1 hour | 24 hours | pg_dump + WAL |
| Application | 15 minutes | N/A | Stateless, multi-replica |
| File storage | 4 hours | 24 hours | Periodic rsync/S3 sync |
| Full system | 4 hours | 24 hours | Infrastructure-as-code |

---

## 6. Disaster Scenarios

| Scenario | Impact | Recovery Action | Estimated Downtime |
|----------|--------|----------------|-------------------|
| Database corruption | Data loss | Restore latest verified backup | 30-60 min |
| Application crash | Service down | Auto-restart (Railway) | 1-5 min |
| Region failure | Full outage | Deploy to secondary region | 1-4 hours |
| Credential leak | Security incident | Rotate keys, audit logs | 1-2 hours |
| Ransomware | Data encrypted | Restore from offline backup | 2-8 hours |

---

## 7. Recovery Testing Schedule

| Test Type | Frequency | Success Criteria |
|-----------|-----------|-----------------|
| Backup integrity check | Daily | Archive validates |
| Restore to staging | Weekly | Application boots, queries return data |
| Full DR exercise | Quarterly | Complete failover and recovery within RTO |
