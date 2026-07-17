import psycopg

conn = psycopg.connect(dbname='minore_test', user='postgres', password='Lgzn3850', host='localhost')
conn.autocommit = True
cur = conn.cursor()
cur.execute('GRANT USAGE ON SCHEMA public TO minore')
cur.execute('GRANT CREATE ON SCHEMA public TO minore')
cur.execute("GRANT ALL PRIVILEGES ON DATABASE minore_test TO minore")
print('Privileges granted successfully')
cur.close()
conn.close()