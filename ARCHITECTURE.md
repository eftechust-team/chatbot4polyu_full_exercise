# Database Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  form.html / exercise.html                               │   │
│  │  ├─ Form inputs (meal/exercise details)                  │   │
│  │  ├─ User info (參與者編號, name, age, gender)            │   │
│  │  └─ Submit buttons                                       │   │
│  └────────────┬─────────────────────────────────────────────┘   │
│               │                                                  │
│               ├─→ form-script.js                                │
│               │   └─→ saveMealToDatabase()                      │
│               │                                                  │
│               ├─→ exercise-script.js                            │
│               │   ├─→ saveExerciseToDB()                        │
│               │   └─→ saveDailySummaryToDB()                    │
│               │                                                  │
│               └─→ localStorage (offline backup)                 │
└────────────────┬──────────────────────────────────────────────┘
                 │ HTTP POST/GET
                 │ JSON data
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FLASK BACKEND                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Endpoints (app.py)                                  │   │
│  │  ├─ POST /api/save-meal                                  │   │
│  │  ├─ POST /api/save-exercise                              │   │
│  │  ├─ POST /api/save-daily-summary                         │   │
│  │  ├─ GET /api/meals/<participant_id>                      │   │
│  │  ├─ GET /api/exercises/<participant_id>                  │   │
│  │  └─ POST /api/init-db                                    │   │
│  └────────────┬─────────────────────────────────────────────┘   │
│               │                                                  │
│               ├─→ SQLAlchemy ORM                               │
│               │   ├─→ MealRecord model                          │
│               │   ├─→ ExerciseRecord model                      │
│               │   └─→ DailySummary model                        │
│               │                                                  │
│               └─→ Data Validation & Processing                 │
└────────────────┬──────────────────────────────────────────────┘
                 │ SQL Queries
                 │ Read/Write Operations
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SQL DATABASE                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SQLite: chatbot_data.db                                 │   │
│  │  (Can be PostgreSQL/MySQL for production)                │   │
│  │                                                          │   │
│  │  Tables:                                                 │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ meal_records                                       │  │   │
│  │  │ ├─ id (PK)                                         │  │   │
│  │  │ ├─ participant_id (FK/Indexed)  ◄─────┐           │  │   │
│  │  │ ├─ meal_type                           │           │  │   │
│  │  │ ├─ meal_time                           │           │  │   │
│  │  │ ├─ photos (JSON - Base64)              │           │  │   │
│  │  │ └─ created_at, updated_at              │           │  │   │
│  │  └────────────────────────────────────────┘           │  │   │
│  │                                                        │  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ exercise_records                                   │  │   │
│  │  │ ├─ id (PK)                                         │  │   │
│  │  │ ├─ participant_id (FK/Indexed)  ◄─────┤           │  │   │
│  │  │ ├─ exercise_type                       │           │  │   │
│  │  │ ├─ intensity                           │           │  │   │
│  │  │ ├─ quarter, time_slot                  │           │  │   │
│  │  │ └─ created_at, updated_at              │           │  │   │
│  │  └────────────────────────────────────────┘           │  │   │
│  │                                                        │  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ daily_summaries                                    │  │   │
│  │  │ ├─ id (PK)                                         │  │   │
│  │  │ ├─ participant_id (FK/Indexed)  ◄─────┘           │  │   │
│  │  │ ├─ daily_activity_level                           │  │   │
│  │  │ └─ created_at, updated_at                         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  All organized by participant_id for multi-user support  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Meal Recording Flow
```
                          USER INTERACTION
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │  Fill Meal Form      │
                    │  - Type              │
                    │  - Time              │
                    │  - Location          │
                    │  - Amount            │
                    │  - Photos (Base64)   │
                    └──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │  Click "保存記錄"    │
                    └──────────────────────┘
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
         ┌─────────────────────┐  ┌──────────────────┐
         │  localStorage Save  │  │  Database Save   │
         │  (Offline mode)     │  │  (Persistent)    │
         └─────────────────────┘  └────────┬─────────┘
                                           │
                                    finalizeRecord()
                                           │
                                 saveMealToDatabase()
                                           │
                                      ▼
                         POST /api/save-meal
                         {
                           participant_id: "001",
                           name: "John",
                           meal_type: "午餐",
                           meal_time: "12:30",
                           photos: [...],
                           ...
                         }
                                      │
                                      ▼
                         Backend: Save to meal_records
                                      │
                                      ▼
                         ✅ Return: { id: 1, success: true }
                                      │
                                      ▼
                         Show "已保存" Message
```

