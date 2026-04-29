let currentMode = 'login'; // login or register
let currentRole = 'student'; // student or seller

function openAuth(mode) {
    toggleMode(mode);
    document.getElementById('authModal').classList.add('open');
}

function closeAuth() {
    document.getElementById('authModal').classList.remove('open');
}

function switchRole(role) {
    currentRole = role;
    
    // UI Updates
    document.getElementById('tab-student').classList.toggle('active', role === 'student');
    document.getElementById('tab-seller').classList.toggle('active', role === 'seller');
    document.getElementById('tab-admin').classList.toggle('active', role === 'admin');

    // Update Dynamic Field in Register Form
    const dynamicField = document.getElementById('dynamicField');
    const dynamicLabel = dynamicField.querySelector('label');
    const dynamicInput = dynamicField.querySelector('input');
    
    if (role === 'student') {
        dynamicField.style.display = 'block';
        dynamicLabel.innerText = "Student ID";
        dynamicInput.placeholder = "1904055";
    } else if (role === 'seller') {
        dynamicField.style.display = 'block';
        dynamicLabel.innerText = "Canteen / Business Name";
        dynamicInput.placeholder = "e.g. QK Hall Dining";
    } else { // Admin
        dynamicField.style.display = 'none';
    }
}

function toggleMode(mode) {
    currentMode = mode;
    const title = document.getElementById('modalTitle');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (mode === 'login') {
        title.innerText = "Welcome Back";
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
    } else {
        title.innerText = "Create Account";
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        // Ensure the correct fields are shown for the active role on registration form
        switchRole(currentRole);
    }
}

function handleLogin(e) {
    e.preventDefault();
    // Simulation Logic
    if (currentRole === 'student') {
        window.location.href = "customer.html";
    } else if (currentRole === 'seller') {
        window.location.href = "seller.html";
    } else { // Admin
        window.location.href = "admin.html";
    }
}

function handleRegister(e) {
    e.preventDefault();
    alert("Registration Successful! Logging you in...");
    handleLogin(e); // Redirect after alert
}

// Check if already logged in and update UI
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        const user = await Auth.init();
        if (user) {
            // Redirect Sellers and Admins away from home page
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
                return;
            }
            if (user.role === 'seller') {
                window.location.href = 'seller.html';
                return;
            }

            // For Customers, just update the navbar
            const navBtns = document.querySelector('.nav-btns');
            if (navBtns) {
                navBtns.innerHTML = `
                    <a href="customer.html" class="btn btn-text">Dashboard</a>
                    <a href="#" id="logoutBtn" class="btn btn-primary">Logout</a>
                `;
                
                document.getElementById('logoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout();
                });
            }
        }
    }
});
