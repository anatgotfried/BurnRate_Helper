# Strava iOS Integration & Workout Matching Guide

## Overview

This guide provides a complete implementation strategy for integrating Strava authentication and workout matching logic from our Flask web app into an iOS application. The system handles Training Peaks iCal feeds, Strava activities, and intelligent workout deduplication.

## Table of Contents

1. [Strava OAuth 2.0 iOS Implementation](#strava-oauth-20-ios-implementation)
2. [Training Peaks iCal Integration](#training-peaks-ical-integration)
3. [Workout Matching Algorithm](#workout-matching-algorithm)
4. [Data Models & Architecture](#data-models--architecture)
5. [Implementation Steps](#implementation-steps)
6. [Testing Strategy](#testing-strategy)
7. [Production Considerations](#production-considerations)

---

## Strava OAuth 2.0 iOS Implementation

### 1. App Registration

**Strava Developer Dashboard Setup:**
```
Application Name: Your App Name
Category: Fitness
Club: (optional)
Website: https://yourdomain.com
Authorization Callback Domain: yourdomain.com
```

**Required Permissions:**
- `activity:read` - Read user's activities
- `activity:read_all` - Read user's private activities (optional)

### 2. iOS Implementation

#### A. URL Scheme Setup

**Info.plist Configuration:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>strava-oauth</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourapp://strava</string>
        </array>
    </dict>
</array>

<key>LSApplicationQueriesSchemes</key>
<array>
    <string>strava</string>
</array>
```

#### B. OAuth Flow Implementation

**Swift Implementation:**
```swift
import Foundation
import AuthenticationServices

class StravaAuthManager: NSObject {
    static let shared = StravaAuthManager()
    
    // Strava OAuth Configuration
    private let clientId = "YOUR_STRAVA_CLIENT_ID"
    private let clientSecret = "YOUR_STRAVA_CLIENT_SECRET"
    private let redirectURI = "yourapp://strava"
    private let scope = "activity:read"
    
    // OAuth URLs
    private var authURL: URL {
        var components = URLComponents(string: "https://www.strava.com/oauth/authorize")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: scope),
            URLQueryItem(name: "state", value: "ios_app")
        ]
        return components.url!
    }
    
    private let tokenURL = URL(string: "https://www.strava.com/oauth/token")!
    
    // Current session storage
    private var accessToken: String?
    private var refreshToken: String?
    private var tokenExpiry: Date?
    
    // MARK: - Authentication Flow
    
    func startOAuthFlow(from viewController: UIViewController) {
        let webAuthSession = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: "yourapp"
        ) { [weak self] callbackURL, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.handleAuthError(error)
                    return
                }
                
                guard let callbackURL = callbackURL else {
                    self?.handleAuthError(AuthError.noCallbackURL)
                    return
                }
                
                self?.handleOAuthCallback(url: callbackURL)
            }
        }
        
        webAuthSession.presentationContextProvider = viewController as? ASWebAuthenticationPresentationContextProviding
        webAuthSession.start()
    }
    
    private func handleOAuthCallback(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            handleAuthError(AuthError.invalidCallbackURL)
            return
        }
        
        // Extract authorization code
        guard let code = queryItems.first(where: { $0.name == "code" })?.value else {
            if let error = queryItems.first(where: { $0.name == "error" })?.value {
                handleAuthError(AuthError.stravaError(error))
            } else {
                handleAuthError(AuthError.noAuthorizationCode)
            }
            return
        }
        
        // Exchange code for tokens
        exchangeCodeForTokens(code: code)
    }
    
    private func exchangeCodeForTokens(code: String) {
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        let bodyParams = [
            "client_id": clientId,
            "client_secret": clientSecret,
            "code": code,
            "grant_type": "authorization_code"
        ]
        
        request.httpBody = bodyParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&").data(using: .utf8)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.handleAuthError(error)
                }
                return
            }
            
            guard let data = data else {
                DispatchQueue.main.async {
                    self?.handleAuthError(AuthError.noResponseData)
                }
                return
            }
            
            do {
                let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
                DispatchQueue.main.async {
                    self?.saveTokens(tokenResponse)
                }
            } catch {
                DispatchQueue.main.async {
                    self?.handleAuthError(error)
                }
            }
        }.resume()
    }
    
    // MARK: - Token Management
    
    private func saveTokens(_ tokenResponse: TokenResponse) {
        accessToken = tokenResponse.accessToken
        refreshToken = tokenResponse.refreshToken
        
        // Calculate expiry (tokens last 6 hours)
        tokenExpiry = Date().addingTimeInterval(TimeInterval(tokenResponse.expiresIn))
        
        // Persist to Keychain
        saveToKeychain()
        
        // Notify success
        NotificationCenter.default.post(name: .stravaAuthSuccess, object: nil)
    }
    
    private func saveToKeychain() {
        guard let accessToken = accessToken,
              let refreshToken = refreshToken else { return }
        
        let keychain = Keychain(service: "yourapp.strava")
        keychain["access_token"] = accessToken
        keychain["refresh_token"] = refreshToken
        keychain["token_expiry"] = tokenExpiry?.timeIntervalSince1970.description
    }
    
    func loadFromKeychain() {
        let keychain = Keychain(service: "yourapp.strava")
        
        if let accessToken = keychain["access_token"],
           let refreshToken = keychain["refresh_token"],
           let expiryString = keychain["token_expiry"],
           let expiryTimestamp = Double(expiryString) {
            
            self.accessToken = accessToken
            self.refreshToken = refreshToken
            self.tokenExpiry = Date(timeIntervalSince1970: expiryTimestamp)
            
            // Check if token is still valid
            if Date() > tokenExpiry! {
                refreshAccessToken()
            }
        }
    }
    
    private func refreshAccessToken() {
        guard let refreshToken = refreshToken else {
            handleAuthError(AuthError.noRefreshToken)
            return
        }
        
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        let bodyParams = [
            "client_id": clientId,
            "client_secret": clientSecret,
            "refresh_token": refreshToken,
            "grant_type": "refresh_token"
        ]
        
        request.httpBody = bodyParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&").data(using: .utf8)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    self?.handleAuthError(error)
                }
                return
            }
            
            guard let data = data else { return }
            
            do {
                let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
                DispatchQueue.main.async {
                    self?.saveTokens(tokenResponse)
                }
            } catch {
                DispatchQueue.main.async {
                    self?.handleAuthError(error)
                }
            }
        }.resume()
    }
    
    // MARK: - API Calls
    
    func fetchActivities(completion: @escaping (Result<[StravaActivity], Error>) -> Void) {
        guard let accessToken = accessToken,
              Date() < tokenExpiry! else {
            refreshAccessToken { [weak self] in
                self?.fetchActivities(completion: completion)
            }
            return
        }
        
        // Fetch last 10 days of activities
        let tenDaysAgo = Calendar.current.date(byAdding: .day, value: -10, to: Date())!
        let unixTimestamp = Int(tenDaysAgo.timeIntervalSince1970)
        
        var components = URLComponents(string: "https://www.strava.com/api/v3/athlete/activities")!
        components.queryItems = [
            URLQueryItem(name: "after", value: "\(unixTimestamp)"),
            URLQueryItem(name: "per_page", value: "200")
        ]
        
        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
                return
            }
            
            guard let data = data else {
                DispatchQueue.main.async {
                    completion(.failure(AuthError.noResponseData))
                }
                return
            }
            
            do {
                let activities = try JSONDecoder().decode([StravaActivity].self, from: data)
                DispatchQueue.main.async {
                    completion(.success(activities))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }.resume()
    }
    
    // MARK: - Error Handling
    
    private func handleAuthError(_ error: Error) {
        NotificationCenter.default.post(name: .stravaAuthError, object: error)
    }
}

