const Auth = {
    getUser: function() {
        try {
            const user = localStorage.getItem('bitezy_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('Error reading user data:', e);
            return null;
        }
    },

    isAuthenticated: function() {
        const user = this.getUser();
        return user && user.loggedIn === true;
    },

    getRole: function() {
        const user = this.getUser();
        return user ? user.role : null;
    },

    getName: function() {
        const user = this.getUser();
        return user ? user.name : 'Guest';
    },

    getHall: function() {
        const user = this.getUser();
        return user ? user.hall : null;
    },

    requireAuth: function(redirectTo) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(redirectTo || 'customer.html');
            return false;
        }
        return true;
    },

    /**
     * Require specific role
     * @param {string|string[]} roles - Required role(s)
     * @param {string} redirectTo - Page to redirect if unauthorized
     */
    requireRole: function(roles, redirectTo) {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(redirectTo || 'customer.html');
            return false;
        }

        const userRole = this.getRole();
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            alert('You do not have permission to access this page.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    logout: function() {
        localStorage.removeItem('bitezy_user');
        window.location.href = 'index.html';
    },

    updateUser: function(data) {
        try {
            const user = this.getUser();
            if (user) {
                const updatedUser = { ...user, ...data };
                localStorage.setItem('bitezy_user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error updating user data:', e);
            return false;
        }
    },

    updateUserInDB: function(data) {
        try {
            const user = this.getUser();
            if (!user || !user.id) {
                return false;
            }

            const updatedUser = { ...user, ...data };
            localStorage.setItem('bitezy_user', JSON.stringify(updatedUser));

            let db = JSON.parse(localStorage.getItem('bitezy_users_db') || '[]');
            const userIndex = db.findIndex(u => u.id === user.id);
            
            if (userIndex !== -1) {
                db[userIndex] = { ...db[userIndex], ...data };
            } else {
                db.push({ ...user, ...data });
            }
            
            localStorage.setItem('bitezy_users_db', JSON.stringify(db));
            
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'bitezy_user',
                newValue: JSON.stringify(updatedUser)
            }));
            
            return true;
        } catch (e) {
            return false;
        }
    },

    getUserFromDB: function(userId) {
        try {
            const db = JSON.parse(localStorage.getItem('bitezy_users_db') || '[]');
            return db.find(u => u.id === userId) || null;
        } catch (e) {
            return null;
        }
    },

    initMockDB: function(users) {
        try {
            const existing = localStorage.getItem('bitezy_users_db');
            if (!existing) {
                localStorage.setItem('bitezy_users_db', JSON.stringify(users));
            }
        } catch (e) {
            console.error('Error initializing mock database:', e);
        }
    }
};

window.Auth = Auth;