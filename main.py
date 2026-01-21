import sys
print(f"Python version: {sys.version}")
print("Starting application...")

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
print("Flask imported successfully")

from supabase import create_client, Client
print("Supabase imported successfully")

import os
from datetime import datetime
print("All imports successful")

app = Flask(__name__)
print("Flask app created")

# Supabase Configuration - HARDCODED
SUPABASE_URL = 'https://urmhsphzfmtciybqdptw.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWhzcGh6Zm10Y2l5YnFkcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODgxOTcsImV4cCI6MjA4NDM2NDE5N30.f9zVtTgY0yK6ispISE62MyGmmCV5UuzXqXHonVg2cPE'

print(f"Connecting to Supabase: {SUPABASE_URL[:30]}...")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client created successfully")
except Exception as e:
    print(f"ERROR creating Supabase client: {e}")
    import traceback
    traceback.print_exc()

app.secret_key = 'f8f7a9d6f2cba09073170d09d5dbc4e19fe816119d8f05e918f5b9d79f495c7a'
print("Secret key set")

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    # If already logged in, redirect to form
    if 'user_id' in session:
        return redirect(url_for('form_page'))
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        participant_id = data.get('participant_id', '').strip()
        password = data.get('password', '')
        
        if not participant_id or not password:
            return jsonify({'success': False, 'message': '請輸入參與者編號和密碼'}), 400
        
        # Query Supabase
        response = supabase.table('participants').select('*').eq('participant_id', participant_id).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({'success': False, 'message': '找不到此編號，請先註冊。'}), 404
        
        user = response.data[0]
        
        # Verify password
        if user.get('password') != password:
            return jsonify({'success': False, 'message': '密碼錯誤'}), 401
        
        # Check if profile is complete (name, gender, age must not be null)
        if not user.get('name') or not user.get('gender') or not user.get('age'):
            return jsonify({
                'success': False, 
                'message': '您的資料不完整，請先完成註冊',
                'incomplete_profile': True
            }), 400
        
        # Save to Flask session
        session['user_id'] = user['id']
        session['participant_id'] = user['participant_id']
        session['name'] = user['name']
        
        return jsonify({'success': True, 'message': '登入成功', 'redirect': '/form'})
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': '登入發生錯誤'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        new_user = {
            'name': data.get('name', '').strip(),
            'participant_id': data.get('participant_id', '').strip(),
            'password': data.get('password', ''),
            'gender': data.get('gender'),
            'age': int(data.get('age', 0))
        }
        
        # Validation
        if not all([new_user['name'], new_user['participant_id'], new_user['password'], new_user['gender'], new_user['age']]):
            return jsonify({'success': False, 'message': '請填寫所有欄位'}), 400
        
        # Check if participant_id already exists
        existing = supabase.table('participants').select('*').eq('participant_id', new_user['participant_id']).execute()
        
        if existing.data and len(existing.data) > 0:
            # Participant exists
            existing_user = existing.data[0]
            
            # Verify password
            if existing_user.get('password') != new_user['password']:
                return jsonify({'success': False, 'message': '此編號已註冊但密碼錯誤'}), 401
            
            # Check if profile is complete
            if existing_user.get('name') and existing_user.get('gender') and existing_user.get('age'):
                # Profile is complete, just login
                session['user_id'] = existing_user['id']
                session['participant_id'] = existing_user['participant_id']
                session['name'] = existing_user['name']
                
                return jsonify({'success': True, 'message': '登入成功', 'redirect': '/form'})
            else:
                # Profile incomplete, update it
                update_data = {
                    'name': new_user['name'],
                    'gender': new_user['gender'],
                    'age': new_user['age']
                }
                
                update_response = supabase.table('participants')\
                    .update(update_data)\
                    .eq('participant_id', new_user['participant_id'])\
                    .execute()
                
                if not update_response.data:
                    return jsonify({'success': False, 'message': '更新資料失敗'}), 500
                
                updated_user = update_response.data[0]
                
                # Login after updating profile
                session['user_id'] = updated_user['id']
                session['participant_id'] = updated_user['participant_id']
                session['name'] = updated_user['name']
                
                return jsonify({'success': True, 'message': '註冊成功', 'redirect': '/form'})
        
        # New participant - insert
        response = supabase.table('participants').insert(new_user).execute()
        
        if not response.data:
            return jsonify({'success': False, 'message': '註冊失敗'}), 500
        
        user = response.data[0]
        
        # Auto-login after registration
        session['user_id'] = user['id']
        session['participant_id'] = user['participant_id']
        session['name'] = user['name']
        
        return jsonify({'success': True, 'message': '註冊成功', 'redirect': '/form'})
        
    except Exception as e:
        error_msg = str(e)
        print(f"Register error: {error_msg}")
        return jsonify({'success': False, 'message': '註冊失敗，請稍後再試'}), 500