// MARK: - Supporting Types

enum AuthError: Error, LocalizedError {
    case noCallbackURL
    case invalidCallbackURL
    case noAuthorizationCode
    case noResponseData
    case noRefreshToken
    case stravaError(String)
    
    var errorDescription: String? {
        switch self {
        case .noCallbackURL:
            return "No callback URL received from Strava"
        case .invalidCallbackURL:
            return "Invalid callback URL format"
        case .noAuthorizationCode:
            return "No authorization code received"
        case .noResponseData:
            return "No response data from Strava"
        case .noRefreshToken:
            return "No refresh token available"
        case .stravaError(let message):
            return "Strava error: \(message)"
        }
    }
}

struct TokenResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let athlete: Athlete
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case athlete
    }
}

struct Athlete: Codable {
    let id: Int
    let username: String?
    let firstName: String?
    let lastName: String?
    
    enum CodingKeys: String, CodingKey {
        case id, username
        case firstName = "firstname"
        case lastName = "lastname"
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let stravaAuthSuccess = Notification.Name("stravaAuthSuccess")
    static let stravaAuthError = Notification.Name("stravaAuthError")
}
```

---

## Training Peaks iCal Integration

### 1. iCal Parsing Implementation

**Swift iCal Parser:**
```swift
import Foundation

class ICalParser {
    static func fetchICal(from urlString: String) async throws -> String {
        guard let url = URL(string: urlString) else {
            throw ICalError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw ICalError.invalidResponse
        }
        
        guard let content = String(data: data, encoding: .utf8) else {
            throw ICalError.invalidData
        }
        
        return content
    }
    
