// app.js - Application shell: navigation, clock, and global refresh

// ─────────────────────────────────────────────────────────────────────────────
// Global refresh – single function that fetches data and updates every page
// ─────────────────────────────────────────────────────────────────────────────
async function refreshEntireApplication() {
    try {
        const latestSales = await api.getSales();
        window.salesData = latestSales;

        if (typeof refreshDashboard === 'function') await refreshDashboard(window.salesData);
        if (typeof refreshReports === 'function') await refreshReports(window.salesData);
        if (typeof refreshPayments === 'function') await refreshPayments(window.salesData);
        if (typeof refreshSalesRecords === 'function') await refreshSalesRecords(window.salesData);
        if (typeof refreshInvoice === 'function') await refreshInvoice(window.salesData);
        if (typeof refreshStatistics === 'function') await refreshStatistics(window.salesData);
        if (typeof refreshCharts === 'function') await refreshCharts(window.salesData);
    } catch (e) {
        console.error('refreshEntireApplication error:', e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPA Application object
// ─────────────────────────────────────────────────────────────────────────────
const app = {
    currentPage: 'dashboard',

    async init() {
        this._bindSidebar();
        this._bindNav();
        this._startClock();
        await this.navigate(this.currentPage);
    },

    // ── Sidebar toggle ──────────────────────────────────────────
    _bindSidebar() {
        const toggle  = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        }
    },

    // ── Navigation links ────────────────────────────────────────
    _bindNav() {
        document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) this.navigate(page);
            });
        });
    },

    // ── Live clock ──────────────────────────────────────────────
    _startClock() {
        this._tickClock();
        setInterval(() => this._tickClock(), 1000);
    },

    _tickClock() {
        const now = new Date();
        const dateEl  = document.getElementById('current-date');
        const clockEl = document.getElementById('live-clock');
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-IN', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });
        }
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
        }
    },

    // ── Page navigation ─────────────────────────────────────────
    async navigate(page) {
        this.currentPage = page;

        // Update active nav link
        document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === page);
        });

        // Close mobile sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('active');

        // Show loading spinner
        const container = document.getElementById('page-container');
        container.innerHTML = `<div class="text-center mt-5 py-5">
            <div class="spinner-border text-danger" style="width:3rem;height:3rem" role="status"></div>
            <p class="mt-3 text-muted">Loading ${page}…</p>
        </div>`;

        try {
            const res = await fetch(`pages/${page}.html`);
            if (!res.ok) throw new Error(`${page}.html not found (${res.status})`);
            const html = await res.text();

            // Animate transition
            container.classList.remove('fade-in');
            void container.offsetWidth; // force reflow
            container.innerHTML = html;
            container.classList.add('fade-in');

            // Run page init
            await this._initPage(page);

            setTimeout(() => {
                if (page === 'dashboard' && typeof updateDashboardUI === 'function') {
                    updateDashboardUI(window.salesData);
                }
                if (page === 'reports' && typeof refreshReports === 'function') {
                    refreshReports(window.salesData);
                }
                if (page === 'payments' && typeof refreshPayments === 'function') {
                    refreshPayments(window.salesData);
                }
                if (page === 'records' && typeof refreshSalesRecords === 'function') {
                    refreshSalesRecords(window.salesData);
                }
            }, 50);
        } catch (err) {
            container.innerHTML = `
                <div class="alert alert-danger m-4" role="alert">
                    <h5 class="alert-heading"><i class="fa-solid fa-triangle-exclamation me-2"></i>Page Load Error</h5>
                    <p>Could not load <strong>${page}.html</strong>. Make sure you are running from a local server.</p>
                    <hr><small class="text-muted">${err.message}</small>
                </div>`;
            console.error('navigate error:', err);
        }
    },

    // ── Per-page initialization ──────────────────────────────────
    async _initPage(page) {
        switch (page) {
            case 'dashboard': if (typeof initDashboard === 'function') await initDashboard(); break;
            case 'sales':     if (typeof initSales     === 'function') initSales();     break;
            case 'records':   if (typeof initRecords   === 'function') await initRecords();   break;
            case 'reports':   if (typeof initReports   === 'function') await initReports();   break;
            case 'payments':  if (typeof initPayments  === 'function') await initPayments();  break;
            case 'settings':  if (typeof initSettings  === 'function') initSettings();  break;
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
async function initApp() {
    // Restore dark mode if saved
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    window.salesData = window.salesData || [];
    await app.init();
    await refreshEntireApplication();
}

document.addEventListener('DOMContentLoaded', initApp);
