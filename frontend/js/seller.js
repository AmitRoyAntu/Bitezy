// DATABASE SIMULATION
const getDB = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
};
const saveDB = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
};

function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
        t.querySelector('span').innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}

// Initialize orders DB with sample data from JSON if it's empty
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

// Call this on page load
document.addEventListener('DOMContentLoaded', initializeOrdersDB);

// APP STATE
let orderViewMode = 'active';

// ORDER LOGIC

function renderOrders(mode) {
    if (mode) { // Allows calling without args to just refresh
        orderViewMode = mode;
    }
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    // Update button styles
    const activeButton = document.querySelector('button[onclick="renderOrders(\'active\')"]');
    const historyButton = document.querySelector('button[onclick="renderOrders(\'history\')"]');
    if (orderViewMode === 'active') {
        activeButton.classList.add('btn-primary');
        activeButton.classList.remove('btn-outline');
        historyButton.classList.add('btn-outline');
        historyButton.classList.remove('btn-primary');
    } else {
        historyButton.classList.add('btn-primary');
        historyButton.classList.remove('btn-outline');
        activeButton.classList.add('btn-outline');
        activeButton.classList.remove('btn-primary');
    }

    const allOrders = getDB('foodhub_orders');
    // Get current seller from user data
    const user = Auth.getUser();
    const currentSeller = user ? (user.shopName || user.name + "'s Shop") : "Unknown Seller";
    
    const filteredOrders = allOrders.filter(order => {
        // Filter for the current seller
        if (order.provider !== currentSeller) return false;

        const isActive = !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(order.status);
        return orderViewMode === 'active' ? isActive : !isActive;
    });

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray); padding:30px;">No ${orderViewMode} orders found.</td></tr>`;
        return;
    }

    filteredOrders.sort((a,b) => b.id - a.id).forEach(order => {
        const tr = document.createElement('tr');
        
        let statusClass = '';
        let statusLabel = order.status.replace(/_/g, ' ');

        switch(order.status) {
            case 'PENDING': statusClass = 'status-pending'; break;
            case 'PREPARING': statusClass = 'status-preparing'; break;
            case 'ON_THE_WAY': statusClass = 'status-ontheway'; break;
            case 'READY': statusClass = 'status-ready'; break;
            case 'DELIVERED': statusClass = 'status-delivered'; break;
            case 'PICKED_UP': statusClass = 'status-pickedup'; break;
            case 'CANCELLED': statusClass = 'status-cancelled'; break;
        }

        let actionBtns = '';
        if (order.status === 'PENDING') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'PREPARING')">Accept</button> <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'CANCELLED')">Reject</button>`;
        } else if (order.status === 'PREPARING') {
            if (order.type === 'Delivery') actionBtns = `<button class="btn btn-info" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'ON_THE_WAY')">Send on Way</button>`;
            else actionBtns = `<button class="btn btn-purple" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'READY')">Mark Ready</button>`;
        } else if (order.status === 'ON_THE_WAY') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'DELIVERED')">Mark Delivered</button>`;
        } else if (order.status === 'READY') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus(${order.id}, 'PICKED_UP')">Mark Picked Up</button>`;
        } else {
            actionBtns = '<span style="color:var(--gray); font-size:12px;">Completed</span>';
        }

        const typeIcon = order.type === 'Delivery' ? '<i class="fa-solid fa-truck type-icon"></i>' : '<i class="fa-solid fa-shopping-bag type-icon"></i>';
        const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        tr.innerHTML = `
            <td><strong>#${order.id}</strong></td>
            <td>${order.customer.name}</td>
            <td>${typeIcon} ${order.type}</td>
            <td style="color:#555;">${itemsSummary}</td>
            <td style="font-weight:600;">৳${order.total}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStatus(id, newStatus) {
    const allOrders = getDB('foodhub_orders');
    const orderIndex = allOrders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        allOrders[orderIndex].status = newStatus;
        saveDB('foodhub_orders', allOrders);
        renderOrders(); // Refresh the current view
    }
}

// MENU LOGIC
let menuItems = [];

async function loadMenuItems() {
    const user = Auth.getUser();
    if (!user || !user.shopName) return;
    
    menuItems = await DataService.getMenuByProvider(user.shopName);
    renderMenu();
}

function renderMenu() {
    const tbody = document.getElementById('menu-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (menuItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--gray); padding:30px;">No items in your menu.</td></tr>';
        return;
    }

    menuItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${item.img}" alt="${item.name}" class="menu-img"></td>
            <td><strong>${item.name}</strong></td>
            <td><span style="background:#f1f2f6; padding:4px 8px; border-radius:4px; font-size:12px;">${item.category}</span></td>
            <td style="font-weight:600; color:var(--dark);">৳${item.price}</td>
            <td><label class="switch"><input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleAvailability(${item.id})"><span class="slider round"></span></label></td>
            <td>
                <button class="btn-icon" onclick="editItem(${item.id})"><i class="fa-solid fa-edit"></i></button> 
                <button class="btn-icon" onclick="deleteItem(${item.id})" style="color:#FF7675"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
}

const modal = document.getElementById('itemModal');
const form = document.getElementById('menuForm');
function openModal() { 
    if (form) form.reset(); 
    document.getElementById('modalTitle').innerText = "Add New Item"; 
    document.getElementById('itemId').value = ''; 
    modal.classList.add('open'); 
}
function closeModal() { modal.classList.remove('open'); }
function saveItem(event) { 
    event.preventDefault(); 
    // In a real app, this would update the JSON/DB
    showToast("Feature coming soon: Saving to persistent storage.");
    closeModal(); 
}
function editItem(id) { 
    showToast("Edit feature coming soon.");
}
function deleteItem(id) { 
    if(confirm("Delete?")) { 
        menuItems = menuItems.filter(i=>i.id!==id); 
        renderMenu(); 
        showToast("Item removed from view (session only)");
    } 
}
function toggleAvailability(id) { 
    const i = menuItems.find(i=>i.id===id); 
    if(i) {
        i.available = !i.available;
        showToast(`${i.name} is now ${i.available ? 'available' : 'unavailable'}`);
    }
}


// CHART FUNCTIONS
function updateWeeklySalesChart(days = 7) {
    const user = Auth.getUser();
    if (!user || user.role !== 'seller') return;
    
    const shopName = user.shopName || document.getElementById('sShopName')?.value;
    if (!shopName) return;
    
    const allOrders = getDB('foodhub_orders');
    const sellerOrders = allOrders.filter(o => o.provider === shopName);
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - Math.max(days, 7) + 1);
    
    // Initialize sales data for each day
    const salesData = {};
    const dayLabels = [];
    
    for (let i = Math.max(days, 7) - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        
        salesData[dateKey] = 0;
        dayLabels.push({ date: dateKey, label: dayName, sales: 0 });
    }
    
    // Group orders by date
    sellerOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        // Filter only delivered/completed orders
        if (['DELIVERED', 'PICKED_UP'].includes(order.status)) {
            const dateKey = orderDate.toISOString().split('T')[0];
            if (salesData.hasOwnProperty(dateKey)) {
                salesData[dateKey] += order.total;
            }
        }
    });
    
    // Update dayLabels with sales amounts
    dayLabels.forEach(day => {
        day.sales = salesData[day.date] || 0;
    });
    
    // Find max sales for scaling
    const maxSales = Math.max(...dayLabels.map(d => d.sales), 1);
    
    // Generate chart HTML
    const chartContainer = document.getElementById('weeklySalesChart');
    chartContainer.innerHTML = dayLabels.map(day => {
        const percentage = (day.sales / maxSales) * 100;
        const displaySales = day.sales > 0 ? `৳${day.sales}` : '৳0';
        return `<div class="bar" style="height: ${Math.max(percentage, 5)}%; position:relative;" data-label="${day.label}" title="${displaySales}">
            <span style="position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:12px; color:var(--gray); font-weight:500;">${day.label}</span>
            <span style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); font-size:11px; color:var(--dark); font-weight:600;">${displaySales}</span>
        </div>`;
    }).join('');
}

// DASHBOARD DATA
async function loadSellerDashboardData() {
    const user = Auth.getUser();
    if (!user || user.role !== 'seller') return;
    
    const shopName = user.shopName || document.getElementById('sShopName')?.value;
    if (!shopName) return;
    
    const allOrders = getDB('foodhub_orders');
    const sellerOrders = allOrders.filter(o => o.provider === shopName);
    
    const today = new Date().toDateString();
    const todayOrders = sellerOrders.filter(o => new Date(o.id).toDateString() === today);
    
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = sellerOrders.length;
    const pendingOrders = sellerOrders.filter(o => 
        !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
    ).length;
    
    const allReviews = await DataService.getReviews();
    const sellerReviews = allReviews.filter(r => r.providerName === shopName);
    const avgRating = sellerReviews.length > 0 
        ? (sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length).toFixed(1)
        : '0.0';
    const totalReviews = sellerReviews.length;
    
    const deliveryOrders = sellerOrders.filter(o => o.type === 'Delivery').length;
    const pickupOrders = sellerOrders.filter(o => o.type === 'Pickup').length;
    const deliveryPercent = totalOrders > 0 ? Math.round((deliveryOrders / totalOrders) * 100) : 0;
    const pickupPercent = totalOrders > 0 ? Math.round((pickupOrders / totalOrders) * 100) : 0;
    
    document.getElementById('dash-today-earnings').textContent = `৳ ${todayRevenue.toLocaleString()}`;
    document.getElementById('dash-total-orders').textContent = totalOrders;
    document.getElementById('dash-pending-orders').textContent = `Pending: ${pendingOrders}`;
    document.getElementById('dash-avg-rating').textContent = avgRating;
    document.getElementById('dash-review-count').textContent = `(${totalReviews})`;
    document.getElementById('dash-delivery-percent').textContent = `${deliveryPercent}%`;
    document.getElementById('dash-delivery-bar').style.width = `${deliveryPercent}%`;
    document.getElementById('dash-pickup-percent').textContent = `${pickupPercent}%`;
    document.getElementById('dash-pickup-bar').style.width = `${pickupPercent}%`;
    
    const recentOrdersContainer = document.getElementById('recent-orders-body');
    const recentOrders = sellerOrders.slice(-3).reverse();
    
    if (recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No orders yet</td></tr>';
    } else {
        recentOrdersContainer.innerHTML = recentOrders.map(order => {
            let statusClass = '';
            switch(order.status) {
                case 'PENDING': statusClass = 'status-pending'; break;
                case 'PREPARING': statusClass = 'status-preparing'; break;
                case 'ON_THE_WAY': statusClass = 'status-ontheway'; break;
                case 'READY': statusClass = 'status-ready'; break;
                case 'DELIVERED': statusClass = 'status-delivered'; break;
                case 'PICKED_UP': statusClass = 'status-pickedup'; break;
                case 'CANCELLED': statusClass = 'status-cancelled'; break;
            }
            return `
                <tr>
                    <td>#${order.id.toString().slice(-4)}</td>
                    <td>${order.customer.name}</td>
                    <td><i class="fa-solid fa-${order.type === 'Delivery' ? 'truck' : 'shopping-bag'} type-icon"></i> ${order.type}</td>
                    <td><span class="status-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</span></td>
                </tr>
            `;
        }).join('');
    }
    
    // Update the weekly sales chart
    updateWeeklySalesChart(7);
}

// NAVIGATION
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionId).classList.remove('hidden');
    const link = document.getElementById('link-' + sectionId);
    if (link) link.classList.add('active');

    if (sectionId === 'home') {
        loadSellerDashboardData();
    }
    
    if (sectionId === 'orders') {
        renderOrders('active');
    }
    
    if (sectionId === 'reviews') {
        renderSellerReviews();
    }
}

async function renderSellerReviews() {
    const user = Auth.getUser();
    if (!user || user.role !== 'seller') return;
    
    const shopName = user.shopName || document.getElementById('sShopName')?.value;
    if (!shopName) return;
    
    const allReviews = await DataService.getReviews();
    const sellerReviews = allReviews.filter(r => r.providerName === shopName);
    
    const avgRating = sellerReviews.length > 0 
        ? (sellerReviews.reduce((acc, r) => acc + r.rating, 0) / sellerReviews.length).toFixed(1)
        : '0.0';
    
    document.getElementById('seller-avg-rating').textContent = avgRating;
    document.getElementById('seller-total-reviews').textContent = sellerReviews.length;
    
    const container = document.getElementById('seller-reviews-list');
    
    if (sellerReviews.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:var(--gray);">
                <i class="fa-solid fa-comment-slash" style="font-size:48px; margin-bottom:15px; display:block;"></i>
                <p>No reviews yet. Reviews will appear here once customers submit them.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sellerReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(review => {
        const stars = Array(5).fill(0).map((_, i) => 
            i < review.rating ? '<i class="fa-solid fa-star" style="color:var(--warning);"></i>' : '<i class="fa-regular fa-star" style="color:var(--border);"></i>'
        ).join('');
        
        const date = new Date(review.timestamp).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="review-item" style="padding:20px; border-bottom:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div>
                        <span style="font-weight:700; color:var(--dark);">${review.buyerName}</span>
                        <span style="color:var(--gray); font-size:13px; margin-left:10px;">${date}</span>
                    </div>
                    <div style="color:var(--warning);">${stars}</div>
                </div>
                <p style="color:#555; font-size:14px; line-height:1.6; margin:0;">${review.comment}</p>
            </div>
        `;
    }).join('');
}

