// ADMIN DASHBOARD - API-CONNECTED VERSION

// RENDER FUNCTIONS

async function renderDashboard() {
    try {
        const orders = await DataService.getAllOrders();
        const users = await DataService.getUsers();
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;

        const buyers = users.filter(u => u.role === 'buyer');
        const totalUsers = buyers.length;
        
        const sellers = users.filter(u => u.role === 'seller');
        const totalSellers = sellers.length;

        // Update stat cards
        document.getElementById('stat-total-revenue').innerText = `৳ ${totalRevenue.toLocaleString()}`;
        document.getElementById('stat-total-orders').innerText = totalOrders;
        document.getElementById('stat-total-users').innerText = totalUsers;
        document.getElementById('stat-total-sellers').innerText = totalSellers;

        // Render recent orders table
        const tbody = document.getElementById('recent-orders-table-body');
        tbody.innerHTML = '';
        const recentOrders = orders.slice(0, 5); // Controller already sorts by -createdAt

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
                    <td><strong>#${order._id.slice(-6)}</strong></td>
                    <td>${order.customer ? order.customer.name : 'Unknown'}</td>
                    <td>${order.provider ? order.provider.name : 'Unknown'}</td>
                    <td style="font-weight:600;">৳${order.total}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error rendering dashboard:', error);
    }
}

async function renderAllOrders() {
    try {
        const orders = await DataService.getAllOrders();
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
                    <td><strong>#${order._id.slice(-6)}</strong></td>
                    <td>${order.customer ? order.customer.name : 'Unknown'}</td>
                    <td>${order.provider ? order.provider.name : 'Unknown'}</td>
                    <td style="color:#555;">${itemsSummary}</td>
                    <td style="font-weight:600;">৳${order.total}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error rendering all orders:', error);
    }
}

async function renderUsers() {
    try {
        const users = await DataService.getUsers();
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
                    <td>${user.residence || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${user.buyerType || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>
                        <button class="btn-icon" style="color:var(--danger)" title="Block User" onclick="toggleUserBlock('${user._id}', ${user.isBlocked})">
                            <i class="fa-solid fa-${user.isBlocked ? 'user-check' : 'user-slash'}"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error rendering users:', error);
    }
}

async function renderSellers() {
    try {
        const users = await DataService.getUsers();
        const providers = await DataService.getProviders();
        const orders = await DataService.getAllOrders();
        const tbody = document.getElementById('sellers-table-body');
        tbody.innerHTML = '';

        const sellerUsers = users.filter(u => u.role === 'seller');

        if (sellerUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #888;">No sellers found.</td></tr>';
            return;
        }

        sellerUsers.forEach(seller => {
            // Find this seller's provider profile
            const provider = providers.find(p => p.seller === seller._id || (p.seller && p.seller._id === seller._id));
            const shopName = provider ? provider.name : 'No Provider Profile';
            const location = provider ? provider.location : 'N/A';
            
            // Filter orders for this provider
            const sellerOrders = provider ? orders.filter(o => o.provider && o.provider._id === provider._id) : [];
            const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
            const totalOrders = sellerOrders.length;

            tbody.innerHTML += `
                 <tr>
                    <td><strong>${shopName}</strong></td>
                    <td>${seller.name}</td>
                    <td><span style="background:#f1f2f6; padding:4px 8px; border-radius:4px; font-size:12px;">${location}</span></td>
                    <td>${totalOrders}</td>
                    <td style="font-weight:600;">৳${totalRevenue.toLocaleString()}</td>
                    <td>
                        <button class="btn-icon" style="color:var(--danger)" title="Deactivate Seller"><i class="fa-solid fa-store-slash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error rendering sellers:', error);
    }
}

// REVIEWS MANAGEMENT
let allReviews = [];
let currentReviewFilter = 'all';

async function renderAllReviews() {
    const container = document.getElementById('reviews-table-container');
    container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:var(--gray);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i><p>Loading reviews...</p></div>';
    
    try {
        allReviews = await DataService.request('/reviews'); // Need to ensure /api/reviews exists for admin
        populateProviderFilter(allReviews);
        displayReviews();
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Error loading reviews</div>';
    }
}

function populateProviderFilter(reviews) {
    const select = document.getElementById('reviewFilter');
    if (!select) return;
    const providers = [...new Set(reviews.map(r => r.provider ? r.provider.name : 'Unknown'))].sort();
    
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
        filteredReviews = allReviews.filter(r => r.provider && r.provider.name === currentReviewFilter);
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
    
    container.innerHTML = `
        <table style="width:100%">
            <thead>
                <tr>
                    <th>Reviewer</th>
                    <th>Provider</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${filteredReviews.map(review => {
                    const stars = Array(5).fill(0).map((_, i) => 
                        i < review.rating ? '<i class="fa-solid fa-star" style="color:var(--warning);"></i>' : '<i class="fa-regular fa-star" style="color:var(--border);"></i>'
                    ).join('');
                    
                    const date = new Date(review.createdAt).toLocaleDateString();
                    
                    return `
                        <tr>
                            <td><strong>${review.buyer ? review.buyer.name : 'Unknown'}</strong></td>
                            <td>${review.provider ? review.provider.name : 'Unknown'}</td>
                            <td style="color:var(--warning);">${stars}</td>
                            <td style="color:#555; max-width:300px;">${review.comment}</td>
                            <td>${date}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function toggleUserBlock(userId, currentStatus) {
    try {
        await DataService.blockUser(userId, !currentStatus);
        showToast(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
        renderUsers();
    } catch (error) {
        showToast(error.message || 'Error updating user status', 'danger');
    }
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
    // Show loading screen initially
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'flex';

    // Initialize Auth (fetches profile from DB)
    const user = await Auth.init();
    
    if (!user || user.role !== 'admin') {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html?redirect=admin.html';
        } else {
            alert('Access denied. Admin only.');
            window.location.href = 'index.html';
        }
        return;
    }

    if (loadingScreen) loadingScreen.style.display = 'none';
    
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

