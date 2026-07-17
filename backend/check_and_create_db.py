import psycopg2
from psycopg2 import sql

def create_role_and_databases():
    try:
        # Connect to PostgreSQL as the postgres user
        conn = psycopg2.connect(dbname='postgres', user='postgres', password='Lgzn3850')
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if the role 'minore' exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname='minore'")
        if not cursor.fetchone():
            cursor.execute("CREATE ROLE minore WITH LOGIN PASSWORD 'minore'")
            print("Role 'minore' created.")

        # Check if the database 'minore' exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='minore'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE minore OWNER minore")
            print("Database 'minore' created.")

        # Check if the database 'minore_test' exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='minore_test'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE minore_test OWNER minore")
            print("Database 'minore_test' created.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_role_and_databases()
