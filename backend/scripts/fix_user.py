import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.models.company import Company
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product

db = SessionLocal()
u = db.query(User).filter(User.email == 'dspn1121@gmail.com').first()
if u:
    print(f"Fixing user {u.email}")
    roles = db.query(UserRole).filter(UserRole.user_id == u.id).all()
    for r in roles:
        r.is_active = (r.role_id == 4)  # Make only funcionario_adm active
    db.commit()
    print("Fixed.")
