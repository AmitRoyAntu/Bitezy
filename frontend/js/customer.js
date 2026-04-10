// DATABASE SIMULATION
// Use localStorage to persist data across sessions and pages
const getDB = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return [];
    }
};

const saveDB = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showToast('Error saving data. Storage may be full.', 'error');
    }
};

// Initialize orders DB if it doesn't exist
if (!localStorage.getItem('foodhub_orders')) {
    try {
        localStorage.setItem('foodhub_orders', JSON.stringify([]));
    } catch (e) {
        console.error('Failed to initialize orders DB:', e);
    }
}

// DATA
let providers = [];
let foodItems = [];

async function loadData() {
    providers = await DataService.getProviders();
    foodItems = await DataService.getMenu();
    
    const existingOrders = getDB('foodhub_orders');
    if (existingOrders.length === 0) {
        const orders = await DataService.getOrders();
        saveDB('foodhub_orders', orders);
    }
    
    renderProviders();
}

if (typeof DataService !== 'undefined') {
    loadData();
}

// APP STATE
let cart = [];
let currentProvider = "";
let activeCat = "All";
let currentReviews = [];
let currentRating = 0;

// RENDERING & UI

function renderProviders() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const grid = document.getElementById('hallList');
    grid.innerHTML = '';
    const list = providers.filter(p => 
        (activeCat === 'All' || p.type === activeCat) && 
        p.name.toLowerCase().includes(q)
    );
    
    if (list.length === 0) {
        grid.innerHTML = '<p style="color:#888; grid-column:1/-1; text-align:center;">No places found.</p>';
        return;
    }

    list.forEach(p => {
        grid.innerHTML += `
            <div class="provider-card" onclick="openMenu('${p.name}')">
                <div class="p-img-box">
                    <img src="${p.img}" class="p-img">
                    <div class="p-tag">${p.type}</div>
                </div>
                <div class="p-info">
                    <div class="p-name">${p.name}</div>
                    <div class="p-meta"><i class="fa-solid fa-star" style="color:#FF9F43"></i> 4.5 &bull; 20 min</div>
                </div>
            </div>`;
    });
}

function renderMenuGrid() {
    const grid = document.getElementById('foodGrid');
    grid.innerHTML = '';
    const itemsForProvider = foodItems.filter(item => item.provider === currentProvider);

    itemsForProvider.forEach(i => {
        const cartItem = cart.find(c => c.name === i.name);
        const qty = cartItem ? cartItem.qty : 0;
        const actionHtml = qty > 0 
            ? `<div class="counter">
                   <button class="c-btn" onclick="updateQty('${i.name}', ${i.price}, -1, '${i.img}')">-</button>
                   <span>${qty}</span>
                   <button class="c-btn" onclick="updateQty('${i.name}', ${i.price}, 1, '${i.img}')">+</button>
               </div>`
            : `<button class="btn-add" onclick="updateQty('${i.name}', ${i.price}, 1, '${i.img}')">
                   <i class="fa-solid fa-plus"></i>
               </button>`;
        
        grid.innerHTML += `
            <div class="food-card">
                <img src="${i.img}" class="f-img">
                <div class="f-info">
                    <div class="f-name">${i.name}</div>
                    <div class="f-desc">${i.desc}</div>
                    <div class="f-bottom">
                        <div class="f-price">৳ ${i.price}</div>
                        ${actionHtml}
                    </div>
                </div>
            </div>`;
    });
}

function renderCart() {
    const listEl = document.getElementById('cartItemsList');
    const badgeEl = document.getElementById('sidebarCartCount');
    const subtotalEl = document.getElementById('cartSubtotal');
    const feeEl = document.getElementById('cartFee');
    const totalEl = document.getElementById('cartTotalDisplay');
    const providerNameEl = document.getElementById('cartProviderName');
    
    let subtotal = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="text-align:center; padding:50px 20px;">' +
            '<i class="fa-solid fa-shopping-basket" style="font-size:48px;color:#ddd;margin-bottom:15px;"></i>' +
            '<h3 style="color:var(--gray);margin-bottom:10px;">Your cart is empty</h3>' +
            '<p style="color:#999;margin-bottom:20px;">Browse our providers and add items to your cart</p>' +
            '<button class="btn btn-primary" onclick="showSection(\'browse\')">Browse Food</button>' +
            '</div>';
        providerNameEl.innerText = "...";
    } else {
        listEl.innerHTML = '';
        providerNameEl.innerText = cart[0].provider;
        cart.forEach((item, index) => {
            subtotal += item.price * item.qty;
            totalItems += item.qty;
            listEl.innerHTML += `
                <div class="cart-item">
                    <div class="ci-info">
                        <img src="${item.img}" class="ci-img">
                        <div>
                            <div style="font-weight:600;">${item.name}</div>
                            <div style="font-size:12px; color:#888;">৳${item.price} x ${item.qty}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-weight:700;">৳ ${item.price * item.qty}</div>
                        <i class="fa-solid fa-trash" style="color:var(--primary); cursor:pointer;" onclick="removeItem(${index})"></i>
                    </div>
                </div>`;
        });
    }
    
    const deliveryType = document.querySelector('input[name="orderType"]:checked').value;
    const deliveryFee = (cart.length > 0 && deliveryType === 'Delivery') ? 30 : 0;
    
    badgeEl.innerText = totalItems;
    subtotalEl.innerText = `৳ ${subtotal}`;
    feeEl.innerText = `৳ ${deliveryFee}`;
    totalEl.innerText = `৳ ${subtotal + deliveryFee}`;
}

