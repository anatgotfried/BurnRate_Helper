# Training Peaks iCal Fields Reference

Complete documentation of Training Peaks iCalendar (iCal) format fields and how we parse them in the Training Peaks Workout Tracker.

## Data Source

Training Peaks provides workout data via iCalendar (iCal) format, which is a standard calendar format (RFC 5545).

**URL Format:**
```
webcal://www.trainingpeaks.com/ical/YOUR_CALENDAR_ID.ics
```

**Converted to HTTPS:**
```
https://www.trainingpeaks.com/ical/YOUR_CALENDAR_ID.ics
```

**Authentication:** None required (public calendar URL)

---

## iCal Structure

Training Peaks exports workouts as `VEVENT` components within an iCalendar file:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:TrainingPeaks
  BEGIN:VEVENT
  UID:unique-identifier
  SUMMARY:Morning Run
  DESCRIPTION:...workout details...
  DTSTART:20241017T083000Z
  DTEND:20241017T093000Z
  LOCATION:Tel Aviv
  STATUS:CONFIRMED
  SEQUENCE:0
  END:VEVENT
END:VCALENDAR
```

---

## Fields We Parse from iCal

### Core Identification

| iCal Field | Our Field | Type | Description | Example |
|------------|-----------|------|-------------|---------|
| `UID` | `uid` | string | Unique identifier from Training Peaks | `"tp-123456789"` |
| `SUMMARY` | `summary` | string | Workout title/name | `"Morning Run"` |
| `DESCRIPTION` | `description` | string | Full workout description with metrics | `"Moving Time: 1:30:00\nDistance: 10 km..."` |

### Date & Time

| iCal Field | Our Field | Type | Description | Example |
|------------|-----------|------|-------------|---------|
| `DTSTART` | `start_time` | ISO 8601 | Start date/time (null for all-day) | `"2024-10-17T08:30:00Z"` |
| `DTSTART` | `start_date` | string | Extracted date (YYYY-MM-DD) | `"2024-10-17"` |
| `DTEND` | `end_time` | ISO 8601 | End date/time (null for all-day) | `"2024-10-17T09:30:00Z"` |
| `DTEND` | `end_date` | string | Extracted end date | `"2024-10-17"` |

**All-Day vs Timed Events:**
- **Planned workouts** (future): All-day events (no specific time)
- **Completed workouts** (past): Timed events (with start/end times)

**Detection Logic:**
```javascript
const isAllDay = event.startDate?.isDate || false;
```

### Location & Metadata

| iCal Field | Our Field | Type | Description | Example |
|------------|-----------|------|-------------|---------|
| `LOCATION` | `location` | string | Workout location | `"Tel Aviv"` |
| `STATUS` | `status` | string | Event status | `"CONFIRMED"`, `"TENTATIVE"` |
| `SEQUENCE` | `sequence` | integer | Version/revision number | `0`, `1`, `2` |

### Parsed Fields (Not Direct iCal)

These are derived fields we parse from the `DESCRIPTION` text:

| Our Field | Type | Parsed From | Description | Example |
|-----------|------|-------------|-------------|---------|
| `is_all_day` | boolean | `DTSTART` property | Whether event is all-day | `true`, `false` |
| `has_time` | boolean | Opposite of `is_all_day` | Whether event has specific time | `true`, `false` |
| `source` | string | Set by us | Data source identifier | `"training_peaks"` |
| `parsed_execution_status` | string | All-day + description | Workout status | `"planned"`, `"completed"` |

---

## Description Field Parsing

The `DESCRIPTION` field contains rich text with workout metrics. We parse this using regular expressions.

### Duration Parsing

**Moving Time (Preferred):**
```
Pattern: /moving\s+time[:\s]*(\d+:\d+(?::\d+)?)/i
Example: "Moving Time: 1:30:45"
Result: parsed_duration = "1:30:45"
        parsed_duration_formatted = "1h 30m 45s"
        duration_type = "moving_time"
```

**Elapsed Time (Fallback):**
```
Pattern: /elapsed\s+time[:\s]*(\d+:\d+(?::\d+)?)/i
Example: "Elapsed Time: 1:35:00"
Result: parsed_duration = "1:35:00"
        parsed_duration_formatted = "1h 35m"
        duration_type = "elapsed_time"
