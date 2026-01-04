/**
 * PDF to Audio Converter - Auth Manager
 * Simple email/password authentication using localStorage
 */

const AuthManager = {
    USERS_KEY: 'pdf2audio_users',
    CURRENT_USER_KEY: 'pdf2audio_current_user',
    
    /**
     * Get all users
     * @returns {Array} Users array
     */
    getUsers() {
        return Utils.storageGet(this.USERS_KEY, []);
    },
    
    /**
     * Save users
     * @param {Array} users - Users array
     */
    saveUsers(users) {
        Utils.storageSet(this.USERS_KEY, users);
    },
    
    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Object|null} User object or null
     */
    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    
    /**
     * Register new user
     * @param {string} name - User name
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result object
     */
    register(name, email, password) {
        // Check if user exists
        if (this.findUserByEmail(email)) {
            return { success: false, error: 'Email already registered' };
        }
        
        // Create new user
        const users = this.getUsers();
        const newUser = {
            id: Utils.generateId(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            isPremium: false,
            premiumExpiresAt: null
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        // Auto login
        this.setCurrentUser(newUser);
        
        return { success: true, user: newUser };
    },
    
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result object
     */
    login(email, password) {
        const user = this.findUserByEmail(email);
        
        if (!user) {
            return { success: false, error: 'Account not found. Please sign up first.' };
        }
        
        if (!this.verifyPassword(password, user.password)) {
            return { success: false, error: 'Incorrect password' };
        }
        
        this.setCurrentUser(user);
        return { success: true, user: user };
    },
    
    /**
     * Logout current user
     */
    logout() {
        Utils.storageRemove(this.CURRENT_USER_KEY);
        this.updateUI();
    },
    
    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return Utils.storageGet(this.CURRENT_USER_KEY, null);
    },
    
    /**
     * Check if logged in
     * @returns {boolean} Login status
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },
    
    /**
     * Set current user
     * @param {Object} user - User object
     */
    setCurrentUser(user) {
        const safeUser = { ...user };
        delete safeUser.password; // Don't store password
        Utils.storageSet(this.CURRENT_USER_KEY, safeUser);
    },
    
    /**
     * Update user premium status
     * @param {boolean} isPremium - Premium status
     * @param {string} expiresAt - Expiry date
     */
    updatePremiumStatus(isPremium, expiresAt) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        currentUser.isPremium = isPremium;
        currentUser.premiumExpiresAt = expiresAt;
        this.setCurrentUser(currentUser);
        
        // Also update in users array
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].isPremium = isPremium;
            users[userIndex].premiumExpiresAt = expiresAt;
            this.saveUsers(users);
        }
    },
    
    /**
     * Hash password (simple hash for demo - use bcrypt in production)
     * @param {string} password - Plain password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        // Simple hash for demo - NOT secure for production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },
    
    /**
     * Verify password
     * @param {string} password - Plain password
     * @param {string} hashedPassword - Hashed password
     * @returns {boolean} Match status
     */
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    },
    
    /**
     * Update UI based on auth state
     */
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const upgradeBtn = document.getElementById('upgrade-btn');
        const user = this.getCurrentUser();
        
        if (loginBtn) {
            if (user) {
                loginBtn.textContent = user.name.split(' ')[0];
            } else {
                loginBtn.textContent = 'Log In';
            }
        }
        
        if (upgradeBtn) {
            if (user && user.isPremium) {
                upgradeBtn.textContent = 'Premium';
                upgradeBtn.disabled = true;
            } else if (user) {
                upgradeBtn.textContent = 'Upgrade';
                upgradeBtn.disabled = false;
            }
        }
    },
    
    /**
     * Initialize auth system
     */
    init() {
        this.updateUI();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
