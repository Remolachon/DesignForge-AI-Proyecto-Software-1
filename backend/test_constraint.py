from app.database.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname = 'ck_single_owner'));")).fetchone()
print(res[0])
