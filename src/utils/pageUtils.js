import {
  Dashboard,
  CalendarToday,
  People,
  BarChart,
  EmojiEvents,
  CardGiftcard,
  Notifications,
  EditNote,
  Poll,
  Group,
  Description,
  Settings,
} from '@mui/icons-material';
import { constants } from '../config/theme';

export const getPageIcon = (pathname) => {
  if (pathname.includes('dashboard')) return Dashboard;
  if (pathname.includes('fixtures')) return CalendarToday;
  if (pathname.includes('users')) return People;
  if (pathname.includes('predictions')) return BarChart;
  if (pathname.includes('leaderboard')) return EmojiEvents;
  if (pathname.includes('rewards')) return CardGiftcard;
  if (pathname.includes('notifications')) return Notifications;
  if (pathname.includes('content')) return EditNote;
  if (pathname.includes('polls')) return Poll;
  if (pathname.includes('referrals')) return Group;
  if (pathname.includes('logs')) return Description;
  if (pathname.includes('settings')) return Settings;
  return Dashboard;
};

export const getPageTitle = (pathname) => {
  if (pathname.includes('dashboard')) return 'Dashboard';
  if (pathname.includes('fixtures')) return 'Fixtures';
  if (pathname.includes('users')) return 'User Management';
  if (pathname.includes('predictions')) return 'Predictions Management';
  if (pathname.includes('leaderboard')) return 'Leaderboard Control';
  if (pathname.includes('rewards')) return 'Rewards Management';
  if (pathname.includes('notifications')) return 'Notifications Center';
  if (pathname.includes('content')) return 'Content / App Updates';
  if (pathname.includes('logs')) return 'System Logs';
  if (pathname.includes('settings')) return 'Settings';
  return 'CeBee Predict Admin';
};
