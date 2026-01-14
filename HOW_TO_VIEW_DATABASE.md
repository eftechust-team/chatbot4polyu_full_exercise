# How to View Your Database

You have several easy ways to view the saved meal and exercise data!

---

## 🚀 Method 1: Interactive Python Viewer (Recommended)

**Use the built-in viewer script:**

```bash
python view_database.py
```

This interactive tool shows:
- ✅ All participants
- ✅ Meal records with details
- ✅ Exercise records organized by date
- ✅ Daily summaries
- ✅ Statistics (counts, breakdowns)
- ✅ Export data to JSON

**Features:**
- Beautiful formatted output
- Easy navigation menu
- Filter by participant
- Export capability

---

## 📊 Method 2: SQLite Command Line

### View Tables
```bash
sqlite3 chatbot_data.db ".tables"
```

### View All Meals
```bash
sqlite3 chatbot_data.db "SELECT * FROM meal_records;"
```

### View All Exercises
```bash
sqlite3 chatbot_data.db "SELECT * FROM exercise_records;"
```

### View Specific Participant's Data
```bash
# Meals for participant 001
sqlite3 chatbot_data.db "SELECT meal_type, meal_time, location FROM meal_records WHERE participant_id='001';"

# Exercises for participant 001
sqlite3 chatbot_data.db "SELECT exercise_type, intensity, time_slot FROM exercise_records WHERE participant_id='001';"
```

### Use Pre-made Queries
```bash
sqlite3 chatbot_data.db < view_queries.sql
```

This runs a comprehensive report showing:
- All participants
- Recent meals and exercises
- Statistics by type
- Daily summaries

---

## 🐍 Method 3: Python Script

Create a simple Python script to query data:

```python
from app import app, MealRecord, ExerciseRecord

with app.app_context():
    # Get all meals
    meals = MealRecord.query.all()
    for meal in meals:
        print(f"{meal.participant_id}: {meal.meal_type} at {meal.meal_time}")
    
    # Get meals for specific participant
    my_meals = MealRecord.query.filter_by(participant_id='001').all()
    print(f"\nFound {len(my_meals)} meals for participant 001")
    
    # Get exercises
    exercises = ExerciseRecord.query.all()
    for ex in exercises:
        print(f"{ex.participant_id}: {ex.exercise_type} ({ex.intensity})")
```

---

## 🌐 Method 4: Through API Endpoints

**Start the Flask app:**
```bash
python app.py
```

**Then query via HTTP:**

```bash
# Get meals for participant 001
curl http://localhost:5000/api/meals/001

# Get exercises for participant 001
curl http://localhost:5000/api/exercises/001
```

Or open in browser:
- http://localhost:5000/api/meals/001
- http://localhost:5000/api/exercises/001

---

## 🖥️ Method 5: Database GUI Tools

### Option A: DB Browser for SQLite (Free)
1. Download from: https://sqlitebrowser.org/
2. Open `chatbot_data.db`
3. Browse tables visually

### Option B: Online SQLite Viewer
1. Go to: https://sqliteviewer.app/
2. Upload `chatbot_data.db`
3. View tables in browser

### Option C: VSCode Extension
1. Install "SQLite Viewer" extension in VSCode
2. Right-click `chatbot_data.db`
3. Select "Open Database"

---

## 📋 Quick Reference Queries

### Count Records
```sql
-- Total meals
SELECT COUNT(*) FROM meal_records;

-- Total exercises
SELECT COUNT(*) FROM exercise_records;

-- Meals per participant
SELECT participant_id, COUNT(*) as count 
FROM meal_records 
GROUP BY participant_id;
```

### View Recent Records
```sql
-- Last 5 meals
SELECT meal_type, meal_time, participant_id, created_at 
FROM meal_records 
ORDER BY created_at DESC 
LIMIT 5;

-- Last 5 exercises
SELECT exercise_type, time_slot, participant_id, created_at 
FROM exercise_records 
ORDER BY created_at DESC 
LIMIT 5;
```

