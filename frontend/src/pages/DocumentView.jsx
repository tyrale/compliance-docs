import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Paper, Box, CircularProgress, Typography } from '@mui/material';
import { getDocument } from '../services/api';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/documents/${id}` } });
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await getDocument(id);
        if (!response.data) {
          throw new Error('Document not found');
        }
        setDocument(response.data);
      } catch (error) {
        console.error('Error fetching document:', error);
        if (error.response?.status === 401) {
          navigate('/login', { state: { from: `/documents/${id}` } });
          return;
        }
        setError(error.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>No document found</Typography>
      </Box>
    );
  }

  // Get the API URL and token
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  
  // Construct the document viewing URL
  const viewerUrl = `${baseUrl}${document.fileUrl}?token=${token}`;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: '80vh', overflow: 'auto' }}>
              <object
                data={viewerUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <embed
                  src={viewerUrl}
                  type="application/pdf"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </object>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DocumentView;
