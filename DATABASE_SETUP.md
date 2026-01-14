# Database Setup Guide - Chatbot with Exercise Tracking

## Overview
The application now saves all meal and exercise records to a SQL database, organized by `參與者編號` (Participant ID). This allows for scalable multi-user data management.

## Database Architecture

### Database Type
- **SQLite** (default, for development/testing)
- Can be easily switched to PostgreSQL or MySQL for production by changing `SQLALCHEMY_DATABASE_URI` in `app.py`

### Database Location
- **File**: `chatbot_data.db` (created automatically in the root directory)

## Database Tables

### 1. meal_records
Stores individual meal/snack records for each participant.

**Columns:**
- `id` (Integer, Primary Key)
- `participant_id` (String, Indexed) - 參與者編號
- `name` (String) - User's name
- `gender` (String) - 男/女
- `age` (Integer) - User's age
- `record_date` (String) - workday1, workday2, or restday
- `meal_type` (String) - 早餐, 午餐, 晚餐, 上午加餐, 下午加餐, 晚上加餐
- `meal_time` (String) - HH:MM format (e.g., "12:30")
- `location` (String) - 家, 工作單位, 餐廳/外賣, 其他
- `amount` (String) - 全部吃完, 剩餘一些, 只吃少量
- `additional_desc` (Text) - Additional description/notes
- `photos` (JSON) - Array of base64 encoded images
- `photo_descriptions` (JSON) - Array of descriptions for each photo
- `created_at` (DateTime) - Record creation timestamp
- `updated_at` (DateTime) - Last update timestamp

### 2. exercise_records
Stores individual exercise records for each time slot and participant.

**Columns:**
- `id` (Integer, Primary Key)
- `participant_id` (String, Indexed) - 參與者編號
- `name` (String) - User's name
- `gender` (String) - 男/女
- `age` (Integer) - User's age
- `record_date` (String) - workday1, workday2, or restday
- `quarter` (String) - morning, afternoon, evening, night
- `time_slot` (String) - HH:00 format (e.g., "14:00")
- `exercise_type` (String) - 無運動, 散步, 跑步, 騎單車, 游泳, 瑜伽, 健身房, 球類運動, 其他
- `intensity` (String) - 低, 中, 高 (or 未指定 for no exercise)
- `description` (Text) - Additional notes
- `activity_level` (String) - 平常, 少於平常, 多於平常
- `reason` (String) - Reason if activity_level differs from 平常
- `created_at` (DateTime) - Record creation timestamp
- `updated_at` (DateTime) - Last update timestamp

### 3. daily_summaries
Stores daily activity summaries for exercise records.

**Columns:**
- `id` (Integer, Primary Key)
- `participant_id` (String, Indexed) - 參與者編號
- `record_date` (String) - workday1, workday2, or restday
- `daily_activity_level` (String) - 平常, 少於平常, 多於平常
- `daily_reason` (String) - Reason for activity level change
- `notes` (Text) - Additional notes
- `created_at` (DateTime) - Record creation timestamp
- `updated_at` (DateTime) - Last update timestamp

## API Endpoints

### Meal Records

#### Save Meal Record
```
POST /api/save-meal
```
**Request Body:**
```json
{
  "participant_id": "001",
  "name": "John Doe",
  "gender": "male",
  "age": 25,
  "record_date": "workday1",
  "meal_type": "午餐",
  "meal_time": "12:30",
  "location": "餐廳/外賣",
  "amount": "全部吃完",
  "additional_desc": "Tasty lunch",
  "photos": ["base64_encoded_image_1", "base64_encoded_image_2"],
  "photo_descriptions": ["Main dish", "Side dish"]
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "message": "飲食記錄已保存"
}
```

#### Get Participant's Meal Records
```
GET /api/meals/<participant_id>
```
**Response:**
```json
{
  "success": true,
  "count": 5,
  "records": [
    {
      "id": 1,
      "participant_id": "001",
      "name": "John Doe",
      "meal_type": "午餐",
      ...
    }
  ]
}
```

### Exercise Records

#### Save Exercise Record
```
POST /api/save-exercise
```
**Request Body:**
```json
{
  "participant_id": "001",
  "name": "John Doe",
  "gender": "male",
  "age": 25,
  "record_date": "workday1",
  "quarter": "afternoon",
  "time_slot": "14:00",
  "exercise_type": "跑步",
  "intensity": "中",
  "description": "30 minutes jogging",
  "activity_level": "平常",
  "reason": ""
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "message": "運動記錄已保存"
}
```