    static func parseICal(_ content: String) -> [String: TPWorkout] {
        var workouts: [String: TPWorkout] = [:]
        
        let lines = content.components(separatedBy: .newlines)
        var currentEvent: [String: String] = [:]
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            if trimmedLine == "BEGIN:VEVENT" {
                currentEvent = [:]
            } else if trimmedLine == "END:VEVENT" {
                if let workout = parseEvent(currentEvent) {
                    workouts[workout.uid] = workout
                }
                currentEvent = [:]
            } else {
                let components = trimmedLine.components(separatedBy: ":")
                if components.count >= 2 {
                    let key = components[0]
                    let value = components.dropFirst().joined(separator: ":")
                    currentEvent[key] = value
                }
            }
        }
        
        return workouts
    }
    
    private static func parseEvent(_ event: [String: String]) -> TPWorkout? {
        guard let uid = event["UID"],
              let summary = event["SUMMARY"],
              let dtstart = event["DTSTART"] else {
            return nil
        }
        
        let description = event["DESCRIPTION"] ?? ""
        let dtend = event["DTEND"]
        let location = event["LOCATION"] ?? ""
        let status = event["STATUS"] ?? ""
        
        // Parse start/end times
        let (startTime, isAllDay) = parseDateTime(dtstart)
        let endTime = dtend != nil ? parseDateTime(dtend!).0 : nil
        
        // Calculate duration
        let duration = calculateDuration(start: startTime, end: endTime, isAllDay: isAllDay)
        
        // Parse description for details
        let parsedDetails = parseDescription(description)
        
        // Determine execution status
        let executionStatus = determineExecutionStatus(
            startDate: startTime,
            status: status,
            description: description
        )
        
        return TPWorkout(
            uid: uid,
            summary: summary,
            description: description,
            startTime: startTime,
            endTime: endTime,
            isAllDay: isAllDay,
            location: location,
            status: status,
            source: .trainingPeaks,
            duration: duration,
            parsedDetails: parsedDetails,
            executionStatus: executionStatus
        )
    }
    
    private static func parseDateTime(_ dateTimeString: String) -> (Date?, Bool) {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = formatter.date(from: dateTimeString) {
            return (date, false)
        }
        
        // Try date-only format (all-day events)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyyMMdd"
        if let date = dateFormatter.date(from: dateTimeString) {
            return (date, true)
        }
        
        return (nil, false)
    }
    
    private static func calculateDuration(start: Date?, end: Date?, isAllDay: Bool) -> Duration? {
        guard let start = start, let end = end, !isAllDay else {
            return nil
        }
        
        let timeInterval = end.timeIntervalSince(start)
        return Duration(seconds: timeInterval)
    }
    
    private static func parseDescription(_ description: String) -> ParsedDetails {
        // Parse duration, distance, TSS, etc. from description
        // Implementation similar to Python version
        
        var parsed = ParsedDetails()
        
        // Parse planned duration (e.g., "3:00")
        if let plannedDurationMatch = description.range(of: #"(\d+):(\d+)"#, options: .regularExpression) {
            let durationString = String(description[plannedDurationMatch])
            parsed.plannedDuration = durationString
        }
        
        // Parse distance
        if let distanceMatch = description.range(of: #"(\d+\.?\d*)\s*(km|m|miles?)"#, options: .regularExpression) {
            parsed.distance = String(description[distanceMatch])
        }
        
        // Parse TSS
        if let tssMatch = description.range(of: #"TSS:\s*(\d+)"#, options: .regularExpression) {
            let tssString = String(description[tssMatch])
            parsed.tss = tssString
        }
        
        return parsed
    }
    
