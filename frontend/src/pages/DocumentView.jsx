import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { getDocument, deleteDocument } from '../services/api';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocument(id);
      setDocument(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError(null);
      await deleteDocument(id);
      navigate('/documents', { 
        state: { 
          notification: {
            type: 'success',
            message: 'Document deleted successfully'
          }
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to delete document');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box m={2}>
        <Typography variant="h6">Document not found</Typography>
      </Box>
    );
  }

  return (
    <Box m={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{document.title}</Typography>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </Box>

      <Typography variant="body1" paragraph>
        {document.description}
      </Typography>

      {/* Add additional document content rendering here */}
    </Box>
  );
};

export default DocumentView;
