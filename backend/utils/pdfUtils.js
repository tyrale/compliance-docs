const pdfjsLib = require('pdfjs-dist');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const path = require('path');

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js');

// Extract text content from PDF
const extractPdfContent = async (filePath) => {
  try {
    const data = new Uint8Array(await require('fs').promises.readFile(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      fullText += `[Page ${i}]\n${text}\n\n`;
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw error;
  }
};

// Detect section headings using heuristics
const detectSectionHeadings = (text) => {
  const lines = text.split('\n');
  const headings = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      // Heading patterns
      /^[A-Z][^.!?]*$/.test(line) || // All caps or first letter cap without ending punctuation
      /^[\d.]+\s+[A-Z][^.!?]*$/.test(line) || // Numbered sections
      /^(Section|Article|Chapter)\s+[\d.]+/.test(line) // Explicit section markers
    ) {
      headings.push({ line, lineNumber: i });
    }
  }
  
  return headings;
};

// Generate section summary using text ranking
const generateSectionSummary = (text) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return '';

  // Tokenize sentences and calculate term frequency
  const tokenizedSentences = sentences.map(sentence => tokenizer.tokenize(sentence.toLowerCase()));
  const termFrequency = {};
  
  tokenizedSentences.forEach(tokens => {
    tokens.forEach(token => {
      termFrequency[token] = (termFrequency[token] || 0) + 1;
    });
  });

  // Score sentences based on term frequency
  const sentenceScores = sentences.map((sentence, index) => {
    const tokens = tokenizedSentences[index];
    const score = tokens.reduce((sum, token) => sum + (termFrequency[token] || 0), 0);
    return { sentence, score };
  });

  // Select top sentences for summary
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);

  return topSentences.join(' ');
};

// Extract sections from PDF content
const extractSections = async (filePath) => {
  const content = await extractPdfContent(filePath);
  const headings = detectSectionHeadings(content);
  const sections = [];
  
  for (let i = 0; i < headings.length; i++) {
    const currentHeading = headings[i];
    const nextHeading = headings[i + 1];
    const startLine = currentHeading.lineNumber;
    const endLine = nextHeading ? nextHeading.lineNumber : content.split('\n').length;
    
    const sectionContent = content
      .split('\n')
      .slice(startLine, endLine)
      .join('\n')
      .trim();
    
    sections.push({
      title: currentHeading.line,
      content: sectionContent,
      summary: generateSectionSummary(sectionContent),
      pageNumber: parseInt(sectionContent.match(/\[Page (\d+)\]/)?.[1] || '1'),
      metadata: {
        level: currentHeading.line.match(/^[\d.]+/)?.[0]?.split('.').length || 1,
      },
    });
  }
  
  return sections;
};

module.exports = {
  extractPdfContent,
  extractSections,
  generateSectionSummary,
};
