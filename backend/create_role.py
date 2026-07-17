import psycopg

conn = psycopg.connect(dbname='postgres', user='postgres', password='Lgzn3850', host='localhost')
conn.autocommit = True
cur = conn.cursor()

cur.execute("SELECT rolname FROM pg_roles WHERE rolname='minore'")
r = cur.fetchone()
if r is None:
    cur.execute("CREATE ROLE minore WITH LOGIN PASSWORD 'minore'")
    print('Created role minore')
else:
    print('Role minore already exists')

cur.close()
conn.close()