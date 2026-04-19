document.querySelectorAll('.role-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
    });
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    
    if (!email.trim() || !password.trim()) {
        if (!email.trim()) document.getElementById('emailError').classList.add('show');
        if (!password.trim()) document.getElementById('passwordError').classList.add('show');
        return;
    }
    
    try {
        const response = await DataService.request('/auth/login', 'POST', { email, password });
        
        if (response && response.token) {
            // response contains _id, name, email, role, token
            const userData = {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            Auth.login(userData, response.token);
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        alert(error.message || 'Login failed. Please try again.');
    }
});