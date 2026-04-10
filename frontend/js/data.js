const DataService = {
    baseUrl: '../data',
    
    cache: {},
    
    async load(file) {
        if (this.cache[file]) {
            return this.cache[file];
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/${file}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${file}`);
            }
            const data = await response.json();
            this.cache[file] = data;
            return data;
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
            return null;
        }
    },
    
    async getUsers() {
        const data = await this.load('users');
        return data ? data.users : [];
    },
    
    async getProviders() {
        const data = await this.load('providers');
        return data ? data.providers : [];
    },
    
    async getMenu() {
        const data = await this.load('menu');
        return data ? data.menu : [];
    },
    
    async getOrders() {
        const data = await this.load('orders');
        return data ? data.orders : [];
    },
    
    // Get items by provider
    async getMenuByProvider(providerName) {
        const menu = await this.getMenu();
        return menu.filter(item => item.provider === providerName);
    },
    
    // Get user by email
    async getUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(u => u.email === email);
    },
    
    // Validate login
    async validateLogin(email, password) {
        const user = await this.getUserByEmail(email);
        if (user && user.password === password) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                buyerType: user.buyerType || null,
                cuetId: user.cuetId || null,
                department: user.department || null,
                hall: user.hall || null,
                shopName: user.shopName || null,
                location: user.location || null,
                loggedIn: true
            };
        }
        return null;
    },
    
    // Get all reviews
    async getReviews() {
        let reviews = [];
        
        const data = await this.load('reviews');
        if (data && data.reviews) {
            reviews = [...data.reviews];
        }
        
        const storedReviews = localStorage.getItem('bitezy_reviews');
        if (storedReviews) {
            try {
                const userReviews = JSON.parse(storedReviews);
                reviews = [...reviews, ...userReviews];
            } catch (e) {
                console.error('Error parsing stored reviews:', e);
            }
        }
        
        return reviews;
    },
    
    // Get reviews by provider ID
    async getReviewsByProvider(providerId) {
        const reviews = await this.getReviews();
        return reviews.filter(r => r.providerId === providerId);
    },
    
    // Get reviews by provider name
    async getReviewsByProviderName(providerName) {
        const reviews = await this.getReviews();
        return reviews.filter(r => r.providerName === providerName);
    },
    
    // Calculate average rating for a provider
    async getProviderRating(providerId) {
        const reviews = await this.getReviewsByProvider(providerId);
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }
};

// Export for use
window.DataService = DataService;