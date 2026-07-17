import psycopg2

try:
    conn = psycopg2.connect(dbname='minore', user='minore', password='minore')
    print('Connection successful')
    conn.close()
except Exception as e:
    print('Connection failed:', e)
