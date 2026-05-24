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
roles = db.query(Role).all()
print("--- ROLES ---")
for r in roles:
    print(f"ID: {r.id}, Name: {r.name}")

print("\n--- RECENT USERS ---")
users = db.query(User).order_by(User.id.desc()).limit(3).all()
for u in users:
    print(f"User {u.id}: {u.email} (Company: {u.company_id})")
    user_roles = db.query(UserRole).filter(UserRole.user_id == u.id).all()
    for ur in user_roles:
        print(f"  Role ID {ur.role_id} (Active: {ur.is_active})")