function renderHistory() {
    const tbody = document.getElementById('historyTableBody');
    const orders = getDB('foodhub_orders');
    // Assuming a hardcoded user for now
    const user = Auth ? Auth.getUser() : { name: 'Guest' };
    const userOrders = orders.filter(o => o.customer.name === user.name).sort((a, b) => b.id - a.id);

    tbody.innerHTML = '';
    if (userOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 60px 20px;">' +
            '<i class="fa-solid fa-receipt" style="font-size:48px;color:#ddd;margin-bottom:15px;display:block;"></i>' +
            '<h3 style="color:var(--gray);margin-bottom:10px;">No orders yet</h3>' +
            '<p style="color:#999;">Your order history will appear here</p>' +
            '</td></tr>';
        return;
    }

    userOrders.forEach(order => {
        let statusClass = '';
        let statusText = order.status.replace('_', ' ').toUpperCase();

        switch (order.status) {
            case 'PENDING': statusClass = 'bs-pending'; break;
            case 'PREPARING': statusClass = 'bs-prep'; break;
            case 'ON_THE_WAY': statusClass = 'bs-way'; break;
            case 'READY': statusClass = 'bs-way'; statusText = 'READY FOR PICKUP'; break; // Use same color for READY
            case 'DELIVERED': statusClass = 'bs-done'; break;
            case 'PICKED_UP': statusClass = 'bs-done'; break;
            case 'CANCELLED': statusClass = 'bs-cancelled'; break; // Use a new class for cancelled
            default: statusClass = 'bs-prep';
        }
        
        tbody.innerHTML += `
            <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:20px; font-weight:600;">#${order.id}</td>
                <td style="padding:20px;">${order.provider}</td>
                <td style="padding:20px; color:var(--text-gray);">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
                <td style="padding:20px; font-weight:700;">৳ ${order.total}</td>
                <td style="padding:20px;"><span class="badge-status ${statusClass}">${statusText}</span></td>
            </tr>`;
    });
}


// ACTIONS & LOGIC

function setCategory(c, btn) {
    activeCat = c;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProviders();
}

function openMenu(name) {
    if (cart.length > 0 && cart[0].provider !== name) {
        if (confirm(`You have items from ${cart[0].provider} in your cart. Clear cart and switch to ${name}?`)) {
            cart = [];
        } else {
            return;
        }
    }
    currentProvider = name;
    document.getElementById('menuTitle').textContent = name;
    
    const provider = providers.find(p => p.name === name);
    if (provider) {
        loadReviews(provider.id);
        loadProviderDetails(provider);
    }
    
    renderMenuGrid();
    showSection('menu-view');
    renderCart();
    
    document.getElementById('menu-tab').classList.remove('hidden');
    document.getElementById('reviews-tab').classList.add('hidden');
    document.querySelectorAll('.provider-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.provider-tabs .tab-btn:first-child').classList.add('active');
}

function loadProviderDetails(provider) {
    document.getElementById('provider-location').textContent = provider.location || 'N/A';
    document.getElementById('provider-delivery-time').textContent = provider.deliveryTime || 'N/A';
    document.getElementById('provider-rating').textContent = provider.rating ? provider.rating + ' / 5' : 'N/A';
    
    const statusEl = document.getElementById('provider-status');
    if (provider.isOpen) {
        statusEl.textContent = 'Open';
        statusEl.className = 'status-badge status-open';
        statusEl.style.cssText = 'background: #D4EDDA; color: #155724; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;';
    } else {
        statusEl.textContent = 'Closed';
        statusEl.className = 'status-badge status-closed';
        statusEl.style.cssText = 'background: #F8D7DA; color: #721C24; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;';
    }
    
    const descEl = document.getElementById('provider-description');
    if (provider.description) {
        descEl.querySelector('p').textContent = provider.description;
        descEl.style.display = 'block';
    } else {
        descEl.style.display = 'none';
    }
}