### Search Records
```sql
-- Find all breakfast records
SELECT * FROM meal_records WHERE meal_type = '早餐';

-- Find all running exercises
SELECT * FROM exercise_records WHERE exercise_type = '跑步';

-- Find meals on workday1
SELECT * FROM meal_records WHERE record_date = 'workday1';
```

### Statistics
```sql
-- Meal types breakdown
SELECT meal_type, COUNT(*) as count 
FROM meal_records 
GROUP BY meal_type 
ORDER BY count DESC;

-- Exercise types breakdown
SELECT exercise_type, COUNT(*) as count 
FROM exercise_records 
GROUP BY exercise_type 
ORDER BY count DESC;

-- Records per date
SELECT record_date, COUNT(*) as count 
FROM meal_records 
GROUP BY record_date;
```

---

## 💾 Export Data

### Export to JSON (Python)
```python
from app import app, MealRecord
import json

with app.app_context():
    meals = MealRecord.query.filter_by(participant_id='001').all()
    data = [meal.to_dict() for meal in meals]
    
    with open('meals_export.json', 'w') as f:
        json.dump(data, f, indent=2, default=str)
```

### Export to CSV (SQLite)
```bash
sqlite3 chatbot_data.db <<EOF
.mode csv
.headers on
.output meals_export.csv
SELECT * FROM meal_records;
.quit
EOF
```

### Export Using Python Viewer
```bash
python view_database.py
# Select option 6, enter participant ID
```

---

## 🔍 Troubleshooting

### "Database not found"
**Problem**: `chatbot_data.db` doesn't exist yet

**Solution**: Run the app first to create the database
```bash
python app.py
# Submit at least one meal or exercise
```

### "No records found"
**Problem**: Database is empty

**Solution**: 
1. Start Flask app: `python app.py`
2. Open http://localhost:5000
3. Fill form with participant ID
4. Submit a meal or exercise

### "sqlite3 not found"
**Problem**: SQLite command not available

**Solution**: Use Python viewer instead:
```bash
python view_database.py
```

---

## 📊 Example Session

```bash
# 1. View all data interactively
python view_database.py

# 2. Quick SQL overview
sqlite3 chatbot_data.db < view_queries.sql

# 3. Count records
sqlite3 chatbot_data.db "SELECT COUNT(*) FROM meal_records;"

# 4. Export specific participant
python view_database.py  # Then select option 6

# 5. View through API
python app.py  # In another terminal:
curl http://localhost:5000/api/meals/001 | python -m json.tool
```

---

## 🎯 Quick Commands

```bash
# See all tables
sqlite3 chatbot_data.db ".tables"

# See table structure
sqlite3 chatbot_data.db ".schema meal_records"

# Count meals
sqlite3 chatbot_data.db "SELECT COUNT(*) FROM meal_records;"

# See participants
sqlite3 chatbot_data.db "SELECT DISTINCT participant_id FROM meal_records;"

# Interactive viewer
python view_database.py

# Run pre-made queries
sqlite3 chatbot_data.db < view_queries.sql
```

---

## 💡 Best Practices

1. **Use Python Viewer for exploration**
   ```bash
   python view_database.py
   ```

2. **Use SQL for specific queries**
   ```bash
   sqlite3 chatbot_data.db "SELECT ..."
   ```

3. **Use API for integration**
   ```bash
   curl http://localhost:5000/api/meals/001
   ```

4. **Use GUI tools for visual browsing**
   - DB Browser for SQLite
   - VSCode extension

---

## 📁 Created Tools

- **view_database.py** - Interactive Python viewer
- **view_queries.sql** - Pre-made SQL queries
- **HOW_TO_VIEW_DATABASE.md** - This guide

---

**Quick Start:**
```bash
python view_database.py
```

This is the easiest way to see all your data! 🎉
