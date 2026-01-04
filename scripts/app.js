/**
 * PDF to Audio Converter - Main Application
 */

// Toast Notification System
const Toast = {
    container: null,
    
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<svg class="toast-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg class="toast-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 6v5M10 12.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            warning: '<svg class="toast-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2.5l7.5 13.5H2.5L10 2.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v4M10 14v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            info: '<svg class="toast-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 9v5M10 6v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
        
        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });
        
        this.container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);
        
        return toast;
    },
    
    remove(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    success(message) {
        return this.show(message, 'success');
    },
    
    error(message) {
        return this.show(message, 'error');
    },
    
    warning(message) {
        return this.show(message, 'warning');
    },
    
    info(message) {
        return this.show(message, 'info');
    }
};

// Modal System
const Modal = {
    activeModal: null,
    
    show(modalId) {
        const modal = document.getElementById(`${modalId}-modal`);
        if (modal) {
            modal.classList.add('active');
            this.activeModal = modalId;
            document.body.style.overflow = 'hidden';
        }
    },
    
    hide(modalId) {
        const modal = document.getElementById(`${modalId}-modal`);
        if (modal) {
            modal.classList.remove('active');
            this.activeModal = null;
            document.body.style.overflow = '';
        }
    },
    
    hideAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.activeModal = null;
        document.body.style.overflow = '';
    },
    
    init() {
        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.hideAll();
            });
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAll();
            }
        });
        
        // Setup modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAll();
            });
        });
    }
};

