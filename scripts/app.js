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
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });
        
        this.container.appendChild(toast);
        
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
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.hideAll();
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAll();
            }
        });
        
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAll();
            });
        });
    }
};

// Main Application
const App = {
    init() {
        console.log('PDF to Audio Converter initializing...');
        
        Modal.init();
        Toast.init();
        AuthManager.init();
        PremiumManager.init();
        LibraryManager.init();
        PDFHandler.init();
        TTSManager.init();
        
        this.setupUpload();
        this.setupPlayer();
        this.setupAuth();
        
        this.checkCapabilities();
        
        console.log('PDF to Audio Converter ready!');
    },
    
    setupUpload() {
        const uploadBtn = document.getElementById('upload-btn');
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const demoBtn = document.getElementById('demo-btn');
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => fileInput.click());
        }
        
        if (uploadZone) {
            uploadZone.addEventListener('click', (e) => {
                if (e.target !== uploadZone) return;
                fileInput.click();
            });
            
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
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.processFile(file);
                }
            });
        }
        
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                this.loadDemoPDF();
            });
        }
    },
    
    async processFile(file) {
        if (!Utils.isPDFFile(file)) {
            Toast.show('Please select a PDF file', 'error');
            return;
        }
        
        const canAdd = LibraryManager.canAddFile();
        if (!canAdd.canAdd && !AuthManager.isLoggedIn()) {
            Modal.show('login');
            Toast.show('Please log in to save files', 'warning');
            return;
        }
        
        if (!canAdd.canAdd && !PremiumManager.isPremium()) {
            Toast.show(`Free tier limited to ${canAdd.maxItems} files. Upgrade for unlimited!`, 'warning');
            return;
        }
        
        try {
            Toast.show('Processing PDF...', 'info');
            
            const pdfData = await PDFHandler.loadPDF(file);
            Toast.show(`Extracting text from ${pdfData.pages} pages...`, 'info');
            
            const text = await PDFHandler.extractText({});
            const cleanedText = PDFHandler.cleanText(text);
            
            if (canAdd.canAdd || PremiumManager.isPremium()) {
                const fileData = LibraryManager.createFileData(file, cleanedText);
                LibraryManager.addFile(fileData);
            }
            
            document.getElementById('doc-title').textContent = file.name;
            document.getElementById('doc-status').textContent = `${pdfData.pages} pages loaded`;
            
            TTSManager.loadText(cleanedText);
            PDFHandler.updateTextDisplay(0);
            
            Modal.show('player');
            
            Toast.show(`PDF loaded! ${pdfData.pages} pages ready.`, 'success');
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            Toast.show('Error processing PDF. Please try again.', 'error');
        }
    },
    
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
            Students can use this to listen to textbooks.
            Professionals can convert reports for commuting.
            
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
    
    setupPlayer() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const rewindBtn = document.getElementById('rewind-btn');
        const forwardBtn = document.getElementById('forward-btn');
        const progressBar = document.getElementById('progress-bar');
        const speedSelect = document.getElementById('speed-select');
        const closePlayer = document.getElementById('close-player');
        const downloadBtn = document.getElementById('download-btn');
        const bookmarkBtn = document.getElementById('bookmark-btn');
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                TTSManager.togglePlayPause();
            });
        }
        
        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => {
                TTSManager.seek(-10);
            });
        }
        
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => {
                TTSManager.seek(10);
            });
        }
        
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                const progress = parseFloat(e.target.value);
                const position = PDFHandler.getPositionAtProgress(progress);
                TTSManager.setPosition(position);
            });
            
            progressBar.addEventListener('change', (e) => {
                if (PDFHandler.extractedText) {
                    TTSManager.speak(PDFHandler.extractedText.slice(TTSManager.currentPosition));
                }
            });
        }
        
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                const rate = parseFloat(e.target.value);
                TTSManager.setPlaybackRate(rate);
            });
        }
        
        if (closePlayer) {
            closePlayer.addEventListener('click', () => {
                TTSManager.stop();
                Modal.hide('player');
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                TTSManager.exportAsAudio();
            });
        }
        
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                if (!AuthManager.isLoggedIn()) {
                    Modal.show('login');
                    Toast.show('Please log in to save bookmarks', 'warning');
                    return;
                }
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
    
    setupAuth() {
        const loginBtn = document.getElementById('login-btn');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const showSignup = document.getElementById('show-signup');
        const showLogin = document.getElementById('show-login');
        const closeSignup = document.getElementById('close-signup');
        const signupModal = document.getElementById('signup-modal');
        
        // Login button
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (AuthManager.isLoggedIn()) {
                    // Show logout confirmation
                    if (confirm('Log out?')) {
                        AuthManager.logout();
                        Toast.show('Logged out successfully', 'success');
                    }
                } else {
                    Modal.show('login');
                }
            });
        }
        
        // Login form
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                const result = AuthManager.login(email, password);
                
                if (result.success) {
                    Modal.hide('login');
                    Toast.show(`Welcome back, ${result.user.name}!`, 'success');
                    AuthManager.updateUI();
                    loginForm.reset();
                } else {
                    Toast.show(result.error, 'error');
                }
            });
        }
        
        // Signup form
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const confirm = document.getElementById('signup-confirm').value;
                
                if (password !== confirm) {
                    Toast.show('Passwords do not match', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    Toast.show('Password must be at least 6 characters', 'error');
                    return;
                }
                
                const result = AuthManager.register(name, email, password);
                
                if (result.success) {
                    Modal.hide('signup');
                    Toast.show(`Welcome, ${result.user.name}! Account created successfully.`, 'success');
                    AuthManager.updateUI();
                    signupForm.reset();
                } else {
                    Toast.show(result.error, 'error');
                }
            });
        }
        
        // Show signup modal from login
        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                Modal.hide('login');
                Modal.show('signup');
            });
        }
        
        // Show login modal from signup
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                Modal.hide('signup');
                Modal.show('login');
            });
        }
        
        // Close signup modal
        if (closeSignup) {
            closeSignup.addEventListener('click', () => {
                Modal.hide('signup');
            });
        }
    },
    
    checkCapabilities() {
        const ttsSupported = TTSManager.isSupported();
        const pdfSupported = PDFHandler.isAvailable();
        
        if (!ttsSupported) {
            Toast.show('Text-to-speech not supported in this browser. Try Chrome or Safari.', 'warning');
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
