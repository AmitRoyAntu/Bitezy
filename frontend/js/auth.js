const Auth = {
    currentUser: null,

    getUser: function() {
        return this.currentUser;
    },

    isAuthenticated: function() {
        return !!localStorage.getItem('bitezy_token');
    },

    getRole: function() {
        return this.currentUser ? this.currentUser.role : null;
    },

    getName: function() {
        return this.currentUser ? this.currentUser.name : 'Guest';
    },

    getResidence: function() {
        return this.currentUser ? this.currentUser.residence : null;
    },

    /**
     * Fetch user profile from database using token
     * This replaces localStorage for user data persistence
     */
    init: async function() {
        const token = localStorage.getItem('bitezy_token');
        if (!token) {
            this.currentUser = null;
            return null;
        }

        try {
            // Use DataService to fetch profile
            if (typeof DataService !== 'undefined') {
                this.currentUser = await DataService.request('/auth/me');
                return this.currentUser;
            }
        } catch (e) {
            console.error('Failed to initialize Auth session:', e);
            this.logout(); // Token might be expired or invalid
            return null;
        }
    },

    requireAuth: async function(redirectTo) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(redirectTo || window.location.pathname);
            return false;
        }
        
        if (!this.currentUser) {
            const user = await this.init();
            if (!user) return false;
        }
        return true;
    },

    requireRole: async function(roles, redirectTo) {
        const authed = await this.requireAuth(redirectTo);
        if (!authed) return false;

        const userRole = this.getRole();
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            alert('You do not have permission to access this page.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    login: function(userData, token) {
        // We only store the token now. Profile is fetched on init.
        localStorage.setItem('bitezy_token', token);
        this.currentUser = userData;
        
        if (userData.role === 'admin') window.location.href = 'admin.html';
        else if (userData.role === 'seller') window.location.href = 'seller.html';
        else window.location.href = 'customer.html';
    },

    logout: function() {
        localStorage.removeItem('bitezy_token');
        this.currentUser = null;
        window.location.href = 'index.html';
    },

    updateUserLocal: function(data) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...data };
            return true;
        }
        return false;
    }
};

window.Auth = Auth;