function confirm(message) {
    return window.confirm(message);
}

function updateQty(name, price, delta, img) {
    const existingItemIndex = cart.findIndex(item => item.name === name);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].qty += delta;
        if (cart[existingItemIndex].qty <= 0) {
            cart.splice(existingItemIndex, 1);
        }
    } else if (delta > 0) {
        cart.push({ name, price, qty: 1, provider: currentProvider, img });
        showToast("Added to Cart");
    }
    
    renderMenuGrid();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    renderCart();
    renderMenuGrid(); // Update menu to show the add button again
}

function placeOrder() {
    if (cart.length === 0) {
        showToast("Your cart is empty!", 'warning');
        return;
    }

    const allOrders = getDB('foodhub_orders');
    const deliveryType = document.querySelector('input[name="orderType"]:checked').value;
    const deliveryFee = deliveryType === 'Delivery' ? 30 : 0;
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const newOrder = {
        id: Date.now(), // Unique ID
        customer: {
            name: document.getElementById('navbarName').innerText,
            hall: document.getElementById('navbarHall').innerText
        },
        provider: cart[0].provider,
        items: cart,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: subtotal + deliveryFee,
        type: deliveryType,
        status: 'PENDING' // Initial status
    };

    allOrders.push(newOrder);
    saveDB('foodhub_orders', allOrders);

    cart = [];
    renderCart();
    showToast("Order Placed Successfully!");
    
    showSection('history');
    showSection('history');
}

// NAVIGATION & UTILS

function showSection(id) {
    ['browse', 'menu-view', 'cart', 'history', 'profile'].forEach(secId => {
        document.getElementById(secId).classList.add('hidden');
    });
    
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    
    document.getElementById(id).classList.remove('hidden');
    const activeLink = document.getElementById('link-' + id);
    if (activeLink) activeLink.classList.add('active');

    if (id === 'history') {
        renderHistory();
    }
    
    if (id === 'cart') {
        renderCart();
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.querySelector('span').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function enableEdit() {
    ['pName', 'pPhone', 'pBuyerType', 'pCuetId', 'pDepartment', 'pHall'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
    document.getElementById('btnEdit').classList.add('hidden');
    document.getElementById('btnSave').classList.remove('hidden');
    document.getElementById('btnCancel').classList.remove('hidden');
}

function cancelEdit() {
    ['pName', 'pPhone', 'pBuyerType', 'pCuetId', 'pDepartment', 'pHall'].forEach(id => {
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
        name: document.getElementById('pName').value,
        phone: document.getElementById('pPhone').value,
        buyerType: document.getElementById('pBuyerType').value,
        cuetId: document.getElementById('pCuetId').value,
        department: document.getElementById('pDepartment').value,
        hall: document.getElementById('pHall').value
    };
    
    if (Auth.updateUserInDB(updatedData)) {
        document.getElementById('navbarName').innerText = updatedData.name;
        document.getElementById('navbarHall').innerText = updatedData.hall;
        cancelEdit();
        showToast("Profile Saved");
    } else {
        showToast("Error saving profile", "error");
    }
}


// INITIALIZATION
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=customer.html';
        return;
    }
    
    const user = Auth.getUser();
    if (user) {
        document.getElementById('navbarName').textContent = user.name || 'User';
        document.getElementById('navbarHall').textContent = user.hall || '';
        
        if (document.getElementById('pName')) {
            document.getElementById('pName').value = user.name || '';
        }
        if (document.getElementById('pEmail')) {
            document.getElementById('pEmail').value = user.email || '';
        }
        if (document.getElementById('pPhone')) {
            document.getElementById('pPhone').value = user.phone || '';
        }
        if (document.getElementById('pBuyerType')) {
            document.getElementById('pBuyerType').value = user.buyerType || 'Student';
            const isStudent = user.buyerType === 'Student';
            document.getElementById('cuetIdGroup').style.display = isStudent ? 'block' : 'none';
            document.getElementById('deptGroup').style.display = isStudent ? 'block' : 'none';
        }
        if (document.getElementById('pCuetId')) {
            document.getElementById('pCuetId').value = user.cuetId || '';
        }
        if (document.getElementById('pDepartment')) {
            document.getElementById('pDepartment').value = user.department || '';
        }
        if (document.getElementById('pHall')) {
            document.getElementById('pHall').value = user.hall || '';
        }
        
        document.getElementById('pBuyerType').addEventListener('change', function() {
            const isStudent = this.value === 'Student';
            document.getElementById('cuetIdGroup').style.display = isStudent ? 'block' : 'none';
            document.getElementById('deptGroup').style.display = isStudent ? 'block' : 'none';
        });
        
        const heroTitle = document.querySelector('#browse .hero-banner h1');
        if (heroTitle) {
            heroTitle.textContent = 'Hungry, ' + (user.name.split(' ')[0] || 'there') + '?';
        }
    }
    
    document.getElementById('loading-screen').style.display = 'none';
    
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });

    document.querySelectorAll('input[name="orderType"]').forEach(radio => {
        radio.addEventListener('change', renderCart);
    });

    document.getElementById('searchInput').addEventListener('input', debounce(renderProviders, 300));

    setCategory('All', document.querySelector('.tab-btn'));
    showSection('browse');
});
async function loadReviews(providerId) {
    currentReviews = await DataService.getReviewsByProvider(providerId);
    renderReviews();
}

