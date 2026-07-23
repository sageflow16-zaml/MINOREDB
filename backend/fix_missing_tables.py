"""Create missing tables for Brain, Agents, etc."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ['DOTENV_PATH'] = '.env'

from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.schema import CreateTable
from src.core.config import settings
import src.brain.models
import src.agents.models

engine = create_engine(settings.DATABASE_URL)
inspector = __import__('sqlalchemy', fromlist=['inspect']).inspect(engine)

# Check which tables exist
brain_tables = [t for t in src.brain.models.BrainBase.metadata.sorted_tables]
agent_tables = [t for t in src.agents.models.AgentBase.metadata.sorted_tables]

missing = []
for t in brain_tables + agent_tables:
    if not inspector.has_table(t.name):
        missing.append(t)

if not missing:
    print('OK - all tables already exist')
else:
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Disable FK checks for creation
            conn.execute(__import__('sqlalchemy', fromlist=['text']).text('SET session_replication_role = replica'))
            for t in missing:
                try:
                    t.create(bind=conn, checkfirst=True)
                    print(f'  Created: {t.name}')
                except Exception as inner:
                    print(f'  Skipped {t.name}: {inner}')
            conn.execute(__import__('sqlalchemy', fromlist=['text']).text('SET session_replication_role = DEFAULT'))
            trans.commit()
            print('OK')
        except Exception as e:
            trans.rollback()
            print(f'Error: {e}')
