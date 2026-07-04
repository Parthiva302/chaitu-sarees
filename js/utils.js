// utils.js - Shared utility functions

const utils = {
    // ── Currency formatter ─────────────────────────────────────
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    },

    // ── Invoice number generator ───────────────────────────────
    // Format: CS-YYYYMMDD-001
    generateInvoice(salesList) {
        const d = new Date();
        const year  = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day   = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const prefix = `CS-${dateStr}-`;

        // Find highest sequence for today
        let maxSeq = 0;
        (salesList || []).forEach(s => {
            if (s.invoice && s.invoice.startsWith(prefix)) {
                const seq = parseInt(s.invoice.replace(prefix, ''), 10);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        });

        return prefix + String(maxSeq + 1).padStart(3, '0');
    },

    // ── Bootstrap Toast ────────────────────────────────────────
    showToast(message, type = 'success') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) return;
        const toastBody = document.getElementById('toast-message');
        if (toastBody) toastBody.textContent = message;
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        toastEl.classList.add(`text-bg-${type}`);
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
    },

    // ── Date helpers ───────────────────────────────────────────
    getCurrentDate() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    },

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    },

    getYesterdayDate() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    },

    getCurrentMonth() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    },

    // ── Safe number parsers ────────────────────────────────────
    parseQty(val) {
        const n = parseInt(val, 10);
        return isNaN(n) || n < 0 ? 0 : n;
    },

    parseAmount(val) {
        const n = parseFloat(val);
        return isNaN(n) || n < 0 ? 0 : n;
    }
};
