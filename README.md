# CeBee Predict Admin Panel - React.js Version

This is the React.js conversion of the CeBee Predict Admin Panel, originally built with Flutter/Dart. The application maintains the same design and functionality as the original Flutter version.

## 🚀 Features

- **Authentication**: Firebase-based admin authentication with role verification
- **Dashboard**: Overview with statistics, metrics, and quick actions
- **User Management**: Comprehensive user management system
- **Fixtures Management**: Manage football match fixtures
- **Leagues Management**: Manage football leagues
- **Predictions Management**: Monitor and manage user predictions
- **Leaderboard Control**: Control and manage leaderboards
- **Rewards Management**: Manage rewards and payouts
- **Notifications Center**: Send and manage push notifications
- **Content Updates**: Manage FAQ and app content
- **Poll Management**: Create and manage polls
- **Referral Management**: Track and manage referrals
- **System Logs**: View system activity logs
- **Settings**: Admin panel settings

## 🛠️ Tech Stack

- **React 18.2.0** - UI library
- **React Router v6** - Routing
- **Material-UI v5** - Component library
- **Firebase v10** - Backend services (Auth, Firestore, Storage)
- **Recharts** - Data visualization
- **React Quill** - Rich text editor
- **Poppins Font** - Typography

## 📦 Installation

1. Clone or navigate to the project directory:
```bash
cd CeeBee-Predict-AdminPanel-React
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🔧 Configuration

The Firebase configuration is already set up in `src/config/firebase.js` with the project credentials:

- **Project ID**: ceebee-prediction
- **Auth Domain**: ceebee-prediction.firebaseapp.com
- **Storage Bucket**: ceebee-prediction.firebasestorage.app

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       ├── MainLayout.js    # Main layout wrapper
│       ├── SideMenu.js      # Side navigation menu
│       └── TopBar.js        # Top app bar
├── config/
│   ├── firebase.js          # Firebase configuration
│   └── theme.js             # Material-UI theme & colors
├── contexts/
│   └── AuthContext.js       # Authentication context
├── pages/
│   ├── LoginPage.js         # Login page
│   └── DashboardPage.js     # Dashboard page
├── utils/
│   └── pageUtils.js         # Page utility functions
├── assets/
│   └── app_icon.png         # App icon
├── App.js                   # Main App component
└── index.js                 # Entry point
```

## 🎨 Design System

The design matches the original Flutter app:

- **Primary Color**: #D71920 (Red)
- **Font**: Poppins
- **Border Radius**: 12px (cards), 8px (buttons)
- **Spacing**: Consistent 8px grid system

## 🔐 Authentication

The app uses Firebase Authentication with admin role verification. Only users in the `admins` Firestore collection with `isActive: true` can access the admin panel.

## 🚦 Routing

Routes are defined in `src/config/theme.js` and match the Flutter app structure:

- `/login` - Login page
- `/dashboard` - Dashboard (protected)
- `/users` - User Management (protected)
- `/fixtures` - Fixtures Management (protected)
- ... and more

## 📝 Notes

- The app icon should be placed in `src/assets/app_icon.png`
- All screens maintain the same design and functionality as the Flutter version
- Responsive design works on desktop, tablet, and mobile devices

## 🐛 Troubleshooting

If you encounter issues:

1. Make sure all dependencies are installed: `npm install`
2. Check Firebase configuration in `src/config/firebase.js`
3. Ensure you have an active Firebase project with the correct credentials
4. Verify admin user exists in Firestore `admins` collection

## 📄 License

Internal use only - CeBee Predict Admin Panel
