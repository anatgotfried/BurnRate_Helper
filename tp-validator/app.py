import os
import json
import requests
import re
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, jsonify
from icalendar import Calendar
from dateutil import tz

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SESSION_COOKIE_SECURE'] = False  # For localhost development
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Configuration
DATA_DIR = 'data'
DEFAULT_ICAL_URL = 'https://www.trainingpeaks.com/ical/FQ52PNFB5MWLS.ics'

# Strava OAuth Configuration
STRAVA_CLIENT_ID = '180503'  # Your client ID
STRAVA_CLIENT_SECRET = 'd56f23c5f5ff634fc90ba08df45d5e3266664d11'
STRAVA_REDIRECT_URI = 'http://127.0.0.1:5001/strava/callback'
STRAVA_SCOPE = 'read,activity:read'

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def get_workouts_file(ical_url):
    """Extract Training Peaks ID from URL and generate filename."""
    # Extract ID from URL (e.g., FQ52PNFB5MWLS from the .ics filename)
    match = re.search(r'/([A-Z0-9]+)\.ics', ical_url)
    if match:
        tp_id = match.group(1)
        return os.path.join(DATA_DIR, f'workouts_{tp_id}.json')
    # Fallback to default
    return os.path.join(DATA_DIR, 'workouts_default.json')


def _find_matching_tp_workout(strava_workout, tp_workouts, matched_tp_uids):
    """Find a matching TP workout for a Strava workout."""
    workout_date = strava_workout['start_date']
    workout_start_time = strava_workout.get('start_time')
    workout_type = strava_workout.get('activity_type', '').lower()
    workout_summary = strava_workout.get('summary', '').lower()
    
    for tp_uid, tp_workout in tp_workouts.items():
        if tp_uid in matched_tp_uids:
            continue  # Already matched
        
        tp_date = tp_workout.get('start_date') or tp_workout.get('start_time', '').split('T')[0]
        tp_start_time = tp_workout.get('start_time')
        tp_summary = tp_workout.get('summary', '').lower()
        
        # Check if dates match
        if tp_date != workout_date:
            continue
        
        # Check if activity types match
        if not _activities_match(workout_type, workout_summary, tp_summary):
            continue
        
        # Check if workout is in the past
        try:
            workout_datetime = datetime.fromisoformat(workout_date)
            today = datetime.now().date()
            is_past = workout_datetime.date() < today
        except:
            is_past = False
        
        # For past workouts: same date + same sport type = automatic match
        if is_past:
            return tp_uid
        
        # For future workouts: check time proximity
        if workout_start_time and tp_start_time:
            try:
                strava_dt = datetime.fromisoformat(workout_start_time.replace('Z', '+00:00'))
                tp_dt = datetime.fromisoformat(tp_start_time.replace('Z', '+00:00'))
                time_diff = abs((strava_dt - tp_dt).total_seconds())
                
                if time_diff <= 3600:  # Within 1 hour
                    return tp_uid
            except:
                pass
    
    return None


def _activities_match(strava_type, strava_summary, tp_summary):
    """Check if Strava and TP activities are the same sport type."""
    # Direct type matching
    if 'run' in strava_type and 'run' in tp_summary:
        return True
    elif any(x in strava_type for x in ['ride', 'bike', 'virtualride']) and any(x in tp_summary for x in ['bike', 'ride']):
        return True
    elif 'swim' in strava_type and 'swim' in tp_summary:
        return True
    elif strava_type in tp_summary:
        return True
    
    # Special cases
    if 'zwift' in strava_summary and any(x in tp_summary for x in ['bike', 'ride']):
        return True
    elif 'virtualride' in strava_type and any(x in tp_summary for x in ['bike', 'ride']):
        return True
    
    return False


def _is_past_planned_workout(workout):
    """Check if a workout is a past planned workout that should be removed."""
    try:
        workout_date_str = workout.get('start_date') or workout.get('start_time', '').split('T')[0]
        if not workout_date_str:
            return False
            
        workout_date = datetime.fromisoformat(workout_date_str).date()
        today = datetime.now().date()
        
        # Must be in the past
        if workout_date >= today:
            return False
        
        # Must be planned (not completed)
        execution_status = workout.get('parsed_execution_status', 'planned')
        if execution_status == 'completed':
            return False
        
        # Remove past planned workouts (TP workouts have source=None initially, Strava workouts have source='strava')
        # If no source is set, it's a TP workout
        source = workout.get('source')
        return source is None or source == 'training_peaks'
        
    except:
        return False


