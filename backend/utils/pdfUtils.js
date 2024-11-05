const fs = require('fs');
const pdf = require('pdf-parse');

const extractText = async (filePath) => {
    try {
        // Read the PDF file
        const dataBuffer = fs.readFileSync(filePath);
        
        // Parse the PDF
        const data = await pdf(dataBuffer);
        
        // Return the text content
        return data.text.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

module.exports = {
    extractText
};
