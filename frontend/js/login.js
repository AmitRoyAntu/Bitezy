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
    
    const user = await DataService.validateLogin(email, password);
    
    if (user) {
        localStorage.setItem('bitezy_user', JSON.stringify(user));
        
        if (user.role === 'buyer') {
            window.location.href = 'customer.html';
        } else if (user.role === 'seller') {
            window.location.href = 'seller.html';
        } else if (user.role === 'admin') {
            window.location.href = 'admin.html';
        }
    } else {
        alert('Invalid email or password. Try: amit@cuet.ac.bd / demo123');
    }
});