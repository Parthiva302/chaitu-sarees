// api.js

// Replace this with your Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbyEaVQkOQl_-vfWObwyZq8NLFe1qcymlpISOgG0jjWD1uE0Frko-Ld8RAyVpFiHTYpX/exec";

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
                salesDataCache = data.data;
                return salesDataCache;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error("Error fetching sales:", error);
            utils.showToast("Failed to fetch sales data.", "danger");
            return salesDataCache;
        }
    },

    // Save a new sale
    async saveSale(saleObject) {
        // Optimistic UI update
        salesDataCache.unshift(saleObject);
        
        if (!API_URL) {
            console.log("Mock Save: ", saleObject);
            return { status: 'success', message: 'Saved locally (No API URL)' };
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                // Pass the data directly as requested by the user's Apps Script setup
                body: JSON.stringify(saleObject)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Error saving sale:", error);
            // Revert cache on fail
            salesDataCache.shift();
            throw error;
        }
    },

    getDummyData() {
        // Generates some initial data for testing UI
        return [
            {
                invoiceNumber: 'CS-20260705-001',
                customerName: 'Rahul Kumar',
                phone: '9876543210',
                offerCategory: '₹500 Offer',
                qty500: 2,
                qty1000: 0,
                totalSarees: 2,
                amount: 1000,
                paymentMethod: 'UPI',
                paymentStatus: 'Paid',
                notes: '',
                date: '2026-07-05',
                time: '10:30 AM'
            }
        ];
    }
};
