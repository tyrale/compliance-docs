import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import { Container, Grid, Paper, Box } from '@mui/material';
import documentService from '../services/documentService';
import '../utils/pdfConfig'; // Import PDF configuration

const DocumentView = () => {
  const { id } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await documentService.getDocument(id);
        setDocument(response.data);
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Construct the full URL for the PDF file
  const getPdfUrl = (fileUrl) => {
    if (!fileUrl) return null;
    // If it's already a full URL, return as is
    if (fileUrl.startsWith('http')) return fileUrl;
    // Otherwise, construct the full URL using the backend URL
    return `http://localhost:5001${fileUrl}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: '80vh', overflow: 'auto' }}>
              {document && (
                <Document
                  file={getPdfUrl(document.fileUrl)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Loading PDF..."
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  ))}
                </Document>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DocumentView;
