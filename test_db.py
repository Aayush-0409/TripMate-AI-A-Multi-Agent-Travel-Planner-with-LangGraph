import psycopg

DATABASE_URL = "postgresql://agentmemory_u13w:xfIuzRwduthto4q0qs58LVXkLa2HcCMI@dpg-d9hq6kbtqb8s738ofe20-a.virginia-postgres.render.com/agentmemory_u13w?sslmode=require"

try:
    conn = psycopg.connect(DATABASE_URL)
    print("✅ Connected successfully")
    conn.close()
except Exception as e:
    print(e)