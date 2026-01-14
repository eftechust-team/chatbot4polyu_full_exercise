#!/usr/bin/env python3
"""
Quick script to display database contents
"""
import sys
sys.path.insert(0, '/var/www/chatbot4polyu')

from app import app, db, MealRecord, ExerciseRecord, DailySummary

with app.app_context():
    print("\n" + "="*80)
    print("MEAL RECORDS")
    print("="*80)
    meals = MealRecord.query.all()
    if meals:
        for meal in meals:
            print(f"\n📋 ID: {meal.id}")
            print(f"   Participant: {meal.participant_id} ({meal.name})")
            print(f"   Date: {meal.record_date}")
            print(f"   Meal Type: {meal.meal_type}")
            print(f"   Time: {meal.meal_time}")
            print(f"   Location: {meal.location}")
            print(f"   Amount: {meal.amount}")
            print(f"   Description: {meal.additional_desc}")
            print(f"   Created: {meal.created_at}")
    else:
        print("No meal records found")
    
    print("\n" + "="*80)
    print("EXERCISE RECORDS")
    print("="*80)
    exercises = ExerciseRecord.query.all()
    if exercises:
        for exercise in exercises:
            print(f"\n🏃 ID: {exercise.id}")
            print(f"   Participant: {exercise.participant_id} ({exercise.name})")
            print(f"   Date: {exercise.record_date}")
            print(f"   Quarter: {exercise.quarter}")
            print(f"   Time: {exercise.time_slot}")
            print(f"   Type: {exercise.exercise_type}")
            print(f"   Intensity: {exercise.intensity}")
            print(f"   Description: {exercise.description}")
            print(f"   Activity Level: {exercise.activity_level}")
            print(f"   Created: {exercise.created_at}")
    else:
        print("No exercise records found")
    
    print("\n" + "="*80)
    print("DAILY SUMMARIES")
    print("="*80)
    summaries = DailySummary.query.all()
    if summaries:
        for summary in summaries:
            print(f"\n📊 ID: {summary.id}")
            print(f"   Participant: {summary.participant_id}")
            print(f"   Date: {summary.record_date}")
            print(f"   Activity Level: {summary.daily_activity_level}")
            print(f"   Notes: {summary.notes}")
            print(f"   Created: {summary.created_at}")
    else:
        print("No daily summaries found")
    
    print("\n" + "="*80)
    print("SUMMARY STATISTICS")
    print("="*80)
    print(f"Total Meal Records: {MealRecord.query.count()}")
    print(f"Total Exercise Records: {ExerciseRecord.query.count()}")
    print(f"Total Daily Summaries: {DailySummary.query.count()}")
    print(f"Unique Participants: {db.session.query(db.func.count(db.distinct(MealRecord.participant_id))).scalar() or 0}")