// Main Application
const App = {
    /**
     * Initialize the application
     */
    init() {
        console.log('PDF to Audio Converter initializing...');
        
        // Initialize systems
        Modal.init();
        Toast.init();
        PremiumManager.init();
        LibraryManager.init();
        PDFHandler.init();
        TTSManager.init();
        
        // Setup event listeners
        this.setupUpload();
        this.setupPlayer();
        this.setupLogin();
        
        // Check capabilities
        this.checkCapabilities();
        
        console.log('PDF to Audio Converter ready!');
    },
    
    /**
     * Setup file upload functionality
     */
    setupUpload() {
        const uploadBtn = document.getElementById('upload-btn');
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const demoBtn = document.getElementById('demo-btn');
        
        // Click to upload
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => fileInput.click());
        }
        
        if (uploadZone) {
            // Click zone to upload
            uploadZone.addEventListener('click', (e) => {
                if (e.target !== uploadZone) return;
                fileInput.click();
            });
            
            // Drag and drop
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
            
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                const file = Utils.getDroppedFile(e);
                if (file && Utils.isPDFFile(file)) {
                    this.processFile(file);
                } else {
                    Toast.show('Please drop a PDF file', 'error');
                }
            });
        }
        
        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.processFile(file);
                }
            });
        }
        
        // Demo button
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                this.loadDemoPDF();
            });
        }
    },
    
    /**
     * Process uploaded PDF file
     * @param {File} file - PDF file
     */
    async processFile(file) {
        if (!Utils.isPDFFile(file)) {
            Toast.show('Please select a PDF file', 'error');
            return;
        }
        
        // Check library limit
        const canAdd = LibraryManager.canAddFile();
        if (!canAdd.canAdd && !PremiumManager.isPremium()) {
            Toast.show(`Free tier limited to ${canAdd.maxItems} files. Upgrade for unlimited!`, 'warning');
            return;
        }
        
        try {
            Toast.show('Processing PDF...', 'info');
            
            // Load PDF
            const pdfData = await PDFHandler.loadPDF(file);
            Toast.show(`Extracting text from ${pdfData.pages} pages...`, 'info');
            
            // Extract text with progress
            const text = await PDFHandler.extractText({
                progressCallback: (progress) => {
                    // Could show progress bar here
                }
            });
            
            // Clean text
            const cleanedText = PDFHandler.cleanText(text);
            
            // Add to library if within limits
            if (canAdd.canAdd || PremiumManager.isPremium()) {
                const fileData = LibraryManager.createFileData(file, cleanedText);
                LibraryManager.addFile(fileData);
            }
            
            // Update UI
            document.getElementById('doc-title').textContent = file.name;
            document.getElementById('doc-status').textContent = `${pdfData.pages} pages loaded`;
            
            // Load text into TTS
            TTSManager.loadText(cleanedText);
            
            // Update text display
            PDFHandler.updateTextDisplay(0);
            
            // Show player
            Modal.show('player');
            
            Toast.show(`PDF loaded! ${pdfData.pages} pages ready.`, 'success');
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            Toast.show('Error processing PDF. Please try again.', 'error');
        }
    },
    
    /**
     * Load demo PDF content
     */
    loadDemoPDF() {
        const demoText = `
            Welcome to PDF to Audio Converter!
            
            This is a demonstration of how the text-to-speech functionality works.
            You can convert any PDF document into an audio experience.
            
            Features included:
            - Instant PDF text extraction
            - Natural-sounding voice synthesis
            - Adjustable playback speed
            - Bookmark your favorite sections
            - Download your audio files
            
            Simply upload a PDF file to get started.
            The system will extract the text and make it ready for audio playback.
            
            Students can use this to listen to textbooks and research papers.
            Professionals can convert reports into audio for commuting.
            Anyone can transform written content into an accessible audio format.
            
            Thank you for using PDF to Audio Converter!
        `;
        
        PDFHandler.extractedText = demoText;
        PDFHandler.pages = [{ page: 1, text: demoText, sentences: [] }];
        PDFHandler.totalPages = 1;
        
        TTSManager.loadText(demoText);
        
        document.getElementById('doc-title').textContent = 'Demo Document';
        document.getElementById('doc-status').textContent = 'Demo mode';
        
        PDFHandler.updateTextDisplay(0);
        Modal.show('player');
        
        Toast.show('Demo loaded! Click play to hear it.', 'success');
    },
    
    /**
     * Setup player controls
     */
    setupPlayer() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const rewindBtn = document.getElementById('rewind-btn');
        const forwardBtn = document.getElementById('forward-btn');
        const progressBar = document.getElementById('progress-bar');
        const speedSelect = document.getElementById('speed-select');
        const closePlayer = document.getElementById('close-player');
        const downloadBtn = document.getElementById('download-btn');
        const bookmarkBtn = document.getElementById('bookmark-btn');
        
        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                TTSManager.togglePlayPause();
            });
        }
        
        // Rewind 10 seconds
        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => {
                TTSManager.seek(-10);
            });
        }
        
        // Forward 10 seconds
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => {
                TTSManager.seek(10);
            });
        }
        
        // Progress bar
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                const progress = parseFloat(e.target.value);
                const position = PDFHandler.getPositionAtProgress(progress);
                TTSManager.setPosition(position);
            });
            
            progressBar.addEventListener('change', (e) => {
                // Resume playback when user releases slider
                if (PDFHandler.extractedText) {
                    TTSManager.speak(PDFHandler.extractedText.slice(TTSManager.currentPosition));
                }
            });
        }
        
        // Speed control
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                const rate = parseFloat(e.target.value);
                TTSManager.setPlaybackRate(rate);
            });
        }
        
        // Close player
        if (closePlayer) {
            closePlayer.addEventListener('click', () => {
                TTSManager.stop();
                Modal.hide('player');
            });
        }
        
        // Download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                TTSManager.exportAsAudio();
            });
        }
        
        // Bookmark button
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                const id = LibraryManager.getLibrary()[0]?.id;
                if (id) {
                    LibraryManager.addBookmark(id, {
                        position: TTSManager.currentPosition,
                        text: PDFHandler.extractedText.slice(TTSManager.currentPosition, TTSManager.currentPosition + 100)
                    });
                    Toast.show('Bookmark added!', 'success');
                }
            });
        }
    },
    
    /**
     * Setup login functionality
     */
    setupLogin() {
        const loginForm = document.getElementById('login-form');
        const closeLogin = document.getElementById('close-login');
        const loginModal = document.getElementById('login-modal');
        const loginBtn = document.getElementById('login-btn');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                try {
                    Toast.show('Signing in...', 'info');
                    const result = await PremiumManager.login(email);
                    
                    if (result.success) {
                        Modal.hide('login');
                        Toast.show(`Welcome back, ${result.email}!`, 'success');
                        loginBtn.textContent = result.email.split('@')[0];
                    }
                } catch (error) {
                    Toast.show('Login failed. Please try again.', 'error');
                }
            });
        }
        
        if (closeLogin) {
            closeLogin.addEventListener('click', () => {
                Modal.hide('login');
            });
        }
    },
    
    /**
     * Check browser capabilities
     */
    checkCapabilities() {
        const ttsSupported = TTSManager.isSupported();
        const pdfSupported = PDFHandler.isAvailable();
        
        if (!ttsSupported) {
            Toast.show('Text-to-speech is not supported in your browser. Try Chrome or Safari.', 'warning');
        }
        
        if (!pdfSupported) {
            Toast.show('PDF.js library not loaded. Some features may be limited.', 'warning');
        }
        
        console.log('Capabilities:', {
            tts: ttsSupported,
            pdf: pdfSupported
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, Toast, Modal };
}
