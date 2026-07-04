// api.js

// Replace this with your Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbxAtp6_h-TrIy4txzmUTB0kMw4GupekFPj2dkqHMggLltmd9Du20r6IGjNOU9fNttIO/exec";

// In-memory cache for immediate UI updates
let salesDataCache = [];

const api = {
    // Initialize or fetch initial data
    async getSales() {
        if (!API_URL) {
            console.warn("API_URL is not set. Returning cached/dummy data.");
            // Return dummy data if no API URL
            if (salesDataCache.length === 0) {
                salesDataCache = this.getDummyData();
            }
            return salesDataCache;
        }

        try {
            const response = await fetch(`${API_URL}?action=getSales&_=${Date.now()}`);
            const data = await response.json();
            if (data.status === 'success') {
                const deletedInvoices = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');
                const localSalesBeforeFetch = [...salesDataCache];
                // Normalize data to ensure old schema matches new schema
                const serverSales = data.data.map(s => {
                    const keys = Object.keys(s);
                    let invoice = s.invoice || '';
                    let offer = s.offer || '';
                    let sarees500 = s.sarees500 !== undefined ? s.sarees500 : 0;
                    let sarees1000 = s.sarees1000 !== undefined ? s.sarees1000 : 0;
                    let payment = s.payment || '';
                    let status = s.status || '';

                    keys.forEach(k => {
                        const kl = k.toLowerCase();
                        if (kl.includes('invoice') && kl.includes('num')) invoice = s[k];
                        else if (kl.includes('offer') && kl.includes('cat')) offer = s[k];
                        else if (kl.includes('qty') && kl.includes('500')) sarees500 = s[k];
                        else if (kl.includes('qty') && kl.includes('1000')) sarees1000 = s[k];
                        else if (kl.includes('payment') && kl.includes('meth')) payment = s[k];
                        else if (kl.includes('payment') && kl.includes('stat')) status = s[k];
                    });

                    let dateVal = s.date || '';
                    if (dateVal.includes('T')) {
                        const d = new Date(dateVal);
                        if (!isNaN(d.getTime())) {
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            dateVal = `${year}-${month}-${day}`;
                        }
                    }

                    let timeVal = s.time || '';
                    if (timeVal.includes('T')) {
                        const d = new Date(timeVal);
                        if (!isNaN(d.getTime())) {
                            timeVal = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                        }
                    }

                    return {
                        ...s,
                        invoice,
                        offer,
                        sarees500: parseInt(sarees500) || 0,
                        sarees1000: parseInt(sarees1000) || 0,
                        payment,
                        status,
                        date: dateVal,
                        time: timeVal,
                        cashAmount: s.cashAmount || 0,
                        onlineAmount: s.onlineAmount || 0
                    };
                }).filter(s => s.invoice && s.invoice !== 'Invoice' && s.date !== 'Date' && !deletedInvoices.includes(s.invoice));

                // Merge server records with locally added sales that haven't synced yet
                const serverInvoiceSet = new Set(serverSales.map(s => s.invoice));
                const localUnsyncedSales = localSalesBeforeFetch.filter(s => !serverInvoiceSet.has(s.invoice) && !deletedInvoices.includes(s.invoice));

                salesDataCache = [...localUnsyncedSales, ...serverSales];
                return salesDataCache;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error("Error fetching sales:", error);
            utils.showToast("Failed to fetch sales data.", "danger");
            return salesDataCache;
        }
    },

    async saveSale(saleObject) {
        // Optimistic UI update
        salesDataCache.unshift(saleObject);

        if (!API_URL) {
            console.log("Mock Save:", saleObject);
            return {
                success: true
            };
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(saleObject)
            });

            const text = await response.text();

            console.log("Server Response:", text);

            const result = JSON.parse(text);

            if (!result.success) {
                throw new Error(result.message || "Unknown Error");
            }

            return result;

        } catch (error) {

            console.error(error);

            salesDataCache.shift();

            throw error;
        }
    },

    getDummyData() {
        // Generates some initial data for testing UI
        return [
            {
                invoice: 'CS-20260705-001',
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
                date: '2026-07-05',
                time: '10:30 AM'
            }
        ];
    }
};