def merge_workouts_by_source(tp_workouts, strava_workouts, enabled_sources):
    """
    Merge workouts from TP and Strava based on enabled sources.
    Priority: Strava completed > TP planned
    
    Matching strategy:
    - Same date (within same day)
    - Similar activity type (Run, Bike, Swim)
    - Start time within 2-hour window
    """
    merged = {}
    matched_tp_uids = set()
    
    # Add Training Peaks workouts if enabled
    # TP workouts will be added later (only unmatched ones)
    
    # Add Strava workouts if enabled
    if 'strava' in enabled_sources:
        for uid, workout in strava_workouts.items():
            matched_tp_uid = None
            
            # Try to match with TP workout if both sources enabled
            if 'tp' in enabled_sources:
                matched_tp_uid = _find_matching_tp_workout(workout, tp_workouts, matched_tp_uids)
                if matched_tp_uid:
                    matched_tp_uids.add(matched_tp_uid)
            
            # If matched, replace TP workout with Strava (Strava takes precedence for completed)
            if matched_tp_uid:
                workout['replaced_tp_uid'] = matched_tp_uid
                # Use Strava UID instead of TP UID to avoid duplicates
                merged[uid] = workout
            else:
                merged[uid] = workout
    
    # Add unmatched TP workouts (filter out past planned workouts)
    if 'tp' in enabled_sources:
        for tp_uid, tp_workout in tp_workouts.items():
            if tp_uid not in matched_tp_uids:
                # Skip past planned TP workouts (they should be removed)
                if _is_past_planned_workout(tp_workout):
                    continue
                    
                tp_workout['source'] = 'training_peaks'
                merged[tp_uid] = tp_workout
    
    return merged


