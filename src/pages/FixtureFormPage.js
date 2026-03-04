import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Save,
  Add,
  ArrowBack,
  Star,
  People,
  CheckCircle,
  Shield,
  Stadium,
  CalendarToday,
  Send,
  Event as EventIcon,
  RadioButtonChecked,
  RadioButtonUnchecked,
  Info,
  ExpandMore,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { getLeagues } from '../services/leaguesService';
import { getCmds, getCurrentCmd, createCmd, updateCmdStatus } from '../services/cmdsService';
import { getTeams } from '../services/teamsService';
import { getFeaturedFixtures, createFixture, updateFixture, getUpcomingFixturesByLeague, createFixtureFromApi } from '../services/fixturesService';
import { getVenues as getVenuesFromApi } from '../services/venuesService';

const FixtureFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const LEAGUES_PAGE_SIZE = 50;
  const [leagues, setLeagues] = useState([]);
  const [leaguesPage, setLeaguesPage] = useState(1);
  const [leaguesTotal, setLeaguesTotal] = useState(0);
  const [leaguesTotalPages, setLeaguesTotalPages] = useState(1);
  const [leaguesLoadingMore, setLeaguesLoadingMore] = useState(false);
  const [cmds, setCmds] = useState([]);
  const [currentCmd, setCurrentCmd] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [featuredFixtures, setFeaturedFixtures] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]); // Teams available based on selection
  const [matchdays, setMatchdays] = useState([]);
  const [loadingMatchdays, setLoadingMatchdays] = useState(false);
  const [showNewCmdForm, setShowNewCmdForm] = useState(false);
  const [newCmdForm, setNewCmdForm] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'current',
  });

  const [featureType, setFeatureType] = useState('cebee'); // 'cebee' or 'community'
  const [cebeeSeason, setCebeeSeason] = useState(new Date().getFullYear());
  const [upcomingFixtures, setUpcomingFixtures] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [selectedApiFixture, setSelectedApiFixture] = useState(null);
  const [apiVenues, setApiVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    leagueId: '',
    venue: '',
    kickoffTime: new Date(),
    publishDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default: 24 hours from now
    matchStatus: 'scheduled',
    cmdId: '', // Will be set to current CMd
    matchday: '', // For Community Featured (uses CMd name)
  });
  const [dateError, setDateError] = useState('');

  const STADIUM_OPTIONS = [
    { value: 'other', label: 'Other' },
    { value: 'wembley', label: 'Wembley Stadium' },
    { value: 'old_trafford', label: 'Old Trafford' },
    { value: 'anfield', label: 'Anfield' },
    { value: 'stamford_bridge', label: 'Stamford Bridge' },
  ];

  // Map API venue name to form dropdown value for auto-fill
  const mapApiVenueToFormValue = (apiVenueName) => {
    if (!apiVenueName || typeof apiVenueName !== 'string') return 'other';
    const v = apiVenueName.toLowerCase().trim();
    if (v.includes('wembley')) return 'wembley';
    if (v.includes('old trafford')) return 'old_trafford';
    if (v.includes('anfield')) return 'anfield';
    if (v.includes('stamford bridge')) return 'stamford_bridge';
    return 'other';
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        // Fetch leagues (paginated – first page only on init)
        const leaguesResult = await getLeagues({ page: 1, limit: LEAGUES_PAGE_SIZE });
        if (leaguesResult.success && leaguesResult.data) {
          const list = leaguesResult.data.leagues || [];
          const formattedLeagues = list.map(league => ({
            id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
            league_id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
            name: league.league_name || league.name,
            league_name: league.league_name || league.name,
            country: league.country || null,
            isActive: league.status === 'Active',
            status: league.status,
          }));
          setLeagues(formattedLeagues);
          const pag = leaguesResult.data.pagination || {};
          setLeaguesTotal(pag.total ?? list.length);
          setLeaguesPage(1);
          setLeaguesTotalPages(pag.pages ?? 1);
        } else {
          setLeagues([]);
          setLeaguesTotal(0);
          setLeaguesTotalPages(0);
        }

        // Fetch CMds from database
        let currentCmdId = '';
        const cmdsResult = await getCmds();
        if (cmdsResult.success && cmdsResult.data) {
          const formattedCmds = cmdsResult.data.map(cmd => ({
            id: cmd.id || cmd._id,
            name: cmd.name,
            startDate: cmd.startDate ? new Date(cmd.startDate) : new Date(),
            endDate: cmd.endDate ? new Date(cmd.endDate) : new Date(),
            status: cmd.status,
            fixtureCount: cmd.fixtureCount || 0,
          }));
          setCmds(formattedCmds);
        
        // Set current CMd (only one can be current)
          const current = formattedCmds.find(cmd => cmd.status === 'current');
        if (current) {
          setCurrentCmd(current);
            currentCmdId = current.id;
            setFormData(prev => ({ 
              ...prev, 
              cmdId: current.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? current.name : prev.matchday
            }));
          }
        } else {
          // Try to get current CMd if getCmds fails
          const currentCmdResult = await getCurrentCmd();
          if (currentCmdResult.success && currentCmdResult.data) {
            const current = {
              id: currentCmdResult.data.id || currentCmdResult.data._id,
              name: currentCmdResult.data.name,
              startDate: currentCmdResult.data.startDate ? new Date(currentCmdResult.data.startDate) : new Date(),
              endDate: currentCmdResult.data.endDate ? new Date(currentCmdResult.data.endDate) : new Date(),
              status: currentCmdResult.data.status,
              fixtureCount: currentCmdResult.data.fixtureCount || 0,
            };
            setCurrentCmd(current);
            currentCmdId = current.id;
            setCmds([current]);
            setFormData(prev => ({ 
              ...prev, 
              cmdId: current.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? current.name : prev.matchday
            }));
          } else {
            console.error('Failed to load CMds:', cmdsResult.error || currentCmdResult.error);
            setCmds([]);
          }
        }

        // Mock Fixture Data if Edit Mode
        if (isEditMode) {
          setFormData({
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            leagueId: 'premier_league',
            venue: 'wembley',
            kickoffTime: new Date(),
            matchStatus: 'scheduled',
            cmdId: currentCmdId,
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [id, isEditMode]);

  // Load teams when league is selected
  useEffect(() => {
    const loadTeams = async () => {
      if (!formData.leagueId) {
        setTeams([]);
        setAvailableTeams([]);
        setFeaturedFixtures([]);
        return;
      }

      setLoadingTeams(true);
      try {
        if (featureType === 'community') {
          // For Community Featured: Fetch featured fixture and show both teams from it
          const fixturesResult = await getFeaturedFixtures(formData.leagueId);
          
          if (fixturesResult.success && fixturesResult.data?.featuredFixture) {
            const featuredFixture = fixturesResult.data.featuredFixture;
            // Store the featured fixture data for later use
            setFeaturedFixtures([featuredFixture]);
            
            // Extract teams from featured fixture (teamA and teamB)
            const teams = [];
            
            if (featuredFixture.teamA && featuredFixture.teamA._id) {
              teams.push({
                id: featuredFixture.teamA._id,
                team_id: featuredFixture.teamA._id,
                name: featuredFixture.teamA.name,
                team_name: featuredFixture.teamA.name,
                logo: featuredFixture.teamA.logo,
                isTeamA: true,
                opponentId: featuredFixture.teamB?._id,
                opponentName: featuredFixture.teamB?.name,
              });
            }
            
            if (featuredFixture.teamB && featuredFixture.teamB._id) {
              teams.push({
                id: featuredFixture.teamB._id,
                team_id: featuredFixture.teamB._id,
                name: featuredFixture.teamB.name,
                team_name: featuredFixture.teamB.name,
                logo: featuredFixture.teamB.logo,
                isTeamA: false,
                opponentId: featuredFixture.teamA?._id,
                opponentName: featuredFixture.teamA?.name,
              });
            }
            
            setTeams(teams);
            setAvailableTeams(teams);
          } else {
            setTeams([]);
            setAvailableTeams([]);
            setFeaturedFixtures([]);
          }
        } else {
          // For CeBee Featured: Show all teams from the league
          const teamsResult = await getTeams({ 
            league_id: formData.leagueId, 
            status: 'Active' 
          });
          
          if (teamsResult.success && teamsResult.data?.teams) {
            // Sort teams: featured teams first (by priority or featured flag), then alphabetically
            const formattedTeams = teamsResult.data.teams
              .map(team => ({
                id: team._id || team.team_id,
                team_id: team._id || team.team_id,
                name: team.team_name || team.name,
                team_name: team.team_name || team.name,
                priority: team.priority || 0,
                featured: team.featured || false,
                isFeatured: team.featured || team.priority > 0,
              }))
              .sort((a, b) => {
                // Featured teams first
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                // Then by priority (higher first)
                if (a.priority !== b.priority) return (b.priority || 0) - (a.priority || 0);
                // Then alphabetically
                return a.name.localeCompare(b.name);
              });
            
            setTeams(formattedTeams);
            setAvailableTeams(formattedTeams);
            setFeaturedFixtures([]);
          } else {
            setTeams([]);
            setAvailableTeams([]);
          }
        }
      } catch (error) {
        console.error('Error loading teams:', error);
        setTeams([]);
        setAvailableTeams([]);
        setFeaturedFixtures([]);
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [formData.leagueId, featureType]);

  // Auto-update matchday when CMd is selected and feature type is community
  useEffect(() => {
    if (featureType === 'community' && formData.cmdId && currentCmd) {
      // Automatically set matchday to current CMd name
      if (formData.matchday !== currentCmd.name) {
        setFormData(prev => ({ ...prev, matchday: currentCmd.name }));
      }
    } else if (featureType === 'community' && !formData.cmdId) {
      // Clear matchday if no CMd is selected
      setFormData(prev => ({ ...prev, matchday: '' }));
    }
  }, [formData.cmdId, currentCmd, featureType]);

  // Update available teams when a team is selected (for Community Featured)
  useEffect(() => {
    if (featureType === 'community' && featuredFixtures.length > 0) {
      if (formData.homeTeam && !formData.awayTeam) {
        // Home team selected, show only the away team from the same fixture
        const selectedTeam = teams.find(t => t.id === formData.homeTeam);
        if (selectedTeam && selectedTeam.opponentId) {
          const opponent = teams.find(t => t.id === selectedTeam.opponentId);
          setAvailableTeams(opponent ? [opponent] : []);
        } else {
          setAvailableTeams([]);
        }
      } else if (formData.awayTeam && !formData.homeTeam) {
        // Away team selected, show only the home team from the same fixture
        const selectedTeam = teams.find(t => t.id === formData.awayTeam);
        if (selectedTeam && selectedTeam.opponentId) {
          const opponent = teams.find(t => t.id === selectedTeam.opponentId);
          setAvailableTeams(opponent ? [opponent] : []);
        } else {
          setAvailableTeams([]);
        }
      } else if (!formData.homeTeam && !formData.awayTeam) {
        // No team selected, show all teams from featured fixtures
        setAvailableTeams(teams);
      } else {
        // Both teams selected, show all teams
        setAvailableTeams(teams);
      }
    } else {
      // For CeBee Featured, all teams are always available
      setAvailableTeams(teams);
    }
  }, [formData.homeTeam, formData.awayTeam, featureType, teams, featuredFixtures]);

  // CeBee Featured: load upcoming fixtures when league + season are set
  useEffect(() => {
    if (featureType !== 'cebee' || !formData.leagueId || !cebeeSeason) {
      setUpcomingFixtures([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingUpcoming(true);
      setSelectedApiFixture(null);
      try {
        const res = await getUpcomingFixturesByLeague(formData.leagueId, cebeeSeason);
        if (!cancelled && res.success && res.data?.fixtures) {
          setUpcomingFixtures(res.data.fixtures);
        } else if (!cancelled) {
          setUpcomingFixtures([]);
        }
      } catch (e) {
        if (!cancelled) setUpcomingFixtures([]);
      } finally {
        if (!cancelled) setLoadingUpcoming(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [featureType, formData.leagueId, cebeeSeason]);

  // When fixture is selected but API venue is empty, load venues for admin to select
  useEffect(() => {
    if (!selectedApiFixture || (selectedApiFixture.venue && String(selectedApiFixture.venue).trim())) {
      setApiVenues([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingVenues(true);
      try {
        const res = await getVenuesFromApi({ country: 'england' });
        if (!cancelled && res.success && res.data?.venues) {
          setApiVenues(res.data.venues);
        } else if (!cancelled) {
          setApiVenues([]);
        }
      } catch (e) {
        if (!cancelled) setApiVenues([]);
      } finally {
        if (!cancelled) setLoadingVenues(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedApiFixture]);

  const handleChange = (field, value) => {
    // Clear team selections if league changes
    if (field === 'leagueId') {
      setFormData(prev => ({ ...prev, [field]: value, homeTeam: '', awayTeam: '' }));
      if (featureType === 'cebee') {
        setSelectedApiFixture(null);
        setUpcomingFixtures([]);
      }
    } else if (field === 'homeTeam' || field === 'awayTeam') {
      // Allow both teams to be selected independently
      // Only clear if selecting the same team in the other field (prevent duplicate selection)
      if (field === 'homeTeam' && value === formData.awayTeam) {
        // If selecting home team that's already selected as away team, clear away team
        setFormData(prev => ({ ...prev, [field]: value, awayTeam: '' }));
      } else if (field === 'awayTeam' && value === formData.homeTeam) {
        // If selecting away team that's already selected as home team, clear home team
        setFormData(prev => ({ ...prev, [field]: value, homeTeam: '' }));
      } else {
        // Normal selection - keep both teams
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
    setFormData({ ...formData, [field]: value });
    }
  };

  const handleFeatureTypeChange = (type) => {
    setFeatureType(type);
    // Clear team selections when switching feature type
    setFormData(prev => ({ ...prev, homeTeam: '', awayTeam: '' }));
    setAvailableTeams([]);
    setFeaturedFixtures([]);
    setSelectedApiFixture(null);
    setUpcomingFixtures([]);
  };

  const loadMoreLeagues = async () => {
    if (leaguesLoadingMore || leaguesPage >= leaguesTotalPages) return;
    setLeaguesLoadingMore(true);
    try {
      const nextPage = leaguesPage + 1;
      const result = await getLeagues({ page: nextPage, limit: LEAGUES_PAGE_SIZE });
      if (result.success && result.data?.leagues?.length) {
        const formatted = (result.data.leagues || []).map(league => ({
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          league_id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          name: league.league_name || league.name,
          league_name: league.league_name || league.name,
          country: league.country || null,
          isActive: league.status === 'Active',
          status: league.status,
        }));
        setLeagues(prev => [...prev, ...formatted]);
        setLeaguesPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more leagues:', err);
    } finally {
      setLeaguesLoadingMore(false);
    }
  };

  const handleCreateCmd = async () => {
    if (!newCmdForm.name || !newCmdForm.startDate || !newCmdForm.endDate) {
      alert('Please fill all CMd fields');
      return;
    }

    try {
      const result = await createCmd({
      name: newCmdForm.name,
      startDate: newCmdForm.startDate,
      endDate: newCmdForm.endDate,
      status: newCmdForm.status,
      });

      if (result.success && result.data) {
        const newCmd = {
          id: result.data.id || result.data._id,
          name: result.data.name,
          startDate: result.data.startDate ? new Date(result.data.startDate) : newCmdForm.startDate,
          endDate: result.data.endDate ? new Date(result.data.endDate) : newCmdForm.endDate,
          status: result.data.status,
          fixtureCount: result.data.fixtureCount || 0,
    };

        // Reload all CMds to get updated statuses
        const cmdsResult = await getCmds();
        if (cmdsResult.success && cmdsResult.data) {
          const formattedCmds = cmdsResult.data.map(cmd => ({
            id: cmd.id || cmd._id,
            name: cmd.name,
            startDate: cmd.startDate ? new Date(cmd.startDate) : new Date(),
            endDate: cmd.endDate ? new Date(cmd.endDate) : new Date(),
            status: cmd.status,
            fixtureCount: cmd.fixtureCount || 0,
          }));
          setCmds(formattedCmds);
          
          // Set current CMd if status is current
    if (newCmdForm.status === 'current') {
      setCurrentCmd(newCmd);
            setFormData(prev => ({ 
              ...prev, 
              cmdId: newCmd.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? newCmd.name : prev.matchday
            }));
          }
        } else {
          // Fallback: just add the new CMd
          setCmds(prev => [...prev, newCmd]);
          if (newCmdForm.status === 'current') {
            setCurrentCmd(newCmd);
            setFormData(prev => ({ 
              ...prev, 
              cmdId: newCmd.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? newCmd.name : prev.matchday
            }));
    }
        }

        alert(result.message || 'CMd created successfully');

    // Reset form
    setNewCmdForm({
      name: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'current',
    });
    setShowNewCmdForm(false);
      } else {
        alert(result.error || 'Failed to create CMd');
      }
    } catch (error) {
      console.error('Error creating CMd:', error);
      alert('An unexpected error occurred while creating CMd');
    }
  };

  const handleSelectCmd = async (cmdId) => {
    try {
      // Update the selected CMd status to 'current' via API
      const result = await updateCmdStatus(cmdId, 'current');
      
      if (result.success) {
        // Reload all CMds to get updated statuses
        const cmdsResult = await getCmds();
        if (cmdsResult.success && cmdsResult.data) {
          const formattedCmds = cmdsResult.data.map(cmd => ({
            id: cmd.id || cmd._id,
            name: cmd.name,
            startDate: cmd.startDate ? new Date(cmd.startDate) : new Date(),
            endDate: cmd.endDate ? new Date(cmd.endDate) : new Date(),
            status: cmd.status,
            fixtureCount: cmd.fixtureCount || 0,
          }));
          setCmds(formattedCmds);
          
          // Set current CMd
          const selectedCmd = formattedCmds.find(cmd => cmd.id === cmdId);
          if (selectedCmd) {
            setCurrentCmd(selectedCmd);
            setFormData(prev => ({ 
              ...prev, 
              cmdId: selectedCmd.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? selectedCmd.name : prev.matchday
            }));
          }
        } else {
          // Fallback: update local state
    setCmds(prev => prev.map(cmd => 
      cmd.id === cmdId ? { ...cmd, status: 'current' } : { ...cmd, status: 'completed' }
    ));
    const selectedCmd = cmds.find(cmd => cmd.id === cmdId);
    if (selectedCmd) {
      setCurrentCmd(selectedCmd);
            setFormData(prev => ({ 
              ...prev, 
              cmdId: selectedCmd.id,
              // Auto-set matchday to CMd name for Community Featured
              matchday: featureType === 'community' ? selectedCmd.name : prev.matchday
            }));
          }
        }
      } else {
        alert(result.error || 'Failed to update CMd status');
      }
    } catch (error) {
      console.error('Error selecting CMd:', error);
      alert('An unexpected error occurred while selecting CMd');
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.leagueId) {
      alert('Please select a league');
      return;
    }

    if (!formData.kickoffTime) {
      alert('Please select a kickoff time');
      return;
    }

    if (!formData.publishDateTime) {
      alert('Please select a publish date and time');
      return;
    }

    if (!formData.venue) {
      alert('Please select a venue');
      return;
    }

    // Validate that publish date is before kickoff time
    const publishDate = formData.publishDateTime instanceof Date 
      ? formData.publishDateTime 
      : new Date(formData.publishDateTime);
    const kickoffDate = formData.kickoffTime instanceof Date 
      ? formData.kickoffTime 
      : new Date(formData.kickoffTime);

    if (publishDate >= kickoffDate) {
      setDateError('Publish date and time must be before kickoff date and time');
      alert('Publish date and time must be before kickoff date and time. Please adjust the dates.');
      return;
    }
    
    // Clear any date errors if validation passes
    setDateError('');

    // Validate based on feature type
    if (featureType === 'community') {
      if (!formData.homeTeam && !formData.awayTeam) {
        alert('Please select at least one team for Community Featured fixture');
        return;
      }
      if (!formData.matchday) {
        alert('Please enter a matchday for Community Featured fixture');
        return;
      }
    } else if (featureType === 'cebee' && selectedApiFixture) {
      // CeBee Featured from API: no team selection required
    } else {
      // CeBee manual or Regular: require both teams
      if (!formData.homeTeam || !formData.awayTeam) {
        alert('Please select both home and away teams, or select a fixture from the list above');
        return;
      }
    }

    // Ensure fixture is assigned to current CMd
    const cmdId = formData.cmdId || currentCmd?.id;
    if (!cmdId) {
      alert('No active CMd found. Please create or select a CMd first.');
      return;
    }

    try {
      setSaving(true);

      // Prepare fixture data according to backend requirements
      const fixtureData = {
        leagueId: formData.leagueId,
        kickoffTime: formData.kickoffTime instanceof Date 
          ? formData.kickoffTime.toISOString() 
          : formData.kickoffTime,
        publishDateTime: formData.publishDateTime instanceof Date 
          ? formData.publishDateTime.toISOString() 
          : formData.publishDateTime,
        venue: formData.venue,
        cmdId: cmdId,
      };

      // Add status if provided
      if (formData.matchStatus) {
        fixtureData.status = formData.matchStatus;
      }

      // Handle based on feature type
      if (featureType === 'community') {
        // Community Featured: requires selected_team_id and matchday
        const selectedTeamId = formData.homeTeam || formData.awayTeam;
        if (!selectedTeamId) {
          alert('Please select a team');
          setSaving(false);
          return;
        }
        fixtureData.isCommunityFeatured = true;
        fixtureData.selected_team_id = selectedTeamId;
        fixtureData.matchday = formData.matchday;
      } else {
        // CeBee from API: teams come from API, no form team IDs needed
        if (featureType === 'cebee' && selectedApiFixture) {
          fixtureData.isCeBeFeatured = true;
        } else {
          // CeBee manual or Regular: requires home_team_id and away_team_id
        if (!formData.homeTeam || !formData.awayTeam) {
          alert('Please select both home and away teams');
          setSaving(false);
          return;
        }
        fixtureData.home_team_id = formData.homeTeam;
        fixtureData.away_team_id = formData.awayTeam;
        if (featureType === 'cebee') {
          fixtureData.isCeBeFeatured = true;
          }
        }
      }

      console.log('Saving fixture with data:', fixtureData);

      let result;
      if (isEditMode && id) {
        result = await updateFixture(id, fixtureData);
      } else if (featureType === 'cebee' && selectedApiFixture) {
        const fromApiPayload = {
          apiFixtureId: selectedApiFixture.apiFixtureId,
          leagueId: formData.leagueId,
          publishDateTime: formData.publishDateTime,
        };
        if (!selectedApiFixture.venue && formData.venue && String(formData.venue).trim()) {
          fromApiPayload.venue = String(formData.venue).trim();
        }
        result = await createFixtureFromApi(fromApiPayload);
      } else {
        result = await createFixture(fixtureData);
      }

      if (result.success) {
        alert(result.message || (isEditMode ? 'Fixture updated successfully' : 'Fixture created successfully'));
        navigate(constants.routes.fixtures, { state: { refresh: true } });
      } else {
        alert(result.error || 'Failed to save fixture');
      }
    } catch (error) {
      console.error('Error saving fixture:', error);
      alert('An error occurred while saving the fixture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(constants.routes.fixtures)}
          sx={{
            mb: 3,
            color: colors.brandRed,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: `${colors.brandRed}0A`,
            },
          }}
        >
          Back to Fixtures
        </Button>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '16px',
              boxShadow: `0 4px 12px ${colors.brandRed}40`,
            }}
          >
            <Add sx={{ fontSize: 40, color: colors.brandWhite }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: colors.brandBlack,
                fontSize: { xs: 24, md: 32 },
                mb: 0.5,
              }}
            >
              {isEditMode ? 'Edit Fixture' : 'Add New Fixture'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.textSecondary,
                fontSize: 16,
              }}
            >
              Create a new match fixture
            </Typography>
          </Box>
        </Box>

        {/* CMd (CeBee Matchday) Management Section */}
        <Card sx={{ padding: 3, borderRadius: '16px', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ fontSize: 20, color: colors.brandRed }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                CeBee Matchday (CMd)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowNewCmdForm(!showNewCmdForm)}
              sx={{
                borderColor: colors.brandRed,
                color: colors.brandRed,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
                '&:hover': {
                  borderColor: colors.brandDarkRed,
                  backgroundColor: `${colors.brandRed}0A`,
                },
              }}
            >
              {showNewCmdForm ? 'Cancel' : 'New CMd'}
            </Button>
          </Box>

          <Alert
            icon={<Info sx={{ color: colors.info }} />}
            sx={{
              mb: 3,
              backgroundColor: `${colors.info}15`,
              border: `1px solid ${colors.info}33`,
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: colors.info,
              },
            }}
          >
            <Typography variant="body2" sx={{ color: colors.info, fontWeight: 600, mb: 0.5 }}>
              CMd Assignment
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
              All fixtures are automatically assigned to the Current CMd. Only one CMd can be active at a time.
            </Typography>
          </Alert>

          {/* Current CMd Display */}
          {currentCmd ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: `${colors.brandRed}08`,
                border: `2px solid ${colors.brandRed}`,
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      padding: 1,
                      borderRadius: '8px',
                      backgroundColor: colors.brandRed,
                    }}
                  >
                    <RadioButtonChecked sx={{ fontSize: 20, color: colors.brandWhite }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                      {currentCmd.name} (Current)
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                      {format(currentCmd.startDate, 'MMM dd, yyyy')} - {format(currentCmd.endDate, 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                      {currentCmd.fixtureCount} fixtures
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="ACTIVE"
                  size="small"
                  sx={{
                    backgroundColor: colors.success,
                    color: colors.brandWhite,
                    fontWeight: 700,
                    fontSize: 10,
                    height: 24,
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: '12px',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                No active CMd found. Please create a new CMd to continue.
              </Typography>
            </Alert>
          )}

          {/* Previous CMds List */}
          {cmds.filter(cmd => cmd.status === 'completed').length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: colors.textSecondary }}>
                Previous CMds
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {cmds
                  .filter(cmd => cmd.status === 'completed')
                  .map((cmd) => (
                    <Box
                      key={cmd.id}
                      onClick={() => handleSelectCmd(cmd.id)}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        backgroundColor: colors.brandWhite,
                        border: `1px solid ${colors.divider}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': {
                          borderColor: colors.brandRed,
                          backgroundColor: `${colors.brandRed}05`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <RadioButtonUnchecked sx={{ fontSize: 18, color: colors.textSecondary }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                            {cmd.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                            {format(cmd.startDate, 'MMM dd')} - {format(cmd.endDate, 'MMM dd, yyyy')} • {cmd.fixtureCount} fixtures
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label="COMPLETED"
                        size="small"
                        sx={{
                          backgroundColor: colors.textSecondary,
                          color: colors.brandWhite,
                          fontWeight: 600,
                          fontSize: 10,
                          height: 22,
                        }}
                      />
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          {/* New CMd Form */}
          {showNewCmdForm && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: `${colors.brandRed}05`,
                border: `1.5px solid ${colors.brandRed}33`,
                mt: 2,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: colors.brandBlack }}>
                Create New CMd
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="CMd Name"
                    placeholder="e.g., CMd-06"
                    value={newCmdForm.name}
                    onChange={(e) => setNewCmdForm({ ...newCmdForm, name: e.target.value })}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Start Date"
                    value={newCmdForm.startDate}
                    onChange={(date) => setNewCmdForm({ ...newCmdForm, startDate: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          borderRadius: '12px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="End Date"
                    value={newCmdForm.endDate}
                    onChange={(date) => setNewCmdForm({ ...newCmdForm, endDate: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          borderRadius: '12px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newCmdForm.status}
                      onChange={(e) => setNewCmdForm({ ...newCmdForm, status: e.target.value })}
                      label="Status"
                      sx={{
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: '12px',
                        },
                      }}
                    >
                      <MenuItem value="current">Current (Active)</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCreateCmd}
                    sx={{
                      background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                    }}
                  >
                    Create CMd
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Card>

        {/* Feature Type Section */}
        <Card sx={{ padding: 3, borderRadius: '16px', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Star sx={{ fontSize: 20, color: colors.brandRed }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Feature Type
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card
                onClick={() => handleFeatureTypeChange('cebee')}
                sx={{
                  padding: 2.5,
                  borderRadius: '16px',
                  border: `2px solid ${featureType === 'cebee' ? colors.brandRed : colors.divider}`,
                  backgroundColor: featureType === 'cebee' ? `${colors.brandRed}08` : colors.brandWhite,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: colors.brandRed,
                    backgroundColor: `${colors.brandRed}0D`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      padding: 1,
                      borderRadius: '8px',
                      backgroundColor: featureType === 'cebee' ? colors.brandRed : colors.textSecondary,
                    }}
                  >
                    <Star sx={{ fontSize: 24, color: colors.brandWhite }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      CeBee Featured
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                      Premium match selected by CeBee
                    </Typography>
                  </Box>
                </Box>
                {featureType === 'cebee' && (
                  <CheckCircle
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      fontSize: 24,
                      color: colors.brandRed,
                    }}
                  />
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                onClick={() => handleFeatureTypeChange('community')}
                sx={{
                  padding: 2.5,
                  borderRadius: '16px',
                  border: `2px solid ${featureType === 'community' ? colors.brandRed : colors.divider}`,
                  backgroundColor: featureType === 'community' ? `${colors.brandRed}08` : colors.brandWhite,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: colors.brandRed,
                    backgroundColor: `${colors.brandRed}0D`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      padding: 1,
                      borderRadius: '8px',
                      backgroundColor: featureType === 'community' ? colors.brandRed : colors.textSecondary,
                    }}
                  >
                    <People sx={{ fontSize: 24, color: colors.brandWhite }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Community Featured
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                      Match voted by community
                    </Typography>
                  </Box>
                </Box>
                {featureType === 'community' && (
                  <CheckCircle
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      fontSize: 24,
                      color: colors.brandRed,
                    }}
                  />
                )}
              </Card>
            </Grid>
          </Grid>
        </Card>

        {/* CeBee Featured: Competition & Fixture (League → Season → Select fixture) */}
        {featureType === 'cebee' && (
          <Card
            sx={{
              padding: 3,
              borderRadius: '16px',
              mb: 3,
              border: `1px solid ${colors.divider || '#eee'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              background: `linear-gradient(180deg, ${colors.brandWhite} 0%, ${colors.brandRed ? `${colors.brandRed}04` : '#fafafa'} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed || colors.brandRed} 100%)`,
                  color: colors.brandWhite,
                }}
              >
                <EventIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, lineHeight: 1.3 }}>
                  Competition & Fixture
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.25 }}>
                  League → Season → Pick a match to auto-fill details
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Step 1 — League
                </Typography>
                <Autocomplete
                  fullWidth
                  options={leagues}
                  getOptionLabel={(opt) => (opt && opt.country ? `${opt.name} (${opt.country})` : (opt?.name || ''))}
                  value={leagues.find((l) => String(l?.id) === String(formData.leagueId)) || null}
                  onChange={(_, newValue) => handleChange('leagueId', newValue?.id ?? '')}
                  isOptionEqualToValue={(opt, val) => opt && val && String(opt.id) === String(val.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="League *"
                      placeholder="Search leagues..."
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: colors.brandWhite,
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brandRed },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: colors.brandRed },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, league) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
                      <Stadium sx={{ fontSize: 20, color: colors.brandRed, opacity: 0.9 }} />
                      <Typography>{league.country ? `${league.name} (${league.country})` : league.name}</Typography>
                    </Box>
                  )}
                />
                {leaguesTotal > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${leagues.length} / ${leaguesTotal} leagues`}
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 600,
                        backgroundColor: `${colors.brandRed}12`,
                        color: colors.brandRed,
                      }}
                    />
                    {leaguesPage < leaguesTotalPages && (
                      <Button
                        size="small"
                        variant="text"
                        endIcon={leaguesLoadingMore ? null : <ExpandMore />}
                        onClick={loadMoreLeagues}
                        disabled={leaguesLoadingMore}
                        sx={{ textTransform: 'none', fontWeight: 600, color: colors.brandRed, '&:hover': { backgroundColor: `${colors.brandRed}0C` } }}
                      >
                        {leaguesLoadingMore ? 'Loading…' : 'Load more leagues'}
                      </Button>
                    )}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Step 2 — Season
                </Typography>
                <Autocomplete
                  fullWidth
                  value={cebeeSeason}
                  onChange={(_, newVal) => { setCebeeSeason(newVal != null ? Number(newVal) : new Date().getFullYear()); setSelectedApiFixture(null); }}
                  options={[new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                  getOptionLabel={(y) => String(y)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Season (year)"
                      placeholder="Search year..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: colors.brandWhite,
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brandRed },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: colors.brandRed },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Step 3 — Fixture
                </Typography>
                <Autocomplete
                  fullWidth
                  value={selectedApiFixture}
                  onChange={(_, newVal) => {
                    setSelectedApiFixture(newVal || null);
                    if (newVal) {
                      const venueValue = mapApiVenueToFormValue(newVal.venue) || 'other';
                      setFormData(prev => ({
                        ...prev,
                        kickoffTime: newVal.kickoff ? new Date(newVal.kickoff) : prev.kickoffTime,
                        venue: venueValue,
                      }));
                    }
                  }}
                  options={loadingUpcoming ? [] : upcomingFixtures}
                  getOptionLabel={(f) => f ? `${f.homeTeamName} vs ${f.awayTeamName} – ${f.kickoff ? format(new Date(f.kickoff), 'EEE d MMM, HH:mm') : ''}` : ''}
                  isOptionEqualToValue={(opt, val) => opt && val && Number(opt.apiFixtureId) === Number(val.apiFixtureId)}
                  disabled={loadingUpcoming || !formData.leagueId || !cebeeSeason}
                  clearable
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select fixture (optional)"
                      placeholder="Search fixtures..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: colors.brandWhite,
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.brandRed },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: colors.brandRed },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, f) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CalendarToday sx={{ fontSize: 18, color: colors.textSecondary }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{f.homeTeamName} vs {f.awayTeamName}</Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                          {f.kickoff ? format(new Date(f.kickoff), 'EEE d MMM · HH:mm') : ''}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  slotProps={{
                    paper: {
                      sx: {
                        maxHeight: 320,
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        mt: 1.5,
                        '& .MuiAutocomplete-listbox': { maxHeight: 300, '& .Mui-focused': { backgroundColor: `${colors.brandRed}12` } },
                      },
                    },
                  }}
                />
                {loadingUpcoming && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                    <CircularProgress size={18} sx={{ color: colors.brandRed }} />
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>Loading fixtures…</Typography>
                  </Box>
                )}
                {!loadingUpcoming && upcomingFixtures.length > 0 && !selectedApiFixture && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: colors.textSecondary }}>
                    {upcomingFixtures.length} upcoming fixture{upcomingFixtures.length !== 1 ? 's' : ''} available – search or clear to select manually
                  </Typography>
                )}
                {!loadingUpcoming && upcomingFixtures.length === 0 && formData.leagueId && cebeeSeason && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: colors.textSecondary }}>
                    No upcoming fixtures for this league/season
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Card>
        )}

        {/* Team Details Section */}
        <Card sx={{ padding: 3, borderRadius: '16px', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Stadium sx={{ fontSize: 20, color: colors.brandRed }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Team Details
            </Typography>
          </Box>

          {/* Info Banner */}
          <Alert
            icon={<CheckCircle sx={{ color: colors.success }} />}
            sx={{
              mb: 3,
              backgroundColor: `${colors.success}15`,
              border: `1px solid ${colors.success}33`,
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: colors.success,
              },
            }}
          >
            <Typography variant="body2" sx={{ color: colors.success, fontWeight: 600 }}>
              {featureType === 'cebee'
                ? (selectedApiFixture
                  ? 'CeBee Featured – Fixture selected from API; teams, kickoff and venue are auto-filled.'
                  : 'CeBee Featured – Select a fixture above to auto-fill, or choose teams manually below.')
                : 'Community Featured - Match voted by community'}
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {featureType === 'cebee' && selectedApiFixture ? (
              <Grid item xs={12}>
                <Box
                sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    backgroundColor: `${colors.success}0C`,
                    border: `1px solid ${colors.success}30`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircle sx={{ color: colors.success, fontSize: 22 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.success }}>
                      Auto-filled from selected fixture
                    </Typography>
                            <Chip
                              size="small"
                      label="From API"
                              sx={{
                        ml: 1,
                        borderRadius: '8px',
                        fontWeight: 600,
                        backgroundColor: colors.brandWhite,
                        color: colors.textSecondary,
                        border: `1px solid ${colors.divider || '#eee'}`,
                      }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Home</Typography>
                      <Typography sx={{ fontWeight: 600, mt: 0.25 }}>{selectedApiFixture.homeTeamName || '–'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Away</Typography>
                      <Typography sx={{ fontWeight: 600, mt: 0.25 }}>{selectedApiFixture.awayTeamName || '–'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kickoff</Typography>
                      <Typography sx={{ fontWeight: 600, mt: 0.25 }}>
                        {selectedApiFixture.kickoff ? format(new Date(selectedApiFixture.kickoff), 'PPp') : '–'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venue</Typography>
                      {selectedApiFixture.venue && String(selectedApiFixture.venue).trim() ? (
                        <Typography sx={{ fontWeight: 600, mt: 0.25 }}>{selectedApiFixture.venue}</Typography>
                      ) : (
                        <Box sx={{ mt: 0.5 }}>
                          <Autocomplete
                            fullWidth
                              size="small"
                            value={apiVenues.find((v) => v.name === formData.venue) || null}
                            onChange={(_, newVal) => handleChange('venue', newVal?.name || '')}
                            options={apiVenues}
                            getOptionLabel={(v) => v ? `${v.name}${v.city ? `, ${v.city}` : ''}` : ''}
                            isOptionEqualToValue={(a, b) => a && b && a.id === b.id}
                            disabled={loadingVenues}
                            clearable
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select venue"
                                placeholder="Search venues..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                              />
                            )}
                            slotProps={{
                              paper: { sx: { maxHeight: 280 } },
                            }}
                          />
                          {loadingVenues && (
                            <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 0.5 }}>Loading venues…</Typography>
                          )}
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ) : (
            <>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                value={(() => {
                  const list = featureType === 'community' ? availableTeams : teams;
                  return list.find(t => String(t.id || t._id || t.team_id) === String(formData.homeTeam)) || null;
                })()}
                onChange={(_, newVal) => handleChange('homeTeam', newVal?.id ?? '')}
                options={featureType === 'community' ? availableTeams : teams}
                getOptionLabel={(t) => t ? (t.name || t.team_name || '') : ''}
                isOptionEqualToValue={(a, b) => a && b && String(a.id || a._id || a.team_id) === String(b.id || b._id || b.team_id)}
                disabled={!formData.leagueId || loadingTeams}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Home Team *"
                    placeholder="Search teams..."
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                renderOption={(props, team) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {(team.isFeatured || featureType === 'community') && <Star sx={{ fontSize: 16, color: colors.brandRed }} />}
                    <Typography sx={{ flex: 1 }}>{team.name || team.team_name}</Typography>
                    {featureType === 'community' && team.isTeamA && (
                      <Chip label="Featured Team" size="small" sx={{ backgroundColor: `${colors.brandRed}22`, color: colors.brandRed, fontWeight: 700, fontSize: 10, height: 20 }} />
                    )}
                    {(team.isFeatured || featureType === 'community') && (
                      <Chip label={featureType === 'community' ? 'Featured Fixture' : 'Featured'} size="small" sx={{ backgroundColor: `${colors.brandRed}15`, color: colors.brandRed, fontWeight: 600, fontSize: 10, height: 20 }} />
                    )}
                  </Box>
                )}
                slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } } }}
              />
              {loadingTeams && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CircularProgress size={18} sx={{ color: colors.brandRed }} />
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>Loading teams...</Typography>
                </Box>
              )}
              {(featureType === 'community' ? availableTeams : teams).length === 0 && !loadingTeams && formData.leagueId && (
                <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 0.5 }}>
                  {featureType === 'community' ? 'No featured fixtures for this league' : 'No teams for this league'}
                </Typography>
              )}
                {featureType === 'community' && (teams.some(t => t.isTeamA) || availableTeams.some(t => t.isTeamA)) && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: colors.textSecondary }}>
                    First team is the Featured Team from the Featured Fixture.
                  </Typography>
                )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                value={(() => {
                  const list = featureType === 'community' ? availableTeams : teams;
                  return list.find(t => String(t.id || t._id || t.team_id) === String(formData.awayTeam)) || null;
                })()}
                onChange={(_, newVal) => handleChange('awayTeam', newVal?.id ?? '')}
                options={featureType === 'community' ? availableTeams : teams}
                getOptionLabel={(t) => t ? (t.name || t.team_name || '') : ''}
                isOptionEqualToValue={(a, b) => a && b && String(a.id || a._id || a.team_id) === String(b.id || b._id || b.team_id)}
                disabled={!formData.leagueId || loadingTeams}
                renderInput={(params) => (
                  <TextField
                    {...params}
                  label="Away Team *"
                    placeholder="Search teams..."
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                renderOption={(props, team) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {(team.isFeatured || featureType === 'community') && <Star sx={{ fontSize: 16, color: colors.brandRed }} />}
                    <Typography sx={{ flex: 1 }}>{team.name || team.team_name}</Typography>
                          {featureType === 'community' && team.isTeamA && (
                      <Chip label="Featured Team" size="small" sx={{ backgroundColor: `${colors.brandRed}22`, color: colors.brandRed, fontWeight: 700, fontSize: 10, height: 20 }} />
                          )}
                          {(team.isFeatured || featureType === 'community') && (
                      <Chip label={featureType === 'community' ? 'Featured Fixture' : 'Featured'} size="small" sx={{ backgroundColor: `${colors.brandRed}15`, color: colors.brandRed, fontWeight: 600, fontSize: 10, height: 20 }} />
                          )}
                        </Box>
                )}
                slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } } }}
              />
              {(featureType === 'community' ? availableTeams : teams).length === 0 && !loadingTeams && formData.leagueId && (
                <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 0.5 }}>
                  {featureType === 'community' ? (formData.homeTeam ? 'Select home team first' : 'No featured fixtures') : 'No teams for this league'}
                </Typography>
              )}
            </Grid>
            {featureType === 'community' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                  label="Matchday *"
                  value={formData.matchday || ''}
                InputProps={{
                    readOnly: true,
                  }}
                  helperText="Automatically set from selected CMd"
                sx={{
                    borderRadius: '12px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                    '& .MuiInputBase-input': {
                      cursor: 'default',
                  },
                }}
              />
            </Grid>
            )}
            <Grid item xs={12} md={featureType === 'community' ? 6 : 12}>
              <Autocomplete
                fullWidth
                value={STADIUM_OPTIONS.find((o) => o.value === (formData.venue || 'other')) || STADIUM_OPTIONS[0]}
                onChange={(_, newVal) => handleChange('venue', newVal?.value ?? 'other')}
                options={STADIUM_OPTIONS}
                getOptionLabel={(o) => o ? o.label : ''}
                isOptionEqualToValue={(a, b) => a && b && a.value === b.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                  label="Match Ground / Stadium *"
                    placeholder="Search stadium..."
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                renderOption={(props, o) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {o.value === 'other' && <Send sx={{ fontSize: 18, color: colors.brandRed }} />}
                    {o.label}
                    </Box>
                )}
                slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1 } } }}
              />
            </Grid>
            {featureType !== 'cebee' && (
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={leagues}
                getOptionLabel={(opt) => (opt && opt.country ? `${opt.name} (${opt.country})` : (opt?.name || ''))}
                value={leagues.find((l) => String(l?.id) === String(formData.leagueId)) || null}
                onChange={(_, newValue) => handleChange('leagueId', newValue?.id ?? '')}
                isOptionEqualToValue={(opt, val) => opt && val && String(opt.id) === String(val.id)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                  label="League *"
                    placeholder="Search leagues..."
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                renderOption={(props, league) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Stadium sx={{ fontSize: 18, color: colors.brandRed }} />
                    {league.country ? `${league.name} (${league.country})` : league.name}
                  </Box>
                )}
              />
              {leaguesTotal > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: '10px', backgroundColor: '#F5F5F5' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                        {leagues.length.toLocaleString()} / {leaguesTotal.toLocaleString()} leagues
                      </Typography>
                      </Box>
                    {leaguesTotal > 0 && (
                      <Box sx={{ width: 80, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                        <Box
                          sx={{
                            width: `${Math.min(100, (leagues.length / leaguesTotal) * 100)}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  {leaguesPage < leaguesTotalPages && (
                    <Button
                      size="small"
                      variant="text"
                      endIcon={leaguesLoadingMore ? null : <ExpandMore />}
                      onClick={loadMoreLeagues}
                      disabled={leaguesLoadingMore}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: colors.brandRed,
                        '&:hover': { backgroundColor: `${colors.brandRed}0C` },
                      }}
                    >
                      {leaguesLoadingMore ? 'Loading…' : 'Load more leagues'}
                    </Button>
                  )}
                </Box>
              )}
            </Grid>
            )}
            </> )}
          </Grid>
        </Card>

        {/* Kickoff Schedule Section */}
        <Card sx={{ padding: 3, borderRadius: '16px', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarToday sx={{ fontSize: 20, color: colors.brandRed }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Schedule
            </Typography>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Publish Date & Time *
                </Typography>
                <Chip
                  label="Required"
                  size="small"
                  sx={{
                    backgroundColor: colors.warning,
                    color: colors.brandBlack,
                    fontWeight: 600,
                    height: 20,
                    fontSize: 10,
                  }}
                />
              </Box>
              <DateTimePicker
                value={formData.publishDateTime}
                onChange={(date) => handleChange('publishDateTime', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!dateError,
                    helperText: dateError || 'Fixture will be published at this time',
                    sx: {
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        border: dateError ? `2px solid ${colors.error || '#d32f2f'}` : `2px solid ${colors.brandRed}`,
                        '& fieldset': {
                          borderColor: dateError ? colors.error || '#d32f2f' : colors.brandRed,
                        },
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Kickoff Date & Time *
                </Typography>
                <Chip
                  label="Required"
                  size="small"
                  sx={{
                    backgroundColor: colors.warning,
                    color: colors.brandBlack,
                    fontWeight: 600,
                    height: 20,
                    fontSize: 10,
                  }}
                />
              </Box>
              <DateTimePicker
                value={formData.kickoffTime}
                onChange={(date) => handleChange('kickoffTime', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!dateError,
                    helperText: dateError || 'Match will start at this time',
                    sx: {
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        border: dateError ? `2px solid ${colors.error || '#d32f2f'}` : `2px solid ${colors.brandRed}`,
                        '& fieldset': {
                          borderColor: dateError ? colors.error || '#d32f2f' : colors.brandRed,
                        },
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(constants.routes.fixtures)}
            sx={{
              borderColor: colors.textSecondary,
              color: colors.textSecondary,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '12px',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {saving ? 'Creating...' : 'Create Fixture'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FixtureFormPage;
