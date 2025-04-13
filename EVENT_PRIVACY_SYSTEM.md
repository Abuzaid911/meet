# Unified Event Privacy System

This document outlines the unified event privacy system designed to enhance user control and social engagement in the Meet app.

## Privacy Tiers

The event privacy system is built around three distinct privacy tiers:

### 1. Public Events
- **Visibility**: Visible to all app users
- **Purpose**: Community-building opportunities, maximum discovery
- **Icon**: 🌐 Globe
- **Default Setting**: Public is the default setting for new events
- **Discover**: Public events appear in the explore feed and search results for all users

### 2. Friends-Only Events
- **Visibility**: Automatically shared with the host's friend network
- **Purpose**: Creates a middle ground of semi-private sharing without manual selection
- **Icon**: 👤 User circle
- **Discover**: Visible on friends' dashboards and they receive notifications

### 3. Private Events
- **Visibility**: Only visible to specifically invited people
- **Purpose**: Targeted sharing for select invitees
- **Icon**: 🔒 Lock
- **Discover**: Not discoverable in feeds or search, only visible to invited users

## Privacy Selection & Modification

### During Event Creation
- Clear visual indicators for each privacy level
- Intuitive selection with detailed explanations about visibility
- Default setting is Public for maximum engagement

### After Event Creation
- Privacy settings can be modified at any time by the event host
- Changes from more private to more public display warnings to the host
- Notifications are sent to affected users when privacy is changed
- The system tracks when privacy was last changed

## Privacy Indicators
Events display their privacy level with consistent visual indicators:
- Public events: Green globe icon
- Friends-only events: Blue user icon
- Private events: Red lock icon

## Technical Implementation

### Database Schema
- `privacyLevel` field on the Event model (String): "PUBLIC", "FRIENDS_ONLY", or "PRIVATE"
- `privacyChanged` field on the Event model (DateTime): Tracks when privacy was last changed

### API Endpoints
- GET `/api/events`: Filters events based on the user's permission to view
- GET `/api/events/[id]`: Checks if the user has permission to view the specific event
- GET `/api/events/public`: Only returns PUBLIC events
- PUT `/api/events/[id]`: Allows updating the privacy level and sends appropriate notifications

### Frontend Components
- `EventCard`: Displays the event's privacy level with appropriate visual indicators
- `AddEventModal`: Allows selecting the privacy level during event creation
- `EditEventModal`: Allows changing the privacy level after creation with appropriate warnings

## Best Practices
- Always check privacy levels before displaying events to users
- Send appropriate notifications when privacy levels change
- Provide clear visual indicators of the current privacy setting
- Confirm with users before changing to a more public setting

This privacy system balances the social fabric of the platform with user control over their event information. 