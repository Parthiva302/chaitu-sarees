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
    
    let totalQty500 = 0;
    let totalQty1000 = 0;
    
    const today = utils.getCurrentDate();
    
    // Create a Set to count unique customers (by phone number) if needed, 
    // or just count transactions as customers for this specific use case.
    const uniqueCustomers = new Set();

    sales.forEach(s => {
        uniqueCustomers.add(s.phone);
        
        // Sum Qty
        const q500 = parseInt(s.sarees500) || 0;
        const q1000 = parseInt(s.sarees1000) || 0;
        totalQty500 += q500;
        totalQty1000 += q1000;
        
        // Offer Customers count
        if (s.offer === '₹500 Offer') customers500++;
        if (s.offer === '₹1000 Offer') customers1000++;

        // Financials (only for today to match "Today's Sales", or you can adjust logic)
        if (s.date === today) {
            const amt = parseFloat(s.amount) || 0;
            todaySales += amt;
            
            if (s.status === 'Pending') {
                pendingCol += amt;
            } else {
                if (s.payment === 'Cash') cashCol += amt;
                else if (s.payment === 'Mixed') {
                    // If we had separate fields stored, we'd add them here.
                    // For simplicity, assuming mixed requires splitting logic stored in DB,
                    // or we just approximate. Let's assume standard behavior.
                    // Wait, the prompt asked to show Cash Amount and Online Amount for Mixed. 
                    // Let's assume s.cashAmount and s.onlineAmount exist if mixed.
                    cashCol += (parseFloat(s.cashAmount) || 0);
                    onlineCol += (parseFloat(s.onlineAmount) || 0);
                }
                else cashCol += 0; // Other are online
                
                if (['PhonePe', 'Google Pay', 'Paytm', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'].includes(s.payment)) {
                    onlineCol += amt;
                }
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
    
    animateValue('summary-qty-500', 0, totalQty500, 1000);
    animateValue('summary-qty-1000', 0, totalQty1000, 1000);
    animateValue('summary-qty-total', 0, totalQty500 + totalQty1000, 1000);
}
