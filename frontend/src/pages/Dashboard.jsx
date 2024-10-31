import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Description,
  Search,
  History,
  Add as AddIcon,
  Visibility,
} from '@mui/icons-material';
import { setDocuments } from '../store/slices/documentSlice';
import documentService from '../services/documentService';
import searchService from '../services/searchService';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { documents, loading: documentsLoading } = useSelector(
    (state) => state.documents
  );
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [documentsData, searchHistoryData] = await Promise.all([
          documentService.getAllDocuments(),
          searchService.getSearchHistory(),
        ]);

        dispatch(setDocuments(documentsData));
        setSearchHistory(searchHistoryData.slice(0, 5)); // Show only last 5 searches
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Welcome to Compliance Docs
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and search through your compliance documents efficiently
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/documents"
              sx={{ height: 'fit-content' }}
            >
              Upload Document
            </Button>
          </Paper>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Documents
            </Typography>
            {documentsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {documents.slice(0, 5).map((doc) => (
                  <ListItem
                    key={doc._id}
                    button
                    component={Link}
                    to={`/documents/${doc._id}`}
                  >
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.title}
                      secondary={new Date(doc.updatedAt).toLocaleDateString()}
                    />
                    <ListItemIcon>
                      <Visibility />
                    </ListItemIcon>
                  </ListItem>
                ))}
                {documents.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No documents found
                  </Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Searches */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Searches
            </Typography>
            <List>
              {searchHistory.map((search, index) => (
                <ListItem
                  key={search._id || index}
                  button
                  component={Link}
                  to={`/search?q=${encodeURIComponent(search.query)}`}
                >
                  <ListItemIcon>
                    <Search />
                  </ListItemIcon>
                  <ListItemText
                    primary={search.query}
                    secondary={new Date(search.timestamp).toLocaleDateString()}
                  />
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                </ListItem>
              ))}
              {searchHistory.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No recent searches
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/documents"
                  sx={{ p: 2 }}
                >
                  Upload Document
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Search />}
                  component={Link}
                  to="/search"
                  sx={{ p: 2 }}
                >
                  Search Documents
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
