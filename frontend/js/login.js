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

let currentLoginEmail = null;
let currentLoginPassword = null;
let resendTimerInterval = null;

function startResendTimer() {
    const resendBtn = document.getElementById('resendOtp');
    if (!resendBtn) return;

    let seconds = 60;
    resendBtn.disabled = true;
    
    if (resendTimerInterval) clearInterval(resendTimerInterval);
    
    resendTimerInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(resendTimerInterval);
            resendBtn.innerText = 'Resend OTP';
            resendBtn.disabled = false;
        } else {
            resendBtn.innerText = `Resend in ${seconds}s`;
        }
    }, 1000);
}

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

    // Optimistic UI: Store credentials and show OTP section immediately
    currentLoginEmail = email;
    currentLoginPassword = password;

    const otpSection = document.getElementById('otpSection');
    const submitBtn = document.querySelector('#loginForm .submit-btn');
    
    // Immediately show the OTP input section and hide the Get OTP button
    otpSection.style.display = 'block';
    submitBtn.style.display = 'none';
    
    // UX Improvements: Auto-focus, Error Reset, and Resend Timer
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
    }
    const otpError = document.getElementById('otpError');
    if (otpError) otpError.classList.remove('show');
    
    startResendTimer();
    
    showToast('Sending OTP to your email...');

    // Perform the actual login request in the background
    (async () => {
        try {
            const response = await DataService.request('/auth/login', 'POST', { email, password });

            // If backend returns token (no OTP flow or already verified), proceed to login
            if (response && response.token) {
                const userData = {
                    id: response._id,
                    name: response.name,
                    email: response.email,
                    role: response.role
                };
                Auth.login(userData, response.token);
                return;
            }

            // If backend indicates OTP sent, just update the toast message
            if (response && response.message) {
                showToast(response.message);
            }
        } catch (error) {
            // Revert UI changes if the password was wrong or another error occurred
            otpSection.style.display = 'none';
            submitBtn.style.display = 'block';
            submitBtn.disabled = false;
            
            // Clear OTP input for a fresh start
            const otpInput = document.getElementById('otpInput');
            if (otpInput) otpInput.value = '';
            
            if (resendTimerInterval) clearInterval(resendTimerInterval);
            
            const passErr = document.getElementById('passwordError');
            passErr.querySelector('span').innerText = error.message || 'Login failed';
            passErr.classList.add('show');
            showToast(error.message || 'Login failed', 'error');
        }
    })();
});


// OTP form handlers
document.getElementById('otpForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const otp = document.getElementById('otpInput').value;
    document.getElementById('otpError').classList.remove('show');

    if (!otp.trim()) {
        document.getElementById('otpError').classList.add('show');
        return;
    }

    const verifyBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = verifyBtn.innerText;
    
    try {
        // Show loading state
        verifyBtn.disabled = true;
        verifyBtn.innerText = 'Signing in...';

        const response = await DataService.request('/auth/verify-otp', 'POST', { email: currentLoginEmail, otp });
        if (response && response.token) {
            if (resendTimerInterval) clearInterval(resendTimerInterval);
            const userData = {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            Auth.login(userData, response.token);
        } else {
            verifyBtn.disabled = false;
            verifyBtn.innerText = originalBtnText;
            const otpErr = document.getElementById('otpError');
            otpErr.querySelector('span').innerText = response && response.message ? response.message : 'Invalid OTP';
            otpErr.classList.add('show');
        }
    } catch (err) {
        verifyBtn.disabled = false;
        verifyBtn.innerText = originalBtnText;
        const otpErr = document.getElementById('otpError');
        otpErr.querySelector('span').innerText = err.message || 'OTP verification failed';
        otpErr.classList.add('show');
    }
});

document.getElementById('resendOtp').addEventListener('click', async function() {
    if (!currentLoginEmail || !currentLoginPassword) return;

    const otpInput = document.getElementById('otpInput');
    const otpError = document.getElementById('otpError');
    if (otpInput) otpInput.value = '';
    if (otpError) otpError.classList.remove('show');

    // Optimistic UI: Show toast immediately and start timer
    showToast('Resending OTP...');
    startResendTimer();

    // Perform the resend request in the background
    (async () => {
        try {
            const response = await DataService.request('/auth/login', 'POST', { email: currentLoginEmail, password: currentLoginPassword });
            showToast(response && response.message ? response.message : 'OTP resent');
        } catch (err) {
            showToast(err.message || 'Resend failed', 'error');
            // If resend failed, we might want to re-enable the button early, 
            // but usually the timer is fine to stay.
        }
    })();
});

