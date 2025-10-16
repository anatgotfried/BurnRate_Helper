# Technical Documentation

## Architecture Overview

This application follows a simple Flask-based architecture with a file-based JSON storage system.

### Technology Stack

- **Backend**: Flask (Python web framework)
- **iCal Parsing**: icalendar library
- **HTTP Requests**: requests library
- **Date Handling**: python-dateutil
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: JSON file system

### Design Principles

1. **Simplicity**: No database, no complex dependencies
2. **Portability**: Single JSON file contains all data
3. **Transparency**: Human-readable data format
4. **Maintainability**: Modular, well-documented code
5. **Extensibility**: Easy to add features or modify behavior

---

## Core Components

### 1. Flask Application (`app.py`)

#### Main Classes

##### `WorkoutManager`
Handles all data operations including storage, retrieval, and change detection.

**Methods:**
- `load_data()`: Loads workout data from JSON file
- `save_data()`: Persists workout data to JSON file
- `get_current_workouts()`: Returns all non-deleted workouts
- `update_workouts(new_workouts)`: Compares new data with existing and tracks changes
- `detect_changes(old, new)`: Identifies specific field changes between workout versions

**Key Logic:**
```python
# Change detection algorithm
for uid, new_workout in new_workouts.items():
    if uid not in current_workouts:
        # Addition
    else:
        # Check for modifications
        change_details = self.detect_changes(old_workout, new_workout)
        if change_details:
            # Modification
            
for uid, old_workout in current_workouts.items():
    if uid not in new_workouts:
        # Deletion
```

##### `ICalParser`
Handles fetching and parsing iCal data from Training Peaks.

**Methods:**
- `fetch_ical(url)`: Downloads iCal file, converts webcal:// to https://
- `parse_ical(ical_content)`: Extracts all VEVENT components
- `extract_workout_data(component)`: Converts iCal event to workout dictionary
- `format_datetime(dt_obj)`: Normalizes datetime objects to ISO format

**Key Logic:**
```python
# URL conversion
if url.startswith('webcal://'):
    url = 'https://' + url[9:]

# Parse calendar
cal = Calendar.from_ical(ical_content)
for component in cal.walk():
    if component.name == "VEVENT":
        # Extract workout data
```

### 2. API Endpoints

#### `GET /`
Renders the main HTML page with default iCal URL.

#### `GET /api/workouts`
Returns current workouts and recent change history.

**Response:**
```json
{
  "workouts": {...},
  "last_updated": "ISO_TIMESTAMP",
  "change_log": [...]  // Last 10 entries
}
```

#### `POST /api/refresh`
Fetches new iCal data and updates workouts.

**Request:**
```json
{
  "url": "ICAL_URL"
}
```

**Response:**
```json
{
  "success": true,
  "message": "...",
  "changes": {...},
  "workouts": {...},
  "last_updated": "ISO_TIMESTAMP"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ERROR_MESSAGE"
}
```

#### `GET /api/history`
Returns complete change log history.

#### `GET /api/workout/<uid>`
Returns full history for a specific workout by UID.

### 3. Frontend (`templates/index.html`)

#### JavaScript Architecture

**Global State:**
- `workoutsData`: Current workout dictionary
- `changeLog`: Array of change log entries

**Main Functions:**

##### `loadWorkouts()`
Initial data load on page load.

##### `refreshWorkouts()`
Fetches new data from API and updates UI.

##### `updateUI(lastUpdated)`
Master function to refresh all UI components.

##### `renderWorkouts()`
Displays all workouts sorted by start time.

##### `renderRecentChanges()`
Shows latest changes with color coding.

##### `renderHistory()`
Timeline of all historical changes.

##### `renderChangeDiff(changes)`
Generates HTML diff view for modifications.

**UI Update Flow:**
```
User clicks Refresh
  → refreshWorkouts()
    → POST /api/refresh
      → Update global state
        → updateUI()
          → renderWorkouts()
          → renderRecentChanges()
          → renderHistory()
```