    private static func determineExecutionStatus(startDate: Date?, status: String, description: String) -> ExecutionStatus {
        // If workout is in the future, force to planned
        if let startDate = startDate, startDate > Date() {
            return .planned
        }
        
        // Check for completion indicators in description
        let lowerDescription = description.lowercased()
        if lowerDescription.contains("actual time") || lowerDescription.contains("actual distance") {
            return .completed
        }
        
        // Default to planned for TP workouts
        return .planned
    }
}

enum ICalError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidData
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid iCal URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidData:
            return "Invalid data received"
        }
    }
}
```

---

## Workout Matching Algorithm

### 1. Core Matching Logic

**Swift Implementation:**
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
        
        if (stravaType.contains("ride") || stravaType.contains("bike") || stravaType.contains("virtualride")) &&
           (tpSummary.contains("bike") || tpSummary.contains("ride")) {
            return true
        }
        
        if stravaType.contains("swim") && tpSummary.contains("swim") {
            return true
        }
        
        if tpSummary.contains(stravaType) {
            return true
        }
        
        // Special cases
        if stravaName.contains("zwift") && (tpSummary.contains("bike") || tpSummary.contains("ride")) {
            return true
        }
        
        if stravaType.contains("virtualride") && (tpSummary.contains("bike") || tpSummary.contains("ride")) {
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
        
        let today = Calendar.current.startOfDay(for: Date())
        let workoutDate = Calendar.current.startOfDay(for: startDate)
        
        // Must be in the past
        guard workoutDate < today else { return false }
        
        // Must be planned (not completed)
        guard workout.executionStatus == .planned else { return false }
        
        // Only remove TP workouts that are past and planned
        return workout.source == .trainingPeaks
    }
}

// MARK: - Supporting Types

struct Workout {
    let uid: String
    let summary: String
    let startTime: Date?
    let endTime: Date?
    let isAllDay: Bool
    let source: WorkoutSource
    let activityType: String?
    let duration: Duration?
    let distance: String?
    let executionStatus: ExecutionStatus
    let stravaMetrics: StravaMetrics?
    let replacedTPUID: String?
    
    static func fromStrava(_ strava: StravaWorkout) -> Workout {
        return Workout(
            uid: strava.id,
            summary: strava.name,
            startTime: strava.startDate,
            endTime: strava.startDate.addingTimeInterval(strava.movingTime),
            isAllDay: false,
            source: .strava,
            activityType: strava.type,
            duration: Duration(seconds: strava.movingTime),
            distance: strava.distance > 0 ? "\(strava.distance/1000, specifier: "%.2f") km" : nil,
            executionStatus: .completed,
            stravaMetrics: StravaMetrics(
                distance: strava.distance,
                movingTime: strava.movingTime,
                elapsedTime: strava.elapsedTime,
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
        return Workout(
            uid: tp.uid,
            summary: tp.summary,
            startTime: tp.startTime,
            endTime: tp.endTime,
            isAllDay: tp.isAllDay,
            source: .trainingPeaks,
            activityType: nil,
            duration: tp.duration,
            distance: tp.parsedDetails.distance,
            executionStatus: tp.executionStatus,
            stravaMetrics: nil,
            replacedTPUID: nil
        )
    }
}

enum WorkoutSource: String, CaseIterable {
    case trainingPeaks = "training_peaks"
    case strava = "strava"
}

enum ExecutionStatus: String, CaseIterable {
    case planned = "planned"
    case completed = "completed"
}

struct StravaMetrics {
    let distance: Double // in meters
    let movingTime: TimeInterval
    let elapsedTime: TimeInterval
    let averageSpeed: Double // in m/s
    let averageHeartRate: Double?
    let averagePower: Double?
    let calories: Int?
    let elevationGain: Double // in meters
}

struct ParsedDetails {
    var plannedDuration: String?
    var distance: String?
    var tss: String?
    var pace: String?
    var power: String?
    var heartRate: String?
}
```

