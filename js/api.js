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
            const response = await fetch(`${API_URL}?action=getSales`);
            const data = await response.json();
            if (data.status === 'success') {
                // Normalize data to ensure old schema matches new schema
                salesDataCache = data.data.map(s => ({
                    ...s,
                    invoice: s.invoice || s.invoiceNumber || '',
                    offer: s.offer || s.offerCategory || '',
                    sarees500: s.sarees500 !== undefined ? s.sarees500 : (s.qty500 || 0),
                    sarees1000: s.sarees1000 !== undefined ? s.sarees1000 : (s.qty1000 || 0),
                    payment: s.payment || s.paymentMethod || '',
                    status: s.status || s.paymentStatus || '',
                    cashAmount: s.cashAmount || 0,
                    onlineAmount: s.onlineAmount || 0
                }));
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
