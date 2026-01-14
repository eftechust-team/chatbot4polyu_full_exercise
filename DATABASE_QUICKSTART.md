# Database Implementation - Quick Start Guide

## What Changed

Your application now has full SQL database integration for saving meal and exercise records. Here's what was added:

### 1. **Dependencies** (requirements.txt)
- Added `SQLAlchemy==2.0.23` - ORM framework
- Added `Flask-SQLAlchemy==3.1.1` - Flask integration for SQLAlchemy

### 2. **Database** (app.py)
- Added 3 database models:
  - `MealRecord` - Stores meal/snack records
  - `ExerciseRecord` - Stores exercise records
  - `DailySummary` - Stores daily activity summaries
  
- Added 6 API endpoints:
  - `POST /api/save-meal` - Save meal record
  - `GET /api/meals/<participant_id>` - Get all meals for a participant
  - `POST /api/save-exercise` - Save exercise record
  - `GET /api/exercises/<participant_id>` - Get all exercises for a participant
  - `POST /api/save-daily-summary` - Save/update daily summary
  - `POST /api/init-db` - Initialize database (optional)

### 3. **Frontend Changes**
- **form-script.js**: 
  - Added `saveMealToDatabase()` function
  - Automatically saves meal records to database when user clicks "保存記錄"
  
- **exercise-script.js**:
  - Added `saveExerciseToDB()` function
  - Added `saveDailySummaryToDB()` function
  - Automatically saves exercise records and daily summary to database

## Installation

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Run the application** (database will be created automatically):
```bash
python app.py
```

The database file `chatbot_data.db` will be created automatically in the root directory.

## How It Works

### Meals
- When user completes a meal record and clicks "保存記錄", the data is sent to `/api/save-meal`
- All meal data including photos (as base64) is saved to the database
- Records are organized by `參與者編號` (participant ID)
- User info (name, gender, age) is also saved with each record

### Exercises
- When user submits an exercise record in the time slot modal, it's sent to `/api/save-exercise`
- Exercise type, intensity, description are saved along with user info
- When user completes the day and clicks finish, the daily summary is sent to `/api/save-daily-summary`

## Data Storage

All records include:
- **participant_id** - The key identifier (參與者編號)
- **User info** - Name, gender, age
- **Timestamps** - When record was created/updated
- **Full details** - All meal/exercise information

Records are indexed by `participant_id` for fast queries across multiple users.

## Verification

To verify everything is working:

1. **Fill out and submit** a meal or exercise record
2. **Check browser console** (F12) for messages like:
   - `[DB] Meal saved successfully - ID: 1`
   - `[DB] Exercise saved successfully - ID: 1`

3. **Check server logs** for:
   - `[DB] Meal record saved - Participant: 001, Meal: 午餐`
   - `[DB] Exercise record saved - Participant: 001, Type: 跑步`

## Database Files

- **chatbot_data.db** - SQLite database file (created automatically)
- Contains 3 tables: meal_records, exercise_records, daily_summaries

## Queries

To view saved data (using any SQLite client):

```sql
-- All meals for a participant
SELECT * FROM meal_records WHERE participant_id = '001';

-- All exercises for a participant
SELECT * FROM exercise_records WHERE participant_id = '001';

-- All daily summaries for a participant
SELECT * FROM daily_summaries WHERE participant_id = '001';
```

## Data Still in LocalStorage

- Meal records are still stored in localStorage (in the `meal` variable)
- Exercise records are still stored in localStorage (in the `exerciseRecords` variable)
- Database storage is **in addition to** localStorage, providing:
  - Persistent storage across browser sessions
  - Multi-user support
  - Data backup
  - Historical analysis capabilities

## Troubleshooting

**Database not creating?**
- Ensure Flask app has write permissions in the directory
- Check Flask logs for errors

**Records not saving to database?**
- Check browser developer console (F12) for JavaScript errors
- Verify participant ID is filled in the form
- Check that `/api/save-meal` and `/api/save-exercise` are accessible

**Want to switch to PostgreSQL/MySQL?**
- See DATABASE_SETUP.md for detailed instructions

## Next Steps

- Each user's meals and exercises are now saved per their `參與者編號`
- You can build reports/analytics by querying the database
- Export functionality can be added to download records as CSV
- Consider moving photos to cloud storage if database size becomes large
