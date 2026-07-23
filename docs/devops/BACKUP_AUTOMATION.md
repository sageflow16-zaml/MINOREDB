# Backup Automation

## Database Backup Script

Location: `backend/scripts/backup_db.py`

### Usage

```bash
# Manual backup to default directory
python backend/scripts/backup_db.py

# Backup to custom path
python backend/scripts/backup_db.py --output /backups/minore

# Backup with custom database URL
python backend/scripts/backup_db.py --db-url postgresql://user:pass@host:5432/minore

# Rotate backups (keep last 30)
python backend/scripts/backup_db.py --keep 30
```

### Backup Features

- Creates timestamped `.sql.gz` dumps
- Optionally encrypts with GPG
- Rotates old backups (configurable retention)
- Sends notification on failure
- Logs all backup operations to structured logger

### Cron Schedule (Linux)

```cron
# Daily at 2 AM — full database backup
0 2 * * * cd /opt/minore && python backend/scripts/backup_db.py --keep 30 >> /var/log/minore-backup.log 2>&1

# Weekly at 3 AM Sunday — encrypted offsite backup
0 3 * * 0 cd /opt/minore && python backend/scripts/backup_db.py --encrypt --output /backups/offsite >> /var/log/minore-backup.log 2>&1
```

## Backup Storage

| Tier | Location | Retention | Frequency |
|------|----------|-----------|-----------|
| Local | `/backups/minore/` | 30 days | Daily |
| Offsite | S3 / S3-compatible | 90 days | Weekly |
| Archive | Glacier / Cold storage | 1 year | Monthly |

## Restore Procedure

### From Local Backup

```bash
# List available backups
ls -lh /backups/minore/

# Restore latest backup
gunzip < /backups/minore/minore_20260720_020000.sql.gz | psql -U minore -d minore

# Restore specific backup
python backend/scripts/restore_db.py --backup /backups/minore/minore_20260720_020000.sql.gz
```

### Point-in-Time Recovery (if WAL archiving enabled)

```bash
# Restore to specific timestamp
python backend/scripts/restore_db.py --pitr "2026-07-20 01:30:00 UTC"
```

### Rollback Migration

```bash
# If data is consistent but schema needs rollback
alembic downgrade -1
```

## Disaster Recovery

See [BACKUP_RECOVERY.md](../security/BACKUP_RECOVERY.md) for the complete disaster recovery plan.
