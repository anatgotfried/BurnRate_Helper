# Training Peaks Workout Tracker - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding iCal Format](#understanding-ical-format)
3. [Training Peaks Data Structure](#training-peaks-data-structure)
4. [Handling Different Workout Situations](#handling-different-workout-situations)
5. [Interpreting the Change Log](#interpreting-the-change-log)
6. [Daily Workflow Tips](#daily-workflow-tips)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

This application helps you track and analyze your Training Peaks workouts by monitoring changes over time. Every time you refresh the data, the system compares the current state with the previous state and logs all changes, giving you complete visibility into your training plan evolution.

### Key Features
- **Automatic Change Detection**: Identifies additions, modifications, deletions, and movements
- **Complete History**: Maintains a full audit trail of all changes
- **Visual Interface**: Beautiful, intuitive UI for reviewing workouts and changes
- **JSON Storage**: Simple file-based storage for easy backup and portability

---

## Understanding iCal Format

### What is iCal?
iCal (iCalendar) is a standard format for exchanging calendar and scheduling information. Training Peaks exports your workouts in this format, which contains all the details about your training sessions.

### iCal URL Structure
Training Peaks provides a unique iCal URL for your calendar:
- **webcal://**: A URL scheme that indicates calendar data
- The system automatically converts this to **https://** for fetching
- Your URL contains a unique identifier (e.g., `FQ52PNFB5MWLS`)

### Important iCal Components
Each workout in the iCal file is represented as a **VEVENT** (calendar event) with these key properties:

- **UID**: Unique identifier that persists across modifications
- **SUMMARY**: Workout title/name
- **DESCRIPTION**: Detailed workout instructions
- **DTSTART**: Start date/time
- **DTEND**: End date/time
- **SEQUENCE**: Version number (increments with each modification)
- **STATUS**: Workout status (TENTATIVE, CONFIRMED, CANCELLED)
- **LAST-MODIFIED**: When the workout was last changed
- **LOCATION**: Where the workout takes place
- **CATEGORIES**: Workout type/category

---

## Training Peaks Data Structure

### Workout States

#### 1. **Future/Planned Workouts**
Workouts scheduled for future dates that haven't been executed yet.

**Characteristics:**
- Date is in the future
- May change frequently as your coach adjusts your plan
- Description contains prescribed workout details
- Status is typically CONFIRMED or TENTATIVE

**What to expect:**
- These workouts are most likely to be modified or moved
- Check for changes daily if your plan is actively managed
- Changes might include timing, intensity, or workout type

#### 2. **Historical/Completed Workouts**
Workouts from the past that have been executed.

**Characteristics:**
- Date is in the past
- May contain actual execution data vs. planned data
- Less likely to change, but can be updated if data is corrected
- Status is typically CONFIRMED

**What to expect:**
- Usually stable, but coaches might adjust historical data
- May see modifications if execution notes are added
- Sequence number might increase if details are updated

#### 3. **Modified Workouts**
Workouts that have been changed since the last refresh.

**Characteristics:**
- Same UID as before
- Different SEQUENCE number (incremented)
- One or more fields changed
- LAST-MODIFIED timestamp is updated

**Common modifications:**
- Time changes (rescheduled)
- Description updates (workout details adjusted)
- Title changes
- Status changes (cancelled, confirmed)
- Duration changes

#### 4. **Deleted/Cancelled Workouts**
Workouts that have been removed from your plan.

**Characteristics:**
- Present in previous data but missing from current fetch
- OR Status changed to CANCELLED
- No longer appears in current workout list

**What this means:**
- Workout removed from training plan
- May be replaced by a different workout
- Coach may have consolidated or restructured plan

#### 5. **Rescheduled/Moved Workouts**
Workouts that have been moved to a different time slot.

**Characteristics:**
- Same UID and basic content
- Different DTSTART and/or DTEND
- Sequence number incremented
- Detected as both modification and movement

**Why this happens:**
- Schedule adjustments due to athlete availability
- Rest day reordering
- Race date changes
- Recovery period adjustments

---

## Handling Different Workout Situations

### Situation 1: New Workouts Added

**What you'll see:**
- Green "Added" badge in Recent Changes
- New workout cards appear in All Workouts
- Change log entry with addition count

**Action items:**
- Review new workout details
- Check timing against your schedule
- Note any equipment or preparation needs
- Communicate with coach if conflicts arise

### Situation 2: Workout Time Changed

**What you'll see:**
- Yellow "Modified" badge with time change
- Movement indicator showing old → new time
- Diff showing old and new DTSTART values

**Action items:**
- Update your personal calendar
- Adjust any prep or travel plans
- Check for cascade effects on other workouts
- Verify new time works with your schedule

### Situation 3: Workout Details Updated

**What you'll see:**
- Yellow "Modified" badge
- Diff showing field changes (description, summary, etc.)
- Sequence number increment

**Action items:**
- Read updated instructions carefully
- Note any intensity or volume changes
- Check if equipment needs changed
- Update training notes if needed

### Situation 4: Workout Deleted

**What you'll see:**
- Red "Deleted" badge in Recent Changes
- Workout no longer in current list
- Change log shows deletion

**Action items:**
- Check if replacement workout added
- Understand reason (rest, injury, schedule conflict)
- Adjust weekly volume expectations
- Communicate with coach if unexpected

### Situation 5: Multiple Changes at Once

**What you'll see:**
- Multiple change indicators
- Change log with varied counts
- Numerous workout cards updated

**Action items:**
- Review changes systematically
- Look for patterns (e.g., all workouts moved forward one day)
- Check if overall plan structure changed
- Schedule time to review with coach if needed

### Situation 6: Sequence Number Changes Without Visible Changes

**What you'll see:**
- Modification detected
- Sequence number increased
- Minimal or no visible field changes

**What this means:**
- Training Peaks metadata updated
- Coach viewed or touched the workout
- Minor formatting or internal changes
- Generally safe to ignore

---

## Interpreting the Change Log

### Change Log Structure

Each refresh creates a change log entry with:
- **Timestamp**: When the refresh occurred
- **Additions**: New workouts that appeared
- **Modifications**: Existing workouts that changed
- **Deletions**: Workouts that disappeared
- **Movements**: Workouts that moved to different times

### Reading Change Diffs

When a workout is modified, you'll see diffs like this:

```
summary:
- Morning Run
+ Morning Recovery Run

description:
- 45 min easy pace
+ 30 min very easy pace, focus on form
```

**How to read:**
- Lines with `-` (red, strikethrough): Old value
- Lines with `+` (green, bold): New value
- Field name tells you what changed

### Change Patterns to Watch

#### Pattern 1: Progressive Overload
Regular increases in volume or intensity across multiple workouts.

**Indicates:** Training plan progression

#### Pattern 2: Taper
Reductions in volume/intensity as race approaches.

**Indicates:** Race preparation

#### Pattern 3: Bulk Rescheduling
Many workouts moved by same time period.

**Indicates:** Schedule adjustment (travel, work conflict, etc.)

#### Pattern 4: Workout Type Swaps
Same time slots, different workout types.

**Indicates:** Plan restructuring based on progress or fatigue

---

## Daily Workflow Tips

### Best Practices for Daily Use

#### Morning Review (Recommended)
1. Open the application
2. Click "Refresh Workouts"
3. Review "Recent Changes" panel
4. Check today's workout details
5. Review next 2-3 days for upcoming changes

#### Weekly Planning Session
1. Refresh data
2. Review full change history for the week
3. Look at all upcoming workouts
4. Identify patterns or trends
5. Prepare questions for coach check-in

### When to Refresh

**High Priority Times:**
- Morning before training
- After coach communications
- Before weekly planning session
- After sync with Training Peaks mobile app

**Low Priority Times:**
- Multiple times per hour (unnecessary)
- Immediately after you upload workout data
- Late at night (unless you train early morning)

### Managing Change Fatigue

If you see constant changes:
1. **Identify patterns**: Is coach fine-tuning or is there confusion?
2. **Communicate**: Ask about planning philosophy
3. **Set expectations**: Understand how far ahead plan is firm
4. **Focus on key workouts**: Don't sweat minor adjustments to easy days

### Backup and History

The `data/workouts.json` file contains everything:
- **Backup regularly**: Copy this file to cloud storage
- **Version control**: Consider using git for the data folder
- **Pre-race backup**: Save a copy before major events
- **Season archive**: Keep copies at season boundaries

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Failed to fetch iCal"

**Possible causes:**
- Internet connection problem
- Training Peaks server temporarily down
- Invalid or expired iCal URL

**Solutions:**
1. Check internet connection
2. Try accessing URL in web browser
3. Log into Training Peaks and regenerate iCal URL
4. Wait a few minutes and try again

#### Issue 2: No Changes Detected (But You Know There Were Changes)

**Possible causes:**
- Changes haven't synced to iCal export yet
- Browser cached old data
- Refresh needed on Training Peaks side

**Solutions:**
1. Wait 5-10 minutes for Training Peaks to update export
2. Clear browser cache and refresh
3. Log into Training Peaks and force a save on the workout
4. Check if UID changed (rare, but indicates workout recreation)

#### Issue 3: Duplicate Workouts Appearing

**Possible causes:**
- Coach created new workout instead of modifying existing
- Workout copied to new date
- UID conflict (very rare)

**Solutions:**
1. Check UIDs - if different, these are truly separate workouts
2. Contact coach about duplicate
3. One workout might be deleted in next sync

#### Issue 4: Workout Shows as "Modified" but Looks Identical

**Possible causes:**
- Sequence number changed without visible changes
- Metadata or formatting changes
- Timezone adjustments
- Internal Training Peaks fields updated

**Solutions:**
- Check sequence numbers in metadata
- Compare timestamps carefully
- Generally safe to ignore if no substantive changes
- May indicate coach reviewed the workout

#### Issue 5: Historical Workouts Keep Changing

**Possible causes:**
- Coach adding notes or actual execution data
- Corrections to past workouts
- TSS (Training Stress Score) recalculations
- Athlete or coach adding completion notes

**Solutions:**
- Normal behavior - historical data can be updated
- Check description field for new notes
- Verify if execution data added after workout completion
- Consider this valuable additional context

#### Issue 6: App Shows Error After Refresh

**Possible causes:**
- Malformed iCal data
- Network timeout
- Server error
- Invalid characters in workout description

**Solutions:**
1. Check browser console for detailed error
2. Try refresh again (may be transient)
3. Test iCal URL in validator tool
4. Contact Training Peaks support if persistent

### Data Recovery

If you accidentally lose data:

1. **Check for backup**: Look for `workouts.json` backup files
2. **Git history**: If using version control, revert to previous commit
3. **Start fresh**: Delete JSON file and refresh - will rebuild from current iCal state
4. **History loss**: Old change logs can't be recovered, but current state will be accurate

### Performance Issues

If the app becomes slow:

1. **Large history**: Consider archiving old change log entries
2. **Many workouts**: Normal - iCal includes extensive history
3. **Browser memory**: Close and reopen browser
4. **JSON file size**: If over 10MB, consider splitting by year

---

## Advanced Tips

### Understanding Sequence Numbers

Sequence numbers are critical for tracking changes:
- Start at 0 for new workouts
- Increment by 1 for each modification
- Never decrease (unless workout recreated)
- Can skip numbers if edits made without saving

### Timezone Handling

The app handles timezones automatically:
- All times converted to ISO format with timezone
- Display uses browser's local timezone
- Be aware of DST transitions
- Coach's timezone vs. your timezone might cause apparent shifts

### Custom Analysis

The `workouts.json` file is structured for easy analysis:
- Import into Excel or Google Sheets
- Write custom scripts for pattern analysis
- Query specific time periods
- Calculate volume trends

### Integration Possibilities

The data structure supports:
- Export to other calendar apps
- Custom reporting dashboards
- Training load calculations
- Progress tracking visualizations

---

## Appendix: Sample Scenarios

### Scenario A: Coach Increases Training Volume

**What you'll see:**
- Multiple modifications
- Longer durations or higher intensities
- Possibly additional workouts added

**How to respond:**
- Ensure adequate recovery
- Assess current fatigue levels
- Communicate any concerns immediately
- Trust the process if plan is well-structured

### Scenario B: Preparing for Race

**What you'll see:**
- Taper pattern (reducing volume)
- Some workouts deleted
- Race-specific workouts added or intensified
- Fine-tuning of timing

**How to respond:**
- Follow plan precisely during taper
- Don't add extra work
- Note any race-day logistics in workout notes
- Communicate confidence level with coach

### Scenario C: Injury or Illness Recovery

**What you'll see:**
- Bulk deletions or modifications
- Reduced intensity across board
- Possible gap in schedule
- Progressive rebuild

**How to respond:**
- Follow modified plan strictly
- Document how you feel
- Don't rush back to original volume
- Communicate recovery status regularly

---

## Conclusion

This tool provides complete visibility into your Training Peaks workout evolution. By understanding the different types of changes and their implications, you can:

- Stay synchronized with your coach's intentions
- Anticipate training plan direction
- Identify patterns and plan structure
- Maintain accurate training records
- Communicate more effectively about your training

**Remember**: Changes are normal and expected. A good training plan evolves based on your progress, fatigue, schedule, and goals. Use this tool to stay informed and engaged with your training journey.

For questions, issues, or feature requests, refer to the main README.md file.