```

**Duration Formats Supported:**
- `HH:MM:SS` → "1:30:45" (1 hour, 30 minutes, 45 seconds)
- `HH:MM` → "1:30" (1 hour, 30 minutes)
- `MM:SS` → "45:30" (45 minutes, 30 seconds)

### Distance Parsing

**Pattern:**
```
Pattern: /(\d+\.?\d*)\s*(km|mi|miles?|meters?|m)\b/i
Examples:
  "10.5 km" → "10.5 km"
  "6.2 miles" → "6.2 miles"
  "5000 meters" → "5000 meters"
  "12.3 mi" → "12.3 mi"
```

**Our Field:**
```javascript
parsed_distance: "10.5 km"
```

### TSS (Training Stress Score) Parsing

**Pattern:**
```
Pattern: /tss[:\s]*(\d+)/i
Examples:
  "TSS: 85" → "85"
  "TSS 120" → "120"
```

**Our Field:**
```javascript
parsed_tss: "85"
```

---

## Execution Status Logic

We determine if a workout is "planned" or "completed" based on multiple factors:

### Planned Workouts
```javascript
// All-day events are considered planned
if (isAllDay) {
    parsed_execution_status = 'planned'
}
```

### Completed Workouts
```javascript
// If we find duration in description, it's completed
if (movingTimeMatch || elapsedMatch) {
    parsed_execution_status = 'completed'
}
```

**Key Indicator:** Presence of duration data in description = completed workout

---

## Example iCal Event (Planned Workout)

```ics
BEGIN:VEVENT
UID:tp-workout-123456
SUMMARY:Easy Run
DESCRIPTION:Zone 2 aerobic run\n30-40 minutes\nKeep heart rate below 145
DTSTART;VALUE=DATE:20241020
DTEND;VALUE=DATE:20241020
LOCATION:
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
```

**Parsed Object:**
```javascript
{
  uid: "tp-workout-123456",
  summary: "Easy Run",
  description: "Zone 2 aerobic run\n30-40 minutes\nKeep heart rate below 145",
  start_time: null,
  start_date: "2024-10-20",
  end_time: null,
  end_date: "2024-10-20",
  location: "",
  status: "CONFIRMED",
  sequence: 0,
  is_all_day: true,
  has_time: false,
  source: "training_peaks",
  parsed_execution_status: "planned",
  parsed_duration: null,
  parsed_distance: null,
  parsed_tss: null
}
```

---

## Example iCal Event (Completed Workout)

```ics
BEGIN:VEVENT
UID:tp-workout-123456
SUMMARY:Easy Run
DESCRIPTION:Zone 2 aerobic run\nMoving Time: 0:35:24\nDistance: 5.2 km\nTSS: 42\nAverage Heart Rate: 138 bpm
DTSTART:20241017T083000Z
DTEND:20241017T091524Z
LOCATION:Tel Aviv
STATUS:CONFIRMED
SEQUENCE:1
END:VEVENT
```

**Parsed Object:**
```javascript
{
  uid: "tp-workout-123456",
  summary: "Easy Run",
  description: "Zone 2 aerobic run\nMoving Time: 0:35:24\nDistance: 5.2 km\nTSS: 42\nAverage Heart Rate: 138 bpm",
  start_time: "2024-10-17T08:30:00Z",
  start_date: "2024-10-17",
  end_time: "2024-10-17T09:15:24Z",
  end_date: "2024-10-17",
  location: "Tel Aviv",
  status: "CONFIRMED",
  sequence: 1,
  is_all_day: false,
  has_time: true,
  source: "training_peaks",
  parsed_execution_status: "completed",
  parsed_duration: "0:35:24",
  parsed_duration_formatted: "35m 24s",
  duration_type: "moving_time",
  parsed_distance: "5.2 km",
  parsed_tss: "42"
}
```

---

## All-Day Event Handling

Training Peaks uses all-day events for planned workouts to avoid timezone issues.

### Problem:
```
All-day event: "2024-10-17"
- User in UTC: sees Oct 17
- User in UTC+3: might see Oct 16 or Oct 18
```

### Our Solution:
```javascript
if (isAllDay) {
    // Use local date components to avoid timezone conversion
    startDateStr = startDate.getFullYear() + '-' + 
                   String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(startDate.getDate()).padStart(2, '0');
}
```

This ensures the date displayed matches the date in Training Peaks, regardless of user timezone.

---

## Sequence Number

The `SEQUENCE` field tracks workout revisions:

| Sequence | Meaning |
|----------|---------|
| `0` | Original workout (first creation) |
| `1` | First modification |
| `2` | Second modification |
| `n` | nth modification |

**Usage in Change Detection:**
- Increment in sequence = workout was modified
- Same UID + different sequence = modification event

---

## Fields NOT Currently Parsed

These iCal fields are available but we don't currently use them:

### Standard iCal Fields
- `DTSTAMP` - When the event was created
- `CREATED` - Creation timestamp
- `LAST-MODIFIED` - Last modification timestamp
- `ORGANIZER` - Event organizer (usually Training Peaks)
- `ATTENDEE` - Participants (if group workout)
- `RRULE` - Recurrence rule (for repeating workouts)
- `EXDATE` - Exception dates
- `TRANSP` - Time transparency (free/busy)
- `CATEGORIES` - Event categories/tags
- `PRIORITY` - Priority level
- `CLASS` - Access classification (public/private)

### Training Peaks Specific (in Description)
- Heart rate zones
- Power zones
- Pace targets
- Detailed workout structure/intervals
- Equipment requirements
- Weather conditions
- Subjective ratings (RPE)
- Notes from athlete
- Coach comments

---

## Data Flow

```
1. Fetch iCal from Training Peaks URL
   ↓
