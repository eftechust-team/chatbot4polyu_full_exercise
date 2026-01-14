from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json

app = Flask(__name__)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))

# Support both SQLite (local development) and PostgreSQL (production)
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # Production: Use PostgreSQL from environment variable
    # Handle the case where DATABASE_URL might use postgres:// instead of postgresql://
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    # Development: Use SQLite locally
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "chatbot_data.db")}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==================== Database Models ====================

class MealRecord(db.Model):
    __tablename__ = 'meal_records'
    
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    record_date = db.Column(db.String(20), nullable=False)  # e.g., 'workday1', 'workday2', 'restday'
    meal_type = db.Column(db.String(20), nullable=False)  # e.g., '早餐', '午餐', '晚餐'
    meal_time = db.Column(db.String(10))  # HH:MM format
    location = db.Column(db.String(20))  # '家', '工作單位', '餐廳/外賣', '其他'
    amount = db.Column(db.String(20))  # '全部吃完', '剩餘一些', '只吃少量'
    additional_desc = db.Column(db.Text)
    photos = db.Column(db.JSON)  # Array of base64 encoded images or image metadata
    photo_descriptions = db.Column(db.JSON)  # Array of descriptions for each photo
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'participant_id': self.participant_id,
            'name': self.name,
            'gender': self.gender,
            'age': self.age,
            'record_date': self.record_date,
            'meal_type': self.meal_type,
            'meal_time': self.meal_time,
            'location': self.location,
            'amount': self.amount,
            'additional_desc': self.additional_desc,
            'photos': self.photos,
            'photo_descriptions': self.photo_descriptions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ExerciseRecord(db.Model):
    __tablename__ = 'exercise_records'
    
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    record_date = db.Column(db.String(20), nullable=False)  # 'workday1', 'workday2', 'restday'
    quarter = db.Column(db.String(20))  # 'morning', 'afternoon', 'evening', 'night'
    time_slot = db.Column(db.String(10))  # HH:00 format
    exercise_type = db.Column(db.String(50))  # '無運動', '散步', '跑步', etc.
    intensity = db.Column(db.String(20))  # '低', '中', '高'
    description = db.Column(db.Text)
    activity_level = db.Column(db.String(20))  # '平常', '少於平常', '多於平常'
    reason = db.Column(db.String(100))  # Reason if activity_level != '平常'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'participant_id': self.participant_id,
            'name': self.name,
            'gender': self.gender,
            'age': self.age,
            'record_date': self.record_date,
            'quarter': self.quarter,
            'time_slot': self.time_slot,
            'exercise_type': self.exercise_type,
            'intensity': self.intensity,
            'description': self.description,
            'activity_level': self.activity_level,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DailySummary(db.Model):
    __tablename__ = 'daily_summaries'
    
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.String(50), nullable=False, index=True)
    record_date = db.Column(db.String(20), nullable=False)
    daily_activity_level = db.Column(db.String(20))  # '平常', '少於平常', '多於平常'
    daily_reason = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'participant_id': self.participant_id,
            'record_date': self.record_date,
            'daily_activity_level': self.daily_activity_level,
            'daily_reason': self.daily_reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== API Routes ====================

