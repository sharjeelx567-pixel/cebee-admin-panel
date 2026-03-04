import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import Sync from '@mui/icons-material/Sync';
import Refresh from '@mui/icons-material/Refresh';
import {
  getApiLeagues,
  getApiTeams,
  getApiPlayers,
  manualSync,
  forceRefresh,
  refetchMatchData,
} from '../services/apiSyncService';

const TAB_LEAGUES = 0;
const TAB_TEAMS = 1;
const TAB_PLAYERS = 2;
// Fixtures & Match Events tabs hidden from UI; constants kept to avoid ReferenceError from cached bundle
const TAB_FIXTURES = 3;
const TAB_MATCH_EVENTS = 4;
const tabLabels = ['Leagues', 'Teams', 'Players'];

const ApiSyncPage = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [leagueId, setLeagueId] = useState('');
  const [season, setSeason] = useState('');
  const [teamId, setTeamId] = useState('');
  const [refetchFixtureId, setRefetchFixtureId] = useState('');

  const clearMsg = () => {
    setMessage(null);
    setError(null);
  };

  const handleManualSync = async () => {
    setActionLoading(true);
    clearMsg();
    const res = await manualSync();
    setActionLoading(false);
    if (res.success) {
      setMessage(res.message || `Sync: ${res.data?.updated ?? 0} updated, ${res.data?.completed ?? 0} completed`);
    } else {
      setError(res.error || 'Manual sync failed');
    }
  };

  const handleForceRefresh = async () => {
    setActionLoading(true);
    clearMsg();
    const res = await forceRefresh();
    setActionLoading(false);
    if (res.success) {
      setMessage(res.message || 'Force refresh completed');
    } else {
      setError(res.error || 'Force refresh failed');
    }
  };

  const handleRefetchMatch = async () => {
    const id = refetchFixtureId?.trim();
    if (!id) {
      setError('Enter API Fixture ID');
      return;
    }
    setActionLoading(true);
    clearMsg();
    const res = await refetchMatchData(id);
    setActionLoading(false);
    if (res.success) {
      setMessage(res.message || 'Match data re-fetched');
    } else {
      setError(res.error || 'Re-fetch failed');
    }
  };

  const loadLeagues = async () => {
    setLoading(true);
    clearMsg();
    const res = await getApiLeagues();
    setLoading(false);
    if (res.success) setLeagues(res.data || []);
    else setError(res.error || 'Failed to load leagues');
  };

  const loadTeams = async () => {
    if (!leagueId.trim() || !season.trim()) {
      setError('League ID and Season are required');
      return;
    }
    setLoading(true);
    clearMsg();
    const res = await getApiTeams(leagueId.trim(), season.trim());
    setLoading(false);
    if (res.success) setTeams(res.data || []);
    else setError(res.error || 'Failed to load teams');
  };

  const loadPlayers = async () => {
    if (!teamId.trim()) {
      setError('API Team ID is required');
      return;
    }
    setLoading(true);
    clearMsg();
    const res = await getApiPlayers(teamId.trim());
    setLoading(false);
    if (res.success) {
      const list = res.data || [];
      setPlayers(Array.isArray(list) ? list : []);
    } else {
      setError(res.error || 'Failed to load players');
    }
  };

  const renderTable = (rows, columns) => (
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {!rows || rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                No data. Use the filters above and click Load.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render ? col.render(row) : (row[col.key] ?? '-')}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const playersRows = Array.isArray(players)
    ? players.flatMap((p) => (p && Array.isArray(p.players) ? p.players : p && p.name ? [p] : []))
    : [];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>API Data & Sync Center</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>Sync actions</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <Sync />}
              onClick={handleManualSync}
              disabled={actionLoading}
            >
              Manual Sync
            </Button>
            <Button
              variant="outlined"
              startIcon={actionLoading ? null : <Refresh />}
              onClick={handleForceRefresh}
              disabled={actionLoading}
            >
              Force Refresh
            </Button>
            <TextField
              size="small"
              label="Re-fetch match (API Fixture ID)"
              value={refetchFixtureId}
              onChange={(e) => setRefetchFixtureId(e.target.value)}
              placeholder="e.g. 1234567"
              sx={{ width: 220 }}
            />
            <Button variant="outlined" onClick={handleRefetchMatch} disabled={actionLoading}>
              Re-fetch Match Data
            </Button>
          </Box>
          {message && <Alert severity="success" onClose={clearMsg} sx={{ mt: 1 }}>{message}</Alert>}
          {error && <Alert severity="error" onClose={clearMsg} sx={{ mt: 1 }}>{error}</Alert>}
        </CardContent>
      </Card>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <CardContent>
          {tab === TAB_LEAGUES && (
            <Box>
              <Button variant="contained" onClick={loadLeagues} disabled={loading} sx={{ mb: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Load Leagues'}
              </Button>
              {renderTable(leagues, [
                { key: 'id', label: 'ID', render: (r) => r.league?.id ?? r.id ?? '-' },
                { key: 'name', label: 'League', render: (r) => r.league?.name ?? r.name ?? '-' },
                { key: 'country', label: 'Country', render: (r) => r.country?.name ?? r.country ?? '-' },
              ])}
            </Box>
          )}

          {tab === TAB_TEAMS && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <TextField size="small" label="League ID" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} placeholder="e.g. 39" sx={{ width: 110 }} />
                <TextField size="small" label="Season" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2024" sx={{ width: 90 }} />
                <Button variant="contained" onClick={loadTeams} disabled={loading}>Load Teams</Button>
              </Box>
              {renderTable(teams, [
                { key: 'id', label: 'Team ID', render: (r) => r.team?.id ?? r.id ?? '-' },
                { key: 'name', label: 'Name', render: (r) => r.team?.name ?? r.name ?? '-' },
              ])}
            </Box>
          )}

          {tab === TAB_PLAYERS && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <TextField size="small" label="API Team ID" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="e.g. 33" sx={{ width: 130 }} />
                <Button variant="contained" onClick={loadPlayers} disabled={loading}>Load Players</Button>
              </Box>
              {renderTable(playersRows, [
                { key: 'name', label: 'Name', render: (r) => r.name ?? '-' },
                { key: 'position', label: 'Position', render: (r) => r.position ?? '-' },
                { key: 'number', label: 'Number', render: (r) => r.number ?? '-' },
              ])}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApiSyncPage;
