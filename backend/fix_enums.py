"""Fix PostgreSQL enum types to use lowercase values."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
os.environ['DOTENV_PATH'] = '.env'
from src.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    trans = conn.begin()
    try:
        conn.execute(text('DROP TYPE IF EXISTS experimentstatus CASCADE'))
        conn.execute(text("CREATE TYPE experimentstatus AS ENUM ('draft', 'running', 'completed', 'failed', 'archived')"))
        conn.execute(text('DROP TYPE IF EXISTS backteststatus CASCADE'))
        conn.execute(text("CREATE TYPE backteststatus AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled')"))
        conn.execute(text('DROP TYPE IF EXISTS hypothesisstatus CASCADE'))
        conn.execute(text("CREATE TYPE hypothesisstatus AS ENUM ('proposed', 'testing', 'supported', 'rejected', 'inconclusive')"))
        trans.commit()
        print('OK')
    except Exception as e:
        trans.rollback()
        print(f'Error: {e}')