2. Parse iCal using ical.js library
   ↓
3. Extract VEVENT components
   ↓
4. Parse each event into workout object
   ↓
5. Parse description for metrics
   ↓
6. Merge with Strava workouts
   ↓
7. Filter past planned workouts
   ↓
8. Store in localStorage
   ↓
9. Display in UI (list/calendar)
   ↓
10. Show details in modal when clicked
```

---

## iCal Library: ical.js

We use the `ical.js` library for parsing iCalendar data.

**CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/ical.js@1.5.0/build/ical.min.js"></script>
```

**Basic Usage:**
```javascript
// Parse iCal text
const jcalData = ICAL.parse(icalText);

// Create component
const comp = new ICAL.Component(jcalData);

// Get all events
const vevents = comp.getAllSubcomponents('vevent');

// Process each event
vevents.forEach(vevent => {
    const event = new ICAL.Event(vevent);
    const uid = event.uid;
    const summary = event.summary;
    const startDate = event.startDate.toJSDate();
    // ... etc
});
```

**Key Methods:**
- `ICAL.parse()` - Parse iCal text to jCal
- `ICAL.Component()` - Create component from jCal
- `getAllSubcomponents()` - Get all events
- `ICAL.Event()` - Create event object
- `toJSDate()` - Convert to JavaScript Date

---

## CORS Proxy

Training Peaks iCal URLs work directly in browsers, but we use a CORS proxy for reliability:

**Proxy URL:**
```javascript
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const url = CORS_PROXY + encodeURIComponent(tpUrl);
```

**Why:** Some environments block cross-origin requests without proper CORS headers.

---

## Date Range

Training Peaks typically provides:
- **Past workouts:** Last 7-14 days
- **Future workouts:** Next 14-30 days

The exact range depends on Training Peaks settings.

**Our Deletion Detection:**
```javascript
// Workouts older than 1 week that disappear are considered deletions
const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
```

---

## Timezone Handling

### iCal Timezone Types

1. **UTC Time:**
   ```
   DTSTART:20241017T083000Z
   (The 'Z' indicates UTC)
   ```

2. **Local Time:**
   ```
   DTSTART:20241017T083000
   (No timezone = local time)
   ```

3. **All-Day:**
   ```
   DTSTART;VALUE=DATE:20241017
   (Date only, no time)
   ```

### Our Handling

```javascript
// For display, convert to selected timezone
const displayTime = formatDateTimeWithTimezone(workout.start_time);

// Available timezones:
- Asia/Jerusalem
- America/New_York  
- America/Los_Angeles
- Europe/London
- UTC
```

