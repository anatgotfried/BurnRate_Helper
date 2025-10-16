# Workout Matching Algorithms - Direct Implementation

This document contains the core algorithms from our Flask implementation, ready for iOS/mobile app integration.

## Table of Contents

1. [Core Matching Logic](#core-matching-logic)
2. [Activity Type Matching](#activity-type-matching)
3. [Past Planned Workout Detection](#past-planned-workout-detection)
4. [Data Structures](#data-structures)
5. [Complete Swift Implementation](#complete-swift-implementation)

---

## Core Matching Logic

### Python (Reference Implementation)

```python
def merge_workouts_by_source(tp_workouts, strava_workouts, enabled_sources):
    """
    Merges workouts from Training Peaks and Strava based on enabled sources.
    Strava completed workouts take precedence over TP workouts.
    Past planned TP workouts are automatically removed.
    """
    merged = {}
    matched_tp_uids = set()
    
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
```

### Swift Translation

```swift
func mergeWorkouts(tpWorkouts: [String: TPWorkout], stravaWorkouts: [String: StravaWorkout]) -> [String: Workout] {
    var merged: [String: Workout] = [:]
    var matchedTPUIDs: Set<String> = []
    
    // Add Strava workouts first (they take precedence)
    for (stravaUID, stravaWorkout) in stravaWorkouts {
        var matchedTPUID: String?
        
        // Try to match with TP workout
        if !tpWorkouts.isEmpty {
            matchedTPUID = findMatchingTPWorkout(stravaWorkout, tpWorkouts, matchedTPUIDs)
            if let matched = matchedTPUID {
                matchedTPUIDs.insert(matched)
            }
        }
        
        // Convert Strava workout to unified format
        let workout = Workout.fromStrava(stravaWorkout)
        if let matchedTPUID = matchedTPUID {
            workout.replacedTPUID = matchedTPUID
        }
        
        merged[stravaUID] = workout
    }
    
    // Add unmatched TP workouts (filter out past planned ones)
    for (tpUID, tpWorkout) in tpWorkouts {
        if matchedTPUIDs.contains(tpUID) { continue }
        
        // Skip past planned TP workouts
        if isPastPlannedWorkout(tpWorkout) { continue }
        
        let workout = Workout.fromTP(tpWorkout)
        merged[tpUID] = workout
    }
    
    return merged
}
```

---

## Activity Type Matching

### Python (Reference Implementation)

```python
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
```

### Swift Translation

```swift
func activitiesMatch(strava: StravaWorkout, tp: TPWorkout) -> Bool {
    let stravaType = strava.type.lowercased()
    let stravaName = strava.name.lowercased()
    let tpSummary = tp.summary.lowercased()
    
    // Direct type matching
    if stravaType.contains("run") && tpSummary.contains("run") {
        return true
    }
    
    let bikeTypes = ["ride", "bike", "virtualride"]
    let bikeKeywords = ["bike", "ride"]
    if bikeTypes.contains(where: stravaType.contains) && bikeKeywords.contains(where: tpSummary.contains) {
        return true
    }
    
    if stravaType.contains("swim") && tpSummary.contains("swim") {
        return true
    }
    
    if tpSummary.contains(stravaType) {
        return true
    }
    
    // Special cases
    if stravaName.contains("zwift") && bikeKeywords.contains(where: tpSummary.contains) {
        return true
    }
    
    if stravaType.contains("virtualride") && bikeKeywords.contains(where: tpSummary.contains) {
        return true
    }
    
    return false
}
```

---

## Past Planned Workout Detection

### Python (Reference Implementation)

```python
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
```

### Swift Translation

```swift
func isPastPlannedWorkout(_ workout: TPWorkout) -> Bool {
    guard let startDate = workout.startTime else { return false }
    
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())
    let workoutDate = calendar.startOfDay(for: startDate)
    
    // Must be in the past
    guard workoutDate < today else { return false }
    
    // Must be planned (not completed)
    guard workout.executionStatus == .planned else { return false }
    
    // Only remove TP workouts that are past and planned
    return workout.source == .trainingPeaks
}
```

---

## Data Structures

### Python (Reference Implementation)

```python
# Workout data structure (from Flask app)
workout = {
    'uid': 'unique_identifier',
    'summary': 'Workout title',
    'description': 'Full description',
    'start_time': '2025-10-12T09:00:00Z',
    'start_date': '2025-10-12',
    'end_time': '2025-10-12T11:00:00Z',
    'is_all_day': False,
    'has_time': True,
    'location': '',
    'status': '',
    'source': 'training_peaks',  # or 'strava'
    'activity_type': 'Run',  # for Strava
    'duration': {
        'total_seconds': 7200,
        'formatted': '2:00:00'
    },
    'parsed_duration': '2:00:00',
    'parsed_planned_duration': '2:00:00',
    'parsed_distance': '10.5 km',
    'parsed_execution_status': 'completed',  # or 'planned'
    'strava_metrics': {  # Only for Strava workouts
        'distance': 10500,  # meters
        'moving_time': 7200,  # seconds
        'elapsed_time': 7500,
        'average_speed': 2.9,  # m/s
        'average_heart_rate': 150.0,
        'average_power': 200.0,
        'calories': 800,
        'elevation_gain': 150.0
    }
}
```

### Swift Translation

```swift
struct Workout: Codable, Identifiable {
    let id: String
    let summary: String
    let description: String
    let startTime: Date?
    let startDate: String
    let endTime: Date?
    let isAllDay: Bool
    let hasTime: Bool
    let location: String
    let status: String
    let source: WorkoutSource
    let activityType: String?
    let duration: DurationInfo?
    let parsedDuration: String?
    let parsedPlannedDuration: String?
    let parsedDistance: String?
    let executionStatus: ExecutionStatus
    let stravaMetrics: StravaMetrics?
    let replacedTPUID: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "uid"
        case summary, description, location, status, source
        case startTime = "start_time"
        case startDate = "start_date"
        case endTime = "end_time"
        case isAllDay = "is_all_day"
        case hasTime = "has_time"
        case activityType = "activity_type"
        case duration, parsedDuration, parsedPlannedDuration, parsedDistance
        case executionStatus = "parsed_execution_status"
        case stravaMetrics = "strava_metrics"
        case replacedTPUID = "replaced_tp_uid"
    }
}

struct DurationInfo: Codable {
    let totalSeconds: Int
    let formatted: String
    
    enum CodingKeys: String, CodingKey {
        case totalSeconds = "total_seconds"
        case formatted
    }
}

struct StravaMetrics: Codable {
    let distance: Double // meters
    let movingTime: Int // seconds
    let elapsedTime: Int
    let averageSpeed: Double // m/s
    let averageHeartRate: Double?
    let averagePower: Double?
    let calories: Int?
    let elevationGain: Double
    
    enum CodingKeys: String, CodingKey {
        case distance, calories
        case movingTime = "moving_time"
        case elapsedTime = "elapsed_time"
        case averageSpeed = "average_speed"
        case averageHeartRate = "average_heart_rate"
        case averagePower = "average_power"
        case elevationGain = "elevation_gain"
    }
}

enum WorkoutSource: String, Codable, CaseIterable {
    case trainingPeaks = "training_peaks"
    case strava = "strava"
}

enum ExecutionStatus: String, Codable, CaseIterable {
    case planned = "planned"
    case completed = "completed"
}
```

---

## Complete Swift Implementation

### WorkoutMatcher.swift

```swift
import Foundation

class WorkoutMatcher {
    
    // MARK: - Main Matching Function
    
    static func mergeWorkouts(tpWorkouts: [String: TPWorkout], stravaWorkouts: [String: StravaWorkout]) -> [String: Workout] {
        var merged: [String: Workout] = [:]
        var matchedTPUIDs: Set<String> = []
        
        // Process Strava workouts first (they take precedence for completed workouts)
        for (stravaUID, stravaWorkout) in stravaWorkouts {
            let stravaWorkoutDate = stravaWorkout.startDate
            
            // Try to find matching TP workout
            var matchedTPUID: String?
            
            for (tpUID, tpWorkout) in tpWorkouts {
                if matchedTPUIDs.contains(tpUID) { continue }
                
                if shouldMatchWorkouts(strava: stravaWorkout, tp: tpWorkout) {
                    matchedTPUID = tpUID
                    matchedTPUIDs.insert(tpUID)
                    break
                }
            }
            
            // Convert Strava workout to unified format
            let workout = Workout.fromStrava(stravaWorkout)
            if let matchedTPUID = matchedTPUID {
                workout.replacedTPUID = matchedTPUID
            }
            
            merged[stravaUID] = workout
        }
        
        // Add unmatched TP workouts (filter out past planned ones)
        for (tpUID, tpWorkout) in tpWorkouts {
            if matchedTPUIDs.contains(tpUID) { continue }
            
            // Skip past planned TP workouts
            if isPastPlannedWorkout(tpWorkout) { continue }
            
            let workout = Workout.fromTP(tpWorkout)
            merged[tpUID] = workout
        }
        
        return merged
    }
    
    // MARK: - Matching Criteria
    
    private static func shouldMatchWorkouts(strava: StravaWorkout, tp: TPWorkout) -> Bool {
        // 1. Check if dates match
        guard Calendar.current.isDate(strava.startDate, inSameDayAs: tp.startTime) else {
            return false
        }
        
        // 2. Check if activity types match
        guard activitiesMatch(strava: strava, tp: tp) else {
            return false
        }
        
        // 3. Apply time-based matching logic
        let workoutDate = Calendar.current.startOfDay(for: strava.startDate)
        let today = Calendar.current.startOfDay(for: Date())
        let isPast = workoutDate < today
        
        if isPast {
            // For past workouts: same date + same sport type = automatic match
            return true
        } else {
            // For future workouts: check time proximity
            return checkTimeProximity(strava: strava, tp: tp)
        }
    }
    
    private static func activitiesMatch(strava: StravaWorkout, tp: TPWorkout) -> Bool {
        let stravaType = strava.type.lowercased()
        let stravaName = strava.name.lowercased()
        let tpSummary = tp.summary.lowercased()
        
        // Direct type matching
        if stravaType.contains("run") && tpSummary.contains("run") {
            return true
        }
        
        let bikeTypes = ["ride", "bike", "virtualride"]
        let bikeKeywords = ["bike", "ride"]
        if bikeTypes.contains(where: stravaType.contains) && bikeKeywords.contains(where: tpSummary.contains) {
            return true
        }
        
        if stravaType.contains("swim") && tpSummary.contains("swim") {
            return true
        }
        
        if tpSummary.contains(stravaType) {
            return true
        }
        
        // Special cases
        if stravaName.contains("zwift") && bikeKeywords.contains(where: tpSummary.contains) {
            return true
        }
        
        if stravaType.contains("virtualride") && bikeKeywords.contains(where: tpSummary.contains) {
            return true
        }
        
        return false
    }
    
    private static func checkTimeProximity(strava: StravaWorkout, tp: TPWorkout) -> Bool {
        guard let tpStartTime = tp.startTime else { return false }
        
        let timeDifference = abs(strava.startDate.timeIntervalSince(tpStartTime))
        return timeDifference <= 3600 // Within 1 hour
    }
    
    private static func isPastPlannedWorkout(_ workout: TPWorkout) -> Bool {
        guard let startDate = workout.startTime else { return false }
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let workoutDate = calendar.startOfDay(for: startDate)
        
        // Must be in the past
        guard workoutDate < today else { return false }
        
        // Must be planned (not completed)
        guard workout.executionStatus == .planned else { return false }
        
        // Only remove TP workouts that are past and planned
        return workout.source == .trainingPeaks
    }
}

// MARK: - Workout Extensions

extension Workout {
    static func fromStrava(_ strava: StravaWorkout) -> Workout {
        let calendar = Calendar.current
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        return Workout(
            id: String(strava.id),
            summary: strava.name,
            description: strava.summary ?? "",
            startTime: strava.startDate,
            startDate: dateFormatter.string(from: strava.startDate),
            endTime: strava.startDate.addingTimeInterval(strava.movingTime),
            isAllDay: false,
            hasTime: true,
            location: "",
            status: "",
            source: .strava,
            activityType: strava.type,
            duration: DurationInfo(
                totalSeconds: Int(strava.movingTime),
                formatted: formatDuration(strava.movingTime)
            ),
            parsedDuration: formatDuration(strava.movingTime),
            parsedPlannedDuration: nil,
            parsedDistance: strava.distance > 0 ? "\(strava.distance/1000, specifier: "%.2f") km" : nil,
            executionStatus: .completed,
            stravaMetrics: StravaMetrics(
                distance: strava.distance,
                movingTime: Int(strava.movingTime),
                elapsedTime: Int(strava.elapsedTime),
                averageSpeed: strava.averageSpeed,
                averageHeartRate: strava.averageHeartRate,
                averagePower: strava.averagePower,
                calories: strava.calories,
                elevationGain: strava.totalElevationGain
            ),
            replacedTPUID: nil
        )
    }
    
    static func fromTP(_ tp: TPWorkout) -> Workout {
        let calendar = Calendar.current
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        return Workout(
            id: tp.uid,
            summary: tp.summary,
            description: tp.description,
            startTime: tp.startTime,
            startDate: tp.startDate,
            endTime: tp.endTime,
            isAllDay: tp.isAllDay,
            hasTime: tp.hasTime,
            location: tp.location,
            status: tp.status,
            source: .trainingPeaks,
            activityType: nil,
            duration: tp.duration,
            parsedDuration: tp.parsedDuration,
            parsedPlannedDuration: tp.parsedPlannedDuration,
            parsedDistance: tp.parsedDistance,
            executionStatus: tp.executionStatus,
            stravaMetrics: nil,
            replacedTPUID: nil
        )
    }
}

// MARK: - Helper Functions

private func formatDuration(_ timeInterval: TimeInterval) -> String {
    let hours = Int(timeInterval) / 3600
    let minutes = Int(timeInterval % 3600) / 60
    let seconds = Int(timeInterval) % 60
    
    if hours > 0 {
        return String(format: "%d:%02d:%02d", hours, minutes, seconds)
    } else {
        return String(format: "%d:%02d", minutes, seconds)
    }
}
```

---

## Usage Example

```swift
// Initialize workout manager
let workoutManager = WorkoutManager(tpURL: "https://www.trainingpeaks.com/ical/YOUR_ID.ics")

// Fetch and merge workouts
Task {
    // Fetch TP workouts
    let tpContent = try await ICalParser.fetchICal(from: workoutManager.tpURL)
    let tpWorkouts = ICalParser.parseICal(tpContent)
    
    // Fetch Strava workouts
    let stravaActivities = try await StravaAuthManager.shared.fetchActivities()
    let stravaWorkouts = Dictionary(uniqueKeysWithValues: stravaActivities.map { (String($0.id), $0) })
    
    // Merge workouts using the algorithm
    let mergedWorkouts = WorkoutMatcher.mergeWorkouts(
        tpWorkouts: tpWorkouts,
        stravaWorkouts: stravaWorkouts
    )
    
    // Update UI with merged results
    await MainActor.run {
        self.workouts = mergedWorkouts
    }
}
```

This implementation provides the exact same logic as the Flask app, ensuring consistent behavior across platforms.
