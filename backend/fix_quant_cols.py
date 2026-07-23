"""Restore quant_research status columns dropped by CASCADE."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
os.environ['DOTENV_PATH'] = '.env'
from src.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    trans = conn.begin()
    try:
        conn.execute(text("ALTER TABLE quant_experiment ADD COLUMN status experimentstatus DEFAULT 'draft' NOT NULL"))
        conn.execute(text("ALTER TABLE quant_backtest_run ADD COLUMN status backteststatus DEFAULT 'pending' NOT NULL"))
        conn.execute(text("ALTER TABLE quant_simulation_run ADD COLUMN status backteststatus DEFAULT 'pending' NOT NULL"))
        conn.execute(text("ALTER TABLE quant_walk_forward_run ADD COLUMN status backteststatus DEFAULT 'pending' NOT NULL"))
        conn.execute(text("ALTER TABLE quant_optimization_run ADD COLUMN status backteststatus DEFAULT 'pending' NOT NULL"))
        conn.execute(text("ALTER TABLE quant_experiment ADD COLUMN hypothesis_status hypothesisstatus"))
        trans.commit()
        print('OK - columns restored')
    except Exception as e:
        trans.rollback()
        print(f'Error: {e}')
