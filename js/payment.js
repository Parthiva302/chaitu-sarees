// payment.js

// ── Called from refreshEntireApplication ──────────────────────
function updatePaymentsUI(sales) {
    if (!document.getElementById('paymentBreakdownList')) return;
    _renderPayments(sales);
}

// ── Page init ─────────────────────────────────────────────────
async function initPayments() {
    _renderPayments(window.salesDataCache || []);
    const fresh = await api.getSales();
    _renderPayments(fresh);
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

    // accumulate amounts per method
    const totals = {};
    let grandTotal   = 0;
    let pendingTotal = 0;
    let paidTotal    = 0;
    let totalBills   = sales.length;
    let paidBills    = 0;
    let pendingBills = 0;

    sales.forEach(s => {
        const amt = utils.parseAmount(s.amount);
        if (s.status === 'Pending') {
            pendingTotal += amt;
            pendingBills++;
            totals['Pending'] = (totals['Pending'] || 0) + amt;
        } else if (s.status === 'Paid') {
            paidTotal += amt;
            paidBills++;
            grandTotal += amt;

            if (s.payment === 'Mixed') {
                const cash = utils.parseAmount(s.cashAmount);
                const online = utils.parseAmount(s.onlineAmount);
                totals['Cash'] = (totals['Cash'] || 0) + cash;
                // Credit the online portion to Mixed bucket for clear display
                totals['Mixed'] = (totals['Mixed'] || 0) + online;
            } else {
                const key = methodDefs[s.payment] ? s.payment : 'Other';
                totals[key] = (totals[key] || 0) + amt;
            }
        }
    });

    // Update summary cards
    _setText('pay-grand-total',    utils.formatCurrency(grandTotal));
    _setText('pay-pending',        utils.formatCurrency(pendingTotal));
    _setText('pay-total-bills',    totalBills);
    _setText('pay-paid-bills',     paidBills);
    _setText('pay-pending-bills',  pendingBills);

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
        const pct  = grandTotal + pendingTotal > 0
            ? Math.round(amt / (grandTotal + pendingTotal) * 100) : 0;

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