@app.route('/form')
def form_page():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    return render_template('form.html')

@app.route('/exercise')
def exercise_page():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('exercise.html')

@app.route('/api/save-meal-record', methods=['POST'])
def save_meal_record():
    try:
        # Check authentication
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        participant_id = session['participant_id']
        
        print(f"Received data: {data}")  # Debug logging
        
        # Extract data
        record_date = data.get('record_date')  # 'workday1', 'workday2', 'restday'
        record_date_label = data.get('record_date_label')  # '第一個工作日', etc.
        meal_type = data.get('meal_type')  # '早餐', '午餐', etc.
        meal_time = data.get('meal_time', '')
        location = data.get('location', '')
        eating_amount = data.get('eating_amount', '')
        additional_description = data.get('additional_description', '')
        
        # Snack-specific fields
        is_snack = data.get('is_snack', False)
        snack_type = data.get('snack_type', '')
        snack_name = data.get('snack_name', '')
        snack_amount = data.get('snack_amount', '')
        
        # Photos
        photos = data.get('photos', [])  # Array of {photo_data, description}
        photo_count = len(photos)
        
        # Validation
        if not all([record_date, record_date_label, meal_type]):
            return jsonify({'success': False, 'message': '缺少必填資訊'}), 400
        
        # Step 1: Get or create daily_record
        daily_record_response = supabase.table('meal_daily_records')\
            .select('id')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        print(f"Daily record query response: {daily_record_response.data}")  # Debug logging
        
        if daily_record_response.data and len(daily_record_response.data) > 0:
            daily_record_id = int(daily_record_response.data[0]['id'])
            print(f"Found existing daily record: {daily_record_id}")
        else:
            # Create new daily record
            new_daily_record = {
                'participant_id': participant_id,
                'record_date': record_date,
                'record_date_label': record_date_label,
                'is_completed': False
            }
            
            print(f"Creating new daily record: {new_daily_record}")  # Debug logging
            
            daily_record_insert = supabase.table('meal_daily_records').insert(new_daily_record).execute()
            
            print(f"Daily record insert response: {daily_record_insert.data}")  # Debug logging
            
            if not daily_record_insert.data or len(daily_record_insert.data) == 0:
                return jsonify({'success': False, 'message': '創建日記錄失敗'}), 500
            
            daily_record_id = int(daily_record_insert.data[0]['id'])
            print(f"Created new daily record: {daily_record_id}")
        
        # Step 2: Create meal_record
        meal_record_data = {
            'daily_record_id': daily_record_id,
            'participant_id': participant_id,
            'record_date': record_date,
            'meal_type': meal_type,
            'meal_time': meal_time if meal_time else None,
            'location': location if location else None,
            'eating_amount': eating_amount if eating_amount else None,
            'additional_description': additional_description if additional_description else None,
            'is_snack': is_snack,
            'snack_type': snack_type if snack_type else None,
            'snack_name': snack_name if snack_name else None,
            'snack_amount': snack_amount if snack_amount else None,
            'photo_count': photo_count
        }
        
        print(f"Creating meal record: {meal_record_data}")  # Debug logging
        
        meal_record_response = supabase.table('meal_records').insert(meal_record_data).execute()
        
        print(f"Meal record insert response: {meal_record_response.data}")  # Debug logging
        
        if not meal_record_response.data or len(meal_record_response.data) == 0:
            return jsonify({'success': False, 'message': '創建餐次記錄失敗'}), 500
        
        meal_record_id = int(meal_record_response.data[0]['id'])
        print(f"Created meal record: {meal_record_id}")
        
        # Step 3: Save photos
        if photos and len(photos) > 0:
            photo_records = []
            for idx, photo_item in enumerate(photos):
                photo_record = {
                    'meal_record_id': meal_record_id,
                    'participant_id': participant_id,
                    'photo_data': photo_item.get('photo_data', ''),
                    'description': photo_item.get('description', ''),
                    'photo_order': idx
                }
                photo_records.append(photo_record)
            
            print(f"Saving {len(photo_records)} photos")  # Debug logging
            
            photos_response = supabase.table('food_photos').insert(photo_records).execute()
            
            print(f"Photos insert response: {len(photos_response.data) if photos_response.data else 0} photos saved")  # Debug logging
            
            if not photos_response.data:
                print("Warning: Failed to save some photos")
        
        return jsonify({
            'success': True, 
            'message': '記錄保存成功',
            'meal_record_id': meal_record_id,
            'daily_record_id': daily_record_id
        })
        
    except Exception as e:
        print(f"Save meal record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'保存記錄時發生錯誤: {str(e)}'}), 500

@app.route('/api/complete-daily-record', methods=['POST'])
def complete_daily_record():
    try:
        # Check authentication
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        participant_id = session['participant_id']
        record_date = data.get('record_date')
        
        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400
        
        print(f"Completing daily record for {participant_id}, {record_date}")  # Debug logging
        
        # Update daily_record to mark as completed
        update_response = supabase.table('meal_daily_records')\
            .update({'is_completed': True})\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        print(f"Update response: {update_response.data}")  # Debug logging
        
        if not update_response.data or len(update_response.data) == 0:
            return jsonify({'success': False, 'message': '標記完成失敗（未找到記錄）'}), 404
        
        return jsonify({'success': True, 'message': '日記錄已標記為完成'})
        
    except Exception as e:
        print(f"Complete daily record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': '標記完成時發生錯誤'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'redirect': '/login'})

@app.route('/api/save-exercise-record', methods=['POST'])
def save_exercise_record():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        participant_id = session['participant_id']
        
        record_date = data.get('record_date')
        record_date_label = data.get('record_date_label')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        exercise_type = data.get('exercise_type')
        intensity = data.get('intensity')
        description = data.get('description', '')
        
        if not all([record_date, start_time, end_time, exercise_type, intensity]):
            return jsonify({'success': False, 'message': '缺少必填資訊'}), 400
        
        # Step 1: Get or create exercise_daily_record
        daily_record_response = supabase.table('exercise_daily_records')\
            .select('id')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        if daily_record_response.data and len(daily_record_response.data) > 0:
            daily_record_id = int(daily_record_response.data[0]['id'])
        else:
            new_daily_record = {
                'participant_id': participant_id,
                'record_date': record_date,
                'record_date_label': record_date_label,
                'is_completed': False
            }
            daily_record_insert = supabase.table('exercise_daily_records').insert(new_daily_record).execute()
            daily_record_id = int(daily_record_insert.data[0]['id'])
        
        # Step 2: Create exercise_record
        exercise_record_data = {
            'exercise_daily_record_id': daily_record_id,
            'participant_id': participant_id,
            'record_date': record_date,
            'record_date_label': record_date_label,
            'start_time': start_time,
            'end_time': end_time,
            'exercise_type': exercise_type,
            'intensity': intensity,
            'description': description if description else None
        }
        
        exercise_response = supabase.table('exercise_records').insert(exercise_record_data).execute()
        
        if not exercise_response.data:
            return jsonify({'success': False, 'message': '創建運動記錄失敗'}), 500
        
        return jsonify({
            'success': True,
            'message': '運動記錄保存成功',
            'exercise_record_id': int(exercise_response.data[0]['id'])
        })
        
    except Exception as e:
        print(f"Save exercise record error: {e}")
        return jsonify({'success': False, 'message': f'保存記錄時發生錯誤: {str(e)}'}), 500

@app.route('/api/get-exercise-records', methods=['GET'])
def get_exercise_records():
    try:
        # Check authentication
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        participant_id = session['participant_id']
        record_date = request.args.get('record_date')
        
        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400
        
        # Query exercise records
        response = supabase.table('exercise_records')\
            .select('*')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        return jsonify({
            'success': True,
            'records': response.data if response.data else []
        })
        
    except Exception as e:
        print(f"Get exercise records error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'獲取記錄時發生錯誤: {str(e)}'}), 500

@app.route('/api/complete-exercise-day', methods=['POST'])
def complete_exercise_day():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        participant_id = session['participant_id']
        record_date = data.get('record_date')
        activity_level = data.get('activity_level')
        activity_reason = data.get('activity_reason', '')
        
        if not all([record_date, activity_level]):
            return jsonify({'success': False, 'message': '缺少必填資訊'}), 400
        
        # Update exercise_daily_record
        update_data = {
            'is_completed': True,
            'activity_level': activity_level,
            'activity_reason': activity_reason if activity_reason else None
        }
        
        update_response = supabase.table('exercise_daily_records')\
            .update(update_data)\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        if not update_response.data:
            return jsonify({'success': False, 'message': '標記完成失敗'}), 404
        
        return jsonify({'success': True, 'message': '運動記錄已完成'})
        
    except Exception as e:
        print(f"Complete exercise day error: {e}")
        return jsonify({'success': False, 'message': '標記完成時發生錯誤'}), 500

@app.route('/api/mark-no-exercise', methods=['POST'])
def mark_no_exercise():
    try:
        # Check authentication
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        participant_id = session['participant_id']
        record_date = data.get('record_date')
        record_date_label = data.get('record_date_label')
        
        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400
        
        print(f"Marking no exercise for {participant_id}, {record_date}")
        
        # Create a special "no exercise" record
        no_exercise_data = {
            'participant_id': participant_id,
            'record_date': record_date,
            'record_date_label': record_date_label,
            'start_time': '00:00',
            'end_time': '00:00',
            'exercise_type': '無運動',
            'intensity': '無',
            'description': '本日無運動'
        }
        
        # First delete any existing records for this date
        delete_response = supabase.table('exercise_records')\
            .delete()\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()
        
        # Insert the no-exercise marker
        insert_response = supabase.table('exercise_records').insert(no_exercise_data).execute()
        
        if not insert_response.data or len(insert_response.data) == 0:
            return jsonify({'success': False, 'message': '標記失敗'}), 500
        
        return jsonify({'success': True, 'message': '已標記本日無運動'})
        
    except Exception as e:
        print(f"Mark no exercise error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': '標記時發生錯誤'}), 500
    
@app.route('/api/delete-exercise-record', methods=['POST'])
def delete_exercise_record():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401
        
        data = request.get_json()
        record_id = data.get('record_id')
        participant_id = session['participant_id']
        
        if not record_id:
            return jsonify({'success': False, 'message': '缺少記錄ID'}), 400
        
        # Delete the record (verify it belongs to this participant)
        delete_response = supabase.table('exercise_records')\
            .delete()\
            .eq('id', record_id)\
            .eq('participant_id', participant_id)\
            .execute()
        
        return jsonify({'success': True, 'message': '刪除成功'})
        
    except Exception as e:
        print(f"Delete exercise record error: {e}")
        return jsonify({'success': False, 'message': '刪除失敗'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)