# PostgreSQL Setup Guide

## Overview

The app now supports both **SQLite** (local development) and **PostgreSQL** (production with shared database).

### Default Behavior:
- **Local Development**: Uses `chatbot_data.db` (SQLite file)
- **Production**: Uses PostgreSQL via `DATABASE_URL` environment variable

---

## Option A: Local Development (SQLite)

No additional setup needed! The app will automatically use SQLite:

```bash
python app.py
```

Data is stored in `chatbot_data.db` (local file only).

---

## Option B: Production with Render.com (PostgreSQL)

### Step 1: Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click **+ New** → **PostgreSQL**
4. Configure:
   - **Name**: `chatbot4polyu-db`
   - **Database**: `chatbot_db`
   - **User**: `chatbot_user`
   - **Region**: Singapore
   - **Plan**: Free

5. Create the database and note the **Internal Database URL**

### Step 2: Connect Web Service to Database

1. Go to your web service settings
2. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL from the PostgreSQL service

Example format:
```
postgresql://chatbot_user:password@dpg-xxxxx.internal:5432/chatbot_db
```

### Step 3: Verify Connection

After deployment:
1. Check logs to ensure no database errors
2. Submit a test record via the web form
3. Check that it appears when you query the participant ID

---

## Option C: Local PostgreSQL Development

If you want to use PostgreSQL locally for testing:

### Step 1: Install PostgreSQL

**Windows**:
```powershell
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**Mac**:
```bash
brew install postgresql@15
```

**Linux**:
```bash
sudo apt-get install postgresql postgresql-contrib
```

### Step 2: Create Database

```bash
# Start PostgreSQL service
psql -U postgres

# In psql prompt:
CREATE DATABASE chatbot_db;
CREATE USER chatbot_user WITH PASSWORD 'your_password';
ALTER ROLE chatbot_user SET client_encoding TO 'utf8';
ALTER ROLE chatbot_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chatbot_user SET default_transaction_deferrable TO on;
ALTER ROLE chatbot_user SET default_transaction_read_uncommitted TO off;
GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;
\q
```

### Step 3: Set Environment Variable

**Windows (PowerShell)**:
```powershell
$env:DATABASE_URL = "postgresql://chatbot_user:your_password@localhost:5432/chatbot_db"
python app.py
```

**Windows (Command Prompt)**:
```cmd
set DATABASE_URL=postgresql://chatbot_user:your_password@localhost:5432/chatbot_db
python app.py
```

**Mac/Linux**:
```bash
export DATABASE_URL="postgresql://chatbot_user:your_password@localhost:5432/chatbot_db"
python app.py
```

### Step 4: Initialize Database

```bash
python init_database.py
```

---

## Database Structure

Both SQLite and PostgreSQL use the same schema:

### Tables:
- **meal_records** - Meal intake records
- **exercise_records** - Exercise activity records
- **daily_summaries** - Daily summary records

All tables are indexed by `participant_id` for fast queries.

---

## Common Issues

### Issue: "psycopg2" ImportError
**Solution**: Install PostgreSQL driver
```bash
pip install psycopg2-binary==2.9.9
# or
pip install -r requirements.txt
```

### Issue: "could not connect to server"
**Solution**: Check if PostgreSQL service is running
```bash
# Windows
net start postgresql-x64-15

# Mac
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Issue: "FATAL: password authentication failed"
**Solution**: Wrong password or user. Reset in psql:
```bash
psql -U postgres
ALTER USER chatbot_user WITH PASSWORD 'new_password';
\q
```

### Issue: "relation 'meal_records' does not exist"
**Solution**: Run init script
```bash
python init_database.py
```

---

## Switching Between SQLite and PostgreSQL

### Use SQLite (remove DATABASE_URL):
```powershell
# Windows PowerShell
Remove-Item Env:\DATABASE_URL
python app.py
```

### Use PostgreSQL (set DATABASE_URL):
```powershell
# Windows PowerShell
$env:DATABASE_URL = "postgresql://..."
python app.py
```

---

## Testing the Setup

### Test Local Database

```bash
# Start the app
python app.py

# In another terminal, run tests
python test_database.py
```

### View Production Database (via Render)

1. Go to Render PostgreSQL instance
2. Click "Connect"
3. Use pgAdmin or DBeaver to browse tables

---

## Environment Variable Reference

| Variable | Local | Production | Example |
|----------|-------|-----------|---------|
| `DATABASE_URL` | Not set | Required | `postgresql://user:pass@host:5432/db` |
| `FLASK_ENV` | development | production | - |
| `PYTHON_VERSION` | - | 3.11.4 | - |

---

## Database Backup & Export

### Export PostgreSQL to CSV
```bash
# From psql
\COPY meal_records TO 'meals.csv' WITH CSV HEADER;
\COPY exercise_records TO 'exercises.csv' WITH CSV HEADER;
```

### Export SQLite to CSV
```bash
# Run view_database.py and select "Export to JSON"
# Or use command:
sqlite3 chatbot_data.db ".mode csv" ".output meals.csv" "SELECT * FROM meal_records;"
```

---

## Next Steps

1. **Local**: Run `python app.py` and test with SQLite
2. **Production**: Deploy to Render with PostgreSQL
3. **Testing**: Use `test_database.py` to verify both environments

All your records will be in one shared database in production! 🎉