class WorkoutManager:
    """Manages workout data storage, retrieval, and change tracking."""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.data = self.load_data()
    
    def load_data(self):
        """Load workout data from JSON file."""
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return self.initialize_data()
        return self.initialize_data()
    
    def initialize_data(self):
        """Initialize empty data structure."""
        return {
            'last_updated': None,
            'workouts': {},
            'change_log': []
        }
    
    def save_data(self):
        """Save workout data to JSON file."""
        with open(self.filepath, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_current_workouts(self):
        """Get all current workouts (non-deleted ones)."""
        current = {}
        for uid, workout_info in self.data['workouts'].items():
            if workout_info.get('current'):
                current[uid] = workout_info['current']
        return current
    
    def update_workouts(self, new_workouts):
        """Update workouts and track changes."""
        timestamp = datetime.now(tz.UTC).isoformat()
        current_workouts = self.get_current_workouts()
        
        changes = {
            'timestamp': timestamp,
            'additions': [],
            'modifications': [],
            'deletions': [],
            'movements': []
        }
        
        # Track workouts that are being replaced
        replaced_uids = set()
        
        # Detect additions and modifications
        for uid, new_workout in new_workouts.items():
            # Check if this workout replaces another workout
            if 'replaced_tp_uid' in new_workout:
                replaced_uid = new_workout['replaced_tp_uid']
                replaced_uids.add(replaced_uid)
                
                # Mark the replaced workout as deleted
                if replaced_uid in current_workouts:
                    old_workout = current_workouts[replaced_uid]
                    changes['deletions'].append({
                        'uid': replaced_uid,
                        'summary': old_workout['summary'],
                        'reason': f'replaced_by_{new_workout["source"]}'
                    })
                    
                    # Mark as deleted in history
                    if replaced_uid in self.data['workouts']:
                        self.data['workouts'][replaced_uid]['history'].append({
                            'timestamp': timestamp,
                            'action': 'deleted',
                            'reason': f'replaced_by_{new_workout["source"]}',
                            'replaced_by': uid
                        })
                        # Remove from current workouts
                        if 'current' in self.data['workouts'][replaced_uid]:
                            del self.data['workouts'][replaced_uid]['current']
            
            if uid not in current_workouts:
                # New workout
                changes['additions'].append(new_workout)
                self.data['workouts'][uid] = {
                    'current': new_workout,
                    'history': [{
                        'timestamp': timestamp,
                        'action': 'added',
                        'data': new_workout
                    }]
                }
            else:
                # Existing workout - check for changes
                old_workout = current_workouts[uid]
                change_details = self.detect_changes(old_workout, new_workout)
                
                if change_details:
                    changes['modifications'].append({
                        'uid': uid,
                        'old': old_workout,
                        'new': new_workout,
                        'changes': change_details
                    })
                    
                    # Check if it's a movement (time change)
                    if 'start_time' in change_details or 'end_time' in change_details:
                        changes['movements'].append({
                            'uid': uid,
                            'summary': new_workout['summary'],
                            'old_start': old_workout['start_time'],
                            'new_start': new_workout['start_time']
                        })
                    
                    # Update workout
                    self.data['workouts'][uid]['current'] = new_workout
                    self.data['workouts'][uid]['history'].append({
                        'timestamp': timestamp,
                        'action': 'modified',
                        'data': new_workout,
                        'changes': change_details
                    })
        
        # Detect deletions (or aged out from rolling window)
        for uid, old_workout in current_workouts.items():
            if uid not in new_workouts and uid not in replaced_uids:
                # IMPORTANT: Never delete completed workouts - they're permanent historical records
                was_completed = (
                    old_workout.get('parsed_execution_status') == 'completed' or
                    old_workout.get('status') == 'COMPLETED' or
                    (old_workout.get('has_time') and not old_workout.get('is_all_day'))
                )
                
                if was_completed:
                    # Completed workout disappeared from feed (normal - rolling window)
                    # Keep it in current state - it's a permanent record
                    # Don't add to deletions or changes - this is expected behavior
                    continue
                
                # For non-completed workouts, determine if deletion or aged out
                deletion_type = self.classify_deletion(old_workout, timestamp)
                
                changes['deletions'].append({
                    **old_workout,
                    'deletion_type': deletion_type
                })
                self.data['workouts'][uid]['current'] = None
                self.data['workouts'][uid]['history'].append({
                    'timestamp': timestamp,
                    'action': 'deleted',
                    'deletion_type': deletion_type,
                    'data': old_workout
                })
        
        # Update metadata and save
        self.data['last_updated'] = timestamp
        if any([changes['additions'], changes['modifications'], 
                changes['deletions'], changes['movements']]):
            self.data['change_log'].append(changes)
        
        self.save_data()
        return changes
    
    def classify_deletion(self, workout, current_timestamp):
        """
        Classify whether a deletion is deliberate or just aged out from rolling window.
        
        Training Peaks iCal feeds vary by account but typically show:
        - Past: 4-7 days (sometimes more for premium accounts)
        - Future: 6-14 days (sometimes up to 90 days)
        
        Conservative thresholds to avoid false positives:
        - 0-2 days past: Likely deliberate deletion (coach action)
        - 3-5 days past: Probably aged out of feed window
        - 5+ days past: Definitely aged out
        - Future: Always a deliberate deletion if removed
        """
        try:
            # Parse workout date
            workout_date_str = workout.get('start_date') or workout.get('start_time')
            if not workout_date_str:
                return 'deleted'  # Can't determine, assume deleted
            
            # Parse dates, handling both with and without timezone
            workout_date_str_clean = workout_date_str.replace('Z', '+00:00')
            current_timestamp_clean = current_timestamp.replace('Z', '+00:00')
            
            workout_date = datetime.fromisoformat(workout_date_str_clean)
            current_time = datetime.fromisoformat(current_timestamp_clean)
            
            # If either is naive, make both naive for comparison
            if workout_date.tzinfo is None or current_time.tzinfo is None:
                workout_date = workout_date.replace(tzinfo=None)
                current_time = current_time.replace(tzinfo=None)
            
            # Calculate days since workout
            days_since = (current_time - workout_date).days
            
            # Check execution status
            was_completed = (
                workout.get('parsed_execution_status') == 'completed' or
                workout.get('status') == 'COMPLETED' or
                (workout.get('has_time') and not workout.get('is_all_day'))  # Executed workouts have times
            )
            
            # Classification logic based on shorter feed windows
            if days_since < 0:
                # Future workout deleted - coach removed it
                return 'deleted_future'
            elif days_since <= 2:
                # Very recent past - if disappeared, likely deliberate deletion
                # But if not completed and 1-2 days old, could be aging out
                if was_completed:
                    return 'deleted_recent'  # Odd to delete completed workout
                else:
                    # Not completed within 1-2 days could be either deleted or aged out
                    # Be conservative - assume aged out after 2 days
                    if days_since == 0:
                        return 'deleted_recent'  # Today's workout deleted
                    else:
                        return 'not_executed_aged_out'  # Yesterday+ not executed
            elif days_since <= 5:
                # 3-5 days old - beyond typical feed window
                if was_completed:
                    return 'aged_out_completed'  # Normal aging
                else:
                    return 'not_executed_aged_out'  # Normal - fell off window
            else:
                # 5+ days old - definitely aged out
                if was_completed:
                    return 'aged_out_completed'  # Normal - old completed workout
                else:
                    return 'aged_out_not_executed'  # Normal - old missed workout
        
        except Exception as e:
            print(f"Error classifying deletion: {e}")
            return 'deleted'  # Default to deleted
    
    def detect_changes(self, old, new):
        """Detect specific changes between old and new workout data."""
        changes = {}
        
        # Fields to compare
        fields = ['summary', 'description', 'start_time', 'end_time', 
                  'start_date', 'location', 'status', 'sequence', 'is_all_day',
                  'duration', 'parsed_duration', 'parsed_planned_duration', 
                  'parsed_distance', 'duration_type', 'source', 'activity_type',
                  'strava_average_heartrate', 'strava_average_watts', 'strava_calories']
        
        for field in fields:
            old_val = old.get(field)
            new_val = new.get(field)
            if old_val != new_val:
                changes[field] = {'old': old_val, 'new': new_val}
        
        return changes if changes else None


class ICalParser:
    """Parses iCal files and extracts workout data."""
    
    @staticmethod
    def fetch_ical(url):
        """Fetch iCal file from URL, converting webcal:// to https://."""
        if url.startswith('webcal://'):
            url = 'https://' + url[9:]
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    
    @staticmethod
    def parse_ical(ical_content):
        """Parse iCal content and extract workout data."""
        cal = Calendar.from_ical(ical_content)
        workouts = {}
        
        for component in cal.walk():
            if component.name == "VEVENT":
                workout = ICalParser.extract_workout_data(component)
                if workout and workout['uid']:
                    workouts[workout['uid']] = workout
        
        return workouts
    
    @staticmethod
    def extract_workout_data(component):
        """Extract relevant data from an iCal event component."""
        try:
            # Get start and end time info
            dtstart = component.get('DTSTART')
            dtend = component.get('DTEND')
            
            # Check if this is an all-day event (date only, no time)
            is_all_day = False
            if dtstart:
                dt_value = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
                is_all_day = isinstance(dt_value, date) and not isinstance(dt_value, datetime)
            
            # Format times appropriately
            start_time_info = ICalParser.format_datetime(dtstart)
            end_time_info = ICalParser.format_datetime(dtend)
            
            # Calculate duration
            duration = ICalParser.calculate_duration(dtstart, dtend)
            
            # Get description and parse details
            description = str(component.get('DESCRIPTION', ''))
            parsed_details = ICalParser.parse_description(description)
            
            # Validate execution status - future workouts cannot be completed
            execution_status = parsed_details.get('execution_status')
            if execution_status == 'completed':
                try:
                    workout_date_str = start_time_info['iso'] if start_time_info else None
                    if workout_date_str:
                        if 'T' in workout_date_str:
                            workout_date = datetime.fromisoformat(workout_date_str.replace('Z', '+00:00')).date()
                        else:
                            workout_date = datetime.fromisoformat(workout_date_str).date()
                        
                        current_date = datetime.now().date()
                        if workout_date > current_date:
                            execution_status = 'planned'  # Force future workouts to be planned
                except:
                    pass  # If date parsing fails, keep original status
            
            workout = {
                'uid': str(component.get('UID', '')),
                'summary': str(component.get('SUMMARY', '')),
                'description': description,
                'start_time': start_time_info['iso'] if start_time_info else None,
                'start_date': start_time_info['date'] if start_time_info else None,
                'end_time': end_time_info['iso'] if end_time_info else None,
                'end_date': end_time_info['date'] if end_time_info else None,
                'is_all_day': is_all_day,
                'has_time': not is_all_day,
                'duration': duration,
                'location': str(component.get('LOCATION', '')),
                'status': str(component.get('STATUS', '')),
                'sequence': int(component.get('SEQUENCE', 0)),
                'created': ICalParser.format_datetime(component.get('CREATED'))['iso'] if component.get('CREATED') else None,
                'last_modified': ICalParser.format_datetime(component.get('LAST-MODIFIED'))['iso'] if component.get('LAST-MODIFIED') else None,
                'categories': str(component.get('CATEGORIES', '')),
                'parsed_duration': parsed_details.get('duration'),
                'parsed_duration_formatted': parsed_details.get('duration_formatted'),
                'parsed_planned_duration': parsed_details.get('planned_duration'),
                'parsed_planned_duration_formatted': parsed_details.get('planned_duration_formatted'),
                'parsed_distance': parsed_details.get('distance'),
                'parsed_tss': parsed_details.get('tss'),
                'parsed_pace': parsed_details.get('pace'),
                'parsed_power': parsed_details.get('power'),
                'parsed_heart_rate': parsed_details.get('heart_rate'),
                'parsed_execution_status': execution_status,
                'duration_type': parsed_details.get('duration_type'),
            }
            return workout
        except Exception as e:
            print(f"Error extracting workout data: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def format_datetime(dt_obj):
        """Format datetime object to ISO string with additional metadata."""
        if dt_obj is None:
            return None
        
        try:
            # Handle both datetime and date objects
            dt = dt_obj.dt if hasattr(dt_obj, 'dt') else dt_obj
            
            if isinstance(dt, datetime):
                # Ensure timezone awareness
                # Training Peaks iCal naive datetimes are in UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=tz.UTC)
                return {
                    'iso': dt.isoformat(),
                    'date': dt.date().isoformat(),
                    'time': dt.time().isoformat(),
                    'is_datetime': True
                }
            elif isinstance(dt, date):
                # Date-only objects (all-day events)
                return {
                    'iso': dt.isoformat(),
                    'date': dt.isoformat(),
                    'time': None,
                    'is_datetime': False
                }
            else:
                return {
                    'iso': str(dt),
                    'date': str(dt),
                    'time': None,
                    'is_datetime': False
                }
        except Exception as e:
            print(f"Error formatting datetime: {e}")
            return {
                'iso': str(dt_obj),
                'date': str(dt_obj),
                'time': None,
                'is_datetime': False
            }
    
    @staticmethod
    def calculate_duration(dtstart, dtend):
        """Calculate duration between start and end times."""
        if not dtstart or not dtend:
            return None
        
        try:
            start = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
            end = dtend.dt if hasattr(dtend, 'dt') else dtend
            
            # For date-only events (all-day), don't calculate duration
            # These are planned workouts without specific times
            if isinstance(start, date) and not isinstance(start, datetime):
                return None  # Duration should come from description parsing
            if isinstance(end, date) and not isinstance(end, datetime):
                return None
            
            duration = end - start
            
            # Return duration in various formats
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            
            # Format duration nicely
            if hours > 0:
                if seconds > 0:
                    formatted = f"{hours}h {minutes}m {seconds}s"
                else:
                    formatted = f"{hours}h {minutes}m"
            elif minutes > 0:
                if seconds > 0:
                    formatted = f"{minutes}m {seconds}s"
                else:
                    formatted = f"{minutes}m"
            else:
                formatted = f"{seconds}s"
            
            return {
                'total_seconds': total_seconds,
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds,
                'formatted': formatted,
                'iso_duration': str(duration)
            }
        except Exception as e:
            print(f"Error calculating duration: {e}")
            return None
    
    @staticmethod
    def parse_description(description):
        """Parse workout description to extract structured details."""
        if not description:
            return {}
        
        details = {}
        
        try:
            # Parse duration - PRIORITY ORDER:
            # 1. Moving Time (most accurate - actual workout time)
            # 2. Elapsed Time  
            # 3. Labeled durations (Duration:, Est. Time:, etc.)
            # 4. Planned durations for planned workouts
            # 5. Standalone time patterns
            
            # Priority 1: Moving Time
            moving_time_match = re.search(r'moving\s+time[:\s]*(\d+:\d+(?::\d+)?)', description, re.IGNORECASE)
            if moving_time_match:
                duration_str = moving_time_match.group(1)
                details['duration'] = duration_str
                details['duration_formatted'] = ICalParser.format_duration_string(duration_str)
                details['duration_type'] = 'moving_time'
            # Priority 2: Elapsed Time
            elif re.search(r'elapsed\s+time[:\s]*(\d+:\d+(?::\d+)?)', description, re.IGNORECASE):
                elapsed_match = re.search(r'elapsed\s+time[:\s]*(\d+:\d+(?::\d+)?)', description, re.IGNORECASE)
                duration_str = elapsed_match.group(1)
                details['duration'] = duration_str
                details['duration_formatted'] = ICalParser.format_duration_string(duration_str)
                details['duration_type'] = 'elapsed_time'
            # Priority 3: Labeled durations
            elif re.search(r'(?:duration|planned duration|est\.? time|estimated time)[:\s]+(\d+:[\d:]+)', description, re.IGNORECASE):
                duration_labeled = re.search(r'(?:duration|planned duration|est\.? time|estimated time)[:\s]+(\d+:[\d:]+)', description, re.IGNORECASE)
                duration_str = duration_labeled.group(1).strip()
                details['duration'] = duration_str
                details['duration_formatted'] = ICalParser.format_duration_string(duration_str)
            # Priority 4: Planned durations for planned workouts (when no actual duration exists)
            else:
                # Look for planned duration patterns
                planned_duration_match = re.search(r'(?:planned|target|goal)\s+(?:time|duration)[:\s]*(\d+:\d+(?::\d+)?)', description, re.IGNORECASE)
                if planned_duration_match:
                    duration_str = planned_duration_match.group(1)
                    details['planned_duration'] = duration_str
                    details['planned_duration_formatted'] = ICalParser.format_duration_string(duration_str)
                    details['duration_type'] = 'planned'
                else:
                    # Look for simple time patterns that might be planned durations
                    # Only if it looks like a reasonable workout duration (not pace)
                    time_patterns = re.findall(r'\b(\d{1,2}:\d{2}(?::\d{2})?)\b', description)
                    for time_pattern in time_patterns:
                        # Check if it's likely a duration (not pace, splits, etc.)
                        if not re.search(r'(?:pace|per|/|split)', description, re.IGNORECASE):
                            # Only use if it's in a reasonable range (5 minutes to 8 hours)
                            parts = time_pattern.split(':')
                            if len(parts) == 2:  # MM:SS or HH:MM
                                minutes = int(parts[0])
                                if 5 <= minutes <= 480:  # 5 minutes to 8 hours
                                    details['planned_duration'] = time_pattern
                                    details['planned_duration_formatted'] = ICalParser.format_duration_string(time_pattern)
                                    details['duration_type'] = 'planned'
                                    break
                            elif len(parts) == 3:  # HH:MM:SS
                                hours = int(parts[0])
                                if hours <= 8:  # Up to 8 hours
                                    details['planned_duration'] = time_pattern
                                    details['planned_duration_formatted'] = ICalParser.format_duration_string(time_pattern)
                                    details['duration_type'] = 'planned'
                                    break
            
            # Parse distance (e.g., "10 km", "5.2 miles", "3000m")
            distance_match = re.search(r'(\d+\.?\d*)\s*(km|mi|miles?|meters?|m)\b', description, re.IGNORECASE)
            if distance_match:
                details['distance'] = f"{distance_match.group(1)} {distance_match.group(2)}"
            
            # Removed intensity/zone parsing - too unreliable
            
            # Parse TSS (Training Stress Score)
            tss_match = re.search(r'tss[:\s]*(\d+)', description, re.IGNORECASE)
            if tss_match:
                details['tss'] = tss_match.group(1)
            
            # Parse pace (e.g., "8:30/mile", "5:00/km")
            pace_match = re.search(r'(\d+:\d+)\s*/\s*(mile|km|mi)', description, re.IGNORECASE)
            if pace_match:
                details['pace'] = f"{pace_match.group(1)}/{pace_match.group(2)}"
            
            # Parse power (e.g., "200W", "FTP", "95% FTP")
            power_match = re.search(r'(\d+)\s*w\b|(\d+)%?\s*ftp', description, re.IGNORECASE)
            if power_match:
                details['power'] = power_match.group(0)
            
            # Parse heart rate (e.g., "145 bpm", "HR 150")
            hr_match = re.search(r'(\d+)\s*bpm|hr[:\s]*(\d+)', description, re.IGNORECASE)
            if hr_match:
                details['heart_rate'] = hr_match.group(0)
        
            # Parse execution status
            # Look for indicators that workout was completed vs planned
            completed_indicators = [
                r'\bcompleted\b',
                r'\bfinished\b',
                r'\bdone\b',
                r'\bactual\b',
                r'moving time',
                r'elapsed time'
            ]
            
            planned_indicators = [
                r'\bplanned\b',
                r'\bscheduled\b',
                r'\bestimated\b',
                r'\best\.',
                r'\bgoal\b',
                r'\btarget\b'
            ]
            
            is_completed = any(re.search(pattern, description, re.IGNORECASE) for pattern in completed_indicators)
            is_planned = any(re.search(pattern, description, re.IGNORECASE) for pattern in planned_indicators)
            
            if is_completed:
                details['execution_status'] = 'completed'
            elif is_planned:
                details['execution_status'] = 'planned'
        
        except Exception as e:
            print(f"Error parsing description: {e}")
        
        return details
    
    @staticmethod
    def format_duration_string(duration_str):
        """Format a duration string into a consistent format."""
        if not duration_str:
            return None
        
        try:
            # Handle HH:MM:SS format
            if ':' in duration_str:
                parts = duration_str.split(':')
                if len(parts) == 3:  # HH:MM:SS
                    hours, minutes, seconds = map(int, parts)
                    if hours > 0:
                        return f"{hours}h {minutes}m {seconds}s" if seconds > 0 else f"{hours}h {minutes}m"
                    elif minutes > 0:
                        return f"{minutes}m {seconds}s" if seconds > 0 else f"{minutes}m"
                    else:
                        return f"{seconds}s"
                elif len(parts) == 2:  # HH:MM or MM:SS
                    first, second = map(int, parts)
                    # Assume HH:MM if first part is reasonable hour range
                    if first < 24:
                        return f"{first}h {second}m" if first > 0 else f"{second}m"
                    else:  # Assume MM:SS
                        return f"{first}m {second}s"
            
            # Return as-is if we can't parse it
            return duration_str
        except Exception as e:
            print(f"Error formatting duration: {e}")
            return duration_str


class StravaAPI:
    """Fetches workout data from Strava API."""
    
    BASE_URL = 'https://www.strava.com/api/v3'
    
    @staticmethod
    def fetch_activities(access_token, after_timestamp=None, before_timestamp=None, per_page=200):
        """
        Fetch athlete activities using List Athlete Activities endpoint.
        Reference: https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
        
        Args:
            access_token: Strava access token
            after_timestamp: Unix timestamp - only activities after this date
            before_timestamp: Unix timestamp - only activities before this date
            per_page: Number of activities per page (max 200)
        """
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            params = {'per_page': min(per_page, 200)}  # Respect API limit
            
            # Set date range to avoid hitting API limits
            if not after_timestamp:
                # Default to last 10 days to avoid hitting rate limits
                from datetime import datetime, timedelta
                ten_days_ago = datetime.now() - timedelta(days=10)
                after_timestamp = int(ten_days_ago.timestamp())
            
            if after_timestamp:
                params['after'] = after_timestamp
            if before_timestamp:
                params['before'] = before_timestamp
            
            response = requests.get(
                f'{StravaAPI.BASE_URL}/activities',
                headers=headers,
                params=params,
                timeout=30
            )
            
            # Handle specific error codes
            if response.status_code == 401:
                raise ValueError('Invalid Strava access token. Please check your token and try again.')
            elif response.status_code == 429:
                raise ValueError('Strava API rate limit exceeded. Please try again in 15 minutes.')
            
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            raise ValueError(f'Failed to fetch from Strava: {str(e)}')
    
    @staticmethod
    def parse_strava_activities(activities):
        """Convert Strava activities to unified workout format."""
        workouts = {}
        
        for activity in activities:
            # Only include completed activities (Strava only has completed)
            workout = {
                'uid': f"strava_{activity['id']}",
                'summary': activity.get('name', ''),
                'description': activity.get('description', '') or '',
                'start_time': activity.get('start_date'),  # ISO format with Z
                'start_date': activity.get('start_date_local', '').split('T')[0] if activity.get('start_date_local') else None,
                'is_all_day': False,
                'has_time': True,
                'location': f"{activity.get('location_city', '')} {activity.get('location_state', '')}".strip(),
                'status': 'COMPLETED',
                'source': 'strava',
                'activity_type': activity.get('sport_type', activity.get('type', '')),
                'sequence': 0,
                'created': activity.get('start_date'),
                'last_modified': activity.get('start_date'),
                'categories': activity.get('sport_type', ''),
                
                # Duration - reuse existing formatter
                'parsed_duration': str(activity.get('moving_time')) if activity.get('moving_time') else None,
                'parsed_duration_formatted': ICalParser.format_duration_string(
                    StravaAPI.seconds_to_time_string(activity.get('moving_time'))
                ) if activity.get('moving_time') else None,
                'parsed_distance': f"{activity.get('distance', 0) / 1000:.2f} km" if activity.get('distance') else None,
                'parsed_execution_status': 'completed',
                'duration_type': 'moving_time',
                
                # Strava-specific metrics (core)
                'strava_distance': activity.get('distance'),  # meters
                'strava_moving_time': activity.get('moving_time'),  # seconds
                'strava_elapsed_time': activity.get('elapsed_time'),  # seconds
                'strava_total_elevation_gain': activity.get('total_elevation_gain'),
                'strava_average_speed': activity.get('average_speed'),
                'strava_max_speed': activity.get('max_speed'),
                'strava_average_heartrate': activity.get('average_heartrate'),
                'strava_max_heartrate': activity.get('max_heartrate'),
                'strava_average_watts': activity.get('average_watts'),
                'strava_kilojoules': activity.get('kilojoules'),
                'strava_calories': activity.get('calories'),
            }
            
            # Calculate end time
            if workout['start_time'] and activity.get('elapsed_time'):
                start_dt = datetime.fromisoformat(workout['start_time'].replace('Z', '+00:00'))
                end_dt = start_dt + timedelta(seconds=activity.get('elapsed_time'))
                workout['end_time'] = end_dt.isoformat()
                workout['end_date'] = end_dt.date().isoformat()
            
            # Calculate duration info for compatibility
            if activity.get('elapsed_time'):
                total_seconds = activity.get('elapsed_time')
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                seconds = total_seconds % 60
                
                if hours > 0:
                    formatted = f"{hours}h {minutes}m {seconds}s" if seconds > 0 else f"{hours}h {minutes}m"
                elif minutes > 0:
                    formatted = f"{minutes}m {seconds}s" if seconds > 0 else f"{minutes}m"
                else:
                    formatted = f"{seconds}s"
                
                workout['duration'] = {
                    'total_seconds': total_seconds,
                    'hours': hours,
                    'minutes': minutes,
                    'seconds': seconds,
                    'formatted': formatted
                }
            
            workouts[workout['uid']] = workout
        
        return workouts
    
    @staticmethod
    def seconds_to_time_string(seconds):
        """Convert seconds to HH:MM:SS or MM:SS format for formatter."""
        if not seconds:
            return None
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', default_url=DEFAULT_ICAL_URL)

@app.route('/strava/login')
def strava_login():
    """Initiate Strava OAuth login."""
    import urllib.parse
    
    # Generate authorization URL
    auth_params = {
        'client_id': STRAVA_CLIENT_ID,
        'redirect_uri': STRAVA_REDIRECT_URI,
        'response_type': 'code',
        'scope': STRAVA_SCOPE,
        'state': 'strava_auth'  # Optional: for security
    }
    
    auth_url = 'https://www.strava.com/oauth/authorize?' + urllib.parse.urlencode(auth_params)
    
    # Redirect to Strava authorization
    from flask import redirect
    return redirect(auth_url)

@app.route('/strava/callback')
def strava_callback():
    """Handle Strava OAuth callback."""
    from flask import request, session, redirect, url_for
    
    # Get authorization code from callback
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        return f"Authorization failed: {error}", 400
    
    if not code:
        return "No authorization code received", 400
    
    # Exchange code for access token
    try:
        token_data = {
            'client_id': STRAVA_CLIENT_ID,
            'client_secret': STRAVA_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code'
        }
        
        # Debug: Print what we're sending (without secret)
        print(f"OAuth Debug - Client ID: {STRAVA_CLIENT_ID}")
        print(f"OAuth Debug - Code: {code[:10]}...")
        print(f"OAuth Debug - Secret length: {len(STRAVA_CLIENT_SECRET)}")
        print(f"OAuth Debug - Secret starts with: {STRAVA_CLIENT_SECRET[:5]}...")
        
        response = requests.post('https://www.strava.com/oauth/token', data=token_data, timeout=30)
        
        # Debug: Print response details
        print(f"OAuth Debug - Response status: {response.status_code}")
        print(f"OAuth Debug - Response text: {response.text}")
        
        response.raise_for_status()
        
        token_response = response.json()
        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        
        if not access_token:
            return "Failed to get access token", 400
        
        # Store tokens in session (in production, use secure storage)
        session['strava_access_token'] = access_token
        session['strava_refresh_token'] = refresh_token
        
        # Debug: Print session info
        print(f"OAuth Success - Token stored: {access_token[:10]}...")
        print(f"OAuth Success - Session ID: {session.get('_id', 'No ID')}")
        
        # Redirect back to main page with success
        return redirect(url_for('index') + '?strava_connected=true')
        
    except Exception as e:
        return f"Token exchange failed: {str(e)}", 400

@app.route('/strava/logout')
def strava_logout():
    """Logout from Strava."""
    from flask import session, redirect, url_for
    
    # Clear Strava tokens from session
    session.pop('strava_access_token', None)
    session.pop('strava_refresh_token', None)
    
    return redirect(url_for('index') + '?strava_disconnected=true')

@app.route('/api/strava/status')
def strava_status():
    """Get current Strava connection status."""
    from flask import session
    
    # Debug: Print session info
    print(f"Status Check - Session keys: {list(session.keys())}")
    print(f"Status Check - Has token: {'strava_access_token' in session}")
    if 'strava_access_token' in session:
        print(f"Status Check - Token: {session['strava_access_token'][:10]}...")
    
    return jsonify({
        'connected': 'strava_access_token' in session,
        'token': session.get('strava_access_token', '') if 'strava_access_token' in session else None
    })


@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    """Get all current workouts and metadata."""
    url = request.args.get('url', DEFAULT_ICAL_URL)
    workouts_file = get_workouts_file(url)
    workout_manager = WorkoutManager(workouts_file)
    
    return jsonify({
        'workouts': workout_manager.get_current_workouts(),
        'last_updated': workout_manager.data['last_updated'],
        'change_log': workout_manager.data['change_log'][-10:]  # Last 10 changes
    })


@app.route('/api/refresh', methods=['POST'])
def refresh_workouts():
    """Fetch from TP and/or Strava based on enabled sources."""
    try:
        from flask import session
        
        data = request.get_json()
        tp_url = data.get('url') or data.get('tp_url', DEFAULT_ICAL_URL)
        
        # Get Strava token from session instead of manual input
        strava_token = session.get('strava_access_token')
        enabled_sources = data.get('sources', ['tp'])  # ['tp', 'strava'] or combination
        
        # Remove Strava from sources if no token available
        if not strava_token and 'strava' in enabled_sources:
            enabled_sources = [s for s in enabled_sources if s != 'strava']
        
        tp_workouts = {}
        strava_workouts = {}
        error_messages = []
        
        # Fetch from Training Peaks if enabled
        if 'tp' in enabled_sources and tp_url:
            try:
                ical_content = ICalParser.fetch_ical(tp_url)
                tp_workouts = ICalParser.parse_ical(ical_content)
            except Exception as e:
                error_messages.append(f'Training Peaks: {str(e)}')
        
        # Fetch from Strava if enabled
        if 'strava' in enabled_sources:
            if not strava_token:
                error_messages.append('Strava: Access token required')
            else:
                try:
                    strava_activities = StravaAPI.fetch_activities(strava_token)
                    strava_workouts = StravaAPI.parse_strava_activities(strava_activities)
                except ValueError as e:
                    error_messages.append(str(e))
                except Exception as e:
                    error_messages.append(f'Strava: {str(e)}')
        
        # If all sources failed, return error
        if error_messages and not tp_workouts and not strava_workouts:
            return jsonify({
                'success': False,
                'error': ' | '.join(error_messages)
            }), 400
        
        # Merge workouts based on priority
        merged_workouts = merge_workouts_by_source(tp_workouts, strava_workouts, enabled_sources)
        
        # Update workout manager
        workouts_file = get_workouts_file(tp_url if tp_url else 'strava_default')
        workout_manager = WorkoutManager(workouts_file)
        changes = workout_manager.update_workouts(merged_workouts)
        
        success_msg = f'Fetched {len(tp_workouts)} TP + {len(strava_workouts)} Strava workouts'
        if error_messages:
            success_msg += f' (Warnings: {", ".join(error_messages)})'
        
        return jsonify({
            'success': True,
            'message': success_msg,
            'changes': changes,
            'workouts': workout_manager.get_current_workouts(),
            'last_updated': workout_manager.data['last_updated']
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }), 500


@app.route('/api/history', methods=['GET'])
def get_full_history():
    """Get complete change history."""
    url = request.args.get('url', DEFAULT_ICAL_URL)
    workouts_file = get_workouts_file(url)
    workout_manager = WorkoutManager(workouts_file)
    
    return jsonify({
        'change_log': workout_manager.data['change_log']
    })


@app.route('/api/workout/<uid>', methods=['GET'])
def get_workout_history(uid):
    """Get full history for a specific workout."""
    url = request.args.get('url', DEFAULT_ICAL_URL)
    workouts_file = get_workouts_file(url)
    workout_manager = WorkoutManager(workouts_file)
    
    workout_info = workout_manager.data['workouts'].get(uid)
    if workout_info:
        return jsonify(workout_info)
    return jsonify({'error': 'Workout not found'}), 404


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

