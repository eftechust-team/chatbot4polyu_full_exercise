#!/usr/bin/env python3
"""
Initialize the database - create all tables
"""

from app import app, db

def init_database():
    """Create all database tables"""
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database initialized successfully!")
            print("   Tables created:")
            print("   - meal_records")
            print("   - exercise_records")
            print("   - daily_summaries")
            print("\n📍 Database file: chatbot_data.db")
            print("\n💡 Now you can:")
            print("   1. Submit records through the web form")
            print("   2. Run: python view_database.py")
            print("   3. Run: python test_database.py")
        except Exception as e:
            print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    init_database()
