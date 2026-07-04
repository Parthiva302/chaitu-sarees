// api.js - Single source of truth for all data

const API_URL = "https://script.google.com/macros/s/AKfycbxAtp6_h-TrIy4txzmUTB0kMw4GupekFPj2dkqHMggLltmd9Du20r6IGjNOU9fNttIO/exec";

// Global sales cache - single source of truth
window.salesDataCache = [];

// ─────────────────────────────────────────────────────────────
// Normalize a single sale row from Google Sheets to our schema
// ─────────────────────────────────────────────────────────────
function normalizeSale(s) {
    // Normalize date: Google Sheets returns ISO timestamp for Date cells
    let dateVal = s.date || '';
    if (dateVal.includes('T')) {
        try {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                // Use LOCAL date (browser timezone) to match utils.getCurrentDate()
                dateVal = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
            }
        } catch (e) { dateVal = ''; }
    }

    // Normalize time: Google Sheets returns 1899-12-29T... for Time cells
    let timeVal = s.time || '';
    if (timeVal.includes('T')) {
        try {
            const d = new Date(timeVal);
            if (!isNaN(d.getTime())) {
                // Use LOCAL hours/minutes (browser timezone)
                const h = d.getHours();
                const m = d.getMinutes();
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                timeVal = h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
            }
        } catch (e) { timeVal = ''; }
    }

    return {
        invoice:      String(s.invoice      || '').trim(),
        customerName: String(s.customerName || '').trim(),
        phone:        String(s.phone        || '').trim(),
        offer:        String(s.offer        || '').trim(),
        sarees500:    parseInt(s.sarees500)  || 0,
        sarees1000:   parseInt(s.sarees1000) || 0,
        totalSarees:  parseInt(s.totalSarees) || 0,
        amount:       parseFloat(s.amount)   || 0,
        payment:      String(s.payment      || '').trim(),
        status:       String(s.status       || '').trim(),
        notes:        String(s.notes        || '').trim(),
        cashAmount:   parseFloat(s.cashAmount)   || 0,
        onlineAmount: parseFloat(s.onlineAmount) || 0,
        date:         dateVal,
        time:         timeVal,
    };
}

// ─────────────────────────────────────────────────────────────
// Determine if a row is the spreadsheet header row or empty
// ─────────────────────────────────────────────────────────────
function isValidSaleRow(s) {
    if (!s.invoice) return false;
    if (s.invoice === 'Invoice' || s.date === 'Date') return false;
    if (isNaN(s.amount) || s.amount < 0) return false;
    return true;
}

const api = {
    // ── Fetch & refresh full list from server ──────────────────
    async getSales() {
        if (!API_URL) {
            if (window.salesDataCache.length === 0) {
                window.salesDataCache = this.getDummyData();
            }
            return window.salesDataCache;
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
                const localOnly = (window.salesDataCache || []).filter(
                    s => !serverKeys.has(s.invoice) && !deletedInvoices.includes(s.invoice)
                );

                window.salesDataCache = [...localOnly, ...serverSales];
                return window.salesDataCache;
            }
            throw new Error(data.message || 'API error');
        } catch (err) {
            console.error('getSales error:', err);
            // Don't show toast here – let callers decide
            return window.salesDataCache;
        }
    },

    // ── Save a new sale ────────────────────────────────────────
    async saveSale(saleObject) {
        // Optimistic add to local cache immediately
        window.salesDataCache.unshift(saleObject);

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
            window.salesDataCache = window.salesDataCache.filter(s => s.invoice !== saleObject.invoice);
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
