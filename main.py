import sys
print(f"Python version: {sys.version}")
print("Starting application...")

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
print("Flask imported successfully")

from supabase import create_client, Client
print("Supabase imported successfully")

import os
import io
from datetime import datetime
print("Standard library imports successful")

# Report generator – import conditionally so the app still starts even when
# the utility module is not present (e.g. in lightweight deployments).
try:
    from utils.generate_participant_report import SupabaseDietaryReportGenerator
    print("Report generator imported successfully")
except ImportError:
    SupabaseDietaryReportGenerator = None
    print("Warning: Report generator not available – /api/generate-report will be disabled")

print("All imports successful")

app = Flask(__name__)
print("Flask app created")

# ──────────────────────────────────────────────
# Supabase Configuration
# ──────────────────────────────────────────────
SUPABASE_URL = 'https://urmhsphzfmtciybqdptw.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWhzcGh6Zm10Y2l5YnFkcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODgxOTcsImV4cCI6MjA4NDM2NDE5N30.f9zVtTgY0yK6ispISE62MyGmmCV5UuzXqXHonVg2cPE'

_supabase_client: Client = None


def _make_supabase_client() -> Client:
    """Create a fresh Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_supabase() -> Client:
    """Return the global Supabase client, recreating it if needed."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = _make_supabase_client()
    return _supabase_client


def reset_supabase():
    """Discard the current client so the next call gets a fresh one."""
    global _supabase_client
    _supabase_client = None


def _is_connection_error(e: Exception) -> bool:
    err_str = str(e)
    return (
        isinstance(e, (ConnectionRefusedError, ConnectionResetError, OSError))
        or 'WinError 10061' in err_str
        or 'WinError 10054' in err_str
        or 'ConnectError' in type(e).__name__
        or 'RemoteProtocolError' in type(e).__name__
    )


class _SupabaseProxy:
    """Transparent proxy that auto-recreates the client on connection errors."""

    def reset(self):
        reset_supabase()

    def __getattr__(self, name: str):
        return getattr(get_supabase(), name)


print(f"Connecting to Supabase: {SUPABASE_URL[:30]}...")
try:
    supabase = _SupabaseProxy()
    get_supabase()  # eagerly test the connection at startup
    print("Supabase client created successfully")
except Exception as e:
    print(f"ERROR creating Supabase client: {e}")
    import traceback
    traceback.print_exc()

app.secret_key = 'f8f7a9d6f2cba09073170d09d5dbc4e19fe816119d8f05e918f5b9d79f495c7a'
print("Secret key set")


# ══════════════════════════════════════════════
# PAGE ROUTES
# ══════════════════════════════════════════════

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login')
def login_page():
    if 'user_id' in session:
        if session.get('is_admin'):
            return redirect(url_for('admin_page'))
        return redirect(url_for('hub_page'))
    return render_template('login.html')


@app.route('/hub')
def hub_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    if session.get('is_admin'):
        return redirect(url_for('admin_page'))
    return render_template('hub.html')


@app.route('/form')
def form_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    if session.get('is_admin'):
        return redirect(url_for('admin_page'))
    return render_template('form.html')


@app.route('/exercise')
def exercise_page():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    if session.get('is_admin'):
        return redirect(url_for('admin_page'))
    return render_template('exercise.html')


@app.route('/admin')
def admin_page():
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('login_page'))
    return render_template('admin.html')


