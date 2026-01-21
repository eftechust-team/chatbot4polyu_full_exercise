import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from supabase import create_client, Client
import base64
from io import BytesIO
from PIL import Image as PILImage

# Register Chinese font using reportlab's built-in CJK support
try:
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
    FONT_NAME = 'STSong-Light'
    print("✅ Using STSong-Light font (built-in Chinese support)")
except:
    try:
        pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
        FONT_NAME = 'HeiseiMin-W3'
        print("✅ Using HeiseiMin-W3 font (built-in Japanese/Chinese support)")
    except:
        FONT_NAME = 'Helvetica'
        print("⚠️ Using Helvetica (no Chinese support)")

class SupabaseDietaryReportGenerator:
    def __init__(self, supabase_url, supabase_key, output_dir='data'):
        """
        Initialize PDF generator with Supabase configuration
        
        Args:
            supabase_url: Your Supabase project URL
            supabase_key: Your Supabase anon/service key
            output_dir: Directory to save PDF reports (default: 'data')
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.output_dir = output_dir
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"📁 Created output directory: {self.output_dir}")
        
    def get_participant_info(self, participant_id):
        """Fetch participant basic information"""
        try:
            response = self.supabase.table('participants')\
                .select('*')\
                .eq('participant_id', participant_id)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching participant: {e}")
            return None
    
    def get_meal_daily_records(self, participant_id):
        """Fetch all daily records for participant"""
        try:
            response = self.supabase.table('meal_daily_records')\
                .select('*')\
                .eq('participant_id', participant_id)\
                .order('created_at')\
                .execute()
            
            # Sort by record_date priority
            if response.data:
                date_order = {'workday1': 1, 'workday2': 2, 'restday': 3}
                return sorted(response.data, key=lambda x: date_order.get(x['record_date'], 4))
            return []
        except Exception as e:
            print(f"Error fetching daily records: {e}")
            return []
    
    def get_meal_records(self, daily_record_id):
        """Fetch all meal records for a daily record"""
        try:
            response = self.supabase.table('meal_records')\
                .select('*')\
                .eq('daily_record_id', daily_record_id)\
                .order('created_at')\
                .execute()
            
            # Sort by meal type
            if response.data:
                meal_order = {
                    '早餐': 1, '上午加餐': 2, '午餐': 3,
                    '下午加餐': 4, '晚餐': 5, '晚上加餐': 6
                }
                return sorted(response.data, key=lambda x: meal_order.get(x['meal_type'], 7))
            return []
        except Exception as e:
            print(f"Error fetching meal records: {e}")
            return []
    
    def get_food_photos(self, meal_record_id):
        """Fetch all photos for a meal record"""
        try:
            response = self.supabase.table('food_photos')\
                .select('*')\
                .eq('meal_record_id', meal_record_id)\
                .order('photo_order')\
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            print(f"Error fetching photos: {e}")
            return []
    
    def get_exercise_records(self, participant_id):
        """Fetch all exercise records for participant"""
        try:
            response = self.supabase.table('exercise_records')\
                .select('*')\
                .eq('participant_id', participant_id)\
                .order('record_date')\
                .order('start_time')\
                .execute()
            
            # Sort by record_date priority and start time
            if response.data:
                date_order = {'workday1': 1, 'workday2': 2, 'restday': 3}
                return sorted(response.data, key=lambda x: (
                    date_order.get(x['record_date'], 4),
                    x.get('start_time', '00:00')
                ))
            return []
        except Exception as e:
            print(f"Error fetching exercise records: {e}")
            return []
    
    def get_exercise_day_info(self, participant_id, record_date):
        """Fetch activity level info for a specific exercise day"""
        try:
            response = self.supabase.table('exercise_day_info')\
                .select('*')\
                .eq('participant_id', participant_id)\
                .eq('record_date', record_date)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching exercise day info: {e}")
            return None
    
    def base64_to_image(self, base64_string, max_width=10*cm, max_height=8*cm):
        """Convert base64 string to ReportLab Image object"""
        try:
            # Remove data URL prefix if present
            if 'base64,' in base64_string:
                base64_string = base64_string.split('base64,')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Open with PIL
            pil_image = PILImage.open(BytesIO(image_data))
            
            # Convert to RGB if necessary
            if pil_image.mode in ('RGBA', 'LA', 'P'):
                pil_image = pil_image.convert('RGB')
            
            # Save to BytesIO
            img_buffer = BytesIO()
            pil_image.save(img_buffer, format='JPEG', quality=85)
            img_buffer.seek(0)
            
            # Create ReportLab Image
            img = Image(img_buffer)
            
            # Calculate aspect ratio and resize
            aspect = pil_image.width / pil_image.height
            if aspect > 1:  # Landscape
                img.drawWidth = max_width
                img.drawHeight = max_width / aspect
            else:  # Portrait
                img.drawHeight = max_height
                img.drawWidth = max_height * aspect
            
            return img
        except Exception as e:
            print(f"Error converting image: {e}")
            return None
    
    def create_styles(self):
        """Create custom paragraph styles"""
        styles = getSampleStyleSheet()
        
        # Title style
        styles.add(ParagraphStyle(
            name='ChineseTitle',
            parent=styles['Title'],
            fontName=FONT_NAME,
            fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=20,
            alignment=TA_CENTER
        ))
        
        # Heading style
        styles.add(ParagraphStyle(
            name='ChineseHeading',
            parent=styles['Heading1'],
            fontName=FONT_NAME,
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        # Subheading style
        styles.add(ParagraphStyle(
            name='ChineseSubheading',
            parent=styles['Heading2'],
            fontName=FONT_NAME,
            fontSize=14,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=10,
            spaceBefore=10
        ))
        
        # Normal text style
        styles.add(ParagraphStyle(
            name='ChineseNormal',
            parent=styles['Normal'],
            fontName=FONT_NAME,
            fontSize=11,
            leading=16,
            textColor=colors.HexColor('#1f2937')
        ))
        
        # Small text style
        styles.add(ParagraphStyle(
            name='ChineseSmall',
            parent=styles['Normal'],
            fontName=FONT_NAME,
            fontSize=9,
            textColor=colors.HexColor('#6b7280')
        ))
        
        return styles
    
    def format_datetime(self, datetime_str):
        """Format datetime string from Supabase"""
        try:
            if not datetime_str:
                return '未知'
            # Parse ISO format datetime
            dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return str(datetime_str)
    
    def calculate_exercise_duration(self, start_time, end_time):
        """Calculate duration in hours and minutes"""
        try:
            start_parts = start_time.split(':')
            end_parts = end_time.split(':')
            start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
            end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
            duration_minutes = end_minutes - start_minutes
            
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            
            if hours > 0:
                return f"{hours}小時{minutes}分鐘"
            else:
                return f"{minutes}分鐘"
        except:
            return "未知"
    
    def generate_pdf(self, participant_id, output_filename=None):
        """Generate PDF report for participant"""
        try:
            # Fetch participant info
            participant = self.get_participant_info(participant_id)
            if not participant:
                print(f"❌ Participant {participant_id} not found")
                return False
            
            # Set output filename with data directory
            if not output_filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                output_filename = f"dietary_report_{participant_id}_{timestamp}.pdf"
            
            # Add data directory to path
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(
                output_path,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Create styles
            styles = self.create_styles()
            
            # Build PDF content
            story = []
            
            # Title page
            story.append(Paragraph("飲食與運動記錄報告", styles['ChineseTitle']))
            story.append(Spacer(1, 0.5*cm))
            
            # Participant information
            participant_info_items = [
                ('參與者編號', participant['participant_id']),
                ('姓名', participant.get('name', '未填寫')),
                ('性別', '男' if participant.get('gender') == 'male' else '女' if participant.get('gender') == 'female' else '未知'),
                ('年齡', str(participant.get('age', '')) if participant.get('age') else '未填寫'),
                ('記錄創建時間', self.format_datetime(participant.get('created_at')))
            ]
            
            for label, value in participant_info_items:
                story.append(Paragraph(f'<b>{label}：</b>{value}', styles['ChineseNormal']))
                story.append(Spacer(1, 0.2*cm))
            
            story.append(Spacer(1, 0.8*cm))
            
            # Fetch daily records and exercise records
            meal_daily_records = self.get_meal_daily_records(participant_id)
            exercise_records = self.get_exercise_records(participant_id)
            
            if not meal_daily_records and not exercise_records:
                story.append(Paragraph('暫無記錄數據', styles['ChineseNormal']))
            else:
                # Summary statistics
                total_days = len(meal_daily_records)
                completed_days = sum(1 for dr in meal_daily_records if dr.get('is_completed', False))
                total_meals = 0
                total_photos = 0
                meal_counts = {'早餐': 0, '午餐': 0, '晚餐': 0, '上午加餐': 0, '下午加餐': 0, '晚上加餐': 0}
                
                for daily_record in meal_daily_records:
                    meals = self.get_meal_records(daily_record['id'])
                    total_meals += len(meals)
                    for meal in meals:
                        total_photos += meal.get('photo_count', 0)
                        meal_type = meal.get('meal_type', '')
                        if meal_type in meal_counts:
                            meal_counts[meal_type] += 1
                
                # Exercise statistics
                exercise_days = set()
                exercise_type_counts = {}
                total_exercise_time = 0  # in minutes
                
                for exercise in exercise_records:
                    exercise_days.add(exercise.get('record_date'))
                    exercise_type = exercise.get('exercise_type', '未知')
                    
                    if exercise_type != '無運動':
                        exercise_type_counts[exercise_type] = exercise_type_counts.get(exercise_type, 0) + 1
                        
                        # Calculate duration
                        try:
                            start_time = exercise.get('start_time', '00:00')
                            end_time = exercise.get('end_time', '00:00')
                            start_parts = start_time.split(':')
                            end_parts = end_time.split(':')
                            start_minutes = int(start_parts[0]) * 60 + int(start_parts[1])
                            end_minutes = int(end_parts[0]) * 60 + int(end_parts[1])
                            total_exercise_time += (end_minutes - start_minutes)
                        except:
                            pass
                
                exercise_hours = total_exercise_time // 60
                exercise_minutes = total_exercise_time % 60
                
                story.append(Paragraph('飲食記錄摘要', styles['ChineseHeading']))
                story.append(Spacer(1, 0.3*cm))
                
                # Summary items
                summary_items = [
                    ('記錄天數', total_days),
                    ('完成天數', completed_days),
                    ('總餐次', total_meals),
                    ('總照片數', total_photos),
                    ('早餐記錄', meal_counts['早餐']),
                    ('午餐記錄', meal_counts['午餐']),
                    ('晚餐記錄', meal_counts['晚餐']),
                    ('加餐記錄', meal_counts['上午加餐'] + meal_counts['下午加餐'] + meal_counts['晚上加餐'])
                ]
                
                for label, value in summary_items:
                    story.append(Paragraph(f'{label}：{value}', styles['ChineseNormal']))
                    story.append(Spacer(1, 0.15*cm))
                
                # Exercise summary
                if exercise_records:
                    story.append(Spacer(1, 0.5*cm))
                    story.append(Paragraph('運動記錄摘要', styles['ChineseHeading']))
                    story.append(Spacer(1, 0.3*cm))
                    
                    exercise_summary_items = [
                        ('運動記錄天數', len(exercise_days)),
                        ('總運動次數', len([e for e in exercise_records if e.get('exercise_type') != '無運動'])),
                        ('總運動時間', f"{exercise_hours}小時{exercise_minutes}分鐘" if exercise_hours > 0 else f"{exercise_minutes}分鐘")
                    ]
                    
                    for label, value in exercise_summary_items:
                        story.append(Paragraph(f'{label}：{value}', styles['ChineseNormal']))
                        story.append(Spacer(1, 0.15*cm))
                    
                    if exercise_type_counts:
                        story.append(Paragraph('運動類型分佈：', styles['ChineseNormal']))
                        for ex_type, count in sorted(exercise_type_counts.items(), key=lambda x: x[1], reverse=True):
                            story.append(Paragraph(f'　　{ex_type}：{count}次', styles['ChineseSmall']))
                            story.append(Spacer(1, 0.1*cm))
                
                story.append(PageBreak())
                
                # Detailed daily records
                date_labels = {'workday1': '第一個工作日', 'workday2': '第二個工作日', 'restday': '第一個休息日'}
                all_dates = set([dr.get('record_date') for dr in meal_daily_records] + 
                               [er.get('record_date') for er in exercise_records])
                
                sorted_dates = sorted(all_dates, key=lambda x: {'workday1': 1, 'workday2': 2, 'restday': 3}.get(x, 4))
                
                for idx, record_date in enumerate(sorted_dates, 1):
                    date_label = date_labels.get(record_date, record_date)
                    
                    # Date header
                    story.append(Paragraph(f'{date_label}', styles['ChineseHeading']))
                    story.append(Spacer(1, 0.5*cm))
                    
                    # === DIETARY SECTION ===
                    daily_record = next((dr for dr in meal_daily_records if dr.get('record_date') == record_date), None)
                    
                    if daily_record:
                        story.append(Paragraph('飲食記錄', styles['ChineseSubheading']))
                        
                        status_text = '✓ 已完成' if daily_record.get('is_completed') else '○ 進行中'
                        time_text = self.format_datetime(daily_record.get('created_at'))
                        
                        story.append(Paragraph(
                            f'記錄時間：{time_text} | 狀態：{status_text}',
                            styles['ChineseSmall']
                        ))
                        story.append(Spacer(1, 0.3*cm))
                        
                        # Fetch meals for this day
                        meals = self.get_meal_records(daily_record['id'])
                        
                        if not meals:
                            story.append(Paragraph('當日無餐次記錄', styles['ChineseNormal']))
                        else:
                            for meal_idx, meal in enumerate(meals, 1):
                                # Meal header
                                meal_type = meal.get('meal_type', '未知餐次')
                                story.append(Paragraph(f'【{meal_type}】', styles['ChineseNormal']))
                                
                                # Meal details
                                meal_details = []
                                
                                if meal.get('is_snack', False):
                                    if meal.get('snack_type'):
                                        meal_details.append(('加餐類型', meal.get('snack_type')))
                                    if meal.get('meal_time'):
                                        meal_details.append(('進食時間', meal.get('meal_time')))
                                    if meal.get('snack_name'):
                                        meal_details.append(('食物名稱', meal.get('snack_name')))
                                    if meal.get('snack_amount'):
                                        meal_details.append(('估計分量', meal.get('snack_amount')))
                                else:
                                    if meal.get('meal_time'):
                                        meal_details.append(('用餐時間', meal.get('meal_time')))
                                    if meal.get('location'):
                                        meal_details.append(('用餐地點', meal.get('location')))
                                    if meal.get('eating_amount'):
                                        meal_details.append(('進食情況', meal.get('eating_amount')))
                                
                                if meal.get('additional_description'):
                                    meal_details.append(('補充描述', meal.get('additional_description')))
                                
                                meal_details.append(('上傳照片數', str(meal.get('photo_count', 0))))
                                
                                # Display meal details
                                for label, value in meal_details:
                                    story.append(Paragraph(f'　{label}：{value}', styles['ChineseSmall']))
                                    story.append(Spacer(1, 0.05*cm))
                                
                                story.append(Spacer(1, 0.2*cm))
                                
                                # Fetch and display photos
                                photos = self.get_food_photos(meal['id'])
                                
                                if photos:
                                    story.append(Paragraph('　食物照片及描述：', styles['ChineseSmall']))
                                    story.append(Spacer(1, 0.15*cm))
                                    
                                    for photo_idx, photo in enumerate(photos, 1):
                                        # Photo description
                                        if photo.get('description'):
                                            story.append(Paragraph(
                                                f'　　照片 {photo_idx}：{photo["description"]}',
                                                styles['ChineseSmall']
                                            ))
                                        
                                        # Photo image
                                        img = self.base64_to_image(photo.get('photo_data', ''))
                                        if img:
                                            story.append(img)
                                        else:
                                            story.append(Paragraph(
                                                f'　　[照片 {photo_idx} 加載失敗]',
                                                styles['ChineseSmall']
                                            ))
                                        
                                        story.append(Spacer(1, 0.25*cm))
                                
                                story.append(Spacer(1, 0.3*cm))
                    else:
                        story.append(Paragraph('飲食記錄：無', styles['ChineseSubheading']))
                    
                    story.append(Spacer(1, 0.5*cm))
                    
                    # === EXERCISE SECTION ===
                    day_exercises = [e for e in exercise_records if e.get('record_date') == record_date]
                    
                    if day_exercises:
                        story.append(Paragraph('運動記錄', styles['ChineseSubheading']))
                        story.append(Spacer(1, 0.3*cm))
                        
                        # Get activity level info
                        exercise_day_info = self.get_exercise_day_info(participant_id, record_date)
                        
                        if exercise_day_info:
                            activity_level = exercise_day_info.get('activity_level', '未評估')
                            activity_reason = exercise_day_info.get('activity_reason', '')
                            
                            story.append(Paragraph(f'整體活動量：{activity_level}', styles['ChineseNormal']))
                            if activity_reason:
                                story.append(Paragraph(f'原因說明：{activity_reason}', styles['ChineseSmall']))
                            story.append(Spacer(1, 0.3*cm))
                        
                        # Group exercises by type
                        exercise_by_type = {}
                        for exercise in day_exercises:
                            ex_type = exercise.get('exercise_type', '未知')
                            if ex_type not in exercise_by_type:
                                exercise_by_type[ex_type] = []
                            exercise_by_type[ex_type].append(exercise)
                        
                        # Display exercises grouped by type
                        for ex_type, exercises in sorted(exercise_by_type.items()):
                            story.append(Paragraph(f'【{ex_type}】', styles['ChineseNormal']))
                            
                            for exercise in exercises:
                                start_time = exercise.get('start_time', '')
                                end_time = exercise.get('end_time', '')
                                intensity = exercise.get('intensity', '')
                                description = exercise.get('description', '')
                                
                                duration = self.calculate_exercise_duration(start_time, end_time)
                                
                                story.append(Paragraph(
                                    f'　時間：{start_time} - {end_time} ({duration})',
                                    styles['ChineseSmall']
                                ))
                                
                                if ex_type != '無運動' and intensity:
                                    story.append(Paragraph(
                                        f'　強度：{intensity}',
                                        styles['ChineseSmall']
                                    ))
                                
                                if description:
                                    story.append(Paragraph(
                                        f'　描述：{description}',
                                        styles['ChineseSmall']
                                    ))
                                
                                story.append(Spacer(1, 0.2*cm))
                            
                            story.append(Spacer(1, 0.3*cm))
                    else:
                        story.append(Paragraph('運動記錄：無', styles['ChineseSubheading']))
                    
                    # Add page break between days (except last one)
                    if idx < len(sorted_dates):
                        story.append(PageBreak())
            
            # Build PDF
            doc.build(story)
            
            print(f"✅ PDF report generated successfully: {output_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error generating PDF: {e}")
            import traceback
            traceback.print_exc()
            return False


# Usage example
if __name__ == "__main__":
    # Supabase configuration
    SUPABASE_URL = 'https://urmhsphzfmtciybqdptw.supabase.co'
    SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWhzcGh6Zm10Y2l5YnFkcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODgxOTcsImV4cCI6MjA4NDM2NDE5N30.f9zVtTgY0yK6ispISE62MyGmmCV5UuzXqXHonVg2cPE'
    
    # Create PDF generator (will save to 'data' folder)
    pdf_generator = SupabaseDietaryReportGenerator(SUPABASE_URL, SUPABASE_KEY)
    
    # Generate PDF for a specific participant
    participant_id = input("請輸入參與者編號 (Enter Participant ID): ").strip()
    
    if participant_id:
        print(f"\n正在生成報告...")
        success = pdf_generator.generate_pdf(participant_id)
        if success:
            print("\n✅ PDF報告生成成功！")
        else:
            print("\n❌ PDF報告生成失敗")
    else:
        print("❌ 無效的參與者編號")