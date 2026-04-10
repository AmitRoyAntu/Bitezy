const getDB = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
};

async function loadUsersFromDB() {
    if (typeof DataService !== 'undefined') {
        return await DataService.getUsers();
    }
    return [];
}

async function loadSellersFromDB() {
    const users = await loadUsersFromDB();
    return users.filter(u => u.role === 'seller');
}

async function initializeOrdersDB() {
    if (!localStorage.getItem('foodhub_orders') || JSON.parse(localStorage.getItem('foodhub_orders')).length === 0) {
        try {
            const response = await fetch('../data/orders.json');
            const data = await response.json();
            localStorage.setItem('foodhub_orders', JSON.stringify(data.orders || []));
        } catch (e) {
            console.error('Error loading orders from JSON:', e);
            localStorage.setItem('foodhub_orders', JSON.stringify([]));
        }
    }
}


// RENDER FUNCTIONS

async function renderDashboard() {
    const orders = getDB('foodhub_orders');
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const usersList = await loadUsersFromDB();
    const buyers = usersList.filter(u => u.role === 'buyer');
    const totalUsers = buyers.length;
    
    const sellers = await loadSellersFromDB();
    const totalSellers = sellers.length;

    // Update stat cards
    document.getElementById('stat-total-revenue').innerText = `৳ ${totalRevenue.toLocaleString()}`;
    document.getElementById('stat-total-orders').innerText = totalOrders;
    document.getElementById('stat-total-users').innerText = totalUsers;
    document.getElementById('stat-total-sellers').innerText = totalSellers;

    // Render recent orders table
    const tbody = document.getElementById('recent-orders-table-body');
    tbody.innerHTML = '';
    const recentOrders = orders.slice(-5).reverse(); // Get last 5 orders

    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No orders yet.</td></tr>';
        return;
    }

    recentOrders.forEach(order => {
        let statusClass = '';
        let statusLabel = order.status.replace(/_/g, ' ');
        switch(order.status) {
            case 'PENDING': statusClass = 'status-pending'; break;
            case 'PREPARING': statusClass = 'status-preparing'; break;
            case 'ON_THE_WAY': case 'READY': statusClass = 'status-ontheway'; break;
            case 'DELIVERED': case 'PICKED_UP': statusClass = 'status-delivered'; break;
            case 'CANCELLED': statusClass = 'status-cancelled'; break;
        }
        tbody.innerHTML += `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${order.customer.name}</td>
                <td>${order.provider}</td>
                <td style="font-weight:600;">৳${order.total}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    });
}

function renderAllOrders() {
    const orders = getDB('foodhub_orders').reverse();
    const tbody = document.getElementById('all-orders-table-body');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #888;">No orders in the system.</td></tr>';
        return;
    }

    orders.forEach(order => {
        let statusClass = '';
        let statusLabel = order.status.replace(/_/g, ' ');
        switch(order.status) {
            case 'PENDING': statusClass = 'status-pending'; break;
            case 'PREPARING': statusClass = 'status-preparing'; break;
            case 'ON_THE_WAY': case 'READY': statusClass = 'status-ontheway'; break;
            case 'DELIVERED': case 'PICKED_UP': statusClass = 'status-delivered'; break;
            case 'CANCELLED': statusClass = 'status-cancelled'; break;
        }
        const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        tbody.innerHTML += `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${order.customer.name}</td>
                <td>${order.provider}</td>
                <td style="color:#555;">${itemsSummary}</td>
                <td style="font-weight:600;">৳${order.total}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    });
}

