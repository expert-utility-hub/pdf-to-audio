/**
 * PDF to Audio Converter - Library Manager
 * Handles storing and managing converted PDFs in localStorage
 */

const LibraryManager = {
    STORAGE_KEY: 'pdf2audio_library',
    MAX_FREE_ITEMS: 5,
    MAX_PREMIUM_ITEMS: Infinity,

    /**
     * Get library from storage
     * @returns {Array} Library items
     */
    getLibrary() {
        return Utils.storageGet(this.STORAGE_KEY, []);
    },

    /**
     * Save library to storage
     * @param {Array} library - Library items
     */
    saveLibrary(library) {
        Utils.storageSet(this.STORAGE_KEY, library);
    },

    /**
     * Add file to library
     * @param {Object} fileData - File data object
     * @returns {boolean} Success status
     */
    addFile(fileData) {
        const library = this.getLibrary();
        
        // Check if file already exists
        const existingIndex = library.findIndex(item => item.id === fileData.id);
        if (existingIndex !== -1) {
            // Update existing file
            library[existingIndex] = fileData;
        } else {
            // Add new file
            library.unshift(fileData);
        }
        
        this.saveLibrary(library);
        this.renderLibrary();
        return true;
    },

    /**
     * Remove file from library
     * @param {string} id - File ID
     * @returns {boolean} Success status
     */
    removeFile(id) {
        const library = this.getLibrary();
        const filtered = library.filter(item => item.id !== id);
        
        if (filtered.length !== library.length) {
            this.saveLibrary(filtered);
            this.renderLibrary();
            return true;
        }
        return false;
    },

    /**
     * Get file from library
     * @param {string} id - File ID
     * @returns {Object|null} File data or null
     */
    getFile(id) {
        const library = this.getLibrary();
        return library.find(item => item.id === id) || null;
    },

    /**
     * Get recent files
     * @param {number} limit - Number of files to return
     * @returns {Array} Recent files
     */
    getRecentFiles(limit = 5) {
        const library = this.getLibrary();
        return library.slice(0, limit);
    },

    /**
     * Check if user can add more files
     * @returns {Object} Status object
     */
    canAddFile() {
        const library = this.getLibrary();
        const isPremium = PremiumManager.isPremium();
        const maxItems = isPremium ? this.MAX_PREMIUM_ITEMS : this.MAX_FREE_ITEMS;
        const remaining = maxItems - library.length;
        
        return {
            canAdd: remaining > 0,
            remaining: remaining,
            isPremium: isPremium,
            maxItems: maxItems
        };
    },

    /**
     * Create file data object
     * @param {File} file - Original file
     * @param {string} text - Extracted text
     * @param {Object} metadata - Additional metadata
     * @returns {Object} File data object
     */
    createFileData(file, text, metadata = {}) {
        return {
            id: Utils.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            text: text,
            addedAt: new Date().toISOString(),
            lastPlayed: null,
            bookmarks: [],
            progress: 0,
            ...metadata
        };
    },

    /**
     * Update file progress
     * @param {string} id - File ID
     * @param {number} progress - Progress percentage
     */
    updateProgress(id, progress) {
        const library = this.getLibrary();
        const file = library.find(item => item.id === id);
        if (file) {
            file.progress = progress;
            file.lastPlayed = new Date().toISOString();
            this.saveLibrary(library);
        }
    },

    /**
     * Add bookmark to file
     * @param {string} id - File ID
     * @param {Object} bookmark - Bookmark object
     * @returns {boolean} Success status
     */
    addBookmark(id, bookmark) {
        const library = this.getLibrary();
        const file = library.find(item => item.id === id);
        
        if (!file) return false;
        
        const isPremium = PremiumManager.isPremium();
        if (!isPremium && file.bookmarks.length >= 3) {
            Toast.show('Free tier limited to 3 bookmarks. Upgrade for unlimited!', 'warning');
            return false;
        }
        
        file.bookmarks.push({
            id: Utils.generateId(),
            ...bookmark,
            createdAt: new Date().toISOString()
        });
        
        this.saveLibrary(library);
        return true;
    },

    /**
     * Remove bookmark from file
     * @param {string} id - File ID
     * @param {string} bookmarkId - Bookmark ID
     * @returns {boolean} Success status
     */
    removeBookmark(id, bookmarkId) {
        const library = this.getLibrary();
        const file = library.find(item => item.id === id);
        
        if (!file) return false;
        
        file.bookmarks = file.bookmarks.filter(b => b.id !== bookmarkId);
        this.saveLibrary(library);
        return true;
    },

    /**
     * Render library in modal
     */
    renderLibrary() {
        const libraryList = document.getElementById('library-list');
        const libraryEmpty = document.getElementById('library-empty');
        const library = this.getLibrary();
        
        if (library.length === 0) {
            libraryList.style.display = 'none';
            libraryEmpty.style.display = 'block';
            return;
        }
        
        libraryList.style.display = 'flex';
        libraryEmpty.style.display = 'none';
        
        libraryList.innerHTML = library.map(file => `
            <div class="library-item" data-id="${file.id}">
                <div class="library-item-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 2h8l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M12 2v4M10 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${Utils.escapeHtml(file.name)}</div>
                    <div class="library-item-date">${Utils.formatDate(new Date(file.addedAt))}</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-item-btn play-btn" data-id="${file.id}" title="Play">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 2v12l12-6-12-6z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="library-item-btn delete-btn" data-id="${file.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M4 4v10a1 1 0 001 1h6a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        libraryList.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const file = this.getFile(id);
                if (file) {
                    PDFHandler.loadFromLibrary(file);
                }
            });
        });
        
        libraryList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Remove this file from your library?')) {
                    this.removeFile(id);
                    Toast.show('File removed from library', 'success');
                }
            });
        });
    },

    /**
     * Initialize library events
     */
    init() {
        const libraryLink = document.getElementById('library-link');
        const libraryModal = document.getElementById('library-modal');
        const closeLibrary = document.getElementById('close-library');
        
        if (libraryLink) {
            libraryLink.addEventListener('click', (e) => {
                e.preventDefault();
                Modal.show('library');
                this.renderLibrary();
            });
        }
        
        if (closeLibrary) {
            closeLibrary.addEventListener('click', () => Modal.hide('library'));
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LibraryManager;
}
