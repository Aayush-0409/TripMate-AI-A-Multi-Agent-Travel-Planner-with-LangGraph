import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

try:
    database_url = os.getenv("DATABASE_URL")

    if database_url is None:
        raise ValueError("DATABASE_URL not found")

    conn = psycopg.connect(
        database_url,
        connect_timeout=15,
    )

    print("✅ Connected")

    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        print(cur.fetchone())

    conn.close()

except Exception as e:
    print("❌", repr(e))