#### Get Participant's Exercise Records
```
GET /api/exercises/<participant_id>
```
**Response:**
```json
{
  "success": true,
  "count": 10,
  "records": [
    {
      "id": 1,
      "participant_id": "001",
      "exercise_type": "跑步",
      ...
    }
  ]
}
```

### Daily Summaries

#### Save/Update Daily Summary
```
POST /api/save-daily-summary
```
**Request Body:**
```json
{
  "participant_id": "001",
  "record_date": "workday1",
  "daily_activity_level": "多於平常",
  "daily_reason": "Extra exercise today",
  "notes": "Felt energetic"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "message": "每日摘要已保存"
}
```

## Automatic Database Initialization

The database tables are created automatically when:
1. The Flask application starts (if tables don't exist)
2. You make a POST request to `/api/init-db` (optional manual initialization)

## Data Flow

### When User Saves a Meal:
1. User completes meal record in form (with photos, time, location, etc.)
2. Clicks "保存記錄" button
3. `finalizeRecord()` is called in form-script.js
4. `saveMealToDatabase()` function sends data to `/api/save-meal` endpoint
5. Backend saves record to `meal_records` table with participant_id as key
6. Frontend shows success message
7. Data is also kept in localStorage for offline capability

### When User Saves an Exercise:
1. User enters exercise details in modal
2. Clicks submit
3. `submitExerciseRecord()` is called in exercise-script.js
4. `saveExerciseToDB()` function sends data to `/api/save-exercise` endpoint
5. Backend saves record to `exercise_records` table with participant_id as key
6. Frontend updates UI
7. Data is also saved to localStorage

### When User Completes Daily Exercise Record:
1. User fills in daily activity level and reason
2. Clicks "完成" button
3. `finishExerciseRecord()` is called
4. `saveDailySummaryToDB()` function sends data to `/api/save-daily-summary` endpoint
5. Backend saves/updates summary in `daily_summaries` table
6. Frontend shows completion message

## Key Features

✅ **Participant-based organization** - All records indexed by 參與者編號
✅ **Automatic timestamps** - created_at and updated_at recorded for audit trail
✅ **Photo storage** - Base64 encoded images stored with meal records
✅ **Offline capability** - localStorage used as fallback
✅ **Scalable** - Can handle multiple users simultaneously
✅ **Data integrity** - Indexed participant_id for fast queries

## Database Queries Examples

### Get all meals for a participant:
```sql
SELECT * FROM meal_records 
WHERE participant_id = '001' 
ORDER BY created_at DESC;
```

### Get exercises for a specific day:
```sql
SELECT * FROM exercise_records 
WHERE participant_id = '001' AND record_date = 'workday1' 
ORDER BY quarter, time_slot;
```

### Get participant's statistics:
```sql
SELECT 
  COUNT(*) as total_meals,
  COUNT(DISTINCT record_date) as days_recorded,
  SUM(CASE WHEN meal_type IN ('早餐', '午餐', '晚餐') THEN 1 ELSE 0 END) as main_meals
FROM meal_records 
WHERE participant_id = '001';
```

## Switching Database Systems

To use PostgreSQL instead of SQLite:

1. Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

2. Update `app.py`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost:5432/chatbot_db'
```

Similarly for MySQL:
```bash
pip install mysql-connector-python
```

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost:3306/chatbot_db'
```

## Troubleshooting

### Database file not created
- Ensure the app directory has write permissions
- Check Flask logs for errors
- Call `/api/init-db` endpoint to manually create tables

### Records not saving
- Check browser console for JavaScript errors
- Verify participant_id is filled in form
- Check Flask server logs for API errors
- Ensure network requests are successful (check Network tab in DevTools)

### Photos not saving
- Photos are stored as base64 strings - very large photos may cause issues
- Consider compressing images before upload
- If database size becomes too large, consider storing photos on cloud storage and saving URLs instead

## Future Enhancements

- Add data export functionality (CSV, Excel)
- Add analytics dashboard
- Implement data backup/restore
- Add user authentication
- Store photos in cloud storage (S3, Azure Blob)
- Add data validation rules
- Implement data encryption for sensitive fields
