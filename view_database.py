#!/usr/bin/env python3
"""
View Database Script
Convenient tool to view all saved meal and exercise records
"""

from app import app, db, MealRecord, ExerciseRecord, DailySummary
from sqlalchemy import func
import json

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def view_all_participants():
    """Show all participants in the database"""
    print_header("ALL PARTICIPANTS")
    
    with app.app_context():
        # Get unique participants from both tables
        meal_participants = db.session.query(MealRecord.participant_id, MealRecord.name).distinct().all()
        exercise_participants = db.session.query(ExerciseRecord.participant_id, ExerciseRecord.name).distinct().all()
        
        # Combine and deduplicate
        all_participants = {}
        for pid, name in meal_participants:
            all_participants[pid] = name
        for pid, name in exercise_participants:
            if pid not in all_participants:
                all_participants[pid] = name
        
        if not all_participants:
            print("  No participants found yet.")
            print("  Start the app and submit some records first!")
            return None
        
        print(f"\n  Found {len(all_participants)} participant(s):\n")
        for pid, name in all_participants.items():
            meal_count = MealRecord.query.filter_by(participant_id=pid).count()
            exercise_count = ExerciseRecord.query.filter_by(participant_id=pid).count()
            print(f"  • ID: {pid}")
            print(f"    Name: {name}")
            print(f"    Meals: {meal_count} records")
            print(f"    Exercises: {exercise_count} records")
            print()
        
        return list(all_participants.keys())

