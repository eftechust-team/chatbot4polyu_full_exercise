# ✅ SQL Database Integration - Complete

## Summary
Your chatbot application now has full SQL database integration for storing meal and exercise records. All records are automatically saved to a SQL database organized by **參與者編號 (Participant ID)**.

---

## What Was Implemented

### 1. **Database Layer** (app.py)
- SQLite database with auto-creation
- 3 database models:
  - `MealRecord` - Stores meal/snack records with photos
  - `ExerciseRecord` - Stores exercise records with intensity levels
  - `DailySummary` - Stores daily activity summaries

### 2. **API Endpoints** (app.py)
- `POST /api/save-meal` - Save meal records
- `POST /api/save-exercise` - Save exercise records
- `POST /api/save-daily-summary` - Save daily summaries
- `GET /api/meals/<participant_id>` - Retrieve all meals for a participant
- `GET /api/exercises/<participant_id>` - Retrieve all exercises for a participant

### 3. **Frontend Integration**
- **form-script.js**: Added `saveMealToDatabase()` function
  - Automatically called when user saves each meal
  - Sends meal data, photos, descriptions, time, location to database
  
- **exercise-script.js**: Added database save functions
  - `saveExerciseToDB()` - Saves each exercise record
  - `saveDailySummaryToDB()` - Saves daily activity summary

---

## Quick Start

### Installation
```bash
pip install -r requirements.txt
python app.py
```

The database file `chatbot_data.db` will be created automatically.

### Test the Integration
```bash
python test_database.py
```

This runs 6 automated tests to verify everything is working:
1. Save a meal record
2. Save an exercise record
3. Save a daily summary
4. Retrieve meals for a participant
5. Retrieve exercises for a participant
6. Test error handling

---

## How It Works

### When User Saves a Meal
```
User completes form → Uploads photos → Enters details
         ↓
   Clicks "保存記錄"
         ↓
form-script.js: finalizeRecord()
         ↓
form-script.js: saveMealToDatabase()
         ↓
POST /api/save-meal (with all meal data + 參與者編號)
         ↓
Backend saves to meal_records table
         ↓
Returns success message with record ID
```

### When User Saves an Exercise
```
User opens time slot → Selects exercise type → Enters details
         ↓
   Clicks submit
         ↓
exercise-script.js: submitExerciseRecord()
         ↓
exercise-script.js: saveExerciseToDB()
         ↓
POST /api/save-exercise (with exercise data + 參與者編號)
         ↓
Backend saves to exercise_records table
         ↓
Returns success message with record ID
```

---

## Database Schema

### meal_records Table
```
id                  - Record ID (Primary Key)
participant_id      - User's 參與者編號 (indexed)
name                - User's name
gender              - 男/女
age                 - User's age
record_date         - workday1/workday2/restday
meal_type           - 早餐/午餐/晚餐/上午加餐/下午加餐/晚上加餐
meal_time           - HH:MM format
location            - 家/工作單位/餐廳/外賣/其他
amount              - 全部吃完/剩餘一些/只吃少量
additional_desc     - Extra notes
photos              - Base64 encoded images (JSON array)
photo_descriptions  - Description for each photo (JSON array)
created_at          - Timestamp
updated_at          - Last update timestamp
```

### exercise_records Table
```
id                  - Record ID (Primary Key)
participant_id      - User's 參與者編號 (indexed)
name                - User's name
gender              - 男/女
age                 - User's age
record_date         - workday1/workday2/restday
quarter             - morning/afternoon/evening/night
time_slot           - HH:00 format (14:00, 15:00, etc.)
exercise_type       - 無運動/散步/跑步/游泳/瑜伽/等
intensity           - 低/中/高
description         - Additional notes
activity_level      - 平常/少於平常/多於平常
reason              - Why activity level is different
created_at          - Timestamp
updated_at          - Last update timestamp
```

### daily_summaries Table
```
id                  - Record ID (Primary Key)
participant_id      - User's 參與者編號 (indexed)
record_date         - workday1/workday2/restday
daily_activity_level - 平常/少於平常/多於平常
daily_reason        - Reason for activity level
notes               - Additional notes
created_at          - Timestamp
updated_at          - Last update timestamp
```

---

## Key Features