async function renderUsers() {
    const users = await loadUsersFromDB();
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    const buyers = users.filter(u => u.role === 'buyer');

    if (buyers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No users found.</td></tr>';
        return;
    }

    buyers.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.hall || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.buyerType || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <button class="btn-icon" style="color:var(--danger)" title="Block User"><i class="fa-solid fa-user-slash"></i></button>
                </td>
            </tr>
        `;
    });
}

async function renderSellers() {
    const sellers = await loadSellersFromDB();
    const orders = getDB('foodhub_orders');
    const tbody = document.getElementById('sellers-table-body');
    tbody.innerHTML = '';

    if (sellers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #888;">No sellers configured.</td></tr>';
        return;
    }

    sellers.forEach(seller => {
        const sellerOrders = orders.filter(o => o.provider === seller.shopName);
        const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = sellerOrders.length;

        tbody.innerHTML += `
             <tr>
                <td><strong>${seller.shopName}</strong></td>
                <td>${seller.name}</td>
                <td><span style="background:#f1f2f6; padding:4px 8px; border-radius:4px; font-size:12px;">${seller.location || 'N/A'}</span></td>
                <td>${totalOrders}</td>
                <td style="font-weight:600;">৳${totalRevenue.toLocaleString()}</td>
                <td>
                    <button class="btn-icon" style="color:var(--danger)" title="Deactivate Seller"><i class="fa-solid fa-store-slash"></i></button>
                </td>
            </tr>
        `;
    });
}

// REVIEWS MANAGEMENT
let allReviews = [];
let currentReviewFilter = 'all';

async function renderAllReviews() {
    const container = document.getElementById('reviews-table-container');
    container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--gray);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p>Loading reviews...</p></div>';
    
    allReviews = await DataService.getReviews();
    populateProviderFilter(allReviews);
    displayReviews();
}

function populateProviderFilter(reviews) {
    const select = document.getElementById('reviewFilter');
    const providers = [...new Set(reviews.map(r => r.providerName))].sort();
    
    let html = '<option value="all">All Providers</option>';
    providers.forEach(provider => {
        html += `<option value="${provider}">${provider}</option>`;
    });
    select.innerHTML = html;
}

function filterReviews() {
    currentReviewFilter = document.getElementById('reviewFilter').value;
    displayReviews();
}

function displayReviews() {
    const container = document.getElementById('reviews-table-container');
    let filteredReviews = allReviews;
    
    if (currentReviewFilter !== 'all') {
        filteredReviews = allReviews.filter(r => r.providerName === currentReviewFilter);
    }
    
    document.getElementById('totalReviewsCount').textContent = `Total: ${filteredReviews.length} reviews`;
    
    if (filteredReviews.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:var(--gray);">
                <i class="fa-solid fa-comment-slash" style="font-size:48px; margin-bottom:15px; display:block; opacity:0.5;"></i>
                <p>No reviews found.</p>
            </div>
        `;
        return;
    }
    
    const sortedReviews = filteredReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    container.innerHTML = `
        <table style="width:100%">
            <thead>
                <tr>
                    <th>Reviewer</th>
                    <th>Provider</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sortedReviews.map(review => {
                    const stars = Array(5).fill(0).map((_, i) => 
                        i < review.rating ? '<i class="fa-solid fa-star" style="color:var(--warning);"></i>' : '<i class="fa-regular fa-star" style="color:var(--border);"></i>'
                    ).join('');
                    
                    const date = new Date(review.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    const comment = review.comment.length > 80 
                        ? review.comment.substring(0, 80) + '...' 
                        : review.comment;
                    
                    return `
                        <tr>
                            <td><strong>${review.buyerName}</strong></td>
                            <td>${review.providerName}</td>
                            <td style="color:var(--warning);">${stars}</td>
                            <td style="color:#555; max-width:300px;">${comment}</td>
                            <td>${date}</td>
                            <td>
                                <button class="btn-icon" title="Delete Review" onclick="deleteReview(${review.id})" style="color:var(--danger);">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    allReviews = allReviews.filter(r => r.id !== reviewId);
    
    const storedReviews = localStorage.getItem('bitezy_reviews');
    if (storedReviews) {
        try {
            let userReviews = JSON.parse(storedReviews);
            userReviews = userReviews.filter(r => r.id !== reviewId);
            localStorage.setItem('bitezy_reviews', JSON.stringify(userReviews));
        } catch (e) {
            console.error('Error updating stored reviews:', e);
        }
    }
    
    displayReviews();
    showToast('Review deleted successfully', 'success');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'times'}-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// NAVIGATION
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionId).classList.remove('hidden');
    const link = document.getElementById('link-' + sectionId);
    if (link) link.classList.add('active');

    switch (sectionId) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'orders':
            renderAllOrders();
            break;
        case 'users':
            renderUsers();
            break;
        case 'sellers':
            renderSellers();
            break;
        case 'reviews':
            renderAllReviews();
            break;
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=admin.html';
        return;
    }
    
    const user = Auth.getUser();
    if (user && user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = 'index.html';
        return;
    }

    // Initialize global data
    await initializeOrdersDB();
    
    document.getElementById('loading-screen').style.display = 'none';
    
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
    
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    showSection('dashboard');
});
