# Chatbot4PolyU - Diet Recording Application v2.0

A web-based food/diet tracking application designed for the PolyU study. Users can record their daily meals with photos, descriptions, and timing information.

## Features

- **Personal Information**: Collect user demographics (name, ID, gender, age)
- **Flexible Recording**: Record meals for workdays and rest days
- **Photo Upload**: Capture or upload food photos
- **Meal Details**: Track meal type, time, location, and amount consumed
- **Multi-Meal Recording**: Support for main meals (breakfast, lunch, dinner) and snacks (morning, afternoon, evening)
- **Completion Tracking**: View daily progress and completion status
- **Summary Reports**: View all recorded meals with statistics

## Deployment on Gcloud APP Engine

This application is deployed using gcloud app engine with Python Flask.

### Live Application
Visit: https://chatbot4polyu.df.r.appspot.com/

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/eftechust-team/chatbot4polyu_full.git
cd chatbot4polyu
```

2. Create a virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
# you may need to delete 'httpx==0.27.0', which is for gcloud app deploy. 
```

4. Run the Flask app:
```bash
python main.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
├── static/ # Static assets
│ ├── css/ # Stylesheets
│ │ ├── form-style.css # Form page styles
│ │ ├── login-style.css # Login page styles
│ │ └── style.css # Global styles
│ │
│ └── js/ # JavaScript files
│ ├── form-script.js # Form page functionality
│ ├── handlers_addition.js # Additional event handlers
│ └── login.js # Login page functionality
│
├── templates/ # HTML templates
│ ├── form.html # Main form/chatbot page
│ ├── index.html # Landing page
│ └── login.html # Login page
│
├── utils/ # Utility modules
│ ├── check_braces.py # Syntax validation utilities
│ ├── check_syntax.py # Code syntax checker
│ └── detailed_check.py # Detailed validation checks
│
├── .gcloudignore # Google Cloud deployment exclusions
├── .gitignore # Git exclusions
├── app.yaml # Google Cloud App Engine configuration
├── main.py # Flask application entry point
├── README.md # Project documentation
└── requirements.txt # Python dependencies
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Backend**: Python Flask
- **Deployment**: Gcloud APP Engine
- **Version Control**: Git/GitHub
- **Database**: Supabase

## Features in Detail

### Meal Recording Flow
1. User enters basic information (name, participant ID, gender, age)
2. Selects recording date (workday 1, workday 2, or rest day)
3. Chooses meal type to record
4. Uploads food photo(s)
5. Provides description of food and portion
6. Records meal time, location, and amount eaten
7. Views completion summary

### Data Tracking
- Tracks recorded meals throughout the day
- Shows progress towards completing all meal recordings
- Calculates total photos uploaded
- Displays meal counts by type

### Multi-Day Support
- Record data for multiple days
- Start new recording day with date selection
- Supplement records for current day
- View all historical records

### Database Structure

-- Table 1: Users (participants)
CREATE TABLE participants (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    age INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Daily Records (tracks each recording day)
CREATE TABLE meal_daily_records (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL, -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT, -- '第一個工作日', '第二個工作日', etc.
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, record_date)
);

-- Table 3: Meal Records (each meal/snack entry)
CREATE TABLE meal_records (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_record_id INT8 REFERENCES daily_records(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL,
    meal_type TEXT NOT NULL, -- '早餐', '午餐', '晚餐', '上午加餐', etc.
    meal_time TEXT, -- HH:mm format
    location TEXT, -- '家', '工作單位', '餐廳/外賣', '其他'
    eating_amount TEXT, -- '全部吃完', '剩餘一些', '只吃少量'
    additional_description TEXT,
    
    -- Snack-specific fields
    is_snack BOOLEAN DEFAULT FALSE,
    snack_type TEXT, -- '水果', '零食', '飲料', '堅果', '甜品', '其他'
    snack_name TEXT,
    snack_amount TEXT,
    
    photo_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
);

-- Table 4: Food Photos (stores photo data and descriptions)
CREATE TABLE food_photos (
    id INT8 PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_record_id INT8 REFERENCES meal_records(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL,
    photo_data TEXT NOT NULL, -- base64 encoded image data
    description TEXT, -- food description like "蘋果-100g 麵條-一碗"
    photo_order INTEGER DEFAULT 0, -- order of photo in the meal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() 
);

-- Table 5: Exercise Daily Records (tracks each recording day)
CREATE TABLE exercise_daily_records (
    id SERIAL PRIMARY KEY,
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL, -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT NOT NULL, -- '第一個工作日', '第二個工作日', '第一個休息日'
    is_completed BOOLEAN DEFAULT FALSE,
    activity_level TEXT, -- '少於平常', '平常', '多於平常'
    activity_reason TEXT, -- Reason if activity level is not '平常'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 6: Exercise Records (each entry)
CREATE TABLE exercise_records (
    id SERIAL PRIMARY KEY,
    exercise_daily_record_id INTEGER, -- Link to daily record
    participant_id TEXT NOT NULL,
    record_date TEXT NOT NULL, -- 'workday1', 'workday2', 'restday'
    record_date_label TEXT,
    start_time TEXT NOT NULL, -- 'HH:MM' format
    end_time TEXT NOT NULL, -- 'HH:MM' format
    exercise_type TEXT NOT NULL, -- '跑步', '步行', '騎自行車', etc.
    intensity TEXT NOT NULL, -- '低強度', '中強度', '高強度', '無'
    description TEXT, -- Optional additional notes
    created_at TIMESTAMP DEFAULT NOW()
);


### Participant Report
```bash
pip install reportlab psycopg2-binary Pillow
cd utils
python generate_participant_report.py
```
Input the participant_id accordingly and generated pdf will be stored under /utils/data.

## Notes
- Frontend UI design to be updated
- Fully client-side form submission and data management
- Mobile-friendly responsive design
- Traditional Chinese language support

## To-do
- register with passwd and user id
- integrate with fitness
- clean database
