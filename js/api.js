// api.js - Single source of truth for all data

const API_URL = "https://script.google.com/macros/s/AKfycbxAtp6_h-TrIy4txzmUTB0kMw4GupekFPj2dkqHMggLltmd9Du20r6IGjNOU9fNttIO/exec";

// Global sales cache - single source of truth
window.salesData = window.salesData || [];

// ── Normalize a single sale row from Google Sheets to our schema ───────────
function normalizeSale(s) {
    // Normalize date: Google Sheets returns ISO timestamp for Date cells
    let dateVal = s.date || '';
    if (dateVal) {
        try {
            dateVal = utils.normalizeDateKey(dateVal);
        } catch (e) {
            dateVal = '';
        }
    }

    // Normalize time: Google Sheets returns 1899-12-29T... for Time cells
    let timeVal = s.time || '';
    if (typeof timeVal === 'string' && timeVal.trim() !== '') {
        timeVal = timeVal.trim();
        const match = timeVal.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/i);
        if (!match) {
            try {
                const d = timeVal.includes('T') ? new Date(timeVal) : new Date('1970-01-01T' + timeVal);
                if (!isNaN(d.getTime())) {
                    timeVal = d.toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                }
            } catch (e) { }
        }
    }

    const invoice = String(s.invoice || '').trim();
    const customerName = String(s.customerName || '').trim();
    const phone = String(s.phone || '').trim();
    const offer = String(s.offer || '').trim();

    const sarees500 = parseInt(s.sarees500) || 0;
    const sarees1000 = parseInt(s.sarees1000) || 0;
    const totalSarees = parseInt(s.totalSarees) || (sarees500 + sarees1000);
    const amount = parseFloat(s.amount) || (sarees500 * 500 + sarees1000 * 1000);

    const payment = String(s.payment || '').trim();
    const status = String(s.status || '').trim();
    const notes = String(s.notes || '').trim();
    const cashAmount = parseFloat(s.cashAmount) || 0;
    const onlineAmount = parseFloat(s.onlineAmount) || 0;

    return {
        invoice,
        customerName,
        phone,
        offer,
        sarees500,
        sarees1000,
        totalSarees,
        amount,
        payment,
        status,
        notes,
        cashAmount,
        onlineAmount,
        date: dateVal,
        time: timeVal,
    };
}

// ── Determine if a row is the spreadsheet header row or empty ──────────────
function isValidSaleRow(s) {
    if (!s.invoice) return false;
    if (s.invoice === 'Invoice' || s.invoice === 'Invoice Number' || s.date === 'Date') return false;
    if (!s.customerName || !s.date) return false;
    if (isNaN(s.amount) || s.amount <= 0) return false;
    return true;
}

const api = {
    // ── Fetch & refresh full list from server ──────────────────
    async getSales() {
        if (!API_URL) {
            if (window.salesData.length === 0) {
                window.salesData = this.getDummyData();
            }
            return window.salesData;
        }

        try {
            const deletedInvoices = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');
            const res = await fetch(`${API_URL}?action=getSales&_=${Date.now()}`);
            const data = await res.json();

            if (data.status === 'success' && Array.isArray(data.data)) {
                const serverSales = data.data
                    .map(normalizeSale)
                    .filter(s => isValidSaleRow(s) && !deletedInvoices.includes(s.invoice));

                // Merge in any optimistically-added local sales not yet on server
                const serverKeys = new Set(serverSales.map(s => s.invoice));
                const localOnly = (window.salesData || []).filter(
                    s => !serverKeys.has(s.invoice) && !deletedInvoices.includes(s.invoice)
                );

                window.salesData = [...localOnly, ...serverSales];
                return window.salesData;
            }
            throw new Error(data.message || 'API error');
        } catch (err) {
            console.error('getSales error:', err);
            return window.salesData;
        }
    },

    // ── Save a new sale ────────────────────────────────────────
    async saveSale(saleObject) {
        // Optimistic add to local cache immediately
        if (!window.salesData) window.salesData = [];
        window.salesData.unshift(saleObject);

        if (!API_URL) {
            return { success: true };
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(saleObject)
            });
            const text = await res.text();
            const result = JSON.parse(text);
            if (!result.success) throw new Error(result.message || 'Save failed');
            return result;
        } catch (err) {
            // Roll back optimistic add
            window.salesData = window.salesData.filter(s => s.invoice !== saleObject.invoice);
            throw err;
        }
    },

    // ── Delete a sale ──────────────────────────────────────────
    async deleteSale(invoice) {
        if (!API_URL) {
            return { success: true };
        }

        try {
            // Try POST delete request
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'delete', invoice })
            });
            const text = await res.text();
            const result = JSON.parse(text);
            if (result.success || result.status === 'success') {
                return result;
            }
        } catch (err) {
            console.warn('deleteSale POST failed, trying GET fallback:', err);
        }

        // Try GET delete request fallback
        try {
            const res = await fetch(`${API_URL}?action=delete&invoice=${invoice}&_=${Date.now()}`);
            const data = await res.json();
            if (data.success || data.status === 'success') {
                return data;
            }
            throw new Error(data.message || 'Delete fallback failed');
        } catch (err) {
            console.error('deleteSale GET fallback failed:', err);
            throw err;
        }
    },

    // ── Dummy data for offline testing ─────────────────────────
    getDummyData() {
        const today = (() => {
            const d = new Date();
            return d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
        })();
        return [
            {
                invoice: 'CS-' + today.replace(/-/g, '') + '-001',
                customerName: 'Rahul Kumar',
                phone: '9876543210',
                offer: '₹500 Offer',
                sarees500: 2,
                sarees1000: 0,
                totalSarees: 2,
                amount: 1000,
                payment: 'UPI',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 0,
                date: today,
                time: '10:30 AM'
            }
        ];
    }
};
