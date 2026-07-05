// payment.js

// ── Called from refreshEntireApplication ──────────────────────
async function refreshPayments(sales) {
    if (Array.isArray(sales)) {
        if (!document.getElementById('paymentBreakdownList')) return;
        _renderPayments(sales);
        return;
    }

    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        _renderPayments(window.salesData);
    }
}

function updatePaymentsUI(sales) {
    if (!document.getElementById('paymentBreakdownList')) return;
    _renderPayments(sales);
}

// ── Page init ─────────────────────────────────────────────────
async function initPayments() {
    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        _renderPayments(window.salesData);
    }
}

// ── Core render logic ─────────────────────────────────────────
function _renderPayments(sales) {
    const methodDefs = {
        'Cash':          { icon: 'fa-money-bill-wave',    color: 'text-success'   },
        'PhonePe':       { icon: 'fa-mobile-screen',      color: 'text-primary'   },
        'Google Pay':    { icon: 'fa-google',             color: 'text-info'      },
        'Paytm':         { icon: 'fa-mobile-screen',      color: 'text-info'      },
        'UPI':           { icon: 'fa-qrcode',             color: 'text-primary'   },
        'Debit Card':    { icon: 'fa-credit-card',        color: 'text-secondary' },
        'Credit Card':   { icon: 'fa-credit-card',        color: 'text-warning'   },
        'Bank Transfer': { icon: 'fa-building-columns',   color: 'text-dark'      },
        'Mixed':         { icon: 'fa-shuffle',            color: 'text-purple'    },
        'Pending':       { icon: 'fa-clock',              color: 'text-danger'    },
        'Other':         { icon: 'fa-circle-question',    color: 'text-muted'     },
    };

    const data = utils.getSalesData(sales);
    const payments = utils.calculatePayments(data);
    const totals = payments.paymentTotals;
    const paidTotal = payments.cashAllTime + payments.onlineAllTime;
    const grandTotal = paidTotal; // Total collected

    // Update summary cards
    _setText('pay-grand-total',    utils.formatCurrency(grandTotal));
    _setText('pay-pending',        utils.formatCurrency(payments.pendingAllTime));
    _setText('pay-total-bills',    payments.totalBills);
    _setText('pay-paid-bills',     payments.paidBills);
    _setText('pay-pending-bills',  payments.pendingBills);

    // Render breakdown list
    const list = document.getElementById('paymentBreakdownList');
    if (!list) return;

    list.innerHTML = '';
    const allKeys = [
        ...Object.keys(methodDefs).filter(k => totals[k] > 0),
        ...Object.keys(totals).filter(k => !methodDefs[k] && totals[k] > 0)
    ];

    if (allKeys.length === 0) {
        list.innerHTML = '<div class="text-center py-5 text-muted">' +
            '<i class="fa-solid fa-inbox fa-2x mb-3 d-block"></i>No payments recorded.</div>';
        return;
    }

    allKeys.forEach(key => {
        const amt  = totals[key] || 0;
        if (amt <= 0) return;
        const def  = methodDefs[key] || { icon: 'fa-circle-question', color: 'text-muted' };
        const pct  = grandTotal + payments.pendingAllTime > 0
            ? Math.round(amt / (grandTotal + payments.pendingAllTime) * 100) : 0;

        list.innerHTML += `
            <div class="list-group-item d-flex justify-content-between align-items-center border-0 mb-2 rounded bg-light p-3">
                <div class="d-flex align-items-center">
                    <div class="icon-box-sm bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center me-3"
                         style="width:42px;height:42px;flex-shrink:0">
                        <i class="fa-solid ${def.icon} ${def.color} fs-5"></i>
                    </div>
                    <div>
                        <span class="fw-bold fs-6">${key}</span>
                        <small class="text-muted d-block">${pct}% of total</small>
                    </div>
                </div>
                <span class="fs-6 fw-bold text-dark">${utils.formatCurrency(amt)}</span>
            </div>`;
    });
}

// ── Helper ────────────────────────────────────────────────────
function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
