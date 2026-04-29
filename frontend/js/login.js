document.querySelectorAll('.role-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
    });
});

// Check if already logged in
document.addEventListener('DOMContentLoaded', async () => {
    if (Auth.isAuthenticated()) {
        const user = await Auth.init();
        if (user) {
            if (user.role === 'admin') window.location.href = 'admin.html';
            else if (user.role === 'seller') window.location.href = 'seller.html';
            else window.location.href = 'customer.html';
        }
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
    
    if (!email.trim() || !password.trim()) {
        if (!email.trim()) document.getElementById('emailError').classList.add('show');
        if (!password.trim()) document.getElementById('passwordError').classList.add('show');
        return;
    }
    
    try {
        const response = await DataService.request('/auth/login', 'POST', { email, password });
        
        if (response && response.token) {
            // response _id, name, email, role, token
            const userData = {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            Auth.login(userData, response.token);
        } else {
            const passErr = document.getElementById('passwordError');
            passErr.querySelector('span').innerText = 'Invalid email or password';
            passErr.classList.add('show');
        }
    } catch (error) {
        const passErr = document.getElementById('passwordError');
        passErr.querySelector('span').innerText = error.message || 'Login failed';
        passErr.classList.add('show');
    }
});