#!/usr/bin/env python3
"""
Test script to verify database integration is working correctly
Run this after starting the Flask app to test database functionality
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_meal_save():
    """Test saving a meal record"""
    print("\n" + "="*60)
    print("TEST 1: Saving Meal Record")
    print("="*60)
    
    meal_data = {
        "participant_id": "TEST001",
        "name": "Test User",
        "gender": "male",
        "age": 30,
        "record_date": "workday1",
        "meal_type": "午餐",
        "meal_time": "12:30",
        "location": "工作單位",
        "amount": "全部吃完",
        "additional_desc": "Test meal record",
        "photos": [],
        "photo_descriptions": []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/save-meal", json=meal_data)
        result = response.json()
        
        if response.status_code in [200, 201]:
            print(f"✅ SUCCESS: Meal saved with ID: {result.get('id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_exercise_save():
    """Test saving an exercise record"""
    print("\n" + "="*60)
    print("TEST 2: Saving Exercise Record")
    print("="*60)
    
    exercise_data = {
        "participant_id": "TEST001",
        "name": "Test User",
        "gender": "male",
        "age": 30,
        "record_date": "workday1",
        "quarter": "afternoon",
        "time_slot": "14:00",
        "exercise_type": "跑步",
        "intensity": "中",
        "description": "Test exercise record",
        "activity_level": "平常",
        "reason": ""
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/save-exercise", json=exercise_data)
        result = response.json()
        
        if response.status_code in [200, 201]:
            print(f"✅ SUCCESS: Exercise saved with ID: {result.get('id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_daily_summary_save():
    """Test saving a daily summary"""
    print("\n" + "="*60)
    print("TEST 3: Saving Daily Summary")
    print("="*60)
    
    summary_data = {
        "participant_id": "TEST001",
        "record_date": "workday1",
        "daily_activity_level": "平常",
        "daily_reason": "",
        "notes": "Test summary"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/save-daily-summary", json=summary_data)
        result = response.json()
        
        if response.status_code in [200, 201]:
            print(f"✅ SUCCESS: Daily summary saved with ID: {result.get('id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_get_meals():
    """Test retrieving meals for a participant"""
    print("\n" + "="*60)
    print("TEST 4: Retrieving Meals for Participant")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/meals/TEST001")
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ SUCCESS: Retrieved {result.get('count')} meal records")
            if result.get('records'):
                for record in result.get('records', [])[:1]:  # Show first record
                    print(f"   - {record.get('meal_type')} at {record.get('meal_time')}")
            return True
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_get_exercises():
    """Test retrieving exercises for a participant"""
    print("\n" + "="*60)
    print("TEST 5: Retrieving Exercises for Participant")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/exercises/TEST001")
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ SUCCESS: Retrieved {result.get('count')} exercise records")
            if result.get('records'):
                for record in result.get('records', [])[:1]:  # Show first record
                    print(f"   - {record.get('exercise_type')} ({record.get('intensity')})")
            return True
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_missing_participant_id():
    """Test error handling for missing participant ID"""
    print("\n" + "="*60)
    print("TEST 6: Error Handling (Missing Participant ID)")
    print("="*60)
    
    bad_data = {
        "participant_id": "",  # Empty participant ID
        "name": "Test User",
        "record_date": "workday1",
        "meal_type": "午餐"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/save-meal", json=bad_data)
        result = response.json()
        
        if response.status_code >= 400:
            print(f"✅ SUCCESS: Properly rejected invalid data")
            print(f"   Error: {result.get('error')}")
            return True
        else:
            print(f"❌ FAILED: Should have rejected empty participant_id")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*10 + "DATABASE INTEGRATION TEST SUITE" + " "*16 + "║")
    print("║" + " "*15 + f"Testing at: {BASE_URL}" + " "*23 + "║")
    print("╚" + "="*58 + "╝")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print("\n✅ Server is running")
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to Flask server")
        print("   Make sure to start the app with: python app.py")
        return
    
    # Run tests
    results = []
    results.append(("Meal Save", test_meal_save()))
    results.append(("Exercise Save", test_exercise_save()))
    results.append(("Daily Summary Save", test_daily_summary_save()))
    results.append(("Get Meals", test_get_meals()))
    results.append(("Get Exercises", test_get_exercises()))
    results.append(("Error Handling", test_missing_participant_id()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("="*60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Database integration is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the errors above.")

if __name__ == "__main__":
    main()
