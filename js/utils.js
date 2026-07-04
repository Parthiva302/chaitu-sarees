// utils.js

const utils = {
    // Format currency to INR
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Generate Auto Invoice Number
    // Format: CS-YYYYMMDD-001
    generateInvoiceNumber(lastInvoiceStr) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}${month}${day}`;
        
        let sequence = 1;
        
        if (lastInvoiceStr) {
            const parts = lastInvoiceStr.split('-');
            if (parts.length === 3 && parts[1] === dateString) {
                sequence = parseInt(parts[2], 10) + 1;
            }
        }
        
        const seqString = String(sequence).padStart(3, '0');
        return `CS-${dateString}-${seqString}`;
    },

    // Show Bootstrap Toast
    showToast(message, type = 'success') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) return;
        
        const toastBody = document.getElementById('toast-message');
        toastBody.textContent = message;
        
        // Remove previous classes
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        toastEl.classList.add(`text-bg-${type}`);
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    },

    // Get current Date in YYYY-MM-DD format
    getCurrentDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Get current Time
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    },
    
    // Parse Qty safely
    parseQty(val) {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
};
