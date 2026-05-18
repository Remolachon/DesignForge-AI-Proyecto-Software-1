#!/usr/bin/env python3
"""
Script de prueba para verificar el flujo completo de crear un orden desde el marketplace.
Prueba:
1. Schema validation
2. Order creation with attributes
3. Asset copying
4. Transaction creation
5. Payment URL generation
"""

import os
import sys
import asyncio
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.models import *
from app.services.order_service import OrderService
from app.schemas.order_schema import CreateMarketplaceOrderRequest
from app.providers.supabase_provider import supabase_admin

def test_schema_validation():
    """Test que el schema de validación funciona correctamente"""
    print("\n=== TEST 1: Schema Validation ===")
    try:
        # This should work
        data = CreateMarketplaceOrderRequest(
            product_id=1,
            quantity=1,
            attributes={"color": "red", "size": "large"}
        )
        print("✓ Schema validation works correctly")
        print(f"  - product_id: {data.product_id}")
        print(f"  - quantity: {data.quantity}")
        print(f"  - attributes: {data.attributes}")
        return True
    except Exception as e:
        print(f"✗ Schema validation failed: {e}")
        return False

def test_marketplace_order_creation():
    """Test la creación de una orden del marketplace"""
    print("\n=== TEST 2: Marketplace Order Creation ===")
    db = SessionLocal()
    try:
        # Get a test product (product_id=19 like in the error)
        product = db.query(Product).filter(Product.id == 19).first()
        if not product:
            print(f"✗ Product 19 not found in database")
            return False
        
        print(f"✓ Found product: {product.name}")
        print(f"  - Product Type ID: {product.product_type_id}")
        print(f"  - Is Active: {product.is_active}")
        print(f"  - Is Public: {product.is_public}")
        print(f"  - Base Price: {product.base_price}")
        
        # Check if product has assets
        assets = db.query(FileAsset).filter(
            FileAsset.product_id == product.id,
            FileAsset.is_active == True,
        ).all()
        
        if not assets:
            print(f"✗ Product has no active assets")
            return False
        
        print(f"✓ Product has {len(assets)} active assets")
        for asset in assets:
            print(f"  - Asset: {asset.storage_path}")
        
        # Get a test user
        user = db.query(User).first()
        if not user:
            print(f"✗ No users found in database")
            return False
        
        print(f"✓ Found user: {user.email}")
        
        # Create request data
        request_data = CreateMarketplaceOrderRequest(
            product_id=19,
            quantity=1,
            attributes={}
        )
        
        # Try to create the order
        print(f"\nCreating marketplace order...")
        order = OrderService.create_marketplace_order(
            db=db,
            user_id=user.id,
            data=request_data
        )
        
        print(f"✓ Order created successfully")
        print(f"  - Order ID: {order.id}")
        print(f"  - Total Amount: {order.total_amount}")
        print(f"  - Created At: {order.created_at}")
        
        # Verify order items
        if not order.items or len(order.items) == 0:
            print(f"✗ Order has no items")
            return False
        
        item = order.items[0]
        print(f"✓ Order has {len(order.items)} item(s)")
        print(f"  - Product ID: {item.product_id}")
        print(f"  - Quantity: {item.quantity}")
        print(f"  - Unit Price: {item.unit_price}")
        print(f"  - Total Price: {item.total_price}")
        
        # Check assets were copied
        order_assets = db.query(FileAsset).filter(
            FileAsset.order_item_id == item.id,
            FileAsset.is_active == True,
        ).all()
        
        print(f"✓ Order has {len(order_assets)} asset(s)")
        for asset in order_assets:
            print(f"  - Asset bucket: {asset.bucket_name}")
            print(f"  - Asset path: {asset.storage_path}")
        
        # Check transaction was created
        from app.models.transaction import Transaction
        transaction = db.query(Transaction).filter(
            Transaction.order_id == order.id
        ).first()
        
        if not transaction:
            print(f"✗ Transaction not created")
            return False
        
        print(f"✓ Transaction created")
        print(f"  - Transaction ID: {transaction.id}")
        print(f"  - Amount: {transaction.amount}")
        print(f"  - Status: {transaction.status}")
        print(f"  - Payment Method: {transaction.payment_method}")
        
        return True
        
    except Exception as e:
        print(f"✗ Order creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_payment_url_generation():
    """Test la generación de URL de pago"""
    print("\n=== TEST 3: Payment URL Generation ===")
    db = SessionLocal()
    try:
        # Get the most recent order
        order = db.query(Order).order_by(Order.id.desc()).first()
        if not order:
            print(f"✗ No orders found in database")
            return False
        
        print(f"✓ Found order: {order.id}")
        
        # Try to generate payment URL
        payment_result = OrderService.generate_payment_url(db, order.id)
        
        if payment_result.get("status") == "error":
            print(f"✗ Payment URL generation failed: {payment_result.get('error')}")
            return False
        
        print(f"✓ Payment URL generated successfully")
        if payment_result.get("payment_url"):
            print(f"  - Payment URL: {payment_result['payment_url'][:80]}...")
        if payment_result.get("payment_reference"):
            print(f"  - Payment Reference: {payment_result['payment_reference']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Payment URL generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """Run all tests"""
    print("=" * 60)
    print("MARKETPLACE ORDER FLOW TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Schema Validation", test_schema_validation()))
    results.append(("Order Creation", test_marketplace_order_creation()))
    results.append(("Payment URL", test_payment_url_generation()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
