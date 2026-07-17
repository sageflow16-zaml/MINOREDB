# Set the password for PostgreSQL
minore="Lgzn3850"

# Check for role "minore"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT rolname FROM pg_roles WHERE rolname='minore';"

# Check for database "minore"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT datname FROM pg_database WHERE datname='minore';"

# Check for database "minore_test"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT datname FROM pg_database WHERE datname='minore_test';"
