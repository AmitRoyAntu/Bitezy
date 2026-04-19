const roleOptions = document.querySelectorAll('.role-option');
const buyerFields = document.getElementById('buyerFields');
const sellerFields = document.getElementById('sellerFields');

roleOptions.forEach(option => {
    option.addEventListener('click', function() {
        roleOptions.forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        
        const role = this.dataset.role;
        
        if (role === 'buyer') {
            buyerFields.classList.remove('hidden');
            sellerFields.classList.add('hidden');
        } else {
            buyerFields.classList.add('hidden');
            sellerFields.classList.remove('hidden');
        }
    });
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
    
    const role = document.querySelector('.role-option.active').dataset.role;
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    let hasError = false;
    
    if (!name) { showError('regName', 'Name is required'); hasError = true; }
    if (!email || !email.includes('@')) { showError('regEmail', 'Valid email is required'); hasError = true; }
    if (!phone) { showError('regPhone', 'Phone number is required'); hasError = true; }
    if (!password || password.length < 6) { showError('regPassword', 'Password must be at least 6 characters'); hasError = true; }
    if (password !== confirmPassword) { showError('regConfirmPassword', 'Passwords do not match'); hasError = true; }
    
    if (role === 'buyer') {
        const buyerType = document.getElementById('regBuyerType').value;
        if (!buyerType) { showError('regBuyerType', 'Please select buyer type'); hasError = true; }
    } else {
        const shopName = document.getElementById('regShopName').value.trim();
        const location = document.getElementById('regLocation').value.trim();
        if (!shopName) { showError('regShopName', 'Shop name is required'); hasError = true; }
        if (!location) { showError('regLocation', 'Location is required'); hasError = true; }
    }
    
    if (hasError) return;
    
    const userData = {
        name,
        email,
        phone,
        password,
        role,
        buyerType: role === 'buyer' ? document.getElementById('regBuyerType').value : null,
        cuetId: role === 'buyer' ? document.getElementById('regCuetId').value.trim() : null,
        department: role === 'buyer' ? document.getElementById('regDepartment').value : null,
        residence: role === 'buyer' ? document.getElementById('regHall').value : null,
        shopName: role === 'seller' ? document.getElementById('regShopName').value.trim() : null,
        location: role === 'seller' ? document.getElementById('regLocation').value.trim() : null,
        description: role === 'seller' ? document.getElementById('regDescription').value.trim() : null,
        openTime: role === 'seller' ? document.getElementById('regOpenTime').value : null,
        closeTime: role === 'seller' ? document.getElementById('regCloseTime').value : null
    };
    
    try {
        const response = await DataService.request('/auth/register', 'POST', userData);
        
        if (response && response.token) {
            alert('Registration Successful! Redirecting...');
            const loggedInUser = {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            Auth.login(loggedInUser, response.token);
        } else {
            alert('Registration failed. Please try again.');
        }
    } catch (error) {
        alert(error.message || 'Registration failed. Please try again.');
    }
});


function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('error');
    let errorEl = input.parentElement.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message show';
        input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('show');
}