document.getElementById('cancelOtp').addEventListener('click', function() {
    // reset OTP UI
    currentLoginEmail = null;
    currentLoginPassword = null;
    if (resendTimerInterval) clearInterval(resendTimerInterval);
    
    const resendBtn = document.getElementById('resendOtp');
    if (resendBtn) {
        resendBtn.innerText = 'Resend OTP';
        resendBtn.disabled = false;
    }

    document.getElementById('otpSection').style.display = 'none';
    const otpInput = document.getElementById('otpInput');
    if (otpInput) otpInput.value = '';

    const submitBtn = document.querySelector('#loginForm .submit-btn');
    if (submitBtn) {
        submitBtn.style.display = 'block';
        submitBtn.disabled = false;
    }
});

// --- FORGOT PASSWORD LOGIC ---
let forgotPasswordEmail = null;

// Toggle Forgot Password UI
document.querySelector('.forgot-password-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('forgotPasswordSection').style.display = 'block';
    
    // Reset forms
    document.getElementById('forgotPasswordEmailForm').style.display = 'block';
    document.getElementById('forgotPasswordResetForm').style.display = 'none';
    document.getElementById('forgotEmailInput').value = '';
    document.getElementById('forgotOtpInput').value = '';
    document.getElementById('forgotNewPasswordInput').value = '';
    
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
});

// Cancel Forgot Password
document.querySelectorAll('.cancel-forgot-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.getElementById('forgotPasswordSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
    });
});

// Submit Email for Forgot Password
document.getElementById('forgotPasswordEmailForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmailInput').value;
    const errorEl = document.getElementById('forgotEmailError');
    errorEl.classList.remove('show');
    
    if (!email.trim()) {
        errorEl.classList.add('show');
        return;
    }
    
    forgotPasswordEmail = email;
    const submitBtn = document.getElementById('forgotEmailSubmitBtn');
    
    // Optimistic UI: Immediately show the next step
    document.getElementById('forgotPasswordEmailForm').style.display = 'none';
    document.getElementById('forgotPasswordResetForm').style.display = 'block';
    
    const otpInput = document.getElementById('forgotOtpInput');
    if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
    }
    
    showToast('Sending reset code to your email...');
    
    // Perform the actual request in the background
    (async () => {
        try {
            const response = await DataService.request('/auth/forgot-password', 'POST', { email });
            showToast(response.message || 'OTP sent successfully');
        } catch (error) {
            // Revert UI on failure
            document.getElementById('forgotPasswordEmailForm').style.display = 'block';
            document.getElementById('forgotPasswordResetForm').style.display = 'none';
            
            errorEl.querySelector('span').innerText = error.message || 'Error sending request';
            errorEl.classList.add('show');
            showToast(error.message || 'Failed to send reset code', 'error');
        }
    })();
});

// Submit OTP & New Password for Reset
document.getElementById('forgotPasswordResetForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const otp = document.getElementById('forgotOtpInput').value;
    const newPassword = document.getElementById('forgotNewPasswordInput').value;
    const errorEl = document.getElementById('forgotResetError');
    errorEl.classList.remove('show');
    
    if (!otp.trim() || !newPassword.trim()) {
        errorEl.querySelector('span').innerText = 'Please fill all fields';
        errorEl.classList.add('show');
        return;
    }
    
    const submitBtn = document.getElementById('forgotResetSubmitBtn');
    const originalText = submitBtn.innerText;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Resetting...';
        
        const response = await DataService.request('/auth/reset-password', 'POST', { 
            email: forgotPasswordEmail, 
            otp, 
            newPassword 
        });
        
        if (response && response.token) {
            const userData = {
                id: response._id,
                name: response.name,
                email: response.email,
                role: response.role
            };
            showToast('Password reset successful! Logging you in...');
            
            setTimeout(() => {
                Auth.login(userData, response.token);
            }, 1000);
        } else {
            showToast(response.message || 'Password reset successful');
            
            // Fallback: Back to login
            document.getElementById('forgotPasswordSection').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('loginPassword').value = '';
        }
        
    } catch (error) {
        errorEl.querySelector('span').innerText = error.message || 'Invalid OTP';
        errorEl.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});