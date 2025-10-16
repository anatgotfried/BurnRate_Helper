# AI Implementation Quick Reference

## Overview
This is a working implementation of Strava OAuth integration and intelligent workout matching between Training Peaks and Strava. The system automatically resolves duplicates and prioritizes Strava data for completed workouts.

## Key Features
- ✅ **Strava OAuth 2.0** - Complete authentication flow
- ✅ **Training Peaks iCal** - Parse workout data from iCal feeds
- ✅ **Smart Matching** - Automatically merge duplicate workouts
- ✅ **Data Prioritization** - Strava wins for completed, TP for planned
- ✅ **Past Cleanup** - Remove outdated planned workouts

## Core Algorithm

### 1. Workout Matching Logic
```python
# For past workouts: Same date + Same sport = Automatic match
if is_past and same_sport_type:
    return MATCH  # Strava wins

# For future workouts: Same date + Same sport + Within 1 hour
if is_future and same_sport_type and time_proximity <= 1_hour:
    return MATCH  # Strava wins
```

### 2. Sport Type Matching
```python
# Direct matches
"Run" + "run" = ✅
"VirtualRide" + "bike" = ✅
"swim" + "swim" = ✅

# Special cases
"Zwift" + "bike" = ✅
"VirtualRide" + "ride" = ✅
```

### 3. Data Filtering
```python
# Remove past planned TP workouts
if workout_date < today and status == "planned" and source == "training_peaks":
    REMOVE_WORKOUT
```

## Implementation Files

### 1. Strava OAuth (`StravaAuthManager.swift`)
- Complete OAuth 2.0 flow
- Token management with Keychain
- Automatic token refresh
- API rate limiting handling

### 2. iCal Parser (`ICalParser.swift`)
- Parse Training Peaks iCal feeds
- Extract workout metadata
- Handle timezone conversions
- Parse workout descriptions

### 3. Workout Matcher (`WorkoutMatcher.swift`)
- Core matching algorithm
- Activity type detection
- Time-based matching rules
- Past workout cleanup

### 4. Data Models
- Unified `Workout` structure
- Strava metrics integration
- Training Peaks metadata
- Change tracking

## API Endpoints Used

### Strava API
```
GET /api/v3/athlete/activities
- after: unix_timestamp (10 days ago)
- per_page: 200
- Authorization: Bearer {access_token}
```

### Training Peaks iCal
```
GET https://www.trainingpeaks.com/ical/{USER_ID}.ics
- Returns iCal format workout data
- Rolling window (past/future workouts)
- Real-time updates
```

## Configuration

### Strava App Setup
```
Client ID: {YOUR_CLIENT_ID}
Client Secret: {YOUR_CLIENT_SECRET}
Redirect URI: yourapp://strava
Scope: activity:read
Authorization Callback Domain: yourdomain.com
```

### iOS Configuration
```xml
<!-- Info.plist -->
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
```

## Testing Scenarios

### 1. Duplicate Resolution
```
Input:
- TP: "Run: tempo park run" (Oct 8, planned)
- Strava: "Morning Run" (Oct 8, completed)

Output:
- Strava: "Morning Run" (completed) ✅
- TP: REMOVED (duplicate) ✅
```

### 2. Past Planned Cleanup
```
Input:
- TP: "Bike: 3:30" (Oct 9, planned, past date)

Output:
- REMOVED (past planned TP) ✅
```

### 3. Future Workout Preservation
```
Input:
- TP: "Run: tempo run" (Oct 15, planned, future date)

Output:
- TP: "Run: tempo run" (preserved) ✅
```

## Error Handling

### Network Issues
- Retry logic for API failures
- Offline data caching
- Graceful degradation

### Authentication
- Token refresh automation
- OAuth error recovery
- Re-authentication flow

### Data Validation
- Malformed iCal handling
- Missing workout fields
- Timezone edge cases

## Performance Optimizations

### API Efficiency
- Fetch only last 10 days from Strava
- Batch API requests
- Cache responses locally

### Memory Management
- Lazy loading for large datasets
- Efficient data structures
- Background processing

## Security Considerations

### Token Storage
- Keychain for sensitive data
- Token encryption
- Secure transmission (HTTPS)

### Data Privacy
- Local data storage only
- No cloud synchronization
- User consent for Strava access

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
- [ ] Prepare for App Store

## Key Success Metrics

### Matching Accuracy
- 95%+ correct duplicate detection
- <5% false positives
- <1% false negatives

### Performance
- <2s sync time
- <100MB memory usage
- 99%+ uptime

### User Experience
- One-tap Strava connection
- Automatic sync
- Clear duplicate resolution

## Troubleshooting

### Common Issues

1. **Strava token expired**
   - Solution: Automatic refresh implemented
   - Fallback: Re-authentication flow

2. **iCal parsing errors**
   - Solution: Robust error handling
   - Fallback: Partial data loading

3. **Duplicate workouts persist**
   - Solution: Check matching criteria
   - Debug: Enable logging

4. **Performance issues**
   - Solution: Optimize API calls
   - Fallback: Reduce data window

## Support Resources

### Documentation
- Strava API: https://developers.strava.com/docs/
- Training Peaks: https://www.trainingpeaks.com/api/
- iOS OAuth: https://developer.apple.com/documentation/authenticationservices

### Testing Data
- Use provided iCal URL for testing
- Test with real Strava account
- Validate edge cases with sample data

This implementation is production-ready and has been tested with real user data.
