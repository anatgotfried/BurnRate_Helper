# Strava API Fields Reference

Complete documentation of Strava activity fields and how we parse them in the Training Peaks Workout Tracker.

## API Endpoint

```
GET https://www.strava.com/api/v3/athlete/activities
```

**Parameters:**
- `after`: Unix timestamp (e.g., 10 days ago)
- `per_page`: Number of activities to fetch (max 200)

**Authentication:**
- Header: `Authorization: Bearer {access_token}`

---

## Fields We Parse from Strava

### Core Identification

| Strava Field | Our Field | Type | Description | Example |
|--------------|-----------|------|-------------|---------|
| `id` | `uid` | string | Unique identifier (prefixed with `strava_`) | `strava_12345678` |
| `name` | `summary` | string | Activity name/title | `"Morning Run"` |
| `description` | `description` | string | User-provided description | `"Easy recovery pace"` |

### Date & Time

| Strava Field | Our Field | Type | Description | Example |
|--------------|-----------|------|-------------|---------|
| `start_date` | `start_time` | ISO 8601 | UTC start date/time | `"2024-10-17T08:30:00Z"` |
| `start_date_local` | `start_date` | ISO 8601 | Local start date (we extract date only) | `"2024-10-17"` |
| - | `end_time` | ISO 8601 | Calculated from `start_time + elapsed_time` | `"2024-10-17T09:30:00Z"` |
| - | `end_date` | string | Extracted from calculated `end_time` | `"2024-10-17"` |

### Activity Type

| Strava Field | Our Field | Type | Description | Example |
|--------------|-----------|------|-------------|---------|
| `sport_type` | `activity_type` | string | Primary activity type (preferred) | `"Run"`, `"Ride"`, `"VirtualRide"` |
| `type` | `activity_type` | string | Fallback if `sport_type` is missing | `"Run"`, `"Ride"` |

**Common Activity Types:**
- `Run`, `TrailRun`, `VirtualRun`
- `Ride`, `VirtualRide`, `GravelRide`, `MountainBikeRide`
- `Swim`, `Workout`, `WeightTraining`, `Yoga`

### Location

| Strava Field | Our Field | Type | Description | Example |
|--------------|-----------|------|-------------|---------|
| `location_city` | `location` | string | City (combined with state) | `"Tel Aviv"` |
| `location_state` | `location` | string | State/Region (combined with city) | `"Tel Aviv District"` |

**Parsing Logic:**
```javascript
location: `${activity.location_city || ''} ${activity.location_state || ''}`.trim()
```

### Duration & Time

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `moving_time` | `strava_moving_time` | integer | seconds | Time in motion (excludes stops) |
| `moving_time` | `parsed_duration` | string | seconds | Same as moving_time (as string) |
| `moving_time` | `parsed_duration_formatted` | string | formatted | Human-readable duration |
| `elapsed_time` | `strava_elapsed_time` | integer | seconds | Total elapsed time (includes stops) |

**Duration Formatting:**
```javascript
// Input: 3661 seconds
// Output: "1h 1m 1s" or "1:01:01"
```

### Distance

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `distance` | `strava_distance` | float | meters | Raw distance in meters |
| `distance` | `parsed_distance` | string | km | Converted to kilometers with 2 decimals |

**Distance Conversion:**
```javascript
parsed_distance: `${(activity.distance / 1000).toFixed(2)} km`
// Example: 5000 meters → "5.00 km"
```

### Speed

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `average_speed` | `strava_average_speed` | float | m/s | Average speed in meters/second |
| `max_speed` | `strava_max_speed` | float | m/s | Maximum speed in meters/second |

**Speed Display (in modal):**
```javascript
// Convert m/s to km/h
const kmh = (activity.strava_average_speed * 3.6).toFixed(1)
// Example: 2.78 m/s → "10.0 km/h"
```

### Elevation

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `total_elevation_gain` | `strava_total_elevation_gain` | float | meters | Total elevation gained |

### Heart Rate

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `average_heartrate` | `strava_average_heartrate` | float | bpm | Average heart rate |
| `max_heartrate` | `strava_max_heartrate` | float | bpm | Maximum heart rate |

**Note:** Only available if the activity was recorded with a heart rate monitor.

### Power Metrics

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `average_watts` | `strava_average_watts` | float | watts | Average power output |
| `kilojoules` | `strava_kilojoules` | float | kJ | Total energy expenditure |

**Note:** Only available if the activity was recorded with a power meter.

### Energy & Calories

| Strava Field | Our Field | Type | Unit | Description |
|--------------|-----------|------|------|-------------|
| `calories` | `strava_calories` | float | kcal | Estimated calories burned |

---

## Fixed Fields (Set by Us)

These fields are not from Strava but set by our application:

| Our Field | Value | Type | Description |
|-----------|-------|------|-------------|
| `source` | `"strava"` | string | Identifies data source |
| `status` | `"COMPLETED"` | string | All Strava activities are completed |
| `parsed_execution_status` | `"completed"` | string | Normalized status |
| `is_all_day` | `false` | boolean | Strava activities have specific times |
| `has_time` | `true` | boolean | Strava activities always have times |
| `duration_type` | `"moving_time"` | string | Indicates which duration we use |
| `sequence` | `0` | integer | Workout sequence (unused for Strava) |

