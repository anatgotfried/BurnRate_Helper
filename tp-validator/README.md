# Training Peaks Workout Tracker

A web application for tracking and analyzing Training Peaks workouts with automatic change detection and comprehensive history logging.

## 🎯 Two Versions Available

### 1. **GitHub Pages Version** (Recommended for most users)
- ✅ No installation required
- ✅ Free hosting on GitHub Pages
- ✅ Works entirely in browser
- ✅ [Live Demo](https://callback.burnrate.fit/tp-validator/)
- 📖 [Setup Guide](GITHUB_PAGES_SETUP.md)

### 2. **Flask Local Version** (For developers)
- ✅ Full Strava OAuth support
- ✅ Faster performance
- ✅ File-based storage
- 📖 Continue reading below for setup

---

## Features

- 🔄 **Automatic Change Detection**: Identifies additions, modifications, deletions, and movements between refreshes
- 📊 **Complete History**: Maintains full audit trail of all workout changes over time
- 🎨 **Beautiful UI**: Modern, responsive interface with intuitive visualization
- 💾 **JSON Storage**: Simple file-based storage for easy backup and portability
- 📅 **Historical & Future**: Displays both past and future workouts from your Training Peaks calendar
- 🔍 **Detailed Diffs**: Shows exactly what changed in modified workouts

## Quick Start

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- Internet connection to fetch iCal data

### Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   Navigate to: `http://127.0.0.1:5000`

### First Use

1. The default Training Peaks iCal URL is pre-filled
2. Click "Refresh Workouts" to fetch your data
3. View all workouts, recent changes, and change history
4. Refresh daily to track changes over time

## Getting Your iCal URL

To get your personal Training Peaks iCal URL:

1. Log into [TrainingPeaks.com](https://www.trainingpeaks.com)
2. Go to your Calendar
3. Look for Calendar Settings or Export options
4. Copy the iCal/ICS subscription URL
5. It will look like: `webcal://www.trainingpeaks.com/ical/YOUR_UNIQUE_ID.ics`
6. Paste this into the URL field in the app

## Strava Integration

### Getting Your Strava Access Token

**Important**: Strava requires OAuth flow to get proper access tokens with `activity:read` permissions. See [STRAVA_OAUTH_GUIDE.md](STRAVA_OAUTH_GUIDE.md) for complete setup instructions.

**Quick Setup**:
1. Go to https://www.strava.com/settings/api
2. Create an application (if you haven't already)
3. Complete OAuth flow to get proper access token
4. Paste the access token into the Strava Access Token field in the app

**For detailed OAuth setup instructions, see [STRAVA_OAUTH_GUIDE.md](STRAVA_OAUTH_GUIDE.md)**

### Using Multiple Data Sources

You can enable:
- **Training Peaks only**: See planned and completed workouts from your coach
- **Strava only**: See completed workouts with detailed metrics
- **Both**: Strava completed workouts override TP planned workouts, TP provides future workouts

**Priority**: When both sources are enabled and a workout appears in both:
- Strava data takes precedence for completed workouts (more accurate metrics)
- Training Peaks data shows planned/future workouts
- Workouts are matched by date, time (within 2-hour window), and activity type

### Strava Metrics Captured

- Distance (km)
- Moving time vs. elapsed time
- Average & max speed
- Average & max heart rate
- Average power & kilojoules
- Elevation gain
- Calories burned

### Strava API Limitations

**Rate Limits**:
- 200 requests per 15 minutes, 2,000 daily
- 100 read requests per 15 minutes, 1,000 daily

**Best Practices**:
- The app automatically fetches only the last 10 days to avoid hitting rate limits
- Use date range filtering for large datasets
- Cache data locally to reduce API calls

## User Interface

### Main Components

#### 1. **Header Section**
- iCal URL input field
- Refresh button to fetch latest data
- Status messages for success/errors

#### 2. **Status Bar**
- Last Updated: Timestamp of most recent refresh
- Total Workouts: Current workout count
- Recent Changes: Number of changes in last refresh

#### 3. **All Workouts Panel** (Left)
- Displays all current workouts (past and future)
- Color-coded borders:
  - 🟢 Green: Past/completed workouts
  - 🟡 Yellow: Future/planned workouts
- Shows full workout details including:
  - Title/summary
  - Date and time
  - Description/instructions
  - Status and sequence number
  - Location (if specified)

#### 4. **Recent Changes Panel** (Right)
- Shows changes from the most recent refresh
- Color-coded by change type:
  - 🟢 Green: Additions
  - 🟡 Yellow: Modifications
  - 🔴 Red: Deletions
  - 🔵 Blue: Movements
- Displays detailed diffs for modifications

#### 5. **Change History Panel** (Bottom)
- Timeline of all historical refreshes
- Shows summary of changes for each refresh
- Timestamps for tracking when changes occurred

## Data Storage

### File Location
All data is stored in: `data/workouts.json`

### Data Structure
```json
{
  "last_updated": "2025-10-11T10:30:00Z",
  "workouts": {
    "WORKOUT_UID": {
      "current": { 
        "uid": "...",
        "summary": "Morning Run",
        "description": "...",
        "start_time": "...",
        "end_time": "...",
        "location": "...",
        "status": "...",
        "sequence": 0
      },
      "history": [
        {
          "timestamp": "...",
          "action": "added|modified|deleted",
          "data": { ... },
          "changes": { ... }
        }
      ]
    }
  },
  "change_log": [
    {
      "timestamp": "...",
      "additions": [...],
      "modifications": [...],
      "deletions": [...],
      "movements": [...]
    }
  ]
}
```

### Backup Recommendations

- **Manual Backup**: Copy `data/workouts.json` to cloud storage regularly
- **Version Control**: Use git to track data changes
- **Automated Backup**: Set up scheduled backups of the data directory

## Understanding Changes

### Change Types

1. **Addition** ✅
   - New workout appears in iCal feed
   - Assigned a new UID
   - Added to current workouts

2. **Modification** ✏️
   - Existing workout (same UID) has changed
   - Sequence number incremented
   - Shows diff of changed fields

3. **Deletion** ❌
   - Workout no longer present in iCal feed
   - Marked as deleted in history
   - Removed from current workouts

4. **Movement** 🔄
   - Workout rescheduled to different time
   - Detected as modification with time change
   - Shows old → new time

### What Triggers Changes?

- Coach modifies your training plan
- Workout rescheduled or moved
- Workout instructions updated
- Workout deleted or cancelled
- New workouts added to calendar
- Execution data added after completion

## Daily Workflow

### Recommended Process

1. **Morning Check**
   - Open the app
   - Click "Refresh Workouts"
   - Review any changes to today's workout
   - Check upcoming days for new additions

2. **Weekly Review**
   - Refresh data
   - Review full change history
   - Look for patterns in modifications
   - Plan ahead based on schedule

3. **Before Key Workouts**
   - Refresh to ensure latest instructions
   - Verify timing and requirements
   - Check for any last-minute changes

## Configuration

### Default URL
The default iCal URL is set in `app.py`:
```python
DEFAULT_ICAL_URL = 'https://www.trainingpeaks.com/ical/FQ52PNFB5MWLS.ics'
```

Change this to your personal URL for convenience.

### Port and Host
By default, the app runs on:
- Host: `127.0.0.1` (localhost)
- Port: `5000`

Modify these in `app.py` if needed:
```python
app.run(debug=True, host='127.0.0.1', port=5000)
```

## API Endpoints

The app provides several API endpoints for programmatic access:

### GET `/api/workouts`
Returns all current workouts and recent change log.

**Response:**
```json
{
  "workouts": { ... },
  "last_updated": "2025-10-11T10:30:00Z",
  "change_log": [ ... ]
}
```

### POST `/api/refresh`
Fetches iCal data and updates workouts.

**Request Body:**
```json
{
  "url": "https://www.trainingpeaks.com/ical/YOUR_ID.ics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully fetched N workouts",
  "changes": { ... },
  "workouts": { ... },
  "last_updated": "..."
}
```

### GET `/api/history`
Returns complete change log history.

### GET `/api/workout/<uid>`
Returns full history for a specific workout.

## Troubleshooting

### Common Issues

**Problem: "Failed to fetch iCal"**
- Check internet connection
- Verify iCal URL is correct
- Try accessing URL in browser
- Training Peaks servers may be temporarily down

**Problem: No changes detected**
- Changes may not have synced to iCal export yet
- Wait 5-10 minutes and try again
- Check if you're looking at the right calendar

**Problem: App won't start**
- Verify Python version: `python --version` (need 3.7+)
- Reinstall dependencies: `pip install -r requirements.txt`
- Check if port 5000 is already in use

**Problem: JSON file corruption**
- Delete `data/workouts.json`
- Restart app and refresh (will rebuild from current state)
- Note: Previous history will be lost

### Debug Mode

The app runs in debug mode by default, providing:
- Detailed error messages
- Automatic reload on code changes
- Stack traces for troubleshooting

To disable debug mode (for production use):
```python
app.run(debug=False, host='127.0.0.1', port=5000)
```

## Advanced Usage

### Custom Scripting

The JSON data structure is designed for easy analysis:

```python
import json

# Load workout data
with open('data/workouts.json', 'r') as f:
    data = json.load(f)

# Analyze changes
for log in data['change_log']:
    print(f"On {log['timestamp']}:")
    print(f"  Added: {len(log['additions'])}")
    print(f"  Modified: {len(log['modifications'])}")
    print(f"  Deleted: {len(log['deletions'])}")
```

### Export to Other Formats

```python
import json
import csv

# Export workouts to CSV
with open('data/workouts.json', 'r') as f:
    data = json.load(f)

with open('workouts.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['UID', 'Summary', 'Start Time', 'Description'])
    
    for uid, info in data['workouts'].items():
        if info['current']:
            w = info['current']
            writer.writerow([uid, w['summary'], w['start_time'], w['description']])
```

### Automated Refreshes

Set up a cron job (Linux/Mac) or Task Scheduler (Windows) to refresh automatically:

```bash
# Cron example - refresh every day at 6 AM
0 6 * * * curl -X POST http://127.0.0.1:5000/api/refresh -H "Content-Type: application/json" -d '{"url":"YOUR_ICAL_URL"}'
```

## Architecture

### Backend (Flask)
- **app.py**: Main application file
- **WorkoutManager**: Handles data storage and change detection
- **ICalParser**: Fetches and parses iCal data
- RESTful API endpoints for frontend

### Frontend (HTML/CSS/JavaScript)
- **templates/index.html**: Single-page application
- Vanilla JavaScript (no frameworks)
- Responsive CSS with modern design
- Real-time updates via fetch API

### Data Layer
- **JSON file storage**: Simple, portable, human-readable
- **No database required**: Reduces complexity
- **Easy backup**: Single file contains everything

## Development

### Project Structure
```
TP_Validator/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Frontend UI
├── data/
│   └── workouts.json     # Workout data (created automatically)
├── README.md             # This file
└── USER_GUIDE.md         # Comprehensive user guide
```

### Adding Features

The modular design makes it easy to extend:

1. **New change detection logic**: Modify `WorkoutManager.detect_changes()`
2. **Additional data fields**: Update `ICalParser.extract_workout_data()`
3. **Custom visualizations**: Add to `templates/index.html`
4. **New API endpoints**: Add routes in `app.py`

## Security Considerations

- App runs locally (127.0.0.1) - not exposed to internet
- No authentication required (local use only)
- iCal URLs should be kept private (contain unique IDs)
- Don't commit `data/workouts.json` to public repositories

## Performance

- Handles thousands of workouts efficiently
- JSON file size typically < 1MB for a year of data
- Page load time < 1 second
- Refresh operation: 2-5 seconds depending on iCal size

## Contributing

This is a personal tool, but improvements are welcome:

1. Test changes thoroughly
2. Maintain simple, readable code
3. Update documentation
4. Consider backward compatibility with existing JSON data

## License

This project is for personal use. Modify and distribute as needed.

## Support

For detailed usage instructions and handling specific scenarios, see:
- **[USER_GUIDE.md](USER_GUIDE.md)** - Comprehensive guide to using the system

## Acknowledgments

- Built with Flask (Python web framework)
- Uses icalendar library for parsing
- Designed for Training Peaks calendar integration

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Python**: 3.7+  
**License**: Personal Use

Happy Training! 🏃‍♂️🚴‍♀️🏊‍♂️

