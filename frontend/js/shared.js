/**
 * Show a toast notification
 * @param {string} msg - The message to display
 * @param {string} type - 'success', 'error', or 'warning'
 */
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) {
        console.warn('Toast container not found in the DOM.');
        return;
    }

    const span = t.querySelector('span');
    const icon = t.querySelector('i');
    
    if (span) span.innerText = msg;
    
    // Update icon style based on type
    if (icon) {
        icon.className = 'fa-solid'; // Reset
        if (type === 'success') {
            icon.classList.add('fa-check-circle');
            icon.style.color = 'var(--success)';
            t.style.borderLeft = '5px solid var(--success)';
        } else if (type === 'error') {
            icon.classList.add('fa-circle-xmark');
            icon.style.color = 'var(--danger)';
            t.style.borderLeft = '5px solid var(--danger)';
        } else if (type === 'warning') {
            icon.classList.add('fa-circle-exclamation');
            icon.style.color = 'var(--warning)';
            t.style.borderLeft = '5px solid var(--warning)';
        }
    }

    t.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        t.classList.remove('show');
    }, 3000);
}

// Export for use if needed in modules, though here we use global scope
window.showToast = showToast;
