# Prayer Bank Feature

## Overview
The Prayer Bank is a personalized prayer counter system where each user can track their prayers. Each user has their own unique record that persists across sessions.

## Features

### 1. Default Prayers
The system comes with 23 built-in prayers:

#### Rosary Mysteries (20 prayers)
- **Joyful Mysteries**: 1st - 5th
- **Luminous Mysteries**: 1st - 5th
- **Sorrowful Mysteries**: 1st - 5th
- **Glorious Mysteries**: 1st - 5th

#### Special Prayers (3 prayers)
- **Kurishinte Vazhi** (Way of the Cross)
- **Divine Mercy Chaplet**
- **Ajatha Sisukalude Prayer** (Prayer for Unborn Children)

### 2. Custom Prayers
Users can add their own prayers at any time:
- Click the "Add Prayer" button
- Enter the prayer name
- The prayer will be added to your personal prayer bank
- You can delete custom prayers anytime

### 3. Counter Functionality
For each prayer (default or custom):
- **Plus (+) button**: Increment the count when you complete a prayer
- **Minus (-) button**: Decrement the count (disabled when count is 0)
- Real-time synchronization with Firebase

## How to Access

Navigate to: `/prayer-bank/{userId}`

Example:
- `/prayer-bank/user123`
- `/prayer-bank/john_doe`
- `/prayer-bank/mary_2024`

Each user ID creates a separate prayer bank with its own counters and custom prayers.

## Database Structure

```
prayerBank/
  └── {userId}/
      ├── joy1: 5
      ├── joy2: 3
      ├── kurishinteVazhi: 10
      ├── mercyPrayer: 7
      └── customPrayers/
          ├── custom_1234567890/
          │   ├── name: "Morning Prayer"
          │   ├── count: 15
          │   ├── isDefault: false
          │   └── createdAt: "2024-01-01T00:00:00.000Z"
          └── custom_1234567891/
              ├── name: "Rosary for Peace"
              ├── count: 8
              ├── isDefault: false
              └── createdAt: "2024-01-02T00:00:00.000Z"
```

## Implementation Files

1. **Frontend**:
   - `/src/pages/PrayerBank/index.jsx` - Main UI component
   - `/src/pages/PrayerBank/constants.js` - Default prayers definition

2. **Backend (Firebase)**:
   - `/src/firebase/prayerBank/counter.js` - Firebase operations
     - `plusCounter()` - Increment prayer count
     - `minusCounter()` - Decrement prayer count
     - `addCustomPrayer()` - Add new custom prayer
     - `deleteCustomPrayer()` - Delete custom prayer
     - `updateCustomPrayerCounter()` - Update custom prayer count

3. **Routing**:
   - Route: `/prayer-bank/:id` in `App.js`

## User Experience

### For New Users
- First visit creates a new document in Firebase
- All counters start at 0
- No custom prayers initially

### For Returning Users
- All previous counts are preserved
- Custom prayers are maintained
- Real-time updates across devices if using the same user ID

## Design Philosophy

1. **One User, One Record**: Each user ID has exactly one document in Firestore
2. **Persistent Storage**: All data is stored in Firebase and persists across sessions
3. **Real-time Updates**: Uses Firebase Realtime listeners for instant updates
4. **Flexible**: Users can add unlimited custom prayers
5. **Simple Interface**: Clean, intuitive UI with clear visual feedback

## Example Usage

```
User "john" visits: /prayer-bank/john
1. Prays Joyful 1st mystery → Clicks + → Count: 1
2. Prays Divine Mercy Chaplet → Clicks + → Count: 1
3. Adds custom prayer "Prayer for Family" → Clicks + → Count: 1
4. Closes browser
5. Returns later → All counts preserved
```

## Technical Notes

- Uses Firebase Firestore for data storage
- Real-time synchronization with `onSnapshot`
- Material-UI components for consistent design
- Responsive layout (works on mobile and desktop)
- User ID validation to prevent errors