function renderReviews() {
    const container = document.getElementById('reviewsList');
    const avgRatingEl = document.getElementById('avgRatingValue');
    const avgStarsEl = document.getElementById('avgRatingStars');
    const reviewCountEl = document.getElementById('totalReviewCount');
    const badgeEl = document.getElementById('reviewCountBadge');
    
    const avgRating = currentReviews.length > 0 
        ? (currentReviews.reduce((acc, r) => acc + r.rating, 0) / currentReviews.length).toFixed(1)
        : 0;
    
    if (avgRatingEl) avgRatingEl.textContent = avgRating;
    if (avgStarsEl) avgStarsEl.innerHTML = renderStarRating(avgRating);
    if (reviewCountEl) reviewCountEl.textContent = `${currentReviews.length} reviews`;
    if (badgeEl) badgeEl.textContent = currentReviews.length;
    
    if (currentReviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <i class="fa-solid fa-comment-dots"></i>
                <p>No reviews yet. Be the first to review!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="reviewer-name">${review.buyerName}</span>
                <span class="review-time">${formatTimeAgo(review.timestamp)}</span>
            </div>
            <div class="stars">${renderStarRating(review.rating)}</div>
            <p class="review-text">${review.comment}</p>
        </div>
    `).join('');
}

function renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fa-solid fa-star"></i>';
    }
    if (hasHalf) {
        html += '<i class="fa-solid fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="fa-regular fa-star"></i>';
    }
    
    return html;
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function switchProviderTab(tab, btn) {
    document.querySelectorAll('.provider-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.getElementById('menu-tab').classList.toggle('hidden', tab !== 'menu');
    document.getElementById('reviews-tab').classList.toggle('hidden', tab !== 'reviews');
}

function openReviewModal() {
    currentRating = 0;
    document.getElementById('reviewRating').value = 0;
    document.getElementById('reviewComment').value = '';
    updateStarInput(0);
    document.getElementById('reviewModal').classList.add('open');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('open');
}

function setRating(rating) {
    currentRating = rating;
    document.getElementById('reviewRating').value = rating;
    updateStarInput(rating);
}

function updateStarInput(rating) {
    document.querySelectorAll('.star-rating-input i').forEach((star, index) => {
        star.classList.toggle('fa-solid', index < rating);
        star.classList.toggle('fa-regular', index >= rating);
        star.classList.toggle('active', index < rating);
    });
}

async function submitReview(e) {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;
    
    if (rating === 0) {
        showToast('Please select a rating');
        return;
    }
    
    if (!comment.trim()) {
        showToast('Please write a review');
        return;
    }
    
    const user = Auth.getUser();
    const provider = providers.find(p => p.name === currentProvider);
    
    const newReview = {
        id: Date.now(),
        providerId: provider ? provider.id : 0,
        providerName: currentProvider,
        buyerName: user ? user.name : 'Guest',
        buyerId: user ? user.id : 'guest',
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString()
    };
    
    const allReviews = await DataService.getReviews();
    allReviews.push(newReview);
    
    try {
        localStorage.setItem('bitezy_reviews', JSON.stringify(allReviews));
        currentReviews.unshift(newReview);
        renderReviews();
        closeReviewModal();
        showToast('Review submitted successfully!');
    } catch (err) {
        console.error('Error saving review:', err);
        showToast('Error submitting review');
    }
}

// Missing function stubs that are called from HTML
function filterProviders() {
    renderProviders();
}

function updateCartDisplay() {
    renderCart();
}
