import os
import sys
import sqlalchemy
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.database import SessionLocal

db = SessionLocal()
result = db.execute(sqlalchemy.text("""
    SELECT pg_get_triggerdef(oid) 
    FROM pg_trigger 
    WHERE tgname = 'trg_assign_funcionario_adm' OR tgrelid = 'companies'::regclass;
"""))
print("--- TRIGGERS on companies ---")
for row in result:
    print(row[0])
