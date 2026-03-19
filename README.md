# PolyU Record App (Meal + Activity)

A web-based self-reporting application designed for the PolyU study. Participants can record their daily meals (with food photos and descriptions) and physical activities (on a 15-minute timeline) across multiple days (e.g., first workday, second workday, rest day). The system supports login/session-based participant tracking.

## Features

- **Login & Registration**: Session-based authentication with participant ID and password
- **Hub Page**: Central navigation to meal or activity recording
- **Meal Recording**: Record meal type, time, location, amount, notes, and photo(s)
- **Activity Recording**: Select timeline blocks in 15-minute units to log exercises
- **Inline Edit/Delete**: Modify or remove records directly in the record list
- **Multi-Day Workflow**: Record data for workday 1, workday 2, and rest day
- **Completion Tracking**: View daily progress and completion status
- **Summary Reports**: View all recorded meals and activities with statistics
- **Participant PDF Report**: Generate per-participant PDF reports from the database

## Current User Flow

1. Open the landing page and log in or register.
2. Enter the hub page and choose either meal recording or activity recording.
3. For each day, the user can add records, view existing records, edit/delete inline, and complete the day.

### Meal Recording Flow

1. User selects recording date (workday 1, workday 2, or rest day).
2. Chooses meal type to record (breakfast, lunch, dinner, or snacks).
3. Uploads food photo(s).
4. Provides a description of food and portion.
5. Records meal time, location, and amount eaten.
6. Views completion summary.

Already-recorded meal types are disabled when adding more entries. The meal list is displayed in chronological order.

### Activity Recording Flow

1. User selects timeline blocks in 15-minute units.
2. The view page shows a full-day schedule with unrecorded gaps shown as sleep/static segments.
3. Inline editing supports type, specific activity, description, and time via HH + MM dropdowns.
4. Minute options are restricted to 00/15/30/45.
5. If an edited time conflicts with other records, overlapping records are auto-adjusted (or removed if fully overlapped), and an on-page notice is shown.
6. Timeline bars and legends are shown in view/summary contexts.

## Routes

### Pages

- `GET /` — Landing page
- `GET /login` — Login page
- `GET /hub` — Hub page
- `GET /form` — Meal recording page
- `GET /exercise` — Activity recording page

### Authentication APIs

- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`

### Meal APIs

- `POST /api/save-meal-record`
- `GET /api/get-meal-records`
- `PUT /api/update-meal-record/<meal_record_id>`
- `DELETE /api/delete-meal-record/<meal_record_id>`
- `POST /api/complete-daily-record`

### Activity APIs

- `POST /api/save-exercise-record`
- `GET /api/get-exercise-records`
- `PUT /api/update-exercise-record/<record_id>`
- `DELETE /api/delete-exercise-record/<record_id>`
- `POST /api/complete-exercise-day`
- `POST /api/mark-no-exercise`

## Deployment on Google Cloud App Engine

This application is deployed using Google Cloud App Engine with Python Flask.

### Live Application

Visit: https://chatbot4polyu.df.r.appspot.com/

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/eftechust-team/chatbot4polyu_full.git
cd chatbot4polyu
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
# You may need to remove 'httpx==0.27.0', which is for gcloud app deploy.
```

4. Start the server:

```bash
python main.py
```

5. Open your browser and navigate to:

```text
http://localhost:5000
```

## Project Structure

```text
├── static/                        # Static assets
│   ├── css/
│   │   ├── form-style.css         # Meal form page styles
│   │   ├── login-style.css        # Login page styles
│   │   └── style.css              # Global styles
│   └── js/
│       ├── exercise-script.js     # Activity recording functionality
│       ├── form-script.js         # Meal form functionality
│       ├── handlers_addition.js   # Additional event handlers
│       ├── hub-script.js          # Hub page functionality
│       └── login.js               # Login page functionality
│
├── templates/                     # HTML templates
│   ├── exercise.html              # Activity recording page
│   ├── form.html                  # Meal recording page
│   ├── hub.html                   # Hub/navigation page
│   ├── index.html                 # Landing page
│   └── login.html                 # Login page
│
├── utils/                         # Utility modules
│   ├── check_braces.py            # Syntax validation utilities
│   ├── check_syntax.py            # Code syntax checker
│   ├── detailed_check.py          # Detailed validation checks
│   ├── generate_participant_report.py  # PDF report generator
│   └── data/                      # Generated reports output
│
├── .gcloudignore                  # Google Cloud deployment exclusions
├── .gitignore                     # Git exclusions
├── app.yaml                       # Google Cloud App Engine configuration
├── main.py                        # Flask application entry point
├── README.md                      # Project documentation
└── requirements.txt               # Python dependencies
```

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **Database**: Supabase
- **Deployment**: Google Cloud App Engine (`app.yaml`)
- **Version Control**: Git/GitHub

## Database Structure

### Table 1: Participants

```sql
CREATE TABLE participants (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    age INTEGER,
    admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 2: Meal Daily Records

```sql
CREATE TABLE meal_daily_records (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL,          -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT,             -- '第一個工作日', '第二個工作日', etc.
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, record_date)
);
```

### Table 3: Meal Records

```sql
CREATE TABLE meal_records (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_record_id INT8 REFERENCES daily_records(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL,
    meal_type TEXT NOT NULL,            -- '早餐', '午餐', '晚餐', '上午加餐', etc.
    meal_time TEXT,                     -- HH:mm format
    location TEXT,                      -- '家', '工作單位', '餐廳/外賣', '其他'
    eating_amount TEXT,                 -- '全部吃完', '剩餘一些', '只吃少量'
    additional_description TEXT,

    -- Snack-specific fields
    is_snack BOOLEAN DEFAULT FALSE,
    snack_type TEXT,                    -- '水果', '零食', '飲料', '堅果', '甜品', '其他'
    snack_name TEXT,
    snack_amount TEXT,

    photo_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 4: Food Photos

```sql
CREATE TABLE food_photos (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_record_id INT8 REFERENCES meal_records(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    photo_data TEXT NOT NULL,           -- base64 encoded image data
    description TEXT,                   -- e.g. "蘋果-100g 麵條-一碗"
    photo_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 5: Exercise Daily Records

```sql
CREATE TABLE exercise_daily_records (
    id SERIAL PRIMARY KEY,
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL,          -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT NOT NULL,    -- '第一個工作日', '第二個工作日', '第一個休息日'
    is_completed BOOLEAN DEFAULT FALSE,
    activity_level TEXT,                -- '少於平常', '平常', '多於平常'
    activity_reason TEXT,               -- Reason if activity level is not '平常'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Table 6: Exercise Records

```sql
CREATE TABLE exercise_records (
    id SERIAL PRIMARY KEY,
    exercise_daily_record_id INTEGER,
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL,          -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT,
    start_time TEXT NOT NULL,           -- 'HH:MM' format
    end_time TEXT NOT NULL,             -- 'HH:MM' format
    exercise_type TEXT NOT NULL,        -- '跑步', '步行', '騎自行車', etc.
    intensity TEXT NOT NULL,            -- '低強度', '中強度', '高強度', '無'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Generating Participant Reports

```bash
pip install reportlab psycopg2-binary Pillow
cd utils
python generate_participant_report.py
```

Enter the participant ID when prompted. The generated PDF will be saved under `utils/data/`.

## Notes

- UI language is Traditional Chinese.
- Time resolution for activity records is 15 minutes.
- Activity color mapping is centralized in the frontend script.
- Mobile-friendly responsive design.
- Fully client-side form submission and data management.

## To-Do

- Clean database
- UI design updates