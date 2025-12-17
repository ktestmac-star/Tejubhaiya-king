# Tracko - SQLite Edition

A cross-platform employee performance and expense tracking system built with React Native, Expo, and SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/ktestmac-star/Tejubhaiya-king.git
cd Tejubhaiya-king

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm start
```

## 🌐 Platform Support

### Web Version
```bash
npx expo start --web
```
- Access at: http://localhost:8081
- Uses localStorage for data persistence
- Full web compatibility

### Mobile Version
```bash
npx expo start
```
- Scan QR code with Expo Go app
- Native SQLite database
- Works on iOS and Android

## 🔑 Test Credentials

The app comes with pre-configured test users:

| Role | Username | Password |
|------|----------|----------|
| OWNER | owner | password123 |
| MANAGER | manager | password123 |
| OPERATOR | operator1 | password123 |

## 🏗️ Architecture

### Database Layer
- **Mobile**: SQLite with `react-native-sqlite-storage`
- **Web**: localStorage fallback for compatibility
- **Offline-first**: All data stored locally

### Authentication
- Simple username/password authentication
- Role-based access (OWNER, MANAGER, OPERATOR)
- Session management with AsyncStorage

### Services
- `DatabaseService`: Handles SQLite operations and web fallback
- `SimpleAuthService`: Authentication and user management
- `DeviceUtils`: Cross-platform device information

## 📱 Features

- ✅ **Cross-platform**: iOS, Android, Web
- ✅ **Offline-first**: No internet required
- ✅ **SQLite Database**: Local data storage
- ✅ **User Authentication**: Role-based login system
- ✅ **Test Data**: Pre-populated sample users
- ✅ **Web Compatible**: Runs in any modern browser

## 🛠️ Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # Business logic and data services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App-Simple.tsx      # Main application component
```

### Key Files
- `src/services/DatabaseService.ts` - Database operations
- `src/services/SimpleAuthService.ts` - Authentication logic
- `src/hooks/useSimpleAuth.ts` - Authentication hook
- `src/App-Simple.tsx` - Main app component

## 🔧 Configuration

### Database Schema
The app automatically creates the following tables:
- `users` - User accounts and roles
- `sessions` - Active user sessions

### Environment
No environment configuration required - everything runs locally!

## 📦 Dependencies

### Core
- React Native 0.81.5
- Expo 54.0.29
- TypeScript 4.8.4

### Database
- react-native-sqlite-storage 6.0.1

### Navigation
- @react-navigation/native 6.1.9
- @react-navigation/stack 6.3.20

## 🚀 Deployment

### Web Deployment
```bash
npx expo export --platform web
```

### Mobile Build
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with watch mode
npm run test:watch
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub.

---

**Note**: This is the SQLite-only version without backend dependencies. All data is stored locally on the device.