def view_meals(participant_id=None):
    """View all meals or meals for specific participant"""
    with app.app_context():
        if participant_id:
            print_header(f"MEALS FOR PARTICIPANT: {participant_id}")
            meals = MealRecord.query.filter_by(participant_id=participant_id).order_by(MealRecord.created_at.desc()).all()
        else:
            print_header("ALL MEAL RECORDS")
            meals = MealRecord.query.order_by(MealRecord.created_at.desc()).all()
        
        if not meals:
            print(f"  No meal records found.")
            return
        
        print(f"\n  Total: {len(meals)} meal record(s)\n")
        
        for i, meal in enumerate(meals, 1):
            print(f"  [{i}] Meal ID: {meal.id}")
            print(f"      Participant: {meal.participant_id} ({meal.name})")
            print(f"      Date: {meal.record_date}")
            print(f"      Type: {meal.meal_type}")
            print(f"      Time: {meal.meal_time}")
            print(f"      Location: {meal.location}")
            print(f"      Amount: {meal.amount}")
            if meal.additional_desc:
                print(f"      Description: {meal.additional_desc}")
            if meal.photos:
                photo_count = len(meal.photos) if isinstance(meal.photos, list) else 0
                print(f"      Photos: {photo_count} image(s)")
            print(f"      Saved: {meal.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print()

def view_exercises(participant_id=None):
    """View all exercises or exercises for specific participant"""
    with app.app_context():
        if participant_id:
            print_header(f"EXERCISES FOR PARTICIPANT: {participant_id}")
            exercises = ExerciseRecord.query.filter_by(participant_id=participant_id).order_by(
                ExerciseRecord.record_date, 
                ExerciseRecord.quarter, 
                ExerciseRecord.time_slot
            ).all()
        else:
            print_header("ALL EXERCISE RECORDS")
            exercises = ExerciseRecord.query.order_by(
                ExerciseRecord.record_date,
                ExerciseRecord.quarter,
                ExerciseRecord.time_slot
            ).all()
        
        if not exercises:
            print(f"  No exercise records found.")
            return
        
        print(f"\n  Total: {len(exercises)} exercise record(s)\n")
        
        current_date = None
        for exercise in exercises:
            if exercise.record_date != current_date:
                current_date = exercise.record_date
                print(f"\n  📅 {exercise.record_date.upper()}")
                print(f"  {'-'*60}")
            
            print(f"  • {exercise.time_slot} ({exercise.quarter})")
            print(f"    Type: {exercise.exercise_type}")
            print(f"    Intensity: {exercise.intensity}")
            if exercise.description:
                print(f"    Note: {exercise.description}")
            print(f"    Participant: {exercise.participant_id} ({exercise.name})")
            print(f"    Saved: {exercise.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

def view_summaries(participant_id=None):
    """View daily summaries"""
    with app.app_context():
        if participant_id:
            print_header(f"DAILY SUMMARIES FOR PARTICIPANT: {participant_id}")
            summaries = DailySummary.query.filter_by(participant_id=participant_id).order_by(DailySummary.record_date).all()
        else:
            print_header("ALL DAILY SUMMARIES")
            summaries = DailySummary.query.order_by(DailySummary.record_date).all()
        
        if not summaries:
            print(f"  No daily summaries found.")
            return
        
        print(f"\n  Total: {len(summaries)} summary/summaries\n")
        
        for summary in summaries:
            print(f"  • {summary.record_date}")
            print(f"    Participant: {summary.participant_id}")
            print(f"    Activity Level: {summary.daily_activity_level}")
            if summary.daily_reason:
                print(f"    Reason: {summary.daily_reason}")
            print(f"    Saved: {summary.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print()

def view_statistics(participant_id=None):
    """Show statistics"""
    with app.app_context():
        if participant_id:
            print_header(f"STATISTICS FOR PARTICIPANT: {participant_id}")
            
            # Meal statistics
            total_meals = MealRecord.query.filter_by(participant_id=participant_id).count()
            meal_types = db.session.query(
                MealRecord.meal_type,
                func.count(MealRecord.id)
            ).filter_by(participant_id=participant_id).group_by(MealRecord.meal_type).all()
            
            # Exercise statistics
            total_exercises = ExerciseRecord.query.filter_by(participant_id=participant_id).count()
            exercise_types = db.session.query(
                ExerciseRecord.exercise_type,
                func.count(ExerciseRecord.id)
            ).filter_by(participant_id=participant_id).group_by(ExerciseRecord.exercise_type).all()
            
            print(f"\n  📊 MEALS")
            print(f"  Total: {total_meals} records")
            if meal_types:
                print(f"  Breakdown:")
                for meal_type, count in meal_types:
                    print(f"    • {meal_type}: {count}")
            
            print(f"\n  🏃 EXERCISES")
            print(f"  Total: {total_exercises} records")
            if exercise_types:
                print(f"  Breakdown:")
                for exercise_type, count in exercise_types:
                    print(f"    • {exercise_type}: {count}")
        else:
            print_header("OVERALL STATISTICS")
            
            total_participants = db.session.query(func.count(func.distinct(MealRecord.participant_id))).scalar()
            total_meals = MealRecord.query.count()
            total_exercises = ExerciseRecord.query.count()
            total_summaries = DailySummary.query.count()
            
            print(f"\n  👥 Participants: {total_participants}")
            print(f"  🍽️  Meal Records: {total_meals}")
            print(f"  🏃 Exercise Records: {total_exercises}")
            print(f"  📝 Daily Summaries: {total_summaries}")
        
        print()

def export_to_json(participant_id):
    """Export participant data to JSON"""
    with app.app_context():
        meals = MealRecord.query.filter_by(participant_id=participant_id).all()
        exercises = ExerciseRecord.query.filter_by(participant_id=participant_id).all()
        summaries = DailySummary.query.filter_by(participant_id=participant_id).all()
        
        data = {
            'participant_id': participant_id,
            'export_date': str(db.func.now()),
            'meals': [meal.to_dict() for meal in meals],
            'exercises': [exercise.to_dict() for exercise in exercises],
            'daily_summaries': [summary.to_dict() for summary in summaries]
        }
        
        filename = f'participant_{participant_id}_export.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n✅ Data exported to: {filename}")
        print(f"   Meals: {len(meals)}")
        print(f"   Exercises: {len(exercises)}")
        print(f"   Summaries: {len(summaries)}")

def main_menu():
    """Interactive menu"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*20 + "DATABASE VIEWER" + " "*33 + "║")
    print("╚" + "="*68 + "╝")
    
    # First show all participants
    participants = view_all_participants()
    
    if not participants:
        print("\n💡 Tip: Start the Flask app and submit some records first!")
        print("   Then run this script again to view the data.\n")
        return
    
    while True:
        print("\n" + "-"*70)
        print("  OPTIONS:")
        print("-"*70)
        print("  1. View all meals")
        print("  2. View all exercises")
        print("  3. View all daily summaries")
        print("  4. View statistics")
        print("  5. View specific participant")
        print("  6. Export participant data to JSON")
        print("  7. Refresh participant list")
        print("  0. Exit")
        print("-"*70)
        
        choice = input("\n  Enter your choice: ").strip()
        
        if choice == '1':
            view_meals()
        elif choice == '2':
            view_exercises()
        elif choice == '3':
            view_summaries()
        elif choice == '4':
            view_statistics()
        elif choice == '5':
            participant_id = input("\n  Enter participant ID: ").strip()
            if participant_id:
                print(f"\n  Viewing data for participant: {participant_id}")
                view_meals(participant_id)
                view_exercises(participant_id)
                view_summaries(participant_id)
                view_statistics(participant_id)
        elif choice == '6':
            participant_id = input("\n  Enter participant ID to export: ").strip()
            if participant_id:
                export_to_json(participant_id)
        elif choice == '7':
            participants = view_all_participants()
        elif choice == '0':
            print("\n  👋 Goodbye!\n")
            break
        else:
            print("\n  ❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    main_menu()
