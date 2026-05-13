import sys
sys.path.insert(0, '.')
from app.database.database import engine
from sqlalchemy import inspect

insp = inspect(engine)
columns = insp.get_columns('file_assets')
for c in columns:
    print(f"{c['name']}: {c['type']}")