---

## Data Model

### JSON Structure

```json
{
  "last_updated": "ISO_TIMESTAMP",
  "workouts": {
    "WORKOUT_UID": {
      "current": WORKOUT_OBJECT | null,
      "history": [HISTORY_ENTRY, ...]
    }
  },
  "change_log": [CHANGE_ENTRY, ...]
}
```

### Workout Object

```json
{
  "uid": "unique-identifier",
  "summary": "Workout Title",
  "description": "Detailed instructions",
  "start_time": "ISO_TIMESTAMP",
  "end_time": "ISO_TIMESTAMP",
  "location": "Location string",
  "status": "CONFIRMED|TENTATIVE|CANCELLED",
  "sequence": 0,
  "created": "ISO_TIMESTAMP",
  "last_modified": "ISO_TIMESTAMP",
  "categories": "Category string"
}
```

### History Entry

```json
{
  "timestamp": "ISO_TIMESTAMP",
  "action": "added|modified|deleted",
  "data": WORKOUT_OBJECT,
  "changes": {
    "field_name": {
      "old": "old_value",
      "new": "new_value"
    }
  }
}
```

### Change Log Entry

```json
{
  "timestamp": "ISO_TIMESTAMP",
  "additions": [WORKOUT_OBJECT, ...],
  "modifications": [
    {
      "uid": "workout-uid",
      "old": WORKOUT_OBJECT,
      "new": WORKOUT_OBJECT,
      "changes": {...}
    }
  ],
  "deletions": [WORKOUT_OBJECT, ...],
  "movements": [
    {
      "uid": "workout-uid",
      "summary": "Workout Title",
      "old_start": "ISO_TIMESTAMP",
      "new_start": "ISO_TIMESTAMP"
    }
  ]
}
```

---

## Change Detection Algorithm

### Process Flow

1. **Load existing workouts** from JSON
2. **Fetch new workouts** from iCal
3. **Compare UIDs** to categorize changes
4. **Detect modifications** by comparing fields
5. **Identify movements** as subset of modifications
6. **Update storage** with new state and history
7. **Return change summary** to frontend

### Comparison Logic

```python
def detect_changes(old, new):
    changes = {}
    fields = ['summary', 'description', 'start_time', 
              'end_time', 'location', 'status', 'sequence']
    
    for field in fields:
        if old.get(field) != new.get(field):
            changes[field] = {
                'old': old.get(field),
                'new': new.get(field)
            }
    
    return changes if changes else None
```

### Movement Detection

A movement is a modification where `start_time` or `end_time` changed:

```python
if 'start_time' in change_details or 'end_time' in change_details:
    changes['movements'].append({
        'uid': uid,
        'summary': new_workout['summary'],
        'old_start': old_workout['start_time'],
        'new_start': new_workout['start_time']
    })
```

### Deletion Handling

Deletions are "soft deletes" - workout history is preserved:

```python
# Mark as deleted
self.data['workouts'][uid]['current'] = None

# Add to history
self.data['workouts'][uid]['history'].append({
    'timestamp': timestamp,
    'action': 'deleted',
    'data': old_workout
})
```

---

## iCal Format Details

### Training Peaks iCal Specifics

Training Peaks exports workouts in standard iCalendar format with these characteristics:

#### Standard Fields Used
- **UID**: Unique identifier (persists across modifications)
- **SUMMARY**: Workout title
- **DESCRIPTION**: Detailed workout instructions (may include HTML)
- **DTSTART**: Start date/time
- **DTEND**: End date/time
- **SEQUENCE**: Version number (increments on changes)
- **STATUS**: Workout status
- **LAST-MODIFIED**: Last modification timestamp
- **CREATED**: Creation timestamp
- **LOCATION**: Location field (sometimes used)
- **CATEGORIES**: Workout type (Run, Bike, Swim, etc.)

#### Timezone Handling

