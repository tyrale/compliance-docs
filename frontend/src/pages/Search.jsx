import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore,
  Description,
  History as HistoryIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  setSearchResults,
  addToSearchHistory,
  setFilters,
  setCurrentPage,
} from '../store/slices/searchSlice';
import searchService from '../services/searchService';

const Search = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, loading, error, filters, currentPage, totalPages } =
    useSelector((state) => state.search);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: null,
    dateTo: null,
    documentType: '',
    section: '',
  });
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
    loadSavedSearches();
  }, [searchParams]);

  const loadSavedSearches = async () => {
    try {
      const searches = await searchService.getSavedSearches();
      setSavedSearches(searches);
    } catch (err) {
      console.error('Error loading saved searches:', err);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    try {
      const searchParams = {
        query,
        page: currentPage,
        ...advancedFilters,
      };

      const results = await searchService.search(searchParams);
      dispatch(setSearchResults(results));
      dispatch(addToSearchHistory({ query, timestamp: new Date() }));
      
      // Update URL with search query
      setSearchParams({ q: query });
    } catch (err) {
      console.error('Error performing search:', err);
    }
  };

  const handleAdvancedSearch = async () => {
    try {
      const searchParams = {
        query: searchQuery,
        filters: advancedFilters,
        page: currentPage,
      };

      const results = await searchService.advancedSearch(searchParams);
      dispatch(setSearchResults(results));
      dispatch(setFilters(advancedFilters));
    } catch (err) {
      console.error('Error performing advanced search:', err);
    }
  };

  const handleSaveSearch = async () => {
    try {
      const searchData = {
        query: searchQuery,
        filters: advancedFilters,
      };
      await searchService.saveSearch(searchData);
      await loadSavedSearches();
    } catch (err) {
      console.error('Error saving search:', err);
    }
  };

  const handleDeleteSavedSearch = async (searchId) => {
    try {
      await searchService.deleteSavedSearch(searchId);
      await loadSavedSearches();
    } catch (err) {
      console.error('Error deleting saved search:', err);
    }
  };

  const handlePageChange = (event, value) => {
    dispatch(setCurrentPage(value));
    handleSearch();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <TextField
                fullWidth
                label="Search Documents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => handleSearch()}
                disabled={loading}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveSearch}
                disabled={!searchQuery.trim()}
              >
                Save
              </Button>
            </Box>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Advanced Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="From Date"
                        value={advancedFilters.dateFrom}
                        onChange={(date) =>
                          setAdvancedFilters({
                            ...advancedFilters,
                            dateFrom: date,
                          })
                        }
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="To Date"
                        value={advancedFilters.dateTo}
                        onChange={(date) =>
                          setAdvancedFilters({
                            ...advancedFilters,
                            dateTo: date,
                          })
                        }
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        value={advancedFilters.documentType}
                        onChange={(e) =>
                          setAdvancedFilters({
                            ...advancedFilters,
                            documentType: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="policy">Policy</MenuItem>
                        <MenuItem value="procedure">Procedure</MenuItem>
                        <MenuItem value="regulation">Regulation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Section</InputLabel>
                      <Select
                        value={advancedFilters.section}
                        onChange={(e) =>
                          setAdvancedFilters({
                            ...advancedFilters,
                            section: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="introduction">Introduction</MenuItem>
                        <MenuItem value="requirements">Requirements</MenuItem>
                        <MenuItem value="procedures">Procedures</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleAdvancedSearch}
                      disabled={loading}
                    >
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* Active Filters */}
        {Object.values(filters).some(Boolean) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(filters).map(
                  ([key, value]) =>
                    value && (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        onDelete={() =>
                          dispatch(
                            setFilters({ ...filters, [key]: null })
                          )
                        }
                      />
                    )
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Search Results */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Search Results
                </Typography>
                <List>
                  {searchResults.map((result) => (
                    <ListItem
                      key={result._id}
                      button
                      onClick={() => navigate(`/documents/${result._id}`)}
                    >
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={result.title}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {result.documentType}
                            </Typography>
                            {` — ${result.excerpt}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                {searchResults.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Saved Searches */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Saved Searches
            </Typography>
            <List>
              {savedSearches.map((search) => (
                <ListItem
                  key={search._id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteSavedSearch(search._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={search.query}
                    secondary={new Date(search.createdAt).toLocaleDateString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Search;
