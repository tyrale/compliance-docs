const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<{text: string, pages: number}>} Extracted text and page count
 */
const extractTextFromPDF = async (filePath) => {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF and extract text
    const data = await pdfParse(dataBuffer, {
      // Ensure we get both text content and metadata
      pagerender: function(pageData) {
        return pageData.getTextContent();
      }
    });

    if (!data || !data.text) {
      throw new Error('Failed to extract text from PDF');
    }

    return {
      text: data.text.trim(),
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Validate extracted text content
 * @param {string} text - Extracted text content
 * @returns {boolean} Whether the text is valid
 */
const validateExtractedText = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  // Ensure text isn't just whitespace
  if (text.trim().length === 0) {
    return false;
  }
  return true;
};

module.exports = {
  extractTextFromPDF,
  validateExtractedText
};
