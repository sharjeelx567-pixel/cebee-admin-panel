/**
 * API Data & Sync Center – Admin only.
 * Leagues, Fixtures, Teams, Players, Match Events + Manual Sync / Force Refresh / Re-fetch match.
 */

import { apiGet, apiPost } from './apiBase';

const BASE = '/admin/api-sync';

export const getApiLeagues = async () => {
  const res = await apiGet(`${BASE}/leagues`);
  const raw = res.data?.leagues ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return res.success ? { success: true, data: list } : { success: false, error: res.error, data: [] };
};

export const getApiFixtures = async (params = {}) => {
  const { league, season, date, status } = params;
  if (!league || !season) return { success: false, error: 'League ID and Season are required', data: [] };
  const res = await apiGet(`${BASE}/fixtures`, { league, season, date, status });
  const raw = res.data?.fixtures ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return res.success ? { success: true, data: list } : { success: false, error: res.error, data: [] };
};

export const getApiTeams = async (league, season) => {
  if (!league || !season) return { success: false, error: 'League ID and Season are required', data: [] };
  const res = await apiGet(`${BASE}/teams`, { league, season });
  const raw = res.data?.teams ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return res.success ? { success: true, data: list } : { success: false, error: res.error, data: [] };
};

export const getApiPlayers = async (team) => {
  if (team == null || team === '') return { success: false, error: 'API Team ID is required', data: [] };
  const res = await apiGet(`${BASE}/players`, { team });
  const raw = res.data?.players ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return res.success ? { success: true, data: list } : { success: false, error: res.error, data: [] };
};

export const getApiEvents = async (fixture) => {
  if (fixture == null || fixture === '') return { success: false, error: 'API Fixture ID is required', data: [] };
  const res = await apiGet(`${BASE}/events`, { fixture });
  const raw = res.data?.events ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return res.success ? { success: true, data: list } : { success: false, error: res.error, data: [] };
};

export const manualSync = async () => {
  const res = await apiPost(`${BASE}/sync-now`);
  return res;
};

export const forceRefresh = async () => {
  const res = await apiPost(`${BASE}/force-refresh`);
  return res;
};

export const refetchMatchData = async (apiFixtureId) => {
  if (apiFixtureId == null) return { success: false, error: 'apiFixtureId is required' };
  const res = await apiPost(`${BASE}/fixture`, { apiFixtureId: Number(apiFixtureId) });
  return res;
};