function enableEdit() {
    ['sName', 'sPhone', 'sShopName', 'sLocation', 'sDescription', 'sOpenTime', 'sCloseTime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
    document.getElementById('btnEdit').classList.add('hidden');
    document.getElementById('btnSave').classList.remove('hidden');
    document.getElementById('btnCancel').classList.remove('hidden');
}

function cancelEdit() {
    ['sName', 'sPhone', 'sShopName', 'sLocation', 'sDescription', 'sOpenTime', 'sCloseTime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
    document.getElementById('btnEdit').classList.remove('hidden');
    document.getElementById('btnSave').classList.add('hidden');
    document.getElementById('btnCancel').classList.add('hidden');
}

function saveProfile(e) {
    e.preventDefault();
    
    const updatedData = {
        name: document.getElementById('sName').value,
        phone: document.getElementById('sPhone').value,
        shopName: document.getElementById('sShopName').value,
        location: document.getElementById('sLocation').value,
        description: document.getElementById('sDescription').value,
        openTime: document.getElementById('sOpenTime').value,
        closeTime: document.getElementById('sCloseTime').value
    };
    
    if (Auth.updateUserInDB(updatedData)) {
        document.getElementById('sellerNameDisplay').textContent = updatedData.shopName;
        cancelEdit();
        showToast("Profile Saved");
    } else {
        showToast("Error saving profile", "error");
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=seller.html';
        return;
    }
    
    const user = Auth.getUser();
    if (user && user.role === 'seller') {
        document.getElementById('sellerNameDisplay').textContent = user.shopName || user.name + "'s Shop";
        
        const welcomeTitle = document.querySelector('#home .welcome-box h1');
        if (welcomeTitle) {
            welcomeTitle.textContent = 'Hello, ' + (user.name.split(' ')[0] || 'Seller') + '!';
        }
        
        const fields = ['sName', 'sEmail', 'sPhone', 'sShopName', 'sLocation', 'sDescription', 'sOpenTime', 'sCloseTime'];
        const userFields = ['name', 'email', 'phone', 'shopName', 'location', 'description', 'openTime', 'closeTime'];
        
        fields.forEach((fieldId, index) => {
            const el = document.getElementById(fieldId);
            if (el && user[userFields[index]]) {
                el.value = user[userFields[index]];
            }
        });
    }
    
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
    
    document.getElementById('navBusiness').addEventListener('click', function() {
        showSection('account');
    });

    loadMenuItems();
    showSection('home');
    // loadSellerDashboardData();
});


document.querySelector('.nav-logo').addEventListener('click', ()=>{
    showSection('home');
});
