from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import sys
import os

# Ensure backend/ is in sys.path so "import src" resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.db.session import Base
from src.core.config import settings
import src.db.base

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_online():
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
