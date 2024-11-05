const pdfjsLib = require('pdfjs-dist');

const extractText = async (filePath) => {
    try {
        // Load the PDF file
        const data = new Uint8Array(require('fs').readFileSync(filePath));
        const loadingTask = pdfjsLib.getDocument(data);
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Get all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

module.exports = {
    extractText
};
