// report.js

let _lineChartInst  = null;
let _donutChartInst = null;

// ── Called from refreshEntireApplication ──────────────────────
async function refreshReports(sales) {
    if (Array.isArray(sales)) {
        if (!document.getElementById('rep-today')) return;
        _renderReports(sales);
        return;
    }

    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        _renderReports(window.salesData);
    }
}

function updateReportsUI(sales) {
    if (!document.getElementById('rep-today')) return;
    _renderReports(sales);
}

async function refreshCharts(sales) {
    const data = utils.getSalesData(sales);
    const revenue = utils.calculateRevenue(data);
    const sarees = utils.calculateSareesSold(data);

    _renderLineChart(revenue.salesByDate);
    _renderDonutChart(sarees.sarees500, sarees.sarees1000);
}

// ── Page init ─────────────────────────────────────────────────
async function initReports() {
    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        _renderReports(window.salesData);
    }
}

// ── Core render logic ─────────────────────────────────────────
function _renderReports(sales) {
    const data = utils.getSalesData(sales);
    const revenue = utils.calculateRevenue(data);
    const payments = utils.calculatePayments(data);
    const sarees = utils.calculateSareesSold(data);

    // Update stat cards
    _setText('rep-today',   utils.formatCurrency(revenue.todaySales));
    _setText('rep-monthly', utils.formatCurrency(revenue.monthlySales));
    _setText('rep-cash',    utils.formatCurrency(payments.cashMonthly));
    _setText('rep-online',  utils.formatCurrency(payments.onlineMonthly));

    // Render charts
    _renderLineChart(revenue.salesByDate);
    _renderDonutChart(sarees.sarees500, sarees.sarees1000);
}

// ── Helper ────────────────────────────────────────────────────
function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Line chart: last 7 days ───────────────────────────────────
function _renderLineChart(salesByDate) {
    const canvas = document.getElementById('dailySalesChart');
    if (!canvas) return;

    const labels = [];
    const data   = [];
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatter.format(d); // "YYYY-MM-DD"
        
        // Extract day and month for label e.g., "DD/MM"
        const parts = dateStr.split('-');
        const label = parts[2] + '/' + parts[1];

        labels.push(label);
        data.push((salesByDate || {})[dateStr] || 0);
    }

    if (_lineChartInst) { _lineChartInst.destroy(); _lineChartInst = null; }

    _lineChartInst = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Sales (₹)',
                data,
                borderColor: '#7B002C',
                backgroundColor: 'rgba(123,0,44,0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#7B002C',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ── Donut chart: offer distribution ──────────────────────────
function _renderDonutChart(s500, s1000) {
    const canvas = document.getElementById('offerDistChart');
    if (!canvas) return;

    if (_donutChartInst) { _donutChartInst.destroy(); _donutChartInst = null; }

    _donutChartInst = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['₹500 Sarees', '₹1000 Sarees'],
            datasets: [{
                data: [s500, s1000],
                backgroundColor: ['#4caf50', '#03a9f4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '68%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}
