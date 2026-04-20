# TrainerOS Mobile App

React Native mobile application for TrainerOS built with Expo.

## Features

- ✅ Complete authentication (login/register)
- ✅ Dashboard with stats and quick actions
- ✅ Daily content idea generation
- ✅ Content review (video & text analysis)
- ✅ Idea history
- ✅ Niche finder
- ✅ Content preferences
- ✅ Settings
- ✅ Full API integration with https://api.traineros.org

## Tech Stack

- **Expo** - React Native framework
- **React Navigation** - Navigation library
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **TypeScript** - Type safety

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── constants/       # App constants (colors, etc.)
├── contexts/        # React contexts (Auth, etc.)
├── navigation/      # Navigation setup
├── screens/         # App screens
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── DailyIdeaScreen.tsx
│   ├── ContentReviewScreen.tsx
│   ├── IdeaHistoryScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── NicheFinderScreen.tsx
│   └── ContentPreferencesScreen.tsx
└── services/        # API services
    └── api.ts
```

## API Configuration

The app connects to the production API at `https://api.traineros.org`.

To change the API URL, edit `src/services/api.ts`:

```typescript
const API_URL = 'https://api.traineros.org/api';
```

## Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both
eas build --platform all
```

## Publishing

```bash
# Publish update
eas update

# Submit to app stores
eas submit
```

## Environment

- Node.js >= 18
- Expo SDK 50+
- React Native 0.73+
