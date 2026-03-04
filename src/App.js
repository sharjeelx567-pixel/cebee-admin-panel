import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { constants } from './config/theme';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import FixturesPage from './pages/FixturesPage';
import LeaguesPage from './pages/LeaguesPage';
import TeamsPage from './pages/TeamsPage';
import TeamHistoryPage from './pages/TeamHistoryPage';
import PlayersPage from './pages/PlayersPage';
import PredictionsPage from './pages/PredictionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import NotificationsPage from './pages/NotificationsPage';
import PollsPage from './pages/PollsPage';
import ReferralsPage from './pages/ReferralsPage';
import SystemLogsPage from './pages/SystemLogsPage';
import ContentUpdatesPage from './pages/ContentUpdatesPage';
import SettingsPage from './pages/SettingsPage';
import UserDetailsPage from './pages/UserDetailsPage';
import FixtureDetailsPage from './pages/FixtureDetailsPage';
import FixtureFormPage from './pages/FixtureFormPage';
import LeagueFormPage from './pages/LeagueFormPage';
import RewardFormPage from './pages/RewardFormPage';
import NotificationFormPage from './pages/NotificationFormPage';
import PollFormPage from './pages/PollFormPage';
import FaqFormPage from './pages/FaqFormPage';
import PlaceholderPage from './pages/PlaceholderPage';
import PredictionDetailsPage from './pages/PredictionDetailsPage';
import LeaderboardDetailsPage from './pages/LeaderboardDetailsPage';
import RewardDetailsPage from './pages/RewardDetailsPage';
import ApiSyncPage from './pages/ApiSyncPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to={constants.routes.login} />;
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path={constants.routes.login}
        element={isAuthenticated ? <Navigate to={constants.routes.dashboard} /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path={constants.routes.dashboard} element={<DashboardPage />} />
                <Route path={constants.routes.users} element={<UsersPage />} />
                <Route path={`${constants.routes.users}/details/:id`} element={<UserDetailsPage />} />
                <Route path={constants.routes.fixtures} element={<FixturesPage />} />
                <Route path="/fixtures/add" element={<FixtureFormPage />} />
                <Route path="/fixtures/edit/:id" element={<FixtureFormPage />} />
                <Route path="/fixtures/details/:id" element={<FixtureDetailsPage />} />
                <Route path="/leagues" element={<LeaguesPage />} />
                <Route path="/leagues/add" element={<LeagueFormPage />} />
                <Route path="/leagues/edit/:id" element={<LeagueFormPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/history/:teamId" element={<TeamHistoryPage />} />
                <Route path="/teams/:teamId/players" element={<PlayersPage />} />
                <Route path={constants.routes.predictions} element={<PredictionsPage />} />
                <Route path="/predictions/details/:id" element={<PredictionDetailsPage />} />
                <Route path={constants.routes.leaderboard} element={<LeaderboardPage />} />
                <Route path="/leaderboard/details/:id" element={<LeaderboardDetailsPage />} />
                <Route path={constants.routes.rewards} element={<RewardsPage />} />
                <Route path="/rewards/add" element={<RewardFormPage />} />
                <Route path="/rewards/edit/:id" element={<RewardFormPage />} />
                <Route path="/rewards/details/:id" element={<RewardDetailsPage />} />
                <Route path="/notifications/create" element={<NotificationFormPage />} />
                <Route path="/notifications/edit/:id" element={<NotificationFormPage />} />
                <Route path="/notifications/details/:id" element={<PlaceholderPage title="Notification Details" />} />
                <Route path={constants.routes.notifications} element={<NotificationsPage />} />
                <Route path={constants.routes.content} element={<ContentUpdatesPage />} />
                <Route path="/content-updates/faq/add" element={<FaqFormPage />} />
                <Route path="/content-updates/faq/edit/:id" element={<FaqFormPage />} />
                <Route path={constants.routes.polls} element={<PollsPage />} />
                <Route path="/polls/add" element={<PollFormPage />} />
                <Route path="/polls/edit/:id" element={<PollFormPage />} />
                <Route path={constants.routes.referrals} element={<ReferralsPage />} />
                <Route path="/referrals/details/:id" element={<PlaceholderPage title="Referral Details" />} />
                <Route path={constants.routes.logs} element={<SystemLogsPage />} />
                <Route path={constants.routes.apiSync} element={<ApiSyncPage />} />
                <Route path={constants.routes.settings} element={<SettingsPage />} />
                <Route path="*" element={<Navigate to={constants.routes.dashboard} />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
