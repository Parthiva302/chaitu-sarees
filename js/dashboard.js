// dashboard.js

async function initDashboard() {
    // Fetch data
    const sales = await api.getSales();
    
    // Calculate Stats
    let todaySales = 0;
    let cashCol = 0;
    let onlineCol = 0;
    let pendingCol = 0;
    let customers500 = 0;
    let customers1000 = 0;
    
    let totalSarees500 = 0;
    let totalSarees1000 = 0;
    
    const today = utils.getCurrentDate();
    
    // Create a Set to count unique customers (by phone number) if needed, 
    // or just count transactions as customers for this specific use case.
    const uniqueCustomers = new Set();

    sales.forEach(s => {
        uniqueCustomers.add(s.phone);
        
        // Sum Qty
        const q500 = parseInt(s.sarees500) || 0;
        const q1000 = parseInt(s.sarees1000) || 0;
        totalSarees500 += q500;
        totalSarees1000 += q1000;
        
        // Offer Customers count
        if (s.offer === '₹500 Offer') customers500++;
        if (s.offer === '₹1000 Offer') customers1000++;

        // Financials (Today's Sales is today only; others are all-time)
        const amt = parseFloat(s.amount) || 0;
        if (s.date === today) {
            todaySales += amt;
        }
        
        if (s.status === 'Pending') {
            pendingCol += amt;
        } else {
            if (s.payment === 'Cash') {
                cashCol += amt;
            } else if (s.payment === 'Mixed') {
                cashCol += (parseFloat(s.cashAmount) || 0);
                onlineCol += (parseFloat(s.onlineAmount) || 0);
            } else if (['PhonePe', 'Google Pay', 'Paytm', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'].includes(s.payment)) {
                onlineCol += amt;
            } else {
                // If not cash/mixed/online lists, default to online
                onlineCol += amt;
            }
        }
    });

    // Animate Numbers function
    const animateValue = (id, start, end, duration, isCurrency = false) => {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            obj.innerHTML = isCurrency ? utils.formatCurrency(current) : current;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Update UI
    animateValue('dash-today-sales', 0, todaySales, 1000, true);
    animateValue('dash-cash', 0, cashCol, 1000, true);
    animateValue('dash-online', 0, onlineCol, 1000, true);
    animateValue('dash-pending', 0, pendingCol, 1000, true);
    
    animateValue('dash-customers', 0, uniqueCustomers.size, 1000);
    animateValue('dash-customers-500', 0, customers500, 1000);
    animateValue('dash-customers-1000', 0, customers1000, 1000);
    
    animateValue('summary-qty-500', 0, totalSarees500, 1000);
    animateValue('summary-qty-1000', 0, totalSarees1000, 1000);
    animateValue('summary-qty-total', 0, totalSarees500 + totalSarees1000, 1000);
}

async function refreshDashboard() {
    const btn = document.querySelector('button.btn-outline-secondary');
    let originalHTML = '';
    if (btn) {
        originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
    }
    
    // Clear salesDataCache to fetch fresh data from server
    salesDataCache = [];
    await initDashboard();
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