# ══════════════════════════════════════════════
# AUTH API
# ══════════════════════════════════════════════

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        participant_id = data.get('participant_id', '').strip()
        password = data.get('password', '')

        if not participant_id or not password:
            return jsonify({'success': False, 'message': '請輸入參與者編號和密碼'}), 400

        response = supabase.table('participants').select('*').eq('participant_id', participant_id).execute()

        if not response.data or len(response.data) == 0:
            return jsonify({'success': False, 'message': '參與者編號或密碼錯誤'}), 401

        user = response.data[0]

        # Verify password
        if user.get('password') != password:
            return jsonify({'success': False, 'message': '參與者編號或密碼錯誤'}), 401

        # Check if user is admin
        is_admin = user.get('admin') is True

        if is_admin:
            session['user_id'] = user['id']
            session['participant_id'] = user['participant_id']
            session['name'] = user.get('name', 'Admin')
            session['is_admin'] = True
            return jsonify({'success': True, 'message': '管理員登入成功', 'redirect': '/admin'})

        # Check if profile is complete
        if not user.get('name') or not user.get('gender') or not user.get('age'):
            return jsonify({
                'success': False,
                'message': '您的資料不完整，請先完成註冊',
                'incomplete_profile': True
            }), 400

        session['user_id'] = user['id']
        session['participant_id'] = user['participant_id']
        session['name'] = user['name']
        session['is_admin'] = False

        return jsonify({'success': True, 'message': '登入成功', 'redirect': '/hub'})

    except Exception as e:
        print(f"Login error: {e}")
        if _is_connection_error(e):
            supabase.reset()
            print("Supabase client reset due to connection error")
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

        if not all([new_user['name'], new_user['participant_id'], new_user['password'], new_user['gender'], new_user['age']]):
            return jsonify({'success': False, 'message': '請填寫所有欄位'}), 400

        # Check if participant_id exists (must be pre-created by researcher)
        existing = supabase.table('participants').select('*').eq('participant_id', new_user['participant_id']).execute()

        if not existing.data or len(existing.data) == 0:
            return jsonify({'success': False, 'message': '此參與者編號不存在，請聯繫研究人員'}), 404

        existing_user = existing.data[0]

        # Verify password
        if existing_user.get('password') != new_user['password']:
            return jsonify({'success': False, 'message': '密碼錯誤'}), 401

        # Check if profile is already complete
        if existing_user.get('name') and existing_user.get('gender') and existing_user.get('age'):
            is_admin = existing_user.get('admin') is True
            session['user_id'] = existing_user['id']
            session['participant_id'] = existing_user['participant_id']
            session['name'] = existing_user['name']
            session['is_admin'] = is_admin
            redirect_url = '/admin' if is_admin else '/hub'
            return jsonify({'success': True, 'message': '登入成功', 'redirect': redirect_url})
        else:
            # Profile incomplete – update it
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
            is_admin = updated_user.get('admin') is True

            session['user_id'] = updated_user['id']
            session['participant_id'] = updated_user['participant_id']
            session['name'] = updated_user['name']
            session['is_admin'] = is_admin

            redirect_url = '/admin' if is_admin else '/hub'
            return jsonify({'success': True, 'message': '註冊成功', 'redirect': redirect_url})

    except Exception as e:
        print(f"Register error: {e}")
        if _is_connection_error(e):
            supabase.reset()
            print("Supabase client reset due to connection error")
        return jsonify({'success': False, 'message': '註冊失敗，請稍後再試'}), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'redirect': '/login'})


