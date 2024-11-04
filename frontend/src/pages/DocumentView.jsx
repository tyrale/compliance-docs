import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import HistoryIcon from '@mui/icons-material/History';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CompareIcon from '@mui/icons-material/Compare';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  setCurrentDocument,
  setVersions,
  setAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from '../store/slices/documentSlice';
import documentService from '../services/documentService';
import api from '../services/api';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDocument, versions, annotations, loading, error } = useSelector(
    (state) => state.documents
  );

  const [activeTab, setActiveTab] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [annotationDialog, setAnnotationDialog] = useState({
    open: false,
    text: '',
    page: 1,
    position: null,
  });

  useEffect(() => {
    fetchDocumentData();
  }, [id, dispatch]);

  const fetchDocumentData = async () => {
    try {
      const [documentData, versionsData, annotationsData] = await Promise.all([
        documentService.getDocument(id),
        documentService.getVersions(id),
        documentService.getAnnotations(id),
      ]);

      dispatch(setCurrentDocument(documentData));
      dispatch(setVersions(versionsData));
      dispatch(setAnnotations(annotationsData));
    } catch (err) {
      console.error('Error fetching document data:', err);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  const handleZoom = (delta) => {
    setScale((prevScale) => Math.max(0.5, Math.min(2.0, prevScale + delta)));
  };

  const handleAnnotationClick = (event) => {
    if (!annotationMode) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    setAnnotationDialog({
      open: true,
      text: '',
      page: pageNumber,
      position: {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
    });
  };

  const handleSaveAnnotation = async () => {
    try {
      const annotationData = {
        documentId: id,
        page: annotationDialog.page,
        position: annotationDialog.position,
        text: annotationDialog.text,
      };

      const newAnnotation = await documentService.createAnnotation(
        id,
        annotationData
      );
      dispatch(addAnnotation(newAnnotation));
      setAnnotationDialog({ ...annotationDialog, open: false });
    } catch (err) {
      console.error('Error saving annotation:', err);
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    try {
      await documentService.deleteAnnotation(id, annotationId);
      dispatch(deleteAnnotation(annotationId));
    } catch (err) {
      console.error('Error deleting annotation:', err);
    }
  };

  const handleVersionChange = async (versionId) => {
    try {
      const versionData = await documentService.getVersion(id, versionId);
      setSelectedVersion(versionData);
    } catch (err) {
      console.error('Error changing version:', err);
    }
  };

  const handleCompareVersions = async (version1Id, version2Id) => {
    try {
      const comparisonData = await documentService.compareVersions(
        id,
        version1Id,
        version2Id
      );
      setCompareMode(true);
      // Handle comparison display
    } catch (err) {
      console.error('Error comparing versions:', err);
    }
  };

  // Construct the PDF URL using the current version
  const getPdfUrl = () => {
    if (!currentDocument || !currentDocument.currentVersion) return null;
    return `${api.defaults.baseURL}/documents/${id}/versions/${currentDocument.currentVersion._id}/file`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!currentDocument) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 2 }}>
          Document not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5">{currentDocument.title}</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setActiveTab(1)}
              sx={{ mr: 1 }}
              color="primary"
            >
              Versions
            </Button>
            <Button
              variant="outlined"
              startIcon={<CommentIcon />}
              onClick={() => setAnnotationMode(!annotationMode)}
              color={annotationMode ? 'primary' : 'inherit'}
            >
              {annotationMode ? 'Exit Annotation' : 'Add Annotation'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Button 
                onClick={() => handleZoom(-0.1)}
                variant="outlined"
                color="primary"
              >
                Zoom Out
              </Button>
              <Button 
                onClick={() => handleZoom(0.1)}
                variant="outlined"
                color="primary"
                sx={{ ml: 1 }}
              >
                Zoom In
              </Button>
              <Typography component="span" sx={{ mx: 2 }}>
                Page {pageNumber} of {numPages}
              </Typography>
              <Button
                disabled={pageNumber <= 1}
                onClick={() => handlePageChange(pageNumber - 1)}
                variant="outlined"
                color="primary"
              >
                Previous
              </Button>
              <Button
                disabled={pageNumber >= numPages}
                onClick={() => handlePageChange(pageNumber + 1)}
                variant="outlined"
                color="primary"
                sx={{ ml: 1 }}
              >
                Next
              </Button>
            </Box>
            <Box
              sx={{
                border: '1px solid #ccc',
                minHeight: '500px',
                display: 'flex',
                justifyContent: 'center',
              }}
              onClick={handleAnnotationClick}
            >
              <Document
                file={getPdfUrl()}
                onLoadSuccess={handleDocumentLoadSuccess}
                loading={<CircularProgress />}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                />
              </Document>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Annotations" />
              <Tab label="Versions" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && (
                <List>
                  {annotations.map((annotation) => (
                    <ListItem key={annotation._id}>
                      <ListItemText
                        primary={annotation.text}
                        secondary={`Page ${annotation.page}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteAnnotation(annotation._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {activeTab === 1 && (
                <List>
                  {versions.map((version) => (
                    <ListItem key={version._id}>
                      <ListItemText
                        primary={`Version ${version.version}`}
                        secondary={new Date(
                          version.createdAt
                        ).toLocaleDateString()}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleVersionChange(version._id)}
                          color="primary"
                        >
                          <CompareIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Annotation Dialog */}
      <Dialog
        open={annotationDialog.open}
        onClose={() => setAnnotationDialog({ ...annotationDialog, open: false })}
      >
        <DialogTitle>Add Annotation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Annotation Text"
            fullWidth
            multiline
            rows={4}
            value={annotationDialog.text}
            onChange={(e) =>
              setAnnotationDialog({ ...annotationDialog, text: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setAnnotationDialog({ ...annotationDialog, open: false })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleSaveAnnotation} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentView;
