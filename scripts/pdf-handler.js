/**
 * PDF to Audio Converter - PDF Handler
 * Handles PDF text extraction using pdf.js
 */

const PDFHandler = {
    pdfDoc: null,
    currentFile: null,
    extractedText: '',
    pages: [],
    totalPages: 0,
    
    /**
     * Initialize PDF.js worker
     */
    init() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
        }
    },
    
    /**
     * Check if PDF.js is available
     * @returns {boolean} Availability status
     */
    isAvailable() {
        return typeof pdfjsLib !== 'undefined';
    },
    
    /**
     * Load PDF file
     * @param {File} file - PDF file to load
     * @returns {Promise<Object>} PDF data
     */
    async loadPDF(file) {
        if (!this.isAvailable()) {
            throw new Error('PDF.js library not loaded');
        }
        
        this.currentFile = file;
        const arrayBuffer = await file.arrayBuffer();
        
        this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        this.totalPages = this.pdfDoc.numPages;
        
        return {
            name: file.name,
            size: file.size,
            pages: this.totalPages
        };
    },
    
    /**
     * Extract all text from PDF
     * @param {Object} options - Extraction options
     * @returns {Promise<string>} Extracted text
     */
    async extractText(options = {}) {
        if (!this.pdfDoc) {
            throw new Error('No PDF loaded');
        }
        
        const {
            startPage = 1,
            endPage = this.totalPages,
            progressCallback = null
        } = options;
        
        this.extractedText = '';
        this.pages = [];
        
        const pagePromises = [];
        for (let i = startPage; i <= endPage; i++) {
            pagePromises.push(this.extractPageText(i));
        }
        
        const pageTexts = await Promise.all(pagePromises);
        
        for (let i = 0; i < pageTexts.length; i++) {
            const pageNum = startPage + i;
            const text = pageTexts[i];
            this.pages.push({
                page: pageNum,
                text: text,
                sentences: this.splitIntoSentences(text)
            });
            this.extractedText += text + '\n\n';
            
            if (progressCallback) {
                progressCallback((i + 1) / pageTexts.length);
            }
        }
        
        return this.extractedText;
    },
    
    /**
     * Extract text from a single page
     * @param {number} pageNum - Page number
     * @returns {Promise<string>} Page text
     */
    async extractPageText(pageNum) {
        const page = await this.pdfDoc.getPage(pageNum);
        const content = await page.getTextContent();
        
        // Group items by lines
        const lines = [];
        let currentLine = [];
        let lastY = null;
        
        for (const item of content.items) {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                if (currentLine.length > 0) {
                    lines.push(currentLine.map(i => i.str).join(' '));
                }
                currentLine = [];
            }
            currentLine.push(item);
            lastY = item.transform[5];
        }
        
        if (currentLine.length > 0) {
            lines.push(currentLine.map(i => i.str).join(' '));
        }
        
        return lines.join('\n');
    },
    
    /**
     * Split text into sentences
     * @param {string} text - Text to split
     * @returns {Array} Array of sentences
     */
    splitIntoSentences(text) {
        // Split by common sentence endings
        const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
    },
    
    /**
     * Get text for a specific range
     * @param {number} start - Start position
     * @param {number} end - End position
     * @returns {string} Text in range
     */
    getTextInRange(start, end) {
        return this.extractedText.slice(start, end);
    },
    
    /**
     * Find sentence at position
     * @param {number} position - Character position
     * @returns {Object} Sentence info
     */
    findSentenceAtPosition(position) {
        const text = this.extractedText.slice(0, position);
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const sentenceStart = text.lastIndexOf(sentences[sentences.length - 1] || '');
        
        return {
            start: sentenceStart,
            end: position + (this.extractedText[position] === ' ' ? 1 : 0) + 
                 (this.extractedText.slice(position).match(/^[^.!?]+[.!?]/) || [''])[0].length
        };
    },
    
    /**
     * Get progress for a character position
     * @param {number} position - Character position
     * @returns {number} Progress percentage
     */
    getProgressAtPosition(position) {
        if (this.extractedText.length === 0) return 0;
        return (position / this.extractedText.length) * 100;
    },
    
    /**
     * Get position for progress percentage
     * @param {number} progress - Progress percentage
     * @returns {number} Character position
     */
    getPositionAtProgress(progress) {
        return Math.floor((progress / 100) * this.extractedText.length);
    },
    
    /**
     * Clean extracted text
     * @param {string} text - Raw text
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // Multiple spaces to single
            .replace(/\n\s*\n/g, '\n\n')  // Multiple newlines
            .replace(/\[.*?\]/g, '')  // Remove bracketed content
            .replace(/\(.*?\)/g, '')  // Remove parenthetical content
            .trim();
    },
    
    /**
     * Get document metadata
     * @returns {Promise<Object>} Metadata
     */
    async getMetadata() {
        if (!this.pdfDoc) return null;
        
        const metadata = await this.pdfDoc.getMetadata();
        return {
            title: metadata.info?.Title || this.currentFile?.name,
            author: metadata.info?.Author,
            creator: metadata.info?.Creator,
            producer: metadata.info?.Producer,
            creationDate: metadata.info?.CreationDate,
            modificationDate: metadata.info?.ModDate,
            pageCount: this.totalPages
        };
    },
    
    /**
     * Load file from library
     * @param {Object} fileData - File data from library
     */
    async loadFromLibrary(fileData) {
        this.currentFile = {
            name: fileData.name,
            size: fileData.size,
            type: 'application/pdf'
        };
        this.extractedText = fileData.text;
        this.pages = [];
        
        // Reconstruct pages from text
        const pageTexts = fileData.text.split(/\n\n+/);
        let charIndex = 0;
        pageTexts.forEach((text, i) => {
            this.pages.push({
                page: i + 1,
                text: text.trim(),
                sentences: this.splitIntoSentences(text.trim())
            });
            charIndex += text.length + 2;
        });
        
        this.totalPages = this.pages.length;
        
        // Show player
        Modal.show('player');
        TTSManager.loadText(this.extractedText);
        
        // Restore progress
        if (fileData.progress > 0) {
            const position = this.getPositionAtProgress(fileData.progress);
            TTSManager.setPosition(position);
        }
        
        // Update UI
        document.getElementById('doc-title').textContent = fileData.name;
        this.updateTextDisplay(0, 200);
    },
    
    /**
     * Update text display with highlighted current sentence
     * @param {number} start - Start position
     * @param {number} length - Length to display
     */
    updateTextDisplay(start, length = 200) {
        const textDisplay = document.getElementById('text-display');
        const text = this.extractedText.slice(start, start + length);
        
        textDisplay.innerHTML = `<p>${Utils.escapeHtml(text)}${this.extractedText.length > start + length ? '...' : ''}</p>`;
    },
    
    /**
     * Clear current PDF
     */
    clear() {
        this.pdfDoc = null;
        this.currentFile = null;
        this.extractedText = '';
        this.pages = [];
        this.totalPages = 0;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFHandler;
}
