const DataService = {
    baseUrl: 'http://localhost:8002/api',
    
    async getAuthToken() {
        return localStorage.getItem('bitezy_token');
    },

    async request(endpoint, method = 'GET', body = null) {
        const token = await this.getAuthToken();
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },
    
    async getProviders() {
        return await this.request('/providers');
    },
    
    async getMenu(vendorId = null, availableOnly = false) {
        let query = vendorId ? `?vendor=${vendorId}` : '';
        if (availableOnly) {
            query += (query ? '&' : '?') + 'available=true';
        }
        return await this.request(`/menu${query}`);
    },
    
    async getMenuByProvider(providerId) {
        return await this.request(`/menu?vendor=${providerId}`);
    },

    async getOrders() {
        return await this.request('/orders/myorders');
    },

    async updateProfile(profileData) {
        return await this.request('/auth/profile', 'PUT', profileData);
    },

    async createOrder(orderData) {
        return await this.request('/orders', 'POST', orderData);
    },

    async getAllOrders() {
        return await this.request('/orders');
    },
    
    async getMenuByProvider(providerId, availableOnly = false) {
        const query = `?vendor=${providerId}${availableOnly ? '&available=true' : ''}`;
        return await this.request(`/menu${query}`);
    },

    async createMenuItem(data) {
        return await this.request('/menu', 'POST', data);
    },

    async updateMenuItem(id, data) {
        return await this.request(`/menu/${id}`, 'PUT', data);
    },

    async deleteMenuItem(id) {
        return await this.request(`/menu/${id}`, 'DELETE');
    },

    async getReviewsByProvider(providerId) {

        return await this.request(`/reviews/provider/${providerId}`);
    },


    async createReview(reviewData) {
        return await this.request('/reviews', 'POST', reviewData);
    },
    
    // Calculate average rating for a provider
    async getProviderRating(providerId) {
        const reviews = await this.getReviews(providerId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    },

    // Seller-specific
    async getSellerOrders() {
        return await this.request('/orders/seller');
    },

    async updateOrderStatus(orderId, status) {
        return await this.request(`/orders/${orderId}/status`, 'PUT', { status });
    },

    async getMyProvider() {
        return await this.request('/providers/myprovider');
    },

    // Admin-specific
    async getUsers() {
        return await this.request('/users');
    },

    async blockUser(userId, isBlocked) {
        return await this.request(`/users/${userId}/block`, 'PUT', { isBlocked });
    },

    // Alias for compatibility
    async getReviews(providerId) {
        return await this.getReviewsByProvider(providerId);
    }
};


// Export for use
window.DataService = DataService;