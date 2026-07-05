// dashboard.js

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

    const s = utils.calculateSalesStats(sales || []);

    animateCounter('dash-today-sales',    s.todaySales,   true);
    animateCounter('dash-cash',           s.cashAllTime,  true);
    animateCounter('dash-online',         s.onlineAllTime,true);
    animateCounter('dash-pending',        s.pendingAllTime,true);

    animateCounter('dash-customers',      s.uniqueCustomers);
    animateCounter('dash-customers-500',  s.customers500);
    animateCounter('dash-customers-1000', s.customers1000);

    animateCounter('summary-qty-500',     s.sarees500);
    animateCounter('summary-qty-1000',    s.sarees1000);
    animateCounter('summary-qty-total',   s.totalSarees);
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
async function refreshDashboard() {
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