---

## Fields NOT Currently Used

These Strava fields are available but we don't currently parse them:

### Additional Metrics
- `average_cadence` - Steps/min or RPM
- `average_temp` - Temperature in Celsius
- `device_watts` - Whether power is from device or estimated
- `has_kudos` - Whether activity has kudos
- `kudos_count` - Number of kudos received
- `comment_count` - Number of comments
- `athlete_count` - Number of participants (for group activities)

### Performance
- `suffer_score` - Strava's relative effort score
- `weighted_average_watts` - Normalized power
- `max_watts` - Maximum power output

### Splits & Laps
- `splits_metric` - Kilometer splits
- `splits_standard` - Mile splits
- `laps` - Lap data
- `best_efforts` - Segment efforts

### Equipment
- `gear_id` - Associated equipment (bike, shoes)

### Geographic
- `start_latlng` - Starting coordinates
- `end_latlng` - Ending coordinates
- `map` - Polyline map data

### Privacy
- `private` - Whether activity is private
- `visibility` - Activity visibility setting
- `flagged` - Whether activity is flagged

---

## Example Strava Activity JSON

```json
{
  "id": 12345678901,
  "name": "Morning Run",
  "description": "Easy recovery run",
  "distance": 5000.0,
  "moving_time": 1800,
  "elapsed_time": 1850,
  "total_elevation_gain": 50.0,
  "sport_type": "Run",
  "type": "Run",
  "start_date": "2024-10-17T08:30:00Z",
  "start_date_local": "2024-10-17T11:30:00+03:00",
  "location_city": "Tel Aviv",
  "location_state": "Tel Aviv District",
  "average_speed": 2.78,
  "max_speed": 3.5,
  "average_heartrate": 145.5,
  "max_heartrate": 165.0,
  "calories": 350.5
}
```

## Example Parsed Workout Object

```javascript
{
  uid: "strava_12345678901",
  summary: "Morning Run",
  description: "Easy recovery run",
  start_time: "2024-10-17T08:30:00Z",
  start_date: "2024-10-17",
  end_time: "2024-10-17T09:00:50Z",
  end_date: "2024-10-17",
  is_all_day: false,
  has_time: true,
  location: "Tel Aviv Tel Aviv District",
  status: "COMPLETED",
  source: "strava",
  activity_type: "Run",
  sequence: 0,
  parsed_execution_status: "completed",
  duration_type: "moving_time",
  parsed_duration: "1800",
  parsed_duration_formatted: "30m",
  parsed_distance: "5.00 km",
  strava_distance: 5000.0,
  strava_moving_time: 1800,
  strava_elapsed_time: 1850,
  strava_total_elevation_gain: 50.0,
  strava_average_speed: 2.78,
  strava_max_speed: 3.5,
  strava_average_heartrate: 145.5,
  strava_max_heartrate: 165.0,
  strava_calories: 350.5
}
```

---

## Data Flow

```
1. Fetch from Strava API
   ↓
2. Parse each activity into workout object
   ↓
3. Merge with Training Peaks workouts
   ↓
4. Store in localStorage
   ↓
5. Display in UI (list/calendar)
   ↓
6. Show details in modal when clicked
```

---

## Rate Limits

**Strava API Rate Limits:**
- 200 requests per 15 minutes
- 2,000 requests per day
- Per athlete

**Our Implementation:**
- Single request per sync
- Fetches last 10 days of activities
- Max 200 activities per request

---

## Authentication

**OAuth 2.0 Flow:**
1. User clicks "Connect Strava"
2. Redirect to Strava authorization page
3. User approves
4. Redirect to callback with `code`
5. Exchange `code` for `access_token` and `refresh_token`
6. Store tokens in `localStorage`
7. Use `access_token` for API requests

**Token Storage:**
```javascript
localStorage.setItem('stravaAccessToken', data.access_token)
localStorage.setItem('stravaRefreshToken', data.refresh_token)
localStorage.setItem('stravaTokenExpiry', data.expires_at)
localStorage.setItem('stravaAthlete', JSON.stringify(data.athlete))
```

---

## Error Handling

**Common Errors:**
- `401 Unauthorized` - Invalid or expired token
- `403 Forbidden` - Insufficient permissions
- `429 Too Many Requests` - Rate limit exceeded
- CORS errors - Browser blocking cross-origin requests

**Our Error Handling:**
```javascript
if (response.status === 401) {
    throw new Error('Invalid Strava access token');
}
```

---

## Future Enhancements

**Possible additions:**
1. Parse `average_cadence` for running/cycling metrics
2. Add `suffer_score` for training load
3. Include `splits_metric` for pace analysis
4. Show `gear_id` to track equipment usage
5. Display `best_efforts` for segment PRs
6. Use `map` polyline for route visualization
7. Add `weighted_average_watts` for cycling power analysis

---

## References

- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [Activity Object Reference](https://developers.strava.com/docs/reference/#api-models-DetailedActivity)
- [OAuth Flow](https://developers.strava.com/docs/authentication/)

