import psycopg

conn = psycopg.connect(dbname='postgres', user='postgres', password='Lgzn3850', host='localhost')
cur = conn.cursor()

cur.execute("SELECT rolname FROM pg_roles WHERE rolname='minore'")
r = cur.fetchone()
print('minore role exists:', r is not None)

cur.execute("SELECT datname FROM pg_database WHERE datname='minore'")
r = cur.fetchone()
print('minore db exists:', r is not None)

cur.execute("SELECT datname FROM pg_database WHERE datname='minore_test'")
r = cur.fetchone()
print('minore_test db exists:', r is not None)

cur.close()
conn.close()