### Exercise Recording Flow
```
                          USER INTERACTION
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │  Select Time Slot    │
                    │  (14:00 - afternoon) │
                    └──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │  Open Exercise Modal │
                    │  - Type              │
                    │  - Intensity         │
                    │  - Description       │
                    └──────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────┐
                    │  Click "Submit"      │
                    └──────────────────────┘
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
         ┌─────────────────────┐  ┌──────────────────┐
         │  localStorage Save  │  │  Database Save   │
         │  (Offline mode)     │  │  (Persistent)    │
         └─────────────────────┘  └────────┬─────────┘
                                           │
                                  submitExerciseRecord()
                                           │
                                   saveExerciseToDB()
                                           │
                                      ▼
                        POST /api/save-exercise
                        {
                          participant_id: "001",
                          exercise_type: "跑步",
                          intensity: "中",
                          quarter: "afternoon",
                          time_slot: "14:00",
                          ...
                        }
                                      │
                                      ▼
                        Backend: Save to exercise_records
                                      │
                                      ▼
                        ✅ Return: { id: 1, success: true }
                                      │
                                      ▼
                        Show "已保存" Message & Update UI
```

---

## Participant-Based Organization

```
PARTICIPANT ID: 001 (李明)
│
├─ Meal Records
│  ├─ 2024-01-15 早餐 (07:30) - 家
│  ├─ 2024-01-15 午餐 (12:30) - 工作單位
│  └─ 2024-01-15 晚餐 (19:00) - 餐廳
│
├─ Exercise Records
│  ├─ 2024-01-15 morning 06:00 - 無運動
│  ├─ 2024-01-15 afternoon 14:00 - 跑步 (中)
│  └─ 2024-01-15 evening 18:00 - 散步 (低)
│
└─ Daily Summary
   └─ 2024-01-15 活動量: 平常


PARTICIPANT ID: 002 (王芳)
│
├─ Meal Records
│  ├─ 2024-01-15 早餐 (08:00) - 家
│  └─ 2024-01-15 午餐 (12:00) - 家
│
├─ Exercise Records
│  ├─ 2024-01-15 morning 05:30 - 瑜伽 (低)
│  └─ 2024-01-15 afternoon 17:00 - 游泳 (中)
│
└─ Daily Summary
   └─ 2024-01-15 活動量: 多於平常


PARTICIPANT ID: 003 (張華)
│
├─ Meal Records
│  └─ ...
│
├─ Exercise Records
│  └─ ...
│
└─ Daily Summary
   └─ ...
```

---

## Database Query Hierarchy

```
┌─────────────────────────────────────────┐
│   Query by Participant ID               │
│   WHERE participant_id = '001'          │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────────┐      ┌──────────────┐
   │  Get Meals  │      │  Get Exercises
   │  (Full      │      │  (All 4      │
   │  history)   │      │  quarters)   │
   └─────────────┘      └──────────────┘
        │                     │
        ├─→ By Date          ├─→ By Date
        ├─→ By Meal Type     ├─→ By Quarter
        ├─→ By Location      └─→ By Time Slot
        └─→ Count Photos
```

---

## Deployment Architecture

```
Development:
┌─────────────────┐
│  Flask Dev      │
│  SQLite         │
│  localhost:5000 │
└─────────────────┘

Production:
┌────────────────────────────────────────┐
│  Cloud Server (Heroku/AWS/etc)         │
│  ┌──────────────────────────────────┐  │
│  │  Flask App                       │  │
│  │  (Gunicorn/uWSGI)                │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  PostgreSQL / MySQL              │  │
│  │  (Scalable, multi-user)          │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Cloud Storage (S3/Azure)        │  │
│  │  (For photos, optional)          │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

---

## Error Handling Flow

```
User Action
    │
    ▼
JavaScript Function
    │
    ├─→ Validate Data
    │   ├─→ Check participant_id exists
    │   ├─→ Check required fields
    │   └─→ If error → Show alert → Stop
    │
    ├─→ POST to API
    │   │
    │   ▼
    │   Backend Validation
    │   ├─→ Check required fields
    │   ├─→ If error → Return 400 + message
    │   │
    │   ├─→ Process Data
    │   ├─→ If error → Return 500 + message
    │   │
    │   └─→ Save to Database
    │       ├─→ Success → Return 201 + ID
    │       └─→ If error → Return 500 + message
    │
    ├─→ Handle Response
    │   ├─→ Success → Show message, update UI
    │   └─→ Error → Log to console, show error
    │
    └─→ User Feedback
        (Success message or error alert)
```

---

## Index Strategy

```
meal_records Table:
┌──────────────────────┐
│ Index: participant_id│  ← Fast lookup by user
│ Index: created_at    │  ← Fast sorting by date
│ Index: record_date   │  ← Fast filtering by day
└──────────────────────┘

exercise_records Table:
┌──────────────────────┐
│ Index: participant_id│  ← Fast lookup by user
│ Index: record_date   │  ← Fast filtering by day
│ Index: quarter       │  ← Fast filtering by time
└──────────────────────┘

daily_summaries Table:
┌──────────────────────┐
│ Index: participant_id│  ← Fast lookup by user
│ Index: record_date   │  ← Unique per user/date
└──────────────────────┘

These indices ensure O(log n) query performance even with thousands of records
```

---

This architecture supports:
- ✅ Hundreds of concurrent users
- ✅ Multi-user data isolation
- ✅ Fast queries by participant
- ✅ Offline-first capability
- ✅ Easy horizontal scaling
- ✅ Photo storage in database
- ✅ Complete audit trail (timestamps)