# Save meal record
@app.route('/api/save-meal', methods=['POST'])
def save_meal():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('participant_id') or not data.get('name'):
            return jsonify({'error': '缺少必需欄位：參與者編號或姓名'}), 400
        
        meal_record = MealRecord(
            participant_id=data.get('participant_id'),
            name=data.get('name'),
            gender=data.get('gender'),
            age=data.get('age'),
            record_date=data.get('record_date'),
            meal_type=data.get('meal_type'),
            meal_time=data.get('meal_time'),
            location=data.get('location'),
            amount=data.get('amount'),
            additional_desc=data.get('additional_desc'),
            photos=data.get('photos'),  # Array of base64 strings
            photo_descriptions=data.get('photo_descriptions')  # Array of descriptions
        )
        
        db.session.add(meal_record)
        db.session.commit()
        
        print(f"[DB] Meal record saved - Participant: {data.get('participant_id')}, Meal: {data.get('meal_type')}", flush=True)
        return jsonify({
            'success': True,
            'id': meal_record.id,
            'message': '飲食記錄已保存'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to save meal: {str(e)}", flush=True)
        return jsonify({'error': f'保存失敗：{str(e)}'}), 500


# Save exercise record
@app.route('/api/save-exercise', methods=['POST'])
def save_exercise():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('participant_id') or not data.get('name'):
            return jsonify({'error': '缺少必需欄位：參與者編號或姓名'}), 400
        
        exercise_record = ExerciseRecord(
            participant_id=data.get('participant_id'),
            name=data.get('name'),
            gender=data.get('gender'),
            age=data.get('age'),
            record_date=data.get('record_date'),
            quarter=data.get('quarter'),
            time_slot=data.get('time_slot'),
            exercise_type=data.get('exercise_type'),
            intensity=data.get('intensity'),
            description=data.get('description'),
            activity_level=data.get('activity_level'),
            reason=data.get('reason')
        )
        
        db.session.add(exercise_record)
        db.session.commit()
        
        print(f"[DB] Exercise record saved - Participant: {data.get('participant_id')}, Type: {data.get('exercise_type')}", flush=True)
        return jsonify({
            'success': True,
            'id': exercise_record.id,
            'message': '運動記錄已保存'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to save exercise: {str(e)}", flush=True)
        return jsonify({'error': f'保存失敗：{str(e)}'}), 500


# Save daily summary for exercises
@app.route('/api/save-daily-summary', methods=['POST'])
def save_daily_summary():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('participant_id') or not data.get('record_date'):
            return jsonify({'error': '缺少必需欄位：參與者編號或記錄日期'}), 400
        
        # Check if summary already exists for this participant and date
        existing = DailySummary.query.filter_by(
            participant_id=data.get('participant_id'),
            record_date=data.get('record_date')
        ).first()
        
        if existing:
            # Update existing record
            existing.daily_activity_level = data.get('daily_activity_level')
            existing.daily_reason = data.get('daily_reason')
            existing.notes = data.get('notes')
            existing.updated_at = datetime.utcnow()
            db.session.commit()
            return jsonify({
                'success': True,
                'id': existing.id,
                'message': '每日摘要已更新'
            }), 200
        else:
            # Create new record
            summary = DailySummary(
                participant_id=data.get('participant_id'),
                record_date=data.get('record_date'),
                daily_activity_level=data.get('daily_activity_level'),
                daily_reason=data.get('daily_reason'),
                notes=data.get('notes')
            )
            db.session.add(summary)
            db.session.commit()
            return jsonify({
                'success': True,
                'id': summary.id,
                'message': '每日摘要已保存'
            }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to save daily summary: {str(e)}", flush=True)
        return jsonify({'error': f'保存失敗：{str(e)}'}), 500


# Get all meal records for a participant
@app.route('/api/meals/<participant_id>', methods=['GET'])
def get_meals(participant_id):
    try:
        meals = MealRecord.query.filter_by(participant_id=participant_id).order_by(MealRecord.created_at.desc()).all()
        return jsonify({
            'success': True,
            'count': len(meals),
            'records': [meal.to_dict() for meal in meals]
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to get meals: {str(e)}", flush=True)
        return jsonify({'error': f'查詢失敗：{str(e)}'}), 500


# Get all exercise records for a participant
@app.route('/api/exercises/<participant_id>', methods=['GET'])
def get_exercises(participant_id):
    try:
        exercises = ExerciseRecord.query.filter_by(participant_id=participant_id).order_by(ExerciseRecord.created_at.desc()).all()
        return jsonify({
            'success': True,
            'count': len(exercises),
            'records': [exercise.to_dict() for exercise in exercises]
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to get exercises: {str(e)}", flush=True)
        return jsonify({'error': f'查詢失敗：{str(e)}'}), 500



# Serve static files (CSS, JS)
@app.route('/static/<path:filename>')
def send_static(filename):
    return send_from_directory('static', filename)

# Initialize database (create tables if not exist)
@app.route('/api/init-db', methods=['POST'])
def init_db():
    try:
        with app.app_context():
            db.create_all()
        print("[DB] Database initialized successfully", flush=True)
        return jsonify({'success': True, 'message': '數據庫初始化成功'}), 200
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {str(e)}", flush=True)
        return jsonify({'error': f'數據庫初始化失敗：{str(e)}'}), 500

# Serve index.html as the welcome page
@app.route('/')
@app.route('/index.html')
def home():
    print("[route] home -> index.html", flush=True)
    return send_from_directory('.', 'index.html')

# Serve form.html (meal tracking)
@app.route('/form.html')
def form_page():
    print("[route] form_page -> form.html", flush=True)
    return send_from_directory('.', 'form.html')

# Serve any other HTML files
@app.route('/<path:filename>')
def serve_file(filename):
    if filename.endswith('.html') or filename.endswith('.css') or filename.endswith('.js'):
        return send_from_directory('.', filename)
    return send_from_directory('.', filename), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
