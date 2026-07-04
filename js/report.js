// report.js

let dailySalesChartInstance = null;
let offerDistChartInstance = null;

async function initReports() {
    const sales = await api.getSales();
    
    let todaySales = 0;
    let monthlySales = 0;
    let cashCol = 0;
    let onlineCol = 0;
    
    const today = utils.getCurrentDate();
    const currentMonth = today.substring(0, 7); // YYYY-MM
    
    // Aggregation objects for charts
    const salesByDate = {};
    let qty500 = 0;
    let qty1000 = 0;
    
    sales.forEach(s => {
        const amt = parseFloat(s.amount) || 0;
        
        // Month stats
        if (s.date.startsWith(currentMonth)) {
            monthlySales += amt;
            if (s.paymentStatus === 'Paid') {
                if (s.paymentMethod === 'Cash') cashCol += amt;
                else if (s.paymentMethod === 'Mixed') {
                    cashCol += (parseFloat(s.cashAmount) || 0);
                    onlineCol += (parseFloat(s.onlineAmount) || 0);
                } else onlineCol += amt;
            }
        }
        
        // Today Stats
        if (s.date === today) {
            todaySales += amt;
        }
        
        // Aggregate by date (last 7 days logic below)
        if (!salesByDate[s.date]) salesByDate[s.date] = 0;
        salesByDate[s.date] += amt;
        
        // Aggregate Qty for pie chart
        qty500 += (parseInt(s.qty500) || 0);
        qty1000 += (parseInt(s.qty1000) || 0);
    });
    
    document.getElementById('rep-today').textContent = utils.formatCurrency(todaySales);
    document.getElementById('rep-monthly').textContent = utils.formatCurrency(monthlySales);
    document.getElementById('rep-cash').textContent = utils.formatCurrency(cashCol);
    document.getElementById('rep-online').textContent = utils.formatCurrency(onlineCol);
    
    renderCharts(salesByDate, qty500, qty1000);
}

function renderCharts(salesByDate, qty500, qty1000) {
    // Prepare last 7 days data
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        
        labels.push(`${day}/${m}`);
        data.push(salesByDate[dateStr] || 0);
    }
    
    const ctxLine = document.getElementById('dailySalesChart').getContext('2d');
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();
    
    dailySalesChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                borderColor: '#7B002C',
                backgroundColor: 'rgba(123, 0, 44, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    const ctxPie = document.getElementById('offerDistChart').getContext('2d');
    if (offerDistChartInstance) offerDistChartInstance.destroy();
    
    offerDistChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['₹500 Sarees', '₹1000 Sarees'],
            datasets: [{
                data: [qty500, qty1000],
                backgroundColor: ['#4caf50', '#03a9f4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
