-- Quick SQL Queries for Database Viewing
-- Use these with: sqlite3 chatbot_data.db < view_queries.sql
-- Or interactively: sqlite3 chatbot_data.db

-- =====================================================
-- PARTICIPANT OVERVIEW
-- =====================================================
.mode column
.headers on
.width 15 25 10 10

SELECT '=== ALL PARTICIPANTS ===' as '';
SELECT DISTINCT 
    participant_id as 'ID',
    name as 'Name',
    (SELECT COUNT(*) FROM meal_records WHERE participant_id = m.participant_id) as 'Meals',
    (SELECT COUNT(*) FROM exercise_records WHERE participant_id = m.participant_id) as 'Exercises'
FROM meal_records m
UNION
SELECT DISTINCT 
    participant_id,
    name,
    (SELECT COUNT(*) FROM meal_records WHERE participant_id = e.participant_id),
    (SELECT COUNT(*) FROM exercise_records WHERE participant_id = e.participant_id)
FROM exercise_records e
ORDER BY participant_id;

-- =====================================================
-- RECENT MEALS
-- =====================================================
SELECT '';
SELECT '=== RECENT 10 MEALS ===' as '';
.width 5 15 12 20 10 10 15
SELECT 
    id as 'ID',
    participant_id as 'Participant',
    record_date as 'Date',
    meal_type as 'Type',
    meal_time as 'Time',
    location as 'Location',
    datetime(created_at) as 'Created'
FROM meal_records
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- RECENT EXERCISES
-- =====================================================
SELECT '';
SELECT '=== RECENT 10 EXERCISES ===' as '';
.width 5 15 12 10 10 20 10
SELECT 
    id as 'ID',
    participant_id as 'Participant',
    record_date as 'Date',
    quarter as 'Quarter',
    time_slot as 'Time',
    exercise_type as 'Type',
    intensity as 'Intensity'
FROM exercise_records
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- MEAL TYPE COUNTS
-- =====================================================
SELECT '';
SELECT '=== MEAL TYPE STATISTICS ===' as '';
.width 20 10
SELECT 
    meal_type as 'Meal Type',
    COUNT(*) as 'Count'
FROM meal_records
GROUP BY meal_type
ORDER BY COUNT(*) DESC;

-- =====================================================
-- EXERCISE TYPE COUNTS
-- =====================================================
SELECT '';
SELECT '=== EXERCISE TYPE STATISTICS ===' as '';
.width 20 10
SELECT 
    exercise_type as 'Exercise Type',
    COUNT(*) as 'Count'
FROM exercise_records
GROUP BY exercise_type
ORDER BY COUNT(*) DESC;

-- =====================================================
-- DAILY SUMMARIES
-- =====================================================
SELECT '';
SELECT '=== DAILY SUMMARIES ===' as '';
.width 15 12 20 30
SELECT 
    participant_id as 'Participant',
    record_date as 'Date',
    daily_activity_level as 'Activity Level',
    daily_reason as 'Reason'
FROM daily_summaries
ORDER BY participant_id, record_date;

-- =====================================================
-- DATABASE STATISTICS
-- =====================================================
SELECT '';
SELECT '=== OVERALL DATABASE STATISTICS ===' as '';
.width 30 10
SELECT 'Total Participants' as 'Metric', 
       COUNT(DISTINCT participant_id) as 'Count' 
FROM (
    SELECT participant_id FROM meal_records
    UNION
    SELECT participant_id FROM exercise_records
);

SELECT 'Total Meal Records' as 'Metric', COUNT(*) as 'Count' FROM meal_records;
SELECT 'Total Exercise Records' as 'Metric', COUNT(*) as 'Count' FROM exercise_records;
SELECT 'Total Daily Summaries' as 'Metric', COUNT(*) as 'Count' FROM daily_summaries;
