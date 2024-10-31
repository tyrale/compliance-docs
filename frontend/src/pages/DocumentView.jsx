import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  History as HistoryIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
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
            >
              Versions
            </Button>
            <Button
              variant="outlined"
              startIcon={<CommentIcon />}
              onClick={() => setAnnotationMode(!annotationMode)}
              color={annotationMode ? 'primary' : 'default'}
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
              <Button onClick={() => handleZoom(-0.1)}>Zoom Out</Button>
              <Button onClick={() => handleZoom(0.1)}>Zoom In</Button>
              <Typography component="span" sx={{ mx: 2 }}>
                Page {pageNumber} of {numPages}
              </Typography>
              <Button
                disabled={pageNumber <= 1}
                onClick={() => handlePageChange(pageNumber - 1)}
              >
                Previous
              </Button>
              <Button
                disabled={pageNumber >= numPages}
                onClick={() => handlePageChange(pageNumber + 1)}
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
                file={currentDocument.url}
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
          <Button onClick={handleSaveAnnotation} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentView;
