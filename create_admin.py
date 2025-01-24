from app import create_app
from models import db, User
from datetime import datetime

def create_admin_user():
    """Create admin user if it doesn't exist"""
    app = create_app()
    
    if not app:
        print("Failed to create application")
        return
        
    with app.app_context():
        try:
            # Check if admin exists
            admin = User.query.filter_by(email='festusa@cnbs.co.za').first()
            
            if not admin:
                # Create new admin user
                admin = User(
                    username='Admin',
                    email='festusa@cnbs.co.za',
                    is_admin=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    subscription_status='active'
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                print("Admin user created successfully")
            else:
                # Update existing admin
                admin.set_password('admin123')
                admin.is_admin = True
                admin.subscription_status = 'active'
                db.session.commit()
                print("Admin user updated successfully")
                
        except Exception as e:
            print(f"Error creating/updating admin user: {str(e)}")
            if db.session:
                db.session.rollback()
            raise

if __name__ == '__main__':
    create_admin_user()