# ══════════════════════════════════════════════
# ADMIN API – Report Generation
# ══════════════════════════════════════════════

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '無權限執行此操作'}), 403

    if SupabaseDietaryReportGenerator is None:
        return jsonify({'success': False, 'message': '報告生成器未安裝'}), 500

    try:
        data = request.get_json()
        target_participant_id = data.get('participant_id', '').strip()

        if not target_participant_id:
            return jsonify({'success': False, 'message': '請輸入參與者編號'}), 400

        output_dir = '/tmp'
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"dietary_report_{target_participant_id}_{timestamp}.pdf"
        output_path = os.path.join(output_dir, output_filename)

        pdf_generator = SupabaseDietaryReportGenerator(SUPABASE_URL, SUPABASE_KEY, output_dir=output_dir)
        success = pdf_generator.generate_pdf(target_participant_id, output_filename)

        if success and os.path.exists(output_path):
            with open(output_path, 'rb') as f:
                return_data = io.BytesIO(f.read())

            try:
                os.remove(output_path)
                print(f"Successfully deleted temporary file: {output_path}")
            except OSError as e:
                print(f"Error deleting temporary file {output_path}: {e}")

            return send_file(
                return_data,
                as_attachment=True,
                download_name=output_filename,
                mimetype='application/pdf'
            )
        else:
            return jsonify({'success': False, 'message': '生成報告失敗，可能找不到該參與者的記錄'}), 404

    except Exception as e:
        print(f"Generate report error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'生成報告時發生錯誤: {str(e)}'}), 500


# ══════════════════════════════════════════════
# MEAL API
# ══════════════════════════════════════════════

@app.route('/api/save-meal-record', methods=['POST'])
def save_meal_record():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        data = request.get_json()
        participant_id = session['participant_id']

        record_date = data.get('record_date')
        record_date_label = data.get('record_date_label')
        actual_date = data.get('actual_date', '')         
        meal_type = data.get('meal_type')
        meal_time = data.get('meal_time', '')
        location = data.get('location', '')
        eating_amount = data.get('eating_amount', '')
        additional_description = data.get('additional_description', '')

        is_snack = data.get('is_snack', False)
        snack_type = data.get('snack_type', '')
        snack_name = data.get('snack_name', '')
        snack_amount = data.get('snack_amount', '')

        photos = data.get('photos', [])
        photo_count = len(photos)

        if not all([record_date, record_date_label, meal_type]):
            return jsonify({'success': False, 'message': '缺少必填資訊'}), 400

        # Step 1: Get or create meal_daily_record
        daily_record_response = supabase.table('meal_daily_records')\
            .select('id')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()

        if daily_record_response.data and len(daily_record_response.data) > 0:
            daily_record_id = int(daily_record_response.data[0]['id'])
            if actual_date:
                supabase.table('meal_daily_records')\
                    .update({'actual_date': actual_date})\
                    .eq('id', daily_record_id)\
                    .execute()
        else:
            new_daily_record = {
                'participant_id': participant_id,
                'record_date': record_date,
                'record_date_label': record_date_label,
                'actual_date': actual_date if actual_date else None, 
                'is_completed': False
            }
            daily_record_insert = supabase.table('meal_daily_records').insert(new_daily_record).execute()

            if not daily_record_insert.data or len(daily_record_insert.data) == 0:
                return jsonify({'success': False, 'message': '創建日記錄失敗'}), 500

            daily_record_id = int(daily_record_insert.data[0]['id'])

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

        print(f"Inserting meal_record: {meal_record_data}")  # ← 加这行
        meal_record_response = supabase.table('meal_records').insert(meal_record_data).execute()
        print(f"Meal record response: {meal_record_response}")  # ← 和这行

        if not meal_record_response.data or len(meal_record_response.data) == 0:
            return jsonify({'success': False, 'message': '創建餐次記錄失敗'}), 500

        meal_record_id = int(meal_record_response.data[0]['id'])

        # Step 3: Save photos
        if photos and len(photos) > 0:
            photo_records = []
            for idx, photo_item in enumerate(photos):
                photo_records.append({
                    'meal_record_id': meal_record_id,
                    'participant_id': participant_id,
                    'photo_data': photo_item.get('photo_data', ''),
                    'description': photo_item.get('description', ''),
                    'photo_order': idx
                })
            supabase.table('food_photos').insert(photo_records).execute()

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
        if _is_connection_error(e):
            supabase.reset()
        return jsonify({'success': False, 'message': f'保存記錄時發生錯誤: {str(e)}'}), 500

@app.route('/api/get-meal-records', methods=['GET'])
def get_meal_records():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']
        record_date = request.args.get('record_date')

        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400

        meal_response = supabase.table('meal_records')\
            .select('*')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .order('id')\
            .execute()

        records = meal_response.data if meal_response.data else []
        result = []

        # Bulk-load photos for all meal records to avoid N+1 API calls.
        meal_ids = [r['id'] for r in records if r.get('id') is not None]
        photos_by_meal_id = {}
        if meal_ids:
            try:
                photo_response = supabase.table('food_photos')\
                    .select('*')\
                    .in_('meal_record_id', meal_ids)\
                    .order('meal_record_id')\
                    .order('photo_order')\
                    .execute()

                for p in (photo_response.data or []):
                    meal_id = p.get('meal_record_id')
                    if meal_id not in photos_by_meal_id:
                        photos_by_meal_id[meal_id] = []
                    photos_by_meal_id[meal_id].append(p)
            except Exception as photo_err:
                print(f"Photo bulk query warning: {photo_err}")
                photos_by_meal_id = {}

        for r in records:
            result.append({
                'meal_record': r,
                'photos': photos_by_meal_id.get(r.get('id'), [])
            })

        return jsonify({'success': True, 'records': result})

    except Exception as e:
        print(f"Get meal records error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'獲取飲食記錄時發生錯誤: {str(e)}'}), 500


@app.route('/api/update-meal-record/<int:meal_record_id>', methods=['PUT'])
def update_meal_record(meal_record_id):
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']
        data = request.get_json()

        update_data = {
            'meal_type': data.get('meal_type'),
            'meal_time': data.get('meal_time') or None,
            'location': data.get('location') or None,
            'eating_amount': data.get('eating_amount') or None,
            'additional_description': data.get('additional_description') or None
        }

        response = supabase.table('meal_records')\
            .update(update_data)\
            .eq('id', meal_record_id)\
            .eq('participant_id', participant_id)\
            .execute()

        if not response.data:
            return jsonify({'success': False, 'message': '更新失敗或找不到記錄'}), 404

        # Replace meal photos when the edit payload includes photos.
        if isinstance(data.get('photos'), list):
            photos = data.get('photos') or []

            supabase.table('food_photos')\
                .delete()\
                .eq('meal_record_id', meal_record_id)\
                .eq('participant_id', participant_id)\
                .execute()

            if photos:
                photo_records = []
                for idx, item in enumerate(photos):
                    photo_records.append({
                        'meal_record_id': meal_record_id,
                        'participant_id': participant_id,
                        'photo_data': item.get('photo_data', ''),
                        'description': item.get('description', ''),
                        'photo_order': idx
                    })

                supabase.table('food_photos').insert(photo_records).execute()

        return jsonify({'success': True, 'message': '飲食記錄已更新'})

    except Exception as e:
        print(f"Update meal record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'更新飲食記錄時發生錯誤: {str(e)}'}), 500


@app.route('/api/delete-meal-record/<int:meal_record_id>', methods=['DELETE'])
def delete_meal_record(meal_record_id):
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']

        # Delete photos first, then meal record.
        supabase.table('food_photos')\
            .delete()\
            .eq('meal_record_id', meal_record_id)\
            .eq('participant_id', participant_id)\
            .execute()

        delete_response = supabase.table('meal_records')\
            .delete()\
            .eq('id', meal_record_id)\
            .eq('participant_id', participant_id)\
            .execute()

        if not delete_response.data:
            return jsonify({'success': False, 'message': '刪除失敗或找不到記錄'}), 404

        return jsonify({'success': True, 'message': '飲食記錄已刪除'})

    except Exception as e:
        print(f"Delete meal record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'刪除飲食記錄時發生錯誤: {str(e)}'}), 500


@app.route('/api/complete-daily-record', methods=['POST'])
def complete_daily_record():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        data = request.get_json()
        participant_id = session['participant_id']
        record_date = data.get('record_date')

        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400

        print(f"Completing daily record for {participant_id}, {record_date}")

        update_response = supabase.table('meal_daily_records')\
            .update({'is_completed': True})\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()

        print(f"Update response: {update_response.data}")

        if not update_response.data or len(update_response.data) == 0:
            return jsonify({'success': False, 'message': '標記完成失敗（未找到記錄）'}), 404

        return jsonify({'success': True, 'message': '日記錄已標記為完成'})

    except Exception as e:
        print(f"Complete daily record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': '標記完成時發生錯誤'}), 500


# ══════════════════════════════════════════════
# EXERCISE API
# ══════════════════════════════════════════════

@app.route('/api/save-exercise-record', methods=['POST'])
def save_exercise_record():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        data = request.get_json()
        participant_id = session['participant_id']

        record_date = data.get('record_date')
        record_date_label = data.get('record_date_label')
        actual_date = data.get('actual_date', '')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        exercise_type = data.get('exercise_type')
        intensity = data.get('intensity')
        description = data.get('description', '')

        if not all([record_date, start_time, end_time, exercise_type]):
            return jsonify({'success': False, 'message': '缺少必填資訊'}), 400

        # ── Step 1: Get or create exercise_daily_record ──
        daily_resp = supabase.table('exercise_daily_records')\
            .select('id')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()

        if daily_resp.data and len(daily_resp.data) > 0:
            daily_record_id = int(daily_resp.data[0]['id'])
            if actual_date:
                supabase.table('exercise_daily_records')\
                    .update({'actual_date': actual_date})\
                    .eq('id', daily_record_id)\
                    .execute()
        else:
            new_daily = {
                'participant_id': participant_id,
                'record_date': record_date,
                'record_date_label': record_date_label if record_date_label else None,
                'actual_date': actual_date if actual_date else None,
                'is_completed': False
            }
            insert_resp = supabase.table('exercise_daily_records').insert(new_daily).execute()

            if not insert_resp.data or len(insert_resp.data) == 0:
                return jsonify({'success': False, 'message': '創建日記錄失敗'}), 500

            daily_record_id = int(insert_resp.data[0]['id'])

        # ── Step 2: Create exercise_record with link ──
        exercise_record_data = {
            'exercise_daily_record_id': daily_record_id,
            'participant_id': participant_id,
            'record_date': record_date,
            'record_date_label': record_date_label,
            'start_time': start_time,
            'end_time': end_time,
            'exercise_type': exercise_type,
            'intensity': intensity if intensity else None,
            'description': description if description else None
        }

        exercise_response = supabase.table('exercise_records').insert(exercise_record_data).execute()

        if not exercise_response.data or len(exercise_response.data) == 0:
            return jsonify({'success': False, 'message': '創建運動記錄失敗'}), 500

        exercise_record_id = int(exercise_response.data[0]['id'])

        return jsonify({
            'success': True,
            'message': '運動記錄保存成功',
            'exercise_record_id': exercise_record_id
        })

    except Exception as e:
        print(f"Save exercise record error: {e}")
        import traceback
        traceback.print_exc()
        if _is_connection_error(e):
            supabase.reset()
        return jsonify({'success': False, 'message': f'保存記錄時發生錯誤: {str(e)}'}), 500

@app.route('/api/get-exercise-records', methods=['GET'])
def get_exercise_records():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']
        record_date = request.args.get('record_date')

        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400

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


@app.route('/api/update-exercise-record/<int:record_id>', methods=['PUT'])
def update_exercise_record(record_id):
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']
        data = request.get_json()

        update_data = {
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time'),
            'exercise_type': data.get('exercise_type'),
            'intensity': data.get('intensity') or None,
            'description': data.get('description') or None
        }

        response = supabase.table('exercise_records')\
            .update(update_data)\
            .eq('id', record_id)\
            .eq('participant_id', participant_id)\
            .execute()

        if not response.data:
            return jsonify({'success': False, 'message': '更新失敗或找不到記錄'}), 404

        return jsonify({'success': True, 'message': '活動記錄已更新'})

    except Exception as e:
        print(f"Update exercise record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'更新活動記錄時發生錯誤: {str(e)}'}), 500


@app.route('/api/delete-exercise-record/<int:record_id>', methods=['DELETE'])
def delete_exercise_record(record_id):
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        participant_id = session['participant_id']

        response = supabase.table('exercise_records')\
            .delete()\
            .eq('id', record_id)\
            .eq('participant_id', participant_id)\
            .execute()

        if not response.data:
            return jsonify({'success': False, 'message': '刪除失敗或找不到記錄'}), 404

        return jsonify({'success': True, 'message': '活動記錄已刪除'})

    except Exception as e:
        print(f"Delete exercise record error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'刪除活動記錄時發生錯誤: {str(e)}'}), 500


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

        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400

        update_data = {
            'is_completed': True,
            'activity_level': activity_level if activity_level else None,
            'activity_reason': activity_reason if activity_reason else None
        }

        daily_resp = supabase.table('exercise_daily_records')\
            .select('id')\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()

        if daily_resp.data and len(daily_resp.data) > 0:
            supabase.table('exercise_daily_records')\
                .update(update_data)\
                .eq('participant_id', participant_id)\
                .eq('record_date', record_date)\
                .execute()
        else:
            new_daily = {
                'participant_id': participant_id,
                'record_date': record_date,
                'record_date_label': data.get('record_date_label', ''),
                'is_completed': True,
                'activity_level': activity_level if activity_level else None,
                'activity_reason': activity_reason if activity_reason else None
            }
            supabase.table('exercise_daily_records').insert(new_daily).execute()

        return jsonify({'success': True, 'message': '活動記錄已完成'})

    except Exception as e:
        print(f"Complete exercise day error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': '標記完成時發生錯誤'}), 500

@app.route('/api/mark-no-exercise', methods=['POST'])
def mark_no_exercise():
    try:
        if 'participant_id' not in session:
            return jsonify({'success': False, 'message': '請先登入'}), 401

        data = request.get_json()
        participant_id = session['participant_id']
        record_date = data.get('record_date')
        record_date_label = data.get('record_date_label')

        if not record_date:
            return jsonify({'success': False, 'message': '缺少記錄日期'}), 400

        print(f"Marking no exercise for {participant_id}, {record_date}")

        no_exercise_data = {
            'participant_id': participant_id,
            'record_date': record_date,
            'record_date_label': record_date_label,
            'start_time': '00:00',
            'end_time': '24:00',
            'exercise_type': '睡眠 / 靜止',
            'intensity': '睡覺',
            'description': '本日無活動記錄'
        }

        # Delete any existing records for this date first
        supabase.table('exercise_records')\
            .delete()\
            .eq('participant_id', participant_id)\
            .eq('record_date', record_date)\
            .execute()

        insert_response = supabase.table('exercise_records').insert(no_exercise_data).execute()

        if not insert_response.data or len(insert_response.data) == 0:
            return jsonify({'success': False, 'message': '標記失敗'}), 500

        return jsonify({'success': True, 'message': '已標記本日為睡眠/靜止'})

    except Exception as e:
        print(f"Mark no exercise error: {e}")
        import traceback
        traceback.print_exc()
        if _is_connection_error(e):
            supabase.reset()
            print("Supabase client reset due to connection error")
        return jsonify({'success': False, 'message': '標記時發生錯誤'}), 500

@app.route('/api/get-actual-dates', methods=['GET'])
def get_actual_dates():
    if 'participant_id' not in session:
        return jsonify({'success': False}), 401

    participant_id = session['participant_id']
    date_map = {}

    try:
        meal_resp = supabase.table('meal_daily_records')\
            .select('record_date, actual_date')\
            .eq('participant_id', participant_id)\
            .execute()

        for r in (meal_resp.data or []):
            if r.get('actual_date'):
                date_map[r['record_date']] = r['actual_date']

        exercise_resp = supabase.table('exercise_daily_records')\
            .select('record_date, actual_date')\
            .eq('participant_id', participant_id)\
            .execute()

        for r in (exercise_resp.data or []):
            if r.get('actual_date') and r['record_date'] not in date_map:
                date_map[r['record_date']] = r['actual_date']

    except Exception as e:
        print(f"Get actual dates error: {e}")

    return jsonify({'success': True, 'date_map': date_map})


if __name__ == '__main__':
    app.run(debug=True, port=5000)