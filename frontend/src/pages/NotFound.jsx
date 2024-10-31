import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
          >
            Back to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
