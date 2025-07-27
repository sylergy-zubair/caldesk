# CalDesk User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Calendar Navigation](#calendar-navigation)
4. [Date Selection & Event Viewing](#date-selection--event-viewing)
5. [Event Management](#event-management)
6. [Tips & Shortcuts](#tips--shortcuts)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is CalDesk?
CalDesk is a lightweight desktop widget that provides quick access to your Google Calendar. It displays as a compact, always-accessible window on your desktop, allowing you to view, create, edit, and delete calendar events without opening a browser.

### First Time Setup
1. **Launch CalDesk** - The application will open with an authentication screen
2. **Sign in with Google** - Click the login button to authenticate with your Google account
3. **Grant Permissions** - Allow CalDesk to access your Google Calendar data
4. **Start Using** - Once authenticated, your calendar will load automatically

---

## Interface Overview

CalDesk's interface consists of several key areas:

### Window Controls
- **Top bar** - Standard window controls (minimize, close)
- **Draggable area** - Click and drag anywhere to move the window

### Header Section
- **Month Navigation** - Left/right arrows to change months
- **Current Month/Year** - Displays the currently viewed month
- **Refresh Button** - Manual refresh of calendar data (animated spinner when loading)
- **User Profile** - Shows your profile picture and provides logout option

### Calendar Grid
- **Week Days** - Column headers showing Sun-Sat
- **Date Cells** - 6x7 grid showing all days of the month
- **Event Indicators** - Blue bars under dates that have events
- **Visual Highlights** - Different colors for today, selected dates, and other months

### Events Section
- **Dynamic Title** - Shows "Today's Events" or specific date events
- **Event List** - Displays events for the selected date
- **Last Updated** - Timestamp showing when data was last refreshed

### Quick Actions
- **Add Event Button** - Creates new events for selected date or today

---

## Calendar Navigation

### Changing Months
- **Previous Month** - Click the left arrow (◀) in the header
- **Next Month** - Click the right arrow (▶) in the header
- **Month Display** - The current month and year are prominently displayed between arrows

### Understanding the Calendar Grid
- **Current Month Days** - Displayed in full opacity
- **Previous/Next Month Days** - Displayed in gray/faded
- **Today** - Highlighted with blue background and white text
- **Selected Date** - Highlighted with light blue background (when not today)

### Event Indicators
- **Blue Bars** - Small horizontal bars under dates indicate events
- **Multiple Events** - Up to 2 bars shown, with "+X" indicator for additional events
- **Hover Info** - Hover over event bars to see event titles and times

---

## Date Selection & Event Viewing

### Viewing Events for Specific Dates

#### Single-Click Selection
1. **Click any date** in the calendar grid
2. **Selected date highlights** with light blue background
3. **Events section updates** to show that date's events
4. **Section title changes** to reflect selected date (e.g., "January 15 Events")

#### Event Display Behavior
- **No Selection** - Shows "Today's Events" by default
- **Today Selected** - Shows "Today's Events" even when today is explicitly selected  
- **Past/Future Dates** - Shows "[Month] [Day] Events" format
- **No Events** - Displays "No events" message for dates without events

#### Visual Feedback
- **Today** - Blue background with white text (highest priority)
- **Selected Date** - Light blue background with darker blue text
- **Unselected Dates** - Normal appearance with hover effects

---

## Event Management

### Creating New Events

#### Method 1: Double-Click Date
1. **Double-click any date** in the current month
2. **Event creation modal opens** with the selected date pre-filled
3. **Fill in event details** (title, time, location, etc.)
4. **Save** to create the event

#### Method 2: Add Event Button
1. **Select a date** by single-clicking (optional)
2. **Click "Add Event"** button at the bottom
3. **Button text adapts** - Shows "Add Event for [Month] [Day]" when date selected
4. **Modal opens** with appropriate date pre-filled

### Editing Existing Events
1. **Click on any event** in the events section
2. **Event edit modal opens** with current details pre-filled
3. **Modify details** as needed
4. **Save changes** or **Cancel** to discard

### Deleting Events
1. **Hover over an event** in the events section
2. **Delete button appears** (trash icon) on the right
3. **Click delete button**
4. **Confirm deletion** in the popup dialog

### Event Details
Events display the following information:
- **Event Title** - Main event name
- **Time** - Start time or "All day" for full-day events
- **Location** - If specified, shown after time with bullet separator
- **Visual Indicator** - Colored dot before event title

---

## Tips & Shortcuts

### Quick Navigation
- **Month Navigation** - Use arrow keys or click header arrows
- **Today Focus** - Today is always prominently highlighted in blue
- **Event Browsing** - Click different dates to quickly browse events

### Efficient Event Creation
- **Double-click shortcut** - Fastest way to create events for specific dates
- **Smart Add Button** - Automatically uses selected date when creating events
- **Date Pre-selection** - Select date first, then use Add Event for better workflow

### Visual Cues
- **Event Density** - More blue bars = busier day
- **Overflow Indication** - "+X" shows when more than 2 events exist
- **Date Highlighting** - Selected date is always visually distinct
- **Loading States** - Refresh button spins during data updates

### Window Management
- **Always on Top** - Option to keep CalDesk visible above other windows
- **Compact Size** - Designed to use minimal screen space
- **Drag to Move** - Click and drag anywhere to reposition

---

## Troubleshooting

### Common Issues

#### Events Not Loading
- **Check internet connection** - CalDesk requires internet to sync with Google Calendar
- **Click refresh button** - Manual refresh if auto-sync fails
- **Re-authenticate** - Sign out and sign back in if persistent issues occur

#### Authentication Problems
- **Clear browser cache** - If using system browser for auth
- **Check Google permissions** - Ensure CalDesk has calendar access in Google account settings
- **Restart application** - Close and reopen CalDesk

#### Visual Issues
- **Window too small** - Resize window if content appears cut off
- **Theme problems** - CalDesk adapts to system theme automatically
- **Missing events** - Check if events are in the correct Google calendar

#### Performance Issues
- **Slow loading** - May occur with very large calendars or slow internet
- **High CPU usage** - Check for excessive auto-refresh or animation issues
- **Memory usage** - Restart CalDesk if running for extended periods

### Getting Help
- **Check logs** - Developer console may show error details
- **Google Calendar sync** - Verify events appear correctly in Google Calendar web interface
- **Restart** - Many issues resolve with a simple application restart

---

## Keyboard Shortcuts & Accessibility

### Navigation
- **Tab** - Navigate between interactive elements
- **Enter/Space** - Activate buttons and select dates
- **Escape** - Close modals and dialogs

### Accessibility Features
- **Screen reader support** - Proper ARIA labels and semantic HTML
- **High contrast** - Adapts to system accessibility settings
- **Keyboard navigation** - Full functionality without mouse
- **Focus indicators** - Clear visual focus for keyboard users

---

*This manual covers CalDesk version with date selection and event management features. For technical issues or feature requests, please refer to the project documentation or contact support.*