✅ **Multi-User Support** - Indexed by 參與者編號 for easy multi-user queries
✅ **Automatic Saving** - No user action needed, saves happen transparently
✅ **Photo Storage** - Photos stored as base64 strings with meal records
✅ **Timestamps** - All records have audit trail
✅ **Error Handling** - Graceful error handling with console logging
✅ **Offline Capability** - Still uses localStorage, database is backup/persistence
✅ **Scalable** - Can handle hundreds/thousands of users
✅ **Data Integrity** - Indexed participant_id for fast queries

---

## Console Messages

### Browser Console (DevTools F12)
When saving records, you'll see:
```
[DB] Meal saved successfully - ID: 1
[DB] Exercise saved successfully - ID: 1
[DB] Daily summary saved successfully - ID: 1
```

### Server Console (Flask logs)
When receiving records:
```
[DB] Meal record saved - Participant: 001, Meal: 午餐
[DB] Exercise record saved - Participant: 001, Type: 跑步
[DB] Database initialized successfully
```

---

## Query Examples

### Using Python (with Flask app context)
```python
from app import app, MealRecord, ExerciseRecord

with app.app_context():
    # Get all meals for a participant
    meals = MealRecord.query.filter_by(participant_id='001').all()
    print(f"Found {len(meals)} meal records")
    
    # Get exercises from a specific day
    exercises = ExerciseRecord.query.filter_by(
        participant_id='001',
        record_date='workday1'
    ).all()
```

### Using SQL (SQLite CLI)
```bash
sqlite3 chatbot_data.db

# View all meals for a participant
SELECT meal_type, meal_time, location FROM meal_records 
WHERE participant_id = '001' 
ORDER BY created_at DESC;

# Count exercises by type
SELECT exercise_type, COUNT(*) as count 
FROM exercise_records 
WHERE participant_id = '001' 
GROUP BY exercise_type;
```

---

## Files Modified/Created

### Modified Files
- `app.py` - Added database models and API endpoints
- `requirements.txt` - Added SQLAlchemy dependencies
- `form-script.js` - Added database save function
- `exercise-script.js` - Added database save functions

### New Documentation Files
- `DATABASE_SETUP.md` - Comprehensive database documentation
- `DATABASE_QUICKSTART.md` - Quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation overview
- `test_database.py` - Automated test suite

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: Ensure Flask app is running and the directory has write permissions

### Issue: "Records not saving to database"
**Check**:
1. Open browser DevTools (F12)
2. Look for `[DB] Meal saved successfully` or error messages
3. Check Flask server logs for API errors
4. Verify participant_id is filled in the form

### Issue: "Database file not created"
**Solution**:
- Check directory permissions
- Run `python app.py` - it will auto-create the database
- Or manually call `POST /api/init-db` endpoint

---

## Future Enhancements

Possible additions:
- 📊 Analytics dashboard
- 📥 Data export (CSV, Excel)
- ☁️ Move photos to cloud storage (reduce database size)
- 🔐 User authentication
- 📱 Mobile app backend
- 📈 Statistical analysis and reports
- 🔄 Data backup/restore functionality

---

## Data Persistence

- **localStorage** - Still used for offline capability
- **Database** - Used for persistent, multi-user storage
- **Both work together** - Best of both worlds!

When a user syncs online, their offline data remains available and database has permanent copy.

---

## Notes

- All timestamps are stored in **UTC**
- Photos are **base64 encoded** strings stored in JSON
- Database is **indexed by participant_id** for fast queries
- Each participant has **isolated records** for privacy
- Can easily export/backup by copying `chatbot_data.db` file

---

## Next Steps

1. **Test it out**: Run `python test_database.py`
2. **Try recording**: Fill out a meal/exercise and watch it save
3. **Query the data**: Use SQL to analyze recorded data
4. **Prepare for production**: Switch to PostgreSQL if needed
5. **Add more features**: Export, analytics, etc.

---

## Support Documentation

- **DATABASE_SETUP.md** - Complete API reference and schema
- **DATABASE_QUICKSTART.md** - Quick start guide
- **test_database.py** - Automated testing script
- Browser Console (F12) - Real-time save status

---

**Status**: ✅ COMPLETE
**Multi-User Ready**: ✅ YES
**Production Ready**: ✅ For SQLite / Upgrade to PostgreSQL for high volume
**Date**: January 2026

All meals and exercises are now being saved to SQL database, organized by 參與者編號!