Training Peaks may use various timezone formats:
- UTC timestamps
- Local time with TZID
- Floating time (no timezone)

The parser handles all cases by:
1. Preserving timezone information if present
2. Assuming UTC if no timezone specified
3. Converting to ISO format with timezone

### iCal Quirks and Edge Cases

#### 1. HTML in Descriptions
Training Peaks may include HTML formatting in descriptions.

**Handling:** Frontend uses `escapeHtml()` to prevent XSS.

#### 2. Sequence Number Gaps
Sequence numbers may skip values if edits are abandoned.

**Handling:** Track sequence but don't rely on continuous increments.

#### 3. UID Format Changes
UIDs are stable but format varies by Training Peaks version.

**Handling:** Treat UIDs as opaque strings, no parsing required.

#### 4. Missing Fields
Not all workouts have all fields (e.g., LOCATION may be absent).

**Handling:** Use `.get()` with defaults, handle None gracefully.

#### 5. Date-Only Events
Some workouts may only have dates, not times.

**Handling:** Parser accommodates both `datetime` and `date` objects.

---

## Error Handling

### Network Errors

```python
try:
    ical_content = ICalParser.fetch_ical(url)
except requests.RequestException as e:
    return jsonify({
        'success': False,
        'error': f'Failed to fetch iCal: {str(e)}'
    }), 400
```

### Parse Errors

```python
try:
    workout = ICalParser.extract_workout_data(component)
except Exception as e:
    print(f"Error extracting workout data: {e}")
    return None  # Skip malformed events
```

### File System Errors

```python
try:
    with open(self.filepath, 'r') as f:
        return json.load(f)
except json.JSONDecodeError:
    return self.initialize_data()  # Start fresh
```

---

## Performance Considerations

### Scalability

**Current Limits:**
- Handles 1000+ workouts without issue
- JSON file size typically < 5MB for a year of data
- Page load time < 1 second
- Refresh operation: 2-5 seconds

**Optimization Opportunities:**
- Paginate workout display for very large datasets
- Implement incremental loading
- Cache iCal responses with ETags
- Add database backend for enterprise scale

### Memory Usage

- Full dataset loaded into memory
- Acceptable for personal use (< 10MB)
- For larger deployments, consider streaming or database

---

## Security Considerations

### Local-Only Design

- Runs on localhost (127.0.0.1)
- Not exposed to internet
- No authentication required

### XSS Prevention

Frontend uses `escapeHtml()` for all user data:

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### iCal URL Privacy

- URLs contain unique identifiers
- Should not be committed to public repositories
- Consider environment variables for sensitive URLs

### CORS Considerations

Server-side fetching avoids CORS issues:
- Browser would block direct webcal:// access
- Flask backend fetches on behalf of client

---

## Extension Points

### Adding New Data Fields

1. **Update `ICalParser.extract_workout_data()`:**
   ```python
   workout['new_field'] = str(component.get('NEW_FIELD', ''))
   ```

2. **Update comparison fields in `WorkoutManager.detect_changes()`:**
   ```python
   fields = ['summary', 'description', ..., 'new_field']
   ```

3. **Update frontend rendering:**
   ```javascript
   ${workout.new_field ? `...` : ''}
   ```

### Custom Change Detection Rules

Modify `detect_changes()` to implement custom logic:

```python
# Example: Ignore case in summary changes
if old.get('summary', '').lower() != new.get('summary', '').lower():
    changes['summary'] = {...}
```

### External Integrations

The JSON structure is designed for easy integration:

```python
# Example: Export to CSV
import csv
data = load_json('data/workouts.json')
with open('export.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['uid', 'summary', ...])
    for uid, info in data['workouts'].items():
        if info['current']:
            writer.writerow(info['current'])
```

### Notification System

Add email/SMS notifications on changes:

```python
# After update_workouts()
if changes['additions'] or changes['modifications']:
    send_notification(changes)
```

---

## Testing

### Manual Testing Checklist

