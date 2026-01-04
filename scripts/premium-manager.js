/**
 * PDF to Audio Converter - Premium Manager
 * Handles premium subscription status and features
 */

const PremiumManager = {
    STORAGE_KEY: 'pdf2audio_premium',
    API_ENDPOINT: 'https://api.example.com', // Replace with actual API
    
    /**
     * Check if user has premium
     * @returns {boolean} Premium status
     */
    isPremium() {
        const status = Utils.storageGet(this.STORAGE_KEY, null);
        if (!status) return false;
        
        // Check if subscription is still valid
        if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
            this.clearPremium();
            return false;
        }
        
        return true;
    },
    
    /**
     * Get premium status
     * @returns {Object} Status info
     */
    getStatus() {
        const status = Utils.storageGet(this.STORAGE_KEY, null);
        if (!status) {
            return {
                isPremium: false,
                expiresAt: null,
                features: this.getFreeFeatures()
            };
        }
        
        return {
            isPremium: true,
            expiresAt: status.expiresAt,
            features: this.getPremiumFeatures(),
            daysRemaining: Math.ceil((new Date(status.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        };
    },
    
    /**
     * Get free tier features
     * @returns {Array} Features list
     */
    getFreeFeatures() {
        return [
            { id: 'pdf_upload', name: 'PDF Upload', enabled: true },
            { id: 'basic_voices', name: 'Basic Voices', enabled: true },
            { id: 'speed_control', name: 'Speed Control', enabled: true },
            { id: 'bookmarks', name: 'Bookmarks', enabled: true, limit: 3 },
            { id: 'recent_files', name: 'Recent Files', enabled: true, limit: 5 },
            { id: 'premium_voices', name: 'Premium Voices', enabled: false },
            { id: 'unlimited_export', name: 'Unlimited Export', enabled: false },
            { id: 'unlimited_library', name: 'Unlimited Library', enabled: false },
            { id: 'voice_cloning', name: 'Voice Cloning', enabled: false }
        ];
    },
    
    /**
     * Get premium features
     * @returns {Array} Features list
     */
    getPremiumFeatures() {
        return [
            { id: 'pdf_upload', name: 'PDF Upload', enabled: true },
            { id: 'basic_voices', name: 'Basic Voices', enabled: true },
            { id: 'speed_control', name: 'Speed Control', enabled: true },
            { id: 'bookmarks', name: 'Bookmarks', enabled: true, limit: Infinity },
            { id: 'recent_files', name: 'Recent Files', enabled: true, limit: Infinity },
            { id: 'premium_voices', name: 'Premium Voices', enabled: true },
            { id: 'unlimited_export', name: 'Unlimited Export', enabled: true },
            { id: 'unlimited_library', name: 'Unlimited Library', enabled: true },
            { id: 'voice_cloning', name: 'Voice Cloning', enabled: true }
        ];
    },
    
    /**
     * Check if feature is available
     * @param {string} featureId - Feature ID
     * @returns {Object} Feature status
     */
    isFeatureEnabled(featureId) {
        const features = this.isPremium() 
            ? this.getPremiumFeatures() 
            : this.getFreeFeatures();
        
        const feature = features.find(f => f.id === featureId);
        return feature ? feature.enabled : false;
    },
    
    /**
     * Check feature limit
     * @param {string} featureId - Feature ID
     * @param {number} currentUsage - Current usage count
     * @returns {Object} Limit status
     */
    checkFeatureLimit(featureId, currentUsage) {
        const features = this.isPremium() 
            ? this.getPremiumFeatures() 
            : this.getFreeFeatures();
        
        const feature = features.find(f => f.id === featureId);
        if (!feature) return { allowed: false, limit: 0, remaining: 0 };
        
        const limit = feature.limit || Infinity;
        const remaining = limit - currentUsage;
        
        return {
            allowed: remaining > 0,
            limit: limit,
            remaining: remaining,
            isPremium: this.isPremium()
        };
    },
    
    /**
     * Set premium status (for testing/demo)
     * @param {Object} status - Premium status object
     */
    setPremiumStatus(status) {
        Utils.storageSet(this.STORAGE_KEY, status);
        this.updateUI();
    },
    
    /**
     * Clear premium status
     */
    clearPremium() {
        Utils.storageRemove(this.STORAGE_KEY);
        this.updateUI();
    },
    
    /**
     * Update UI based on premium status
     */
    updateUI() {
        const isPremium = this.isPremium();
        
        // Update upgrade button
        const upgradeBtns = document.querySelectorAll('#upgrade-btn, #upgrade-pricing-btn');
        upgradeBtns.forEach(btn => {
            if (isPremium) {
                btn.textContent = 'Premium Active';
                btn.disabled = true;
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            } else {
                btn.textContent = 'Upgrade';
                btn.disabled = false;
            }
        });
        
        // Update feature indicators
        document.querySelectorAll('.premium-feature').forEach(el => {
            if (isPremium) {
                el.classList.remove('locked');
            } else {
                el.classList.add('locked');
            }
        });
        
        // Update pricing card
        const pricingCard = document.querySelector('.pricing-card.featured');
        if (pricingCard) {
            const btn = pricingCard.querySelector('.btn');
            if (isPremium) {
                btn.textContent = 'Current Plan';
                btn.disabled = true;
            } else {
                btn.textContent = 'Upgrade Now';
                btn.disabled = false;
            }
        }
    },
    
    /**
     * Initialize checkout
     */
    async initCheckout() {
        // In production, this would integrate with Stripe/Lemon Squeezy
        Toast.show('Payment integration coming soon!', 'info');
        
        // For demo purposes, simulate premium activation
        if (confirm('Demo mode: Activate premium for 7 days?')) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            this.setPremiumStatus({
                plan: 'premium',
                activatedAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            });
            
            Toast.show('Premium activated! Enjoy 7 days of premium features.', 'success');
        }
    },
    
    /**
     * Get available plans
     * @returns {Array} Plans list
     */
    getPlans() {
        return [
            {
                id: 'monthly',
                name: 'Monthly',
                price: 9.99,
                interval: 'month',
                popular: true,
                features: this.getPremiumFeatures().map(f => f.name)
            },
            {
                id: 'yearly',
                name: 'Yearly',
                price: 99.00,
                interval: 'year',
                savings: '17%',
                features: this.getPremiumFeatures().map(f => f.name)
            },
            {
                id: 'lifetime',
                name: 'Lifetime',
                price: 299.00,
                interval: 'lifetime',
                features: this.getPremiumFeatures().map(f => f.name)
            }
        ];
    },
    
    /**
     * Render pricing plans
     */
    renderPricing() {
        // Pricing is handled in HTML, this can be used for dynamic pricing
    },
    
    /**
     * Handle login
     * @param {string} email - User email
     * @returns {Promise<Object>} Auth result
     */
    async login(email) {
        // Simulated login - replace with actual auth
        return new Promise((resolve) => {
            setTimeout(() => {
                Utils.storageSet('pdf2audio_user', { email });
                resolve({ success: true, email });
            }, 500);
        });
    },
    
    /**
     * Handle logout
     */
    logout() {
        Utils.storageRemove('pdf2audio_user');
        this.clearPremium();
    },
    
    /**
     * Get current user
     * @returns {Object|null} User object
     */
    getUser() {
        return Utils.storageGet('pdf2audio_user', null);
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean} Login status
     */
    isLoggedIn() {
        return this.getUser() !== null;
    },
    
    /**
     * Initialize premium manager
     */
    init() {
        this.updateUI();
        
        // Setup upgrade buttons
        const upgradeBtns = document.querySelectorAll('#upgrade-btn, #upgrade-pricing-btn');
        upgradeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isPremium()) {
                    this.initCheckout();
                }
            });
        });
        
        // Setup login
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (this.isLoggedIn()) {
                    // Show user menu or logout
                    if (confirm('Log out?')) {
                        this.logout();
                        Toast.show('Logged out successfully', 'success');
                        loginBtn.textContent = 'Log In';
                    }
                } else {
                    Modal.show('login');
                }
            });
            
            // Update login button text
            if (this.isLoggedIn()) {
                loginBtn.textContent = this.getUser().email.split('@')[0];
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumManager;
}
