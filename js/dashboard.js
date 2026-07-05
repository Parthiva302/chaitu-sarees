// dashboard.js

// ── Animate counter ────────────────────────────────────────────
function animateCounter(id, end, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;
    const finalValue = Number(end) || 0;
    el.textContent = isCurrency ? utils.formatCurrency(finalValue) : finalValue;
}

function refreshStatistics(sales) {
    updateDashboardUI(sales);
}

async function refreshDashboard(sales) {
    if (Array.isArray(sales)) {
        updateDashboardUI(sales);
        return;
    }

    const btn = document.querySelector('[onclick="refreshDashboard()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
    }

    await refreshEntireApplication();

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refresh';
    }
}

// ── Update all dashboard DOM elements ─────────────────────────
function updateDashboardUI(sales) {
    if (!document.getElementById('dash-today-sales')) return; // not on dashboard page

    const data = utils.getSalesData(sales);
    const revenue = utils.calculateRevenue(data);
    const customers = utils.calculateCustomers(data);
    const payments = utils.calculatePayments(data);
    const offers = utils.calculateOfferStats(data);
    const sarees = utils.calculateSareesSold(data);
    const pending = utils.calculatePending(data);

    animateCounter('dash-today-sales',    revenue.todaySales,   true);
    animateCounter('dash-cash',           payments.cashAllTime,  true);
    animateCounter('dash-online',         payments.onlineAllTime,true);
    animateCounter('dash-pending',        pending.pendingAllTime,true);

    animateCounter('dash-customers',      customers.uniqueCustomers);
    animateCounter('dash-customers-500',  offers.customers500);
    animateCounter('dash-customers-1000', offers.customers1000);

    animateCounter('summary-qty-500',     sarees.sarees500);
    animateCounter('summary-qty-1000',    sarees.sarees1000);
    animateCounter('summary-qty-total',   sarees.totalSarees);
}

// ── Page init ─────────────────────────────────────────────────
async function initDashboard() {
    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        updateDashboardUI(window.salesData);
    }
}

// ── Refresh button handler ─────────────────────────────────────
