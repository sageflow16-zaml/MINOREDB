import psycopg

# Test connection as minore user to minore db
conn = psycopg.connect(dbname='minore', user='minore', password='minore', host='localhost')
cur = conn.cursor()
cur.execute("SELECT current_user, current_database()")
r = cur.fetchone()
print(f'Connected as: {r[0]}, database: {r[1]}')
cur.close()
conn.close()

# Test connection as minore user to minore_test db
conn = psycopg.connect(dbname='minore_test', user='minore', password='minore', host='localhost')
cur = conn.cursor()
cur.execute("SELECT current_user, current_database()")
r = cur.fetchone()
print(f'Connected as: {r[0]}, database: {r[1]}')
cur.close()
conn.close()

print('All connections successful')