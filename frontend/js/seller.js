// SELLER DASHBOARD - API-CONNECTED VERSION

function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
        t.querySelector('span').innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}

// APP STATE
let orderViewMode = 'active';
let sellerOrders = [];
let sellerProvider = null;

// ORDER LOGIC

async function loadSellerOrders() {
    try {
        sellerOrders = await DataService.getSellerOrders();
        renderOrders();
    } catch (error) {
        console.error('Error loading seller orders:', error);
    }
}

function renderOrders(mode) {
    if (mode) {
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

    const filteredOrders = sellerOrders.filter(order => {
        const isActive = !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(order.status);
        return orderViewMode === 'active' ? isActive : !isActive;
    });

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--gray); padding:30px;">No ${orderViewMode} orders found.</td></tr>`;
        return;
    }

    filteredOrders.forEach(order => {
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
        const orderId = order._id;
        if (order.status === 'PENDING') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'PREPARING')">Accept</button> <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'CANCELLED')">Reject</button>`;
        } else if (order.status === 'PREPARING') {
            if (order.type === 'delivery') actionBtns = `<button class="btn btn-info" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'ON_THE_WAY')">Send on Way</button>`;
            else actionBtns = `<button class="btn btn-purple" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'READY')">Mark Ready</button>`;
        } else if (order.status === 'ON_THE_WAY') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'DELIVERED')">Mark Delivered</button>`;
        } else if (order.status === 'READY') {
            actionBtns = `<button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="updateStatus('${orderId}', 'PICKED_UP')">Mark Picked Up</button>`;
        } else {
            actionBtns = '<span style="color:var(--gray); font-size:12px;">Completed</span>';
        }

        const typeIcon = order.type === 'delivery' ? '<i class="fa-solid fa-truck type-icon"></i>' : '<i class="fa-solid fa-shopping-bag type-icon"></i>';
        const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        const customerName = order.customer ? order.customer.name : 'Unknown';

        tr.innerHTML = `
            <td><strong>#${orderId.slice(-6)}</strong></td>
            <td>${customerName}</td>
            <td>${typeIcon} ${order.type}</td>
            <td style="color:#555;">${itemsSummary}</td>
            <td style="font-weight:600;">৳${order.total}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateStatus(orderId, newStatus) {
    try {
        await DataService.updateOrderStatus(orderId, newStatus);
        // Update local state
        const orderIndex = sellerOrders.findIndex(o => o._id === orderId);
        if (orderIndex !== -1) {
            sellerOrders[orderIndex].status = newStatus;
        }
        renderOrders();
        showToast(`Order status updated to ${newStatus}`);
    } catch (error) {
        showToast('Error updating order status');
    }
}

// MENU LOGIC
let menuItems = [];

async function loadMenuItems() {
    try {
        if (sellerProvider) {
            menuItems = await DataService.getMenuByProvider(sellerProvider._id);
        } else {
            menuItems = await DataService.getMenu();
        }
        renderMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
    }
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
            <td><label class="switch"><input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleAvailability('${item._id}')"><span class="slider round"></span></label></td>
            <td>
                <button class="btn-icon" onclick="editItem('${item._id}')"><i class="fa-solid fa-edit"></i></button> 
                <button class="btn-icon" onclick="deleteItem('${item._id}')" style="color:#FF7675"><i class="fa-solid fa-trash"></i></button>
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
function closeModal() { 
    modal.classList.remove('open'); 
    if (form) form.reset();
}
async function saveItem(event) { 
    event.preventDefault(); 
    
    const id = document.getElementById('itemId').value;
    const itemData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        img: document.getElementById('itemImageUrl').value,
        desc: document.getElementById('itemDesc').value
    };

    try {
        if (id) {
            await DataService.updateMenuItem(id, itemData);
            showToast("Item updated successfully!");
        } else {
            await DataService.createMenuItem(itemData);
            showToast("Item added successfully!");
        }
        closeModal();
        loadMenuItems(); // Reload the whole list
    } catch (error) {
        showToast(error.message || "Error saving item", "error");
    }
}
function editItem(id) { 
    const item = menuItems.find(i => i._id === id);
    if (!item) return;

    document.getElementById('modalTitle').innerText = "Edit Item";
    document.getElementById('itemId').value = item._id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImageUrl').value = item.img || '';
    document.getElementById('itemDesc').value = item.desc || '';
    
    modal.classList.add('open');
}
async function deleteItem(id) { 
    if(confirm("Are you sure you want to delete this item?")) { 
        try {
            await DataService.deleteMenuItem(id);
            showToast("Item removed successfully");
            loadMenuItems(); // Refresh list
        } catch (error) {
            showToast("Error deleting item", "error");
        }
    } 
}
async function toggleAvailability(id) { 
    const i = menuItems.find(i => i._id === id); 
    if(i) {
        const originalStatus = i.available;
        const newStatus = !originalStatus;
        try {
            await DataService.updateMenuItem(id, { available: newStatus });
            i.available = newStatus;
            showToast(`${i.name} is now ${i.available ? 'available' : 'unavailable'}`);
        } catch (error) {
            console.error('Error toggling availability:', error);
            showToast('Error updating availability');
            renderMenu(); // Rerender to revert the checkbox state
        }
    }
}


// CHART FUNCTIONS
function updateWeeklySalesChart(days = 7) {
    // Use sellerOrders (already loaded from API)
    const now = new Date();
    
    const dayLabels = [];
    const salesData = {};
    
    for (let i = Math.max(days, 7) - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        
        salesData[dateKey] = 0;
        dayLabels.push({ date: dateKey, label: dayName, sales: 0 });
    }
    
    sellerOrders.forEach(order => {
        if (['DELIVERED', 'PICKED_UP'].includes(order.status)) {
            const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
            if (salesData.hasOwnProperty(dateKey)) {
                salesData[dateKey] += order.total;
            }
        }
    });
    
    dayLabels.forEach(day => {
        day.sales = salesData[day.date] || 0;
    });
    
    const maxSales = Math.max(...dayLabels.map(d => d.sales), 1);
    
    const chartContainer = document.getElementById('weeklySalesChart');
    if (!chartContainer) return;
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
    // Use already-loaded sellerOrders
    const todayStr = new Date().toDateString();
    const todayOrders = sellerOrders.filter(o => 
        new Date(o.createdAt).toDateString() === todayStr && 
        ['DELIVERED', 'PICKED_UP'].includes(o.status)
    );
    
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = sellerOrders.length;
    const pendingOrders = sellerOrders.filter(o => 
        !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
    ).length;
    
    // Get reviews for this provider
    let avgRating = '0.0';
    let totalReviews = 0;
    if (sellerProvider) {
        try {
            const reviews = await DataService.getReviews(sellerProvider._id);
            totalReviews = reviews.length;
            avgRating = totalReviews > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
                : '0.0';
        } catch (e) {
            console.error('Error loading reviews:', e);
        }
    }
    
    const completedOrders = sellerOrders.filter(o => ['DELIVERED', 'PICKED_UP'].includes(o.status));
    const deliveryOrders = completedOrders.filter(o => o.type === 'delivery').length;
    const pickupOrders = completedOrders.filter(o => o.type === 'pickup').length;
    const totalCompleted = completedOrders.length;
    
    const deliveryPercent = totalCompleted > 0 ? Math.round((deliveryOrders / totalCompleted) * 100) : 0;
    const pickupPercent = totalCompleted > 0 ? Math.round((pickupOrders / totalCompleted) * 100) : 0;
    
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
            const customerName = order.customer ? order.customer.name : 'Unknown';
            return `
                <tr>
                    <td>#${order._id.slice(-4)}</td>
                    <td>${customerName}</td>
                    <td><i class="fa-solid fa-${order.type === 'delivery' ? 'truck' : 'shopping-bag'} type-icon"></i> ${order.type}</td>
                    <td><span class="status-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</span></td>
                </tr>
            `;
        }).join('');
    }
    
    updateWeeklySalesChart(7);
    renderTopSellingItems();
}

function renderTopSellingItems() {
    const listContainer = document.getElementById('top-selling-list');
    if (!listContainer) return;

    // Aggregate sales from completed orders
    const salesCount = {};
    sellerOrders.forEach(order => {
        if (['DELIVERED', 'PICKED_UP'].includes(order.status)) {
            order.items.forEach(item => {
                salesCount[item.name] = (salesCount[item.name] || 0) + item.qty;
            });
        }
    });

    // Convert to array and sort
    const sortedItems = Object.entries(salesCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3); // Top 3

    if (sortedItems.length === 0) {
        listContainer.innerHTML = '<p style="color:var(--gray); text-align:center; padding:20px;">No sales data available yet.</p>';
        return;
    }

    listContainer.innerHTML = sortedItems.map((item, index) => `
        <div class="item-rank">
            <div class="rank-number">${index + 1}</div>
            <div style="flex:1">
                <span style="font-size:14px; font-weight:600; color:var(--dark);">${item.name}</span><br>
                <small style="color:var(--gray)">${item.qty} sold</small>
            </div>
        </div>
    `).join('');
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
    if (!sellerProvider) return;
    
    try {
        const sellerReviews = await DataService.getReviewsByProvider(sellerProvider._id);

        
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
        
        container.innerHTML = sellerReviews.map(review => {
            const stars = Array(5).fill(0).map((_, i) => 
                i < review.rating ? '<i class="fa-solid fa-star" style="color:var(--warning);"></i>' : '<i class="fa-regular fa-star" style="color:var(--border);"></i>'
            ).join('');
            
            const date = new Date(review.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const buyerName = review.buyer ? review.buyer.name : 'Anonymous';
            
            return `
                <div class="review-item" style="padding:20px; border-bottom:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div>
                            <span style="font-weight:700; color:var(--dark);">${buyerName}</span>
                            <span style="color:var(--gray); font-size:13px; margin-left:10px;">${date}</span>
                        </div>
                        <div style="color:var(--warning);">${stars}</div>
                    </div>
                    <p style="color:#555; font-size:14px; line-height:1.6; margin:0;">${review.comment}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
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

async function saveProfile(e) {
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
    
    try {
        await DataService.updateProfile(updatedData);
        Auth.updateUser(updatedData);
        document.getElementById('sellerNameDisplay').textContent = updatedData.shopName;
        cancelEdit();
        showToast("Profile Saved Successfully!");
    } catch (error) {
        showToast(error.message || "Error saving profile", "error");
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading screen initially
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'flex';

    // Initialize Auth (fetches profile from DB)
    const user = await Auth.init();
    
    if (!user || user.role !== 'seller') {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html?redirect=seller.html';
        } else {
            alert('Access denied. Seller accounts only.');
            window.location.href = 'index.html';
        }
        return;
    }
    
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

    
    // Load seller's provider info
    try {
        sellerProvider = await DataService.getMyProvider();
    } catch (e) {
        console.warn('Could not load provider info:', e);
    }

    // Load orders
    await loadSellerOrders();
    
    // Update Dashboard UI (Numbers and Charts)
    loadSellerDashboardData();
    updateWeeklySalesChart();
    
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
});



document.querySelector('.nav-logo').addEventListener('click', ()=>{
    showSection('home');
});
