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

    const invoice = String(s.invoice || '').trim() || `NO-INVOICE-${dateVal || 'DATELESS'}-${String(s.phone || '').trim() || 'NOPHONE'}-${String(s.amount || '').trim() || '0'}`;
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

        // Try GET delete request
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
                invoice: 'CS-20260705-001',
                customerName: 'Gousie',
                phone: '9182255783',
                offer: '₹500 Offer',
                sarees500: 2,
                sarees1000: 0,
                totalSarees: 2,
                amount: 1000,
                payment: 'PhonePe',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 1000,
                date: '2026-07-05',
                time: '10:46 AM'
            },
            {
                invoice: 'CS-20260705-001',
                customerName: 'Siva kumari',
                phone: '8919784820',
                offer: '₹1000 Offer',
                sarees500: 0,
                sarees1000: 2,
                totalSarees: 2,
                amount: 2000,
                payment: 'Cash',
                status: 'Paid',
                notes: '',
                cashAmount: 2000,
                onlineAmount: 0,
                date: '2026-07-05',
                time: '10:47 AM'
            },
            {
                invoice: 'CS-20260705-001',
                customerName: 'Sureka',
                phone: '8801013916',
                offer: '₹500 Offer',
                sarees500: 35,
                sarees1000: 16,
                totalSarees: 51,
                amount: 33500,
                payment: 'PhonePe',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 33500,
                date: '2026-07-05',
                time: '12:44 PM'
            },
            {
                invoice: 'CS-20260705-002',
                customerName: 'Sindhu',
                phone: '9652436875',
                offer: '₹500 Offer',
                sarees500: 15,
                sarees1000: 10,
                totalSarees: 25,
                amount: 17500,
                payment: 'PhonePe',
                status: 'Pending',
                notes: '8000 pending',
                cashAmount: 0,
                onlineAmount: 9500,
                date: '2026-07-05',
                time: '2:29 PM'
            },
            {
                invoice: 'CS-20260705-003',
                customerName: 'Jahanavi',
                phone: '9347674316',
                offer: '₹500 Offer',
                sarees500: 4,
                sarees1000: 0,
                totalSarees: 4,
                amount: 2000,
                payment: 'PhonePe',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 2000,
                date: '2026-07-05',
                time: '2:39 PM'
            },
            {
                invoice: 'CS-20260705-004',
                customerName: 'Saroja',
                phone: '7207753128',
                offer: '₹500 Offer',
                sarees500: 6,
                sarees1000: 2,
                totalSarees: 8,
                amount: 5000,
                payment: 'Mixed',
                status: 'Paid',
                notes: '',
                cashAmount: 2500, // Guessing split for dummy
                onlineAmount: 2500,
                date: '2026-07-05',
                time: '2:42 PM'
            },
            {
                invoice: 'CS-20260705-001',
                customerName: 'Padmaja',
                phone: '9492710056',
                offer: '₹500 Offer',
                sarees500: 10,
                sarees1000: 7,
                totalSarees: 17,
                amount: 12000,
                payment: 'Cash',
                status: 'Pending',
                notes: '7000 pending',
                cashAmount: 5000,
                onlineAmount: 0,
                date: '2026-07-05',
                time: '2:56 PM'
            },
            {
                invoice: 'CS-20260705-005',
                customerName: 'Hebsiba M',
                phone: '9441452285',
                offer: '₹500 Offer',
                sarees500: 1,
                sarees1000: 8,
                totalSarees: 9,
                amount: 8500,
                payment: 'Cash',
                status: 'Pending',
                notes: '6500 pending',
                cashAmount: 2000,
                onlineAmount: 0,
                date: '2026-07-05',
                time: '2:50 PM'
            },
            {
                invoice: 'CS-20260705-001',
                customerName: 'madumayi',
                phone: '9491565904',
                offer: '₹500 Offer',
                sarees500: 0,
                sarees1000: 8,
                totalSarees: 8,
                amount: 8000,
                payment: 'PhonePe',
                status: 'Pending',
                notes: '3000 pending',
                cashAmount: 0,
                onlineAmount: 5000,
                date: '2026-07-05',
                time: '3:30 PM'
            },
            {
                invoice: 'CS-20260705-006',
                customerName: 'Katyayani',
                phone: '8919784820',
                offer: '₹500 Offer',
                sarees500: 14,
                sarees1000: 3,
                totalSarees: 17,
                amount: 10000,
                payment: 'PhonePe',
                status: 'Pending',
                notes: 'Siva Kumari - on behalf of katyayani',
                cashAmount: 0,
                onlineAmount: 10000, // Assuming nothing paid yet if amount is 10k but it's pending without specify amount? We'll leave as 0 paid online if pending? Actually wait, we don't have pending amount logic inside amount paid. Let's just follow normalized structure.
                date: '2026-07-05',
                time: '4:13 PM'
            },
            {
                invoice: 'CS-20260705-007',
                customerName: 'Aparna',
                phone: '9441539147',
                offer: '₹500 Offer',
                sarees500: 7,
                sarees1000: 3,
                totalSarees: 10,
                amount: 6500,
                payment: 'PhonePe',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 6500,
                date: '2026-07-05',
                time: '4:15 PM'
            },
            {
                invoice: 'CS-20260705-008',
                customerName: 'Pushpalata',
                phone: '8008760383',
                offer: '₹500 Offer',
                sarees500: 2,
                sarees1000: 0,
                totalSarees: 2,
                amount: 1000,
                payment: 'PhonePe',
                status: 'Paid',
                notes: '',
                cashAmount: 0,
                onlineAmount: 1000,
                date: '2026-07-05',
                time: '4:49 PM'
            }
        ];
    }
};
