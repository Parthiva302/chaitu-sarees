// payment.js

async function initPayments() {
    const sales = await api.getSales();
    
    const methods = {
        'Cash': { amount: 0, icon: 'fa-money-bill-wave', color: 'text-success' },
        'PhonePe': { amount: 0, icon: 'fa-mobile-screen', color: 'text-primary' },
        'Google Pay': { amount: 0, icon: 'fa-google-pay', color: 'text-info' },
        'Paytm': { amount: 0, icon: 'fa-mobile-screen', color: 'text-info' },
        'UPI': { amount: 0, icon: 'fa-qrcode', color: 'text-primary' },
        'Debit Card': { amount: 0, icon: 'fa-credit-card', color: 'text-secondary' },
        'Credit Card': { amount: 0, icon: 'fa-credit-card', color: 'text-warning' },
        'Bank Transfer': { amount: 0, icon: 'fa-building-columns', color: 'text-dark' }
    };
    
    let grandTotal = 0;
    
    sales.forEach(s => {
        if (s.paymentStatus === 'Paid') {
            if (s.paymentMethod === 'Mixed') {
                methods['Cash'].amount += (parseFloat(s.cashAmount) || 0);
                // The online part goes into generic 'UPI' or we can create an 'Online Mixed' category.
                // Assuming UPI for mixed online, or create a 'Mixed Online' bucket.
                if (!methods['Mixed Online']) methods['Mixed Online'] = { amount: 0, icon: 'fa-globe', color: 'text-primary' };
                methods['Mixed Online'].amount += (parseFloat(s.onlineAmount) || 0);
                grandTotal += (parseFloat(s.cashAmount) || 0) + (parseFloat(s.onlineAmount) || 0);
            } else {
                if (methods[s.paymentMethod]) {
                    methods[s.paymentMethod].amount += parseFloat(s.amount);
                    grandTotal += parseFloat(s.amount);
                } else {
                    // Fallback
                    if (!methods['Other']) methods['Other'] = { amount: 0, icon: 'fa-circle-question', color: 'text-muted' };
                    methods['Other'].amount += parseFloat(s.amount);
                    grandTotal += parseFloat(s.amount);
                }
            }
        }
    });
    
    const list = document.getElementById('paymentBreakdownList');
    list.innerHTML = '';
    
    for (const [key, val] of Object.entries(methods)) {
        if (val.amount > 0) {
            list.innerHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center border-0 mb-2 rounded bg-light p-3">
                    <div class="d-flex align-items-center">
                        <div class="icon-box-sm bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center me-3" style="width: 40px; height: 40px;">
                            <i class="fa-solid ${val.icon} ${val.color} fs-5"></i>
                        </div>
                        <span class="fw-bold fs-5">${key}</span>
                    </div>
                    <span class="fs-5 fw-bold">${utils.formatCurrency(val.amount)}</span>
                </div>
            `;
        }
    }
    
    if (list.innerHTML === '') {
        list.innerHTML = '<div class="text-center py-4 text-muted">No payments recorded.</div>';
    }
    
    document.getElementById('pay-grand-total').textContent = utils.formatCurrency(grandTotal);
}