---

## Data Models & Architecture

### 1. Core Data Models

```swift
import Foundation

// MARK: - Training Peaks Workout
struct TPWorkout: Codable {
    let uid: String
    let summary: String
    let description: String
    let startTime: Date?
    let endTime: Date?
    let isAllDay: Bool
    let location: String
    let status: String
    let source: WorkoutSource
    let duration: Duration?
    let parsedDetails: ParsedDetails
    let executionStatus: ExecutionStatus
}

// MARK: - Strava Activity
struct StravaActivity: Codable {
    let id: Int
    let name: String
    let type: String
    let startDate: Date
    let distance: Double // meters
    let movingTime: TimeInterval
    let elapsedTime: TimeInterval
    let averageSpeed: Double // m/s
    let averageHeartRate: Double?
    let averagePower: Double?
    let calories: Int?
    let totalElevationGain: Double
    let summary: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, type, distance, calories
        case startDate = "start_date"
        case movingTime = "moving_time"
        case elapsedTime = "elapsed_time"
        case averageSpeed = "average_speed"
        case averageHeartRate = "average_heartrate"
        case averagePower = "average_watts"
        case totalElevationGain = "total_elevation_gain"
        case summary
    }
}

// MARK: - Workout Manager
class WorkoutManager: ObservableObject {
    @Published var workouts: [String: Workout] = [:]
    @Published var isLoading = false
    @Published var error: Error?
    
    private let stravaAuth = StravaAuthManager.shared
    private let tpURL: String
    
    init(tpURL: String) {
        self.tpURL = tpURL
        loadStoredWorkouts()
    }
    
    func refreshWorkouts() async {
        await MainActor.run {
            isLoading = true
            error = nil
        }
        
        do {
            // Fetch TP workouts
            let tpContent = try await ICalParser.fetchICal(from: tpURL)
            let tpWorkouts = ICalParser.parseICal(tpContent)
            
            // Fetch Strava workouts if authenticated
            var stravaWorkouts: [String: StravaActivity] = [:]
            if stravaAuth.isAuthenticated {
                let activities = try await stravaAuth.fetchActivities()
                stravaWorkouts = Dictionary(uniqueKeysWithValues: activities.map { (String($0.id), $0) })
            }
            
            // Merge workouts
            let mergedWorkouts = WorkoutMatcher.mergeWorkouts(
                tpWorkouts: tpWorkouts,
                stravaWorkouts: stravaWorkouts
            )
            
            await MainActor.run {
                self.workouts = mergedWorkouts
                self.isLoading = false
                self.saveWorkouts()
            }
            
        } catch {
            await MainActor.run {
                self.error = error
                self.isLoading = false
            }
        }
    }
    
    private func saveWorkouts() {
        // Save to UserDefaults or Core Data
        if let data = try? JSONEncoder().encode(workouts) {
            UserDefaults.standard.set(data, forKey: "workouts")
        }
    }
    
    private func loadStoredWorkouts() {
        guard let data = UserDefaults.standard.data(forKey: "workouts"),
              let workouts = try? JSONDecoder().decode([String: Workout].self, from: data) else {
            return
        }
        self.workouts = workouts
    }
}
```

---

## Implementation Steps

### 1. Project Setup

1. **Create new iOS project**
2. **Add dependencies** (Swift Package Manager):
   ```
   - KeychainAccess (for secure token storage)
   - AuthenticationServices (for OAuth)
   ```

3. **Configure Info.plist** (as shown in OAuth section)

### 2. Strava Integration

1. **Register app** in Strava Developer Dashboard
2. **Implement StravaAuthManager** (copy from guide)
3. **Add OAuth flow** to your app's authentication screen
4. **Test authentication** with your Strava account

### 3. Training Peaks Integration

1. **Implement ICalParser** (copy from guide)
2. **Test with your iCal URL**
3. **Verify parsing** of workout data

### 4. Workout Matching

1. **Implement WorkoutMatcher** (copy from guide)
2. **Create data models** (copy from guide)
3. **Test matching logic** with sample data

### 5. UI Implementation

