/**
 * PDF to Audio Converter - Text-to-Speech Manager
 * Handles Web Speech API integration for audio playback
 */

const TTSManager = {
    synth: null,
    utterance: null,
    voices: [],
    currentPosition: 0,
    textLength: 0,
    isPlaying: false,
    playbackRate: 1,
    
    /**
     * Initialize TTS
     */
    init() {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        
        // Some browsers need a delay to load voices
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    },
    
    /**
     * Check if TTS is supported
     * @returns {boolean} Support status
     */
    isSupported() {
        return 'speechSynthesis' in window;
    },
    
    /**
     * Load available voices
     */
    loadVoices() {
        this.voices = this.synth.getVoices();
        this.populateVoiceSelect();
    },
    
    /**
     * Populate voice select dropdown
     */
    populateVoiceSelect() {
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;
        
        // Keep the default option
        const defaultOption = voiceSelect.querySelector('option[value=""]');
        voiceSelect.innerHTML = '';
        if (defaultOption) {
            voiceSelect.appendChild(defaultOption);
        }
        
        // Add available voices
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            option.dataset.name = voice.name;
            if (voice.default) {
                option.textContent += ' - Default';
            }
            voiceSelect.appendChild(option);
        });
    },
    
    /**
     * Load text for playback
     * @param {string} text - Text to convert to speech
     */
    loadText(text) {
        this.textLength = text.length;
        this.currentPosition = 0;
    },
    
    /**
     * Start playback
     * @param {string} text - Text to speak
     */
    speak(text) {
        if (!this.isSupported()) {
            Toast.show('Text-to-speech not supported in this browser', 'error');
            return;
        }
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = this.playbackRate;
        this.utterance.pitch = 1;
        
        // Set voice if selected
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect && voiceSelect.value !== '') {
            const selectedVoice = this.voices[voiceSelect.value];
            if (selectedVoice) {
                this.utterance.voice = selectedVoice;
            }
        }
        
        // Event handlers
        this.utterance.onstart = () => {
            this.isPlaying = true;
            this.updatePlayButton();
            document.getElementById('doc-status').textContent = 'Playing...';
        };
        
        this.utterance.onend = () => {
            this.isPlaying = false;
            this.updatePlayButton();
            document.getElementById('doc-status').textContent = 'Completed';
            this.updateProgress(100);
        };
        
        this.utterance.onerror = (event) => {
            console.error('TTS Error:', event);
            this.isPlaying = false;
            this.updatePlayButton();
            document.getElementById('doc-status').textContent = 'Error occurred';
        };
        
        this.utterance.onboundary = (event) => {
            if (event.name === 'word' || event.name === 'sentence') {
                this.currentPosition = event.charIndex;
                const progress = (this.currentPosition / this.textLength) * 100;
                this.updateProgress(progress);
                this.updateTimeDisplay();
                PDFHandler.updateTextDisplay(this.currentPosition);
            }
        };
        
        // Start speaking
        this.synth.speak(this.utterance);
    },
    
    /**
     * Pause playback
     */
    pause() {
        if (this.isSupported() && this.synth) {
            this.synth.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            document.getElementById('doc-status').textContent = 'Paused';
        }
    },
    
    /**
     * Resume playback
     */
    resume() {
        if (this.isSupported() && this.synth) {
            this.synth.resume();
            this.isPlaying = true;
            this.updatePlayButton();
            document.getElementById('doc-status').textContent = 'Playing...';
        }
    },
    
    /**
     * Stop playback
     */
    stop() {
        if (this.isSupported() && this.synth) {
            this.synth.cancel();
            this.isPlaying = false;
            this.currentPosition = 0;
            this.updatePlayButton();
            this.updateProgress(0);
            this.updateTimeDisplay();
            document.getElementById('doc-status').textContent = 'Ready to play';
        }
    },
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (!this.isSupported()) {
            Toast.show('Text-to-speech not supported', 'error');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else if (this.synth.paused) {
            this.resume();
        } else if (PDFHandler.extractedText) {
            this.speak(PDFHandler.extractedText.slice(this.currentPosition));
        }
    },
    
    /**
     * Set playback position
     * @param {number} position - Character position
     */
    setPosition(position) {
        this.currentPosition = Math.max(0, Math.min(position, this.textLength));
        const progress = (this.currentPosition / this.textLength) * 100;
        this.updateProgress(progress);
        this.updateTimeDisplay();
        PDFHandler.updateTextDisplay(this.currentPosition);
    },
    
    /**
     * Seek by amount
     * @param {number} amount - Amount to seek (positive or negative)
     */
    seek(amount) {
        const charCount = this.textLength * (amount / 100);
        this.setPosition(this.currentPosition + charCount);
    },
    
    /**
     * Set playback rate
     * @param {number} rate - Playback rate (0.5 to 2)
     */
    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.utterance) {
            this.utterance.rate = rate;
        }
        
        // Restart if playing
        if (this.isPlaying && PDFHandler.extractedText) {
            const wasPlaying = true;
            this.stop();
            this.speak(PDFHandler.extractedText.slice(this.currentPosition));
        }
    },
    
    /**
     * Update play/pause button
     */
    updatePlayButton() {
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        
        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    },
    
    /**
     * Update progress bar
     * @param {number} progress - Progress percentage
     */
    updateProgress(progress) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.value = progress;
        }
    },
    
    /**
     * Update time display
     */
    updateTimeDisplay() {
        const currentTime = document.getElementById('current-time');
        const totalTime = document.getElementById('total-time');
        
        // Estimate time based on characters and playback rate
        const charsPerSecond = 15 * this.playbackRate; // ~15 chars/sec at 1x
        const currentSeconds = Math.floor(this.currentPosition / charsPerSecond);
        const totalSeconds = Math.floor(this.textLength / charsPerSecond);
        
        if (currentTime) {
            currentTime.textContent = Utils.formatTime(currentSeconds);
        }
        if (totalTime) {
            totalTime.textContent = Utils.formatTime(totalSeconds);
        }
    },
    
    /**
     * Get current audio level (for visualization)
     * @returns {number} Audio level (0-1)
     */
    getAudioLevel() {
        // Web Speech API doesn't provide audio levels
        // This is a placeholder for when we add audio API
        return this.isPlaying ? 0.7 : 0;
    },
    
    /**
     * Export as audio (placeholder for premium)
     * Note: Web Speech API doesn't support direct audio export
     * Premium users would use server-side TTS API
     */
    async exportAsAudio() {
        if (PremiumManager.isPremium()) {
            // Premium export would use API
            Toast.show('Premium export coming soon!', 'info');
        } else {
            Toast.show('Export to MP3 is a Premium feature. Upgrade to unlock!', 'warning');
            Modal.show('login');
        }
    },
    
    /**
     * Check browser TTS capabilities
     * @returns {Object} Capability info
     */
    checkCapabilities() {
        return {
            supported: this.isSupported(),
            voiceCount: this.voices.length,
            rateRange: { min: 0.5, max: 2 },
            pitchSupported: true
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSManager;
}
