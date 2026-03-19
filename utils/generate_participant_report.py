import os
import gc
import time
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from supabase import create_client, Client
import base64
from io import BytesIO
from PIL import Image as PILImage

# ── Font Registration ──────────────────────────────────────────
try:
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
    FONT_NAME = 'STSong-Light'
    print("✅ Using STSong-Light font (built-in CJK)")
except Exception:
    try:
        pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
        FONT_NAME = 'HeiseiMin-W3'
        print("✅ Using HeiseiMin-W3 font")
    except Exception:
        FONT_NAME = 'Helvetica'
        print("⚠️ Fallback: Helvetica (Chinese characters may not render)")


class SupabaseDietaryReportGenerator:
    """
    Generates PDF dietary & exercise reports from Supabase.
    
    Optimizations over original:
      1. Batch data fetching (5 queries vs ~30+)
      2. Configurable image compression presets (low/medium/high)
      3. Memory-efficient photo processing with gc.collect()
      4. BytesIO output for GCloud streaming
      5. No duplicate meal fetching (summary & detail share same data)
      6. Progress logging with timing
    """
    
    QUALITY_PRESETS = {
        'low':    {'max_pixels': 500,  'jpeg_quality': 30, 'pdf_width': 7,   'pdf_height': 5.5},
        'medium': {'max_pixels': 800,  'jpeg_quality': 45, 'pdf_width': 9,   'pdf_height': 7},
        'high':   {'max_pixels': 1200, 'jpeg_quality': 65, 'pdf_width': 11,  'pdf_height': 9},
    }
    
    DATE_ORDER = {'workday1': 1, 'workday2': 2, 'restday': 3}
    DATE_LABELS = {'workday1': '第一個工作日', 'workday2': '第二個工作日', 'restday': '第一個休息日'}
    MEAL_ORDER = {'早餐': 1, '上午加餐': 2, '午餐': 3, '下午加餐': 4, '晚餐': 5, '晚上加餐': 6}
    
    def __init__(self, supabase_url, supabase_key, output_dir='data',
                 image_preset='medium', include_photos=True):
        """
        Args:
            supabase_url:   Supabase project URL
            supabase_key:   Supabase anon/service key
            output_dir:     Directory for saved PDFs (default: 'data')
            image_preset:   'low' (~1-3MB), 'medium' (~3-8MB), 'high' (~6-15MB)
            include_photos: False to skip photos entirely (~0.3MB report)
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.output_dir = output_dir
        self.include_photos = include_photos
        
        p = self.QUALITY_PRESETS.get(image_preset, self.QUALITY_PRESETS['medium'])
        self.max_pixels = p['max_pixels']
        self.jpeg_quality = p['jpeg_quality']
        self.pdf_img_width = p['pdf_width'] * cm
        self.pdf_img_height = p['pdf_height'] * cm
        
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"📷 Preset: {image_preset} | max {self.max_pixels}px | "
              f"quality {self.jpeg_quality}% | photos: {include_photos}")
    
    # ── Data Fetching (Batch Optimized) ────────────────────────
    
    def _fetch_participant(self, participant_id):
        try:
            r = self.supabase.table('participants') \
                .select('*').eq('participant_id', participant_id).execute()
            return r.data[0] if r.data else None
        except Exception as e:
            print(f"❌ Fetch participant error: {e}")
            return None
    
    def _fetch_meal_daily_records(self, participant_id):
        try:
            r = self.supabase.table('meal_daily_records') \
                .select('*').eq('participant_id', participant_id).execute()
            data = r.data or []
            data.sort(key=lambda x: self.DATE_ORDER.get(x.get('record_date', ''), 4))
            return data
        except Exception as e:
            print(f"❌ Fetch meal daily records error: {e}")
            return []
    
    def _fetch_all_meal_records(self, participant_id):
        """Fetch ALL meal records for participant in ONE query"""
        try:
            r = self.supabase.table('meal_records') \
                .select('*').eq('participant_id', participant_id).execute()
            return r.data or []
        except Exception as e:
            print(f"❌ Fetch meal records error: {e}")
            return []
    
    def _fetch_all_exercise_daily_records(self, participant_id):
        """Fetch ALL exercise daily records in ONE query"""
        try:
            r = self.supabase.table('exercise_daily_records') \
                .select('*').eq('participant_id', participant_id).execute()
            return r.data or []
        except Exception as e:
            print(f"❌ Fetch exercise daily records error: {e}")
            return []
    
    def _fetch_all_exercise_records(self, participant_id):
        """Fetch ALL exercise records in ONE query"""
        try:
            r = self.supabase.table('exercise_records') \
                .select('*').eq('participant_id', participant_id).execute()
            return r.data or []
        except Exception as e:
            print(f"❌ Fetch exercise records error: {e}")
            return []
    
    def _fetch_food_photos(self, meal_record_id):
        """Fetch photos for ONE meal (lazy — for memory efficiency)"""
        try:
            r = self.supabase.table('food_photos') \
                .select('*').eq('meal_record_id', meal_record_id) \
                .order('photo_order').execute()
            return r.data or []
        except Exception as e:
            print(f"⚠️ Fetch photos error (meal {meal_record_id}): {e}")
            return []
    
    def _fetch_all_participant_ids(self):
        try:
            r = self.supabase.table('participants').select('participant_id').execute()
            return [p['participant_id'] for p in (r.data or [])]
        except Exception as e:
            print(f"❌ Fetch participant list error: {e}")
            return []
        
    def _format_actual_date(self, date_str):
        """Format actual date for display"""
        if not date_str:
            return ''
        for fmt in ('%d/%m/%Y', '%Y-%m-%d'):
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y年%m月%d日')
            except ValueError:
                continue
        return date_str

    # ── Image Processing (Aggressive Compression) ─────────────
    
    def _base64_to_image(self, base64_string):
        """Convert base64 → resized & compressed JPEG → ReportLab Image"""
        try:
            if not base64_string:
                return None
            
            # Strip data URL prefix if present
            if 'base64,' in base64_string:
                base64_string = base64_string.split('base64,')[1]
            
            raw = base64.b64decode(base64_string)
            pil = PILImage.open(BytesIO(raw))
            del raw  # free raw bytes immediately
            
            # Convert to RGB
            if pil.mode in ('RGBA', 'LA', 'P'):
                pil = pil.convert('RGB')
            
            # Downscale to max_pixels on longest side
            max_dim = max(pil.width, pil.height)
            if max_dim > self.max_pixels:
                ratio = self.max_pixels / max_dim
                pil = pil.resize(
                    (int(pil.width * ratio), int(pil.height * ratio)),
                    PILImage.LANCZOS
                )
            
            img_w, img_h = pil.size
            
            # Compress to JPEG with optimize flag
            buf = BytesIO()
            pil.save(buf, format='JPEG', quality=self.jpeg_quality, optimize=True)
            buf.seek(0)
            del pil  # free PIL image
            
            compressed_kb = len(buf.getvalue()) / 1024
            
            # Create ReportLab Image
            rl_img = Image(buf)
            
            # Calculate PDF display dimensions preserving aspect ratio
            aspect = img_w / img_h
            if aspect > 1:  # landscape
                rl_img.drawWidth = self.pdf_img_width
                rl_img.drawHeight = self.pdf_img_width / aspect
            else:  # portrait or square
                rl_img.drawHeight = self.pdf_img_height
                rl_img.drawWidth = self.pdf_img_height * aspect
            
            return rl_img
        except Exception as e:
            print(f"⚠️ Image conversion error: {e}")
            return None
    
    # ── PDF Styles ─────────────────────────────────────────────
    
    def _create_styles(self):
        styles = getSampleStyleSheet()
        
        styles.add(ParagraphStyle(
            'ChineseTitle', parent=styles['Title'],
            fontName=FONT_NAME, fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=20, alignment=TA_CENTER
        ))
        styles.add(ParagraphStyle(
            'ChineseHeading', parent=styles['Heading1'],
            fontName=FONT_NAME, fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12, spaceBefore=12
        ))
        styles.add(ParagraphStyle(
            'ChineseSubheading', parent=styles['Heading2'],
            fontName=FONT_NAME, fontSize=14,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=10, spaceBefore=10
        ))
        styles.add(ParagraphStyle(
            'ChineseNormal', parent=styles['Normal'],
            fontName=FONT_NAME, fontSize=11,
            leading=16, textColor=colors.HexColor('#1f2937')
        ))
        styles.add(ParagraphStyle(
            'ChineseSmall', parent=styles['Normal'],
            fontName=FONT_NAME, fontSize=9,
            textColor=colors.HexColor('#6b7280')
        ))
        
        return styles
    
    # ── Helpers ────────────────────────────────────────────────
    
    @staticmethod
    def _fmt_dt(dt_str):
        """Format ISO datetime string for display"""
        try:
            if not dt_str:
                return '未知'
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            return str(dt_str)
    
    @staticmethod
    def _calc_duration(start, end):
        """Calculate duration string from HH:MM times"""
        try:
            s = start.split(':')
            e = end.split(':')
            mins = (int(e[0]) * 60 + int(e[1])) - (int(s[0]) * 60 + int(s[1]))
            h, m = divmod(max(0, mins), 60)
            return f"{h}小時{m}分鐘" if h > 0 else f"{m}分鐘"
        except Exception:
            return "未知"
    
    # ── Story Builder (Core Logic) ─────────────────────────────
    
    def _build_story(self, participant_id):
        """
        Build complete PDF story for a participant.
        Structure: Day (with actual date) → 飲食記錄 → 活動記錄
        """
        # ── Phase 1: Batch fetch all data ──
        t_fetch = time.time()

        participant = self._fetch_participant(participant_id)
        if not participant:
            print(f"❌ Participant '{participant_id}' not found")
            return None

        meal_daily_records = self._fetch_meal_daily_records(participant_id)
        all_meals = self._fetch_all_meal_records(participant_id)
        ex_daily_records = self._fetch_all_exercise_daily_records(participant_id)
        all_exercises = self._fetch_all_exercise_records(participant_id)

        print(f"📊 Fetched in {time.time()-t_fetch:.1f}s: "
            f"{len(meal_daily_records)} meal days | {len(all_meals)} meals | "
            f"{len(ex_daily_records)} exercise days | {len(all_exercises)} exercises")

        # ── Group data for O(1) lookups ──
        meals_by_daily = {}
        for m in all_meals:
            meals_by_daily.setdefault(m.get('daily_record_id'), []).append(m)
        for k in meals_by_daily:
            meals_by_daily[k].sort(
                key=lambda x: self.MEAL_ORDER.get(x.get('meal_type', ''), 7)
            )

        ex_daily_by_date = {r['record_date']: r for r in ex_daily_records}

        exercises_by_date = {}
        for e in all_exercises:
            exercises_by_date.setdefault(e.get('record_date'), []).append(e)
        for k in exercises_by_date:
            exercises_by_date[k].sort(key=lambda x: x.get('start_time', '00:00'))

        # ── Build actual date map from daily records ──
        actual_date_map = {}
        for d in meal_daily_records:
            rd = d.get('record_date', '')
            real = d.get('actual_date') or ''
            if rd and real:
                actual_date_map[rd] = real
        for d in ex_daily_records:
            rd = d.get('record_date', '')
            real = d.get('actual_date') or ''
            if rd and real and rd not in actual_date_map:
                actual_date_map[rd] = real

        # ── Phase 2: Build story ──
        styles = self._create_styles()
        story = []

        # ────── Title & Participant Info (NO created_at) ──────
        story.append(Paragraph("飲食與活動記錄報告", styles['ChineseTitle']))
        story.append(Spacer(1, 0.5 * cm))

        gender_map = {'male': '男', 'female': '女'}
        info_items = [
            ('參與者編號', participant['participant_id']),
            ('姓名', participant.get('name') or '未填寫'),
            ('性別', gender_map.get(participant.get('gender', ''), '未知')),
            ('年齡', str(participant.get('age', '')) if participant.get('age') else '未填寫'),
        ]
        for label, val in info_items:
            story.append(Paragraph(f'<b>{label}：</b>{val}', styles['ChineseNormal']))
            story.append(Spacer(1, 0.2 * cm))

        story.append(Spacer(1, 0.8 * cm))

        # No data at all
        if not meal_daily_records and not all_exercises:
            story.append(Paragraph('暫無記錄數據', styles['ChineseNormal']))
            return story

        # ────── Meal Summary ──────
        total_photos = sum(m.get('photo_count', 0) for m in all_meals)
        completed_days = sum(1 for d in meal_daily_records if d.get('is_completed'))

        mt_counts = {}
        for m in all_meals:
            mt = m.get('meal_type', '')
            mt_counts[mt] = mt_counts.get(mt, 0) + 1

        snack_total = sum(mt_counts.get(t, 0) for t in ['上午加餐', '下午加餐', '晚上加餐'])

        story.append(Paragraph('飲食記錄摘要', styles['ChineseHeading']))
        story.append(Spacer(1, 0.3 * cm))

        for label, val in [
            ('記錄天數', len(meal_daily_records)),
            ('完成天數', completed_days),
            ('總餐次', len(all_meals)),
            ('總照片數', total_photos),
            ('早餐記錄', mt_counts.get('早餐', 0)),
            ('午餐記錄', mt_counts.get('午餐', 0)),
            ('晚餐記錄', mt_counts.get('晚餐', 0)),
            ('加餐記錄', snack_total),
        ]:
            story.append(Paragraph(f'{label}：{val}', styles['ChineseNormal']))
            story.append(Spacer(1, 0.15 * cm))

        # ────── Activity Summary (renamed from 運動) ──────
        if all_exercises:
            story.append(Spacer(1, 0.5 * cm))
            story.append(Paragraph('活動記錄摘要', styles['ChineseHeading']))
            story.append(Spacer(1, 0.3 * cm))

            ex_dates = set(e.get('record_date') for e in all_exercises)
            active_exercises = [e for e in all_exercises if e.get('exercise_type') != '無運動']

            total_ex_mins = 0
            et_counts = {}
            for e in active_exercises:
                et = e.get('exercise_type', '未知')
                et_counts[et] = et_counts.get(et, 0) + 1
                try:
                    sp = e.get('start_time', '00:00').split(':')
                    ep = e.get('end_time', '00:00').split(':')
                    total_ex_mins += (int(ep[0]) * 60 + int(ep[1])) - (int(sp[0]) * 60 + int(sp[1]))
                except Exception:
                    pass

            h, m = divmod(max(0, total_ex_mins), 60)
            time_str = f"{h}小時{m}分鐘" if h > 0 else f"{m}分鐘"

            for label, val in [
                ('活動記錄天數', len(ex_dates)),
                ('總活動次數', len(active_exercises)),
                ('總活動時間', time_str),
            ]:
                story.append(Paragraph(f'{label}：{val}', styles['ChineseNormal']))
                story.append(Spacer(1, 0.15 * cm))

            if et_counts:
                story.append(Paragraph('活動類型分佈：', styles['ChineseNormal']))
                for et, cnt in sorted(et_counts.items(), key=lambda x: -x[1]):
                    story.append(Paragraph(f'　　{et}：{cnt}次', styles['ChineseSmall']))
                    story.append(Spacer(1, 0.1 * cm))

        story.append(PageBreak())

        # ────── Detailed Daily Records ──────
        all_dates = set(
            [d.get('record_date') for d in meal_daily_records] +
            list(exercises_by_date.keys())
        )
        sorted_dates = sorted(all_dates, key=lambda x: self.DATE_ORDER.get(x, 4))

        for idx, record_date in enumerate(sorted_dates, 1):
            date_label = self.DATE_LABELS.get(record_date, record_date)

            # ── Day header with actual date ──
            actual_date = actual_date_map.get(record_date, '')
            if actual_date:
                header_text = f'{date_label}（{self._format_actual_date(actual_date)}）'
            else:
                header_text = date_label

            story.append(Paragraph(header_text, styles['ChineseHeading']))
            story.append(Spacer(1, 0.5 * cm))

            # ── Dietary Section (NO record time) ──
            daily_rec = next(
                (d for d in meal_daily_records if d.get('record_date') == record_date),
                None
            )

            if daily_rec:
                story.append(Paragraph('飲食記錄', styles['ChineseSubheading']))
                story.append(Spacer(1, 0.3 * cm))

                meals = meals_by_daily.get(daily_rec['id'], [])

                if not meals:
                    story.append(Paragraph('當日無餐次記錄', styles['ChineseNormal']))
                else:
                    for meal in meals:
                        meal_type = meal.get('meal_type', '未知餐次')
                        story.append(Paragraph(f'【{meal_type}】', styles['ChineseNormal']))

                        # Meal detail lines
                        details = []
                        if meal.get('is_snack'):
                            for key, label in [
                                ('snack_type', '加餐類型'),
                                ('meal_time', '進食時間'),
                                ('snack_name', '食物名稱'),
                                ('snack_amount', '估計分量'),
                            ]:
                                if meal.get(key):
                                    details.append((label, meal[key]))
                        else:
                            for key, label in [
                                ('meal_time', '用餐時間'),
                                ('location', '用餐地點'),
                                ('eating_amount', '進食情況'),
                            ]:
                                if meal.get(key):
                                    details.append((label, meal[key]))

                        if meal.get('additional_description'):
                            details.append(('補充描述', meal['additional_description']))
                        details.append(('上傳照片數', str(meal.get('photo_count', 0))))

                        for label, val in details:
                            story.append(Paragraph(f'　{label}：{val}', styles['ChineseSmall']))
                            story.append(Spacer(1, 0.05 * cm))

                        story.append(Spacer(1, 0.2 * cm))

                        # ── Photos (lazy fetch per meal) ──
                        if self.include_photos and meal.get('photo_count', 0) > 0:
                            print(f"  📸 Fetching {meal.get('photo_count', 0)} photo(s) for {meal_type}...")
                            photos = self._fetch_food_photos(meal['id'])

                            if photos:
                                story.append(Paragraph('　食物照片及描述：', styles['ChineseSmall']))
                                story.append(Spacer(1, 0.15 * cm))

                                for pi, photo in enumerate(photos, 1):
                                    if photo.get('description'):
                                        story.append(Paragraph(
                                            f'　　照片 {pi}：{photo["description"]}',
                                            styles['ChineseSmall']
                                        ))

                                    rl_img = self._base64_to_image(photo.get('photo_data', ''))
                                    if rl_img:
                                        story.append(rl_img)
                                    else:
                                        story.append(Paragraph(
                                            f'　　[照片 {pi} 加載失敗]',
                                            styles['ChineseSmall']
                                        ))
                                    story.append(Spacer(1, 0.25 * cm))

                                del photos
                                gc.collect()

                        story.append(Spacer(1, 0.3 * cm))
            else:
                story.append(Paragraph('飲食記錄：無', styles['ChineseSubheading']))

            story.append(Spacer(1, 0.5 * cm))

            # ── Activity Section (renamed from 運動, NO record time) ──
            day_exercises = exercises_by_date.get(record_date, [])

            if day_exercises:
                story.append(Paragraph('活動記錄', styles['ChineseSubheading']))
                story.append(Spacer(1, 0.3 * cm))

                # Activity level from exercise_daily_records
                ex_daily = ex_daily_by_date.get(record_date)
                if ex_daily:
                    story.append(Paragraph(
                        f'整體活動量：{ex_daily.get("activity_level", "未評估")}',
                        styles['ChineseNormal']
                    ))
                    if ex_daily.get('activity_reason'):
                        story.append(Paragraph(
                            f'原因說明：{ex_daily["activity_reason"]}',
                            styles['ChineseSmall']
                        ))
                    story.append(Spacer(1, 0.3 * cm))

                # Group exercises by type
                ex_by_type = {}
                for e in day_exercises:
                    et = e.get('exercise_type', '未知')
                    ex_by_type.setdefault(et, []).append(e)

                for et, exercises in sorted(ex_by_type.items()):
                    story.append(Paragraph(f'【{et}】', styles['ChineseNormal']))
                    for e in exercises:
                        st = e.get('start_time', '')
                        en = e.get('end_time', '')
                        dur = self._calc_duration(st, en)

                        story.append(Paragraph(
                            f'　時間：{st} - {en} ({dur})',
                            styles['ChineseSmall']
                        ))
                        if et != '無運動' and e.get('intensity'):
                            story.append(Paragraph(
                                f'　強度：{e["intensity"]}',
                                styles['ChineseSmall']
                            ))
                        if e.get('description'):
                            story.append(Paragraph(
                                f'　描述：{e["description"]}',
                                styles['ChineseSmall']
                            ))
                        story.append(Spacer(1, 0.2 * cm))
                    story.append(Spacer(1, 0.3 * cm))
            else:
                story.append(Paragraph('活動記錄：無', styles['ChineseSubheading']))

            # Page break between days (except last)
            if idx < len(sorted_dates):
                story.append(PageBreak())

        return story
    
    # ── Public API ─────────────────────────────────────────────
    
    def generate_pdf(self, participant_id, output_filename=None):
        """Generate PDF to file — delegates to generate_pdf_buffer"""
        pdf_buffer = self.generate_pdf_buffer(participant_id)
        if pdf_buffer is None:
            return None

        if output_filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"dietary_report_{participant_id}_{timestamp}.pdf"

        output_path = os.path.join(self.output_dir, output_filename)
        with open(output_path, 'wb') as f:
            f.write(pdf_buffer.read())

        print(f"PDF saved to: {output_path}")
        return output_path
    
    def generate_pdf_buffer(self, participant_id):
        """Generate PDF → BytesIO buffer for streaming"""
        t0 = time.time()
        story = self._build_story(participant_id)
        if story is None:
            return None

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=50, leftMargin=50,
            topMargin=50, bottomMargin=50
        )
        doc.build(story)
        buffer.seek(0)

        elapsed = time.time() - t0
        size_mb = len(buffer.getvalue()) / (1024 * 1024)
        print(f"✅ PDF generated in {elapsed:.1f}s ({size_mb:.1f}MB)")
        return buffer
    
    def generate_all_reports(self):
        """
        Generate PDF reports for ALL participants.
        
        Returns: dict {participant_id: file_path_or_None}
        """
        pids = self._fetch_all_participant_ids()
        print(f"\n📋 Generating reports for {len(pids)} participants\n")
        
        results = {}
        total_t0 = time.time()
        
        for i, pid in enumerate(pids, 1):
            print(f"\n[{i}/{len(pids)}] Processing: {pid}")
            results[pid] = self.generate_pdf(pid)
        
        # Summary
        ok = sum(1 for v in results.values() if v is not None)
        failed = len(results) - ok
        total_elapsed = time.time() - total_t0
        
        print(f"\n{'='*50}")
        print(f"📊 Complete: {ok} success | {failed} failed | {len(results)} total")
        print(f"⏱️  Total time: {total_elapsed:.1f}s")
        
        if failed > 0:
            failed_ids = [k for k, v in results.items() if v is None]
            print(f"❌ Failed: {', '.join(failed_ids)}")
        
        return results


# ── Main Entry Point ───────────────────────────────────────────
if __name__ == "__main__":
    import sys
    
    SUPABASE_URL = os.environ.get(
        'SUPABASE_URL',
        'https://urmhsphzfmtciybqdptw.supabase.co'
    )
    SUPABASE_KEY = os.environ.get(
        'SUPABASE_KEY',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWhzcGh6Zm10Y2l5YnFkcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODgxOTcsImV4cCI6MjA4NDM2NDE5N30.f9zVtTgY0yK6ispISE62MyGmmCV5UuzXqXHonVg2cPE'
    )
    
    # Parse command-line options
    preset = 'medium'
    if '--low' in sys.argv:
        preset = 'low'
    elif '--high' in sys.argv:
        preset = 'high'
    
    no_photos = '--no-photos' in sys.argv
    
    gen = SupabaseDietaryReportGenerator(
        SUPABASE_URL, SUPABASE_KEY,
        image_preset=preset,
        include_photos=not no_photos
    )
    
    if '--all' in sys.argv:
        # Generate reports for ALL participants
        gen.generate_all_reports()
    else:
        # Single participant
        pid = input("請輸入參與者編號 (Enter Participant ID): ").strip()
        if pid:
            path = gen.generate_pdf(pid)
            if path:
                print(f"\n✅ PDF報告生成成功！")
            else:
                print(f"\n❌ PDF報告生成失敗")
        else:
            print("❌ 無效的參與者編號")