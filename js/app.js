// app.js
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const app = {
    currentPage: 'dashboard',
    
    init() {
        this.bindEvents();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.navigate(this.currentPage);
    },
    
    bindEvents() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Navigation Links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.navigate(page);
                }
            });
        });
    },
    
    updateClock() {
        const now = new Date();
        const dateEl = document.getElementById('current-date');
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
    
    async navigate(page) {
        this.currentPage = page;
        
        // Update active class in sidebar
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
        
        // Close sidebar on mobile after navigation
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('active');
        }
        
        // Fetch and load page content
        const container = document.getElementById('page-container');
        container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Loading...</p></div>';
        
        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            // Add fade animation
            container.classList.remove('fade-in');
            void container.offsetWidth; // trigger reflow
            container.innerHTML = html;
            container.classList.add('fade-in');
            
            // Initialize page specific scripts
            this.initPageScripts(page);
            
        } catch (error) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error!</h4>
                    <p>Failed to load ${page}.html. Ensure you are running through a local server.</p>
                </div>`;
            console.error(error);
        }
    },
    
    initPageScripts(page) {
        // Call specific init functions based on the loaded page
        switch (page) {
            case 'dashboard':
                if (typeof initDashboard === 'function') initDashboard();
                break;
            case 'sales':
                if (typeof initSales === 'function') initSales();
                break;
            case 'records':
                if (typeof initRecords === 'function') initRecords();
                break;
            case 'reports':
                if (typeof initReports === 'function') initReports();
                break;
            case 'payments':
                if (typeof initPayments === 'function') initPayments();
                break;
            case 'settings':
                if (typeof initSettings === 'function') initSettings();
                break;
        }
    }
};

function initApp() {
    app.init();
}