---

## Duration Formatting

We format durations for display:

**Input Formats:**
- `"1:30:45"` (HH:MM:SS)
- `"1:30"` (HH:MM or MM:SS)
- `"45"` (MM or SS)

**Output Format:**
```javascript
"1:30:45" → "1h 30m 45s"
"1:30:00" → "1h 30m"
"0:35:24" → "35m 24s"
"0:00:45" → "45s"
```

**Function:**
```javascript
function formatDurationString(durationStr) {
    const parts = durationStr.split(':');
    // Parse and format based on parts
}
```

---

## Error Handling

**Common Issues:**

1. **Invalid iCal URL**
   ```javascript
   Error: Failed to fetch Training Peaks data
   ```

2. **Malformed iCal Data**
   ```javascript
   Error: Failed to parse Training Peaks calendar data
   ```

3. **Empty Calendar**
   ```javascript
   console.log('Found 0 events in iCal data')
   ```

4. **Missing UID**
   ```javascript
   console.log('Event X has no UID, skipping')
   ```

---

## Debug Tools

We provide a "Debug TP" button that logs:
- Raw iCal response
- Number of events found
- Date range of workouts
- Each workout's parsed fields
- Parsing errors

**Usage:**
```javascript
function debugTrainingPeaks() {
    // Fetch and log detailed TP data
    console.log('=== Training Peaks Debug ===');
    // ... detailed logging
}
```

---

## Future Enhancements

**Possible additions:**

1. **Parse Workout Structure:**
   - Warmup/cooldown sections
   - Interval details (reps, duration, intensity)
   - Rest periods

2. **Parse Target Metrics:**
   - Heart rate zones (Z1-Z5)
   - Power zones
   - Pace targets

3. **Parse Equipment:**
   - Bike type (road/mountain/TT)
   - Shoe type
   - Pool length (for swimming)

4. **Parse Subjective Data:**
   - RPE (Rate of Perceived Exertion)
   - Athlete notes
   - Coach feedback

5. **Parse Weather:**
   - Temperature
   - Conditions
   - Wind

6. **Handle Recurrence:**
   - Parse RRULE for repeating workouts
   - Handle exceptions (EXDATE)

7. **Use Timestamps:**
   - Track creation date (CREATED)
   - Track modification date (LAST-MODIFIED)
   - Use for more accurate change detection

---

## Comparison with Strava

| Feature | Training Peaks (iCal) | Strava (API) |
|---------|----------------------|--------------|
| **Format** | iCalendar (RFC 5545) | JSON REST API |
| **Auth** | Public URL (no auth) | OAuth 2.0 required |
| **Data Type** | Planned + Completed | Completed only |
| **Time Granularity** | All-day or timed | Always timed |
| **Metrics in Response** | Text (need parsing) | Structured fields |
| **Updates** | Real-time (iCal pull) | Real-time (API call) |
| **Rate Limits** | None | 200/15min, 2000/day |
| **Rich Metrics** | Limited | Extensive |

---

## Summary: Fields Parsed

### **Direct from iCal (7 fields):**
- `UID` → `uid`
- `SUMMARY` → `summary`
- `DESCRIPTION` → `description`
- `DTSTART` → `start_time` + `start_date`
- `DTEND` → `end_time` + `end_date`
- `LOCATION` → `location`
- `STATUS` → `status`
- `SEQUENCE` → `sequence`

### **Derived (4 fields):**
- `is_all_day` (from DTSTART properties)
- `has_time` (inverse of is_all_day)
- `source` (set to "training_peaks")
- `parsed_execution_status` (from all-day + description)

### **Parsed from Description (3 fields):**
- `parsed_duration` + `parsed_duration_formatted` (regex: moving/elapsed time)
- `parsed_distance` (regex: distance with units)
- `parsed_tss` (regex: TSS score)

**Total: 14+ fields extracted from Training Peaks iCal**

---

## References

- [iCalendar Specification (RFC 5545)](https://datatracker.ietf.org/doc/html/rfc5545)
- [ical.js Library Documentation](https://github.com/kewisch/ical.js/)
- [Training Peaks Help Center](https://help.trainingpeaks.com/)


