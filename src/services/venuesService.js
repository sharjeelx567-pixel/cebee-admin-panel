/**
 * Venues Service - fetches venues from Football API (for admin dropdown when venue auto-fill is empty).
 */

import { apiGet } from './apiBase';

/**
 * Get venues from API (for venue dropdown).
 * @param {{ search?: string, country?: string, city?: string }} params
 * @returns {Promise<{ success: boolean, data?: { venues: Array<{ id: number, name: string, city?: string, country?: string }> }, error?: string }>}
 */
export const getVenues = async (params = {}) => {
  try {
    const query = {};
    if (params.search && String(params.search).trim()) query.search = params.search.trim();
    if (params.country && String(params.country).trim()) query.country = params.country.trim();
    if (params.city && String(params.city).trim()) query.city = params.city.trim();
    const response = await apiGet('/venues', query);
    if (response.success && response.data) {
      return {
        success: true,
        data: { venues: response.data.venues || [] },
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch venues',
      data: { venues: [] },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch venues',
      data: { venues: [] },
    };
  }
};
