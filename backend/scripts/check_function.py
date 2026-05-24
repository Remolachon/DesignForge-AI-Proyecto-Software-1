import os
import sys
import sqlalchemy
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.database import SessionLocal

db = SessionLocal()
result = db.execute(sqlalchemy.text("""
    SELECT prosrc 
    FROM pg_proc 
    WHERE proname = 'assign_funcionario_adm_on_company_create';
"""))
print("--- FUNCTION DEF ---")
for row in result:
    print(row[0])