```swift
import SwiftUI

struct WorkoutListView: View {
    @StateObject private var workoutManager: WorkoutManager
    @State private var showingStravaAuth = false
    
    init(tpURL: String) {
        _workoutManager = StateObject(wrappedValue: WorkoutManager(tpURL: tpURL))
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Header with sync button
                HStack {
                    Button("Sync Workouts") {
                        Task {
                            await workoutManager.refreshWorkouts()
                        }
                    }
                    .disabled(workoutManager.isLoading)
                    
                    Spacer()
                    
                    Button("Connect Strava") {
                        showingStravaAuth = true
                    }
                }
                .padding()
                
                // Workout list
                if workoutManager.isLoading {
                    ProgressView("Syncing workouts...")
                } else {
                    List {
                        ForEach(Array(workoutManager.workouts.values).sorted(by: { 
                            ($0.startTime ?? Date.distantPast) > ($1.startTime ?? Date.distantPast) 
                        }), id: \.uid) { workout in
                            WorkoutRowView(workout: workout)
                        }
                    }
                }
            }
            .navigationTitle("Workouts")
            .sheet(isPresented: $showingStravaAuth) {
                StravaAuthView()
            }
        }
    }
}

struct WorkoutRowView: View {
    let workout: Workout
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(workout.summary)
                    .font(.headline)
                
                Spacer()
                
                // Source badge
                Text(workout.source.rawValue.capitalized)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(workout.source == .strava ? Color.orange : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(4)
            }
            
            if let startTime = workout.startTime {
                Text(startTime, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let distance = workout.distance {
                Text(distance)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}
```

---

## Testing Strategy

### 1. Unit Tests

```swift
import XCTest

class WorkoutMatcherTests: XCTestCase {
    
    func testPastWorkoutMatching() {
        let tpWorkout = TPWorkout(
            uid: "tp1",
            summary: "Run: tempo park run",
            startTime: Calendar.current.date(byAdding: .day, value: -1, to: Date()),
            // ... other properties
        )
        
        let stravaWorkout = StravaActivity(
            id: 123,
            name: "Morning Run",
            type: "Run",
            startDate: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
            // ... other properties
        )
        
        let shouldMatch = WorkoutMatcher.shouldMatchWorkouts(strava: stravaWorkout, tp: tpWorkout)
        XCTAssertTrue(shouldMatch)
    }
    
    func testActivityTypeMatching() {
        XCTAssertTrue(WorkoutMatcher.activitiesMatch(
            strava: StravaActivity(type: "VirtualRide"),
            tp: TPWorkout(summary: "Bike: 3:30")
        ))
        
        XCTAssertFalse(WorkoutMatcher.activitiesMatch(
            strava: StravaActivity(type: "Run"),
            tp: TPWorkout(summary: "Bike: tempo ride")
        ))
    }
}
```

### 2. Integration Tests

1. **Test OAuth flow** with real Strava account
2. **Test iCal parsing** with your Training Peaks URL
3. **Test workout matching** with real data
4. **Test edge cases** (timezone boundaries, missing data)

---

## Production Considerations

### 1. Security

- **Store tokens in Keychain** (not UserDefaults)
- **Use HTTPS** for all API calls
- **Validate OAuth state parameter**
- **Implement token refresh** before expiry

### 2. Performance

- **Cache workout data** locally
- **Implement pagination** for large Strava datasets
- **Background sync** for regular updates
- **Optimize matching algorithm** for large datasets

### 3. Error Handling

- **Network connectivity** checks
- **API rate limiting** handling
- **Graceful degradation** when services unavailable
- **User-friendly error messages**

### 4. Data Management

- **Core Data** for persistent storage
- **Data migration** strategies
- **Backup/restore** functionality
- **Privacy compliance** (GDPR, etc.)

---

## Migration Checklist

- [ ] Set up Strava Developer account
- [ ] Implement OAuth flow
- [ ] Add iCal parsing
- [ ] Implement workout matching
- [ ] Create data models
- [ ] Build UI components
- [ ] Add unit tests
- [ ] Test with real data
- [ ] Handle edge cases
- [ ] Optimize performance
- [ ] Prepare for App Store submission

This guide provides a complete roadmap for implementing the Strava integration and workout matching logic in your iOS app, based on the proven Flask implementation.
