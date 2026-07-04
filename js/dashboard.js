// dashboard.js

// ── Calculate stats from sales array ──────────────────────────
function calcDashboardStats(sales) {
    const today = utils.getCurrentDate();

    let todaySales  = 0;
    let cashCol     = 0;
    let onlineCol   = 0;
    let pendingCol  = 0;
    let customers500   = 0;
    let customers1000  = 0;
    let totalSarees500  = 0;
    let totalSarees1000 = 0;
    const uniquePhones = new Set();

    const onlineMethods = ['PhonePe', 'Google Pay', 'Paytm', 'UPI',
                           'Debit Card', 'Credit Card', 'Bank Transfer'];

    sales.forEach(s => {
        const amt = utils.parseAmount(s.amount);

        // Unique customers
        if (s.phone) uniquePhones.add(String(s.phone));

        // Saree quantities
        totalSarees500  += utils.parseQty(s.sarees500);
        totalSarees1000 += utils.parseQty(s.sarees1000);

        // Offer customer counts
        if (s.offer === '₹500 Offer')  customers500++;
        if (s.offer === '₹1000 Offer') customers1000++;

        // Today's sales
        if (s.date === today) todaySales += amt;

        // Payment breakdown (all-time)
        if (s.status === 'Pending') {
            pendingCol += amt;
        } else if (s.status === 'Paid') {
            if (s.payment === 'Cash') {
                cashCol += amt;
            } else if (s.payment === 'Mixed') {
                cashCol   += utils.parseAmount(s.cashAmount);
                onlineCol += utils.parseAmount(s.onlineAmount);
            } else if (onlineMethods.includes(s.payment)) {
                onlineCol += amt;
            } else {
                // unknown payment type – count as online
                onlineCol += amt;
            }
        }
    });

    return {
        todaySales,
        cashCol,
        onlineCol,
        pendingCol,
        customers500,
        customers1000,
        totalSarees500,
        totalSarees1000,
        totalSarees: totalSarees500 + totalSarees1000,
        uniqueCustomers: uniquePhones.size,
        totalBills: sales.length,
        avgBill: sales.length > 0 ? Math.round(
            sales.reduce((sum, s) => sum + utils.parseAmount(s.amount), 0) / sales.length
        ) : 0
    };
}

// ── Animate counter ────────────────────────────────────────────
function animateCounter(id, end, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = 0;
    const duration = 800;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        el.textContent = isCurrency ? utils.formatCurrency(val) : val;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = isCurrency ? utils.formatCurrency(end) : end;
    }
    requestAnimationFrame(step);
}

// ── Update all dashboard DOM elements ─────────────────────────
function updateDashboardUI(sales) {
    if (!document.getElementById('dash-today-sales')) return; // not on dashboard page

    const s = calcDashboardStats(sales);

    animateCounter('dash-today-sales',    s.todaySales,   true);
    animateCounter('dash-cash',           s.cashCol,      true);
    animateCounter('dash-online',         s.onlineCol,    true);
    animateCounter('dash-pending',        s.pendingCol,   true);

    animateCounter('dash-customers',      s.uniqueCustomers);
    animateCounter('dash-customers-500',  s.customers500);
    animateCounter('dash-customers-1000', s.customers1000);

    animateCounter('summary-qty-500',     s.totalSarees500);
    animateCounter('summary-qty-1000',    s.totalSarees1000);
    animateCounter('summary-qty-total',   s.totalSarees);
}

// ── Page init ─────────────────────────────────────────────────
async function initDashboard() {
    updateDashboardUI(window.salesDataCache);   // show cached data instantly
    const fresh = await api.getSales();
    updateDashboardUI(fresh);
}

// ── Refresh button handler ─────────────────────────────────────
async function refreshDashboard() {
    const btn = document.querySelector('[onclick="refreshDashboard()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
    }
    // Force fresh fetch by clearing cache
    window.salesDataCache = [];
    await refreshEntireApplication();
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refresh';
    }
}