1. **First Run**
   - [ ] Fresh install works
   - [ ] Dependencies install correctly
   - [ ] Initial refresh populates data

2. **Change Detection**
   - [ ] Additions detected
   - [ ] Modifications detected
   - [ ] Deletions detected
   - [ ] Movements detected

3. **UI Functionality**
   - [ ] All panels render
   - [ ] Scrolling works
   - [ ] Diffs display correctly
   - [ ] Error messages shown

4. **Edge Cases**
   - [ ] Empty iCal handled
   - [ ] Malformed data skipped
   - [ ] Network errors caught
   - [ ] Large datasets perform well

### Unit Testing (Future)

Consider adding pytest tests:

```python
def test_change_detection():
    manager = WorkoutManager(':memory:')
    old = {'summary': 'Run', 'sequence': 0}
    new = {'summary': 'Easy Run', 'sequence': 1}
    changes = manager.detect_changes(old, new)
    assert 'summary' in changes
```

---

## Deployment

### Local Development

```bash
python app.py  # Runs with debug=True
```

### Production (Local Use)

```python
# In app.py
app.run(debug=False, host='127.0.0.1', port=5000)
```

### Network Access (Not Recommended)

To allow network access (use with caution):

```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

**Security Warning:** This exposes the app to your network. Add authentication if using this option.

---

## Maintenance

### Data Backup

```bash
# Backup script
cp data/workouts.json "backups/workouts_$(date +%Y%m%d).json"
```

### Data Cleanup

```python
# Remove old change log entries (keep last 100)
data['change_log'] = data['change_log'][-100:]
```

### Performance Monitoring

Add logging to track performance:

```python
import time
start = time.time()
# ... operation ...
print(f"Operation took {time.time() - start:.2f}s")
```

---

## Troubleshooting Development Issues

### Import Errors

```bash
# Verify installations
pip list | grep -E "Flask|icalendar|requests"

# Reinstall if needed
pip install --force-reinstall -r requirements.txt
```

### JSON Corruption

```python
# Validate JSON
import json
with open('data/workouts.json', 'r') as f:
    json.load(f)  # Will raise exception if invalid
```

### Template Not Found

Ensure directory structure:
```
TP_Validator/
├── app.py
└── templates/
    └── index.html
```

---

## Future Enhancements

### Potential Features

1. **Data Visualization**
   - Charts showing volume trends
   - Workout type distribution
   - Change frequency over time

2. **Advanced Filtering**
   - Filter by workout type
   - Date range selection
   - Search functionality

3. **Export Options**
   - PDF reports
   - CSV export
   - Google Calendar sync

4. **Notification System**
   - Email alerts on changes
   - Daily summary emails
   - Mobile push notifications

5. **Multi-User Support**
   - Multiple iCal URLs
   - User profiles
   - Shared team calendars

6. **Analytics**
   - Training load calculation
   - Workout compliance tracking
   - Pattern recognition

---

## Contributing

### Code Style

- Follow PEP 8 for Python
- Use meaningful variable names
- Add docstrings to functions
- Comment complex logic

### Testing Changes

1. Test with real Training Peaks data
2. Verify all change types detected
3. Check UI rendering
4. Test error conditions

### Documentation

- Update USER_GUIDE.md for user-facing changes
- Update README.md for feature additions
- Update this file for technical changes

---

## Resources

### Libraries

- [Flask Documentation](https://flask.palletsprojects.com/)
- [icalendar Documentation](https://icalendar.readthedocs.io/)
- [requests Documentation](https://requests.readthedocs.io/)

### Standards

- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545)
- [ISO 8601 Date/Time Format](https://en.wikipedia.org/wiki/ISO_8601)

### Training Peaks

- [Training Peaks Help Center](https://help.trainingpeaks.com/)
- [iCalendar Export Documentation](https://help.trainingpeaks.com/hc/en-us/articles/204493464)

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintainer**: Documentation maintained with codebase

