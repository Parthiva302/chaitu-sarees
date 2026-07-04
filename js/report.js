// report.js

let _lineChartInst  = null;
let _donutChartInst = null;

// ── Called from refreshEntireApplication ──────────────────────
function updateReportsUI(sales) {
    if (!document.getElementById('rep-today')) return;
    _renderReports(sales);
}

// ── Page init ─────────────────────────────────────────────────
async function initReports() {
    _renderReports(window.salesDataCache || []);
    const fresh = await api.getSales();
    _renderReports(fresh);
}

// ── Core render logic ─────────────────────────────────────────
function _renderReports(sales) {
    const today = utils.getCurrentDate();
    const month = utils.getCurrentMonth(); // YYYY-MM

    const onlineMethods = ['PhonePe', 'Google Pay', 'Paytm', 'UPI',
                           'Debit Card', 'Credit Card', 'Bank Transfer'];

    let todaySales  = 0;
    let monthlySales = 0;
    let cashCol     = 0;
    let onlineCol   = 0;
    let sarees500   = 0;
    let sarees1000  = 0;
    const salesByDate = {};   // date -> total amount
    const salesByMonth = {};  // YYYY-MM -> total amount

    sales.forEach(s => {
        const amt = utils.parseAmount(s.amount);

        // Today
        if (s.date === today) todaySales += amt;

        // Current month
        if (s.date && s.date.startsWith(month)) {
            monthlySales += amt;

            if (s.status === 'Paid') {
                if (s.payment === 'Cash') {
                    cashCol += amt;
                } else if (s.payment === 'Mixed') {
                    cashCol   += utils.parseAmount(s.cashAmount);
                    onlineCol += utils.parseAmount(s.onlineAmount);
                } else if (onlineMethods.includes(s.payment)) {
                    onlineCol += amt;
                }
            }
        }

        // Charts - aggregate by date
        if (s.date) {
            salesByDate[s.date]  = (salesByDate[s.date]  || 0) + amt;
            const m = s.date.substring(0, 7);
            salesByMonth[m] = (salesByMonth[m] || 0) + amt;
        }

        // Saree counts
        sarees500  += utils.parseQty(s.sarees500);
        sarees1000 += utils.parseQty(s.sarees1000);
    });

    // Update stat cards
    _setText('rep-today',   utils.formatCurrency(todaySales));
    _setText('rep-monthly', utils.formatCurrency(monthlySales));
    _setText('rep-cash',    utils.formatCurrency(cashCol));
    _setText('rep-online',  utils.formatCurrency(onlineCol));

    // Render charts
    _renderLineChart(salesByDate);
    _renderDonutChart(sarees500, sarees1000);
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
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
        labels.push(String(d.getDate()).padStart(2, '0') + '/' +
            String(d.getMonth() + 1).padStart(2, '0'));
        data.push(salesByDate[dateStr] || 0);
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
