import os
import psycopg
from dotenv import load_dotenv
from langgraph.checkpoint.postgres import PostgresSaver

load_dotenv()

database_url = os.getenv("DATABASE_URL")
assert database_url is not None

conn = psycopg.connect(
    database_url,
    autocommit=True,
)

print("✅ Connected")

checkpointer = PostgresSaver(conn)

print("✅ Checkpointer created")

checkpointer.setup()

print("✅ Setup completed")

with conn.cursor() as cur:
    cur.execute("SELECT 1")
    print(cur.fetchone())