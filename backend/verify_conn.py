import psycopg
conn = psycopg.connect(dbname='minore', user='minore', password='minore', host='localhost')
cur = conn.cursor()
cur.execute('SELECT 1')
print('PostgreSQL connection OK')
cur.close()
conn.close()