import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { setDocuments, setLoading, setError } from '../store/slices/documentSlice';
import documentService from '../services/documentService';

const Documents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documents, loading, error } = useSelector((state) => state.documents);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentTitle, setDocumentTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [dispatch]);

  const fetchDocuments = async () => {
    try {
      dispatch(setLoading(true));
      const data = await documentService.getAllDocuments();
      dispatch(setDocuments(data));
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Set default title as file name without extension
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentTitle.trim()) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', documentTitle.trim());

    try {
      dispatch(setLoading(true));
      await documentService.uploadDocument(formData);
      await fetchDocuments();
      setUploadOpen(false);
      setSelectedFile(null);
      setDocumentTitle('');
      setUploadProgress(0);
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        dispatch(setLoading(true));
        await documentService.deleteDocument(id);
        await fetchDocuments();
      } catch (err) {
        dispatch(setError(err.message));
      }
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h2">
              Documents
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Document
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          label="Search Documents"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Upload Date</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => navigate(`/documents/${doc._id}`)}
                        title="View"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(doc._id)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Document Title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Select File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {selectedFile.name}
              </Typography>
            )}
            {uploadProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !documentTitle.trim() || loading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Documents;
