// sales.js

let _currentInvoice = '';

// ── Page init ─────────────────────────────────────────────────
function initSales() {
    let isEditMode = false;
    
    if (window.editSaleData) {
        isEditMode = true;
        _currentInvoice = window.editSaleData.invoice;
        const formTitle = document.querySelector('h2.text-primary-custom');
        if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-pencil me-2"></i> Edit Sale';
    } else {
        // Generate next invoice from the full sales list
        _currentInvoice = utils.generateInvoice(utils.getSalesData(window.salesData));
    }

    const preview = document.getElementById('invoice-preview');
    if (preview) preview.textContent = '#' + _currentInvoice;

    // Offer option highlighting
    document.querySelectorAll('input[name="offer"]').forEach(radio => {
        radio.addEventListener('change', _onOfferChange);
    });

    // Payment method dropdown
    const paymentSel = document.getElementById('payment');
    if (paymentSel) {
        paymentSel.addEventListener('change', handlePaymentChange);
    }

    // Mixed payment inputs
    const cashAmt = document.getElementById('cashAmount');
    const onlAmt  = document.getElementById('onlineAmount');
    if (cashAmt) cashAmt.addEventListener('input', validateMixedAmounts);
    if (onlAmt)  onlAmt.addEventListener('input',  validateMixedAmounts);

    // Qty inputs - listen for direct edits
    const q500Input = document.getElementById('sarees500');
    const q1kInput  = document.getElementById('sarees1000');
    if (q500Input) q500Input.addEventListener('input', calculateTotals);
    if (q1kInput)  q1kInput.addEventListener('input',  calculateTotals);

    calculateTotals();

    // Populate data if editing
    if (window.editSaleData) {
        populateEditForm(window.editSaleData);
    }
}

function populateEditForm(data) {
    document.getElementById('customerName').value = data.customerName || '';
    document.getElementById('customerPhone').value = data.phone || '';
    
    const offerRadio = document.querySelector(`input[name="offer"][value="${data.offer}"]`);
    if (offerRadio) {
        offerRadio.checked = true;
        _onOfferChange({ target: offerRadio });
    }
    
    document.getElementById('sarees500').value = data.sarees500 || 0;
    document.getElementById('sarees500-val').textContent = data.sarees500 || 0;
    
    document.getElementById('sarees1000').value = data.sarees1000 || 0;
    document.getElementById('sarees1000-val').textContent = data.sarees1000 || 0;
    
    const paymentEl = document.getElementById('payment');
    if (paymentEl) {
        paymentEl.value = data.payment || 'Cash';
        handlePaymentChange({ target: paymentEl });
    }
    
    const statusPaid = document.getElementById('statusPaid');
    const statusPending = document.getElementById('statusPending');
    if (data.status === 'Paid' && statusPaid) statusPaid.checked = true;
    else if (statusPending) statusPending.checked = true;
    
    if (data.payment === 'Mixed') {
        document.getElementById('cashAmount').value = data.cashAmount || '';
        document.getElementById('onlineAmount').value = data.onlineAmount || '';
    }
    
    document.getElementById('notes').value = data.notes || '';
    
    calculateTotals();
}


// ── Offer styling ─────────────────────────────────────────────
function _onOfferChange(e) {
    document.querySelectorAll('.offer-option').forEach(opt => opt.classList.remove('selected'));
    const opt = e.target.closest('.offer-option');
    if (opt) opt.classList.add('selected');
}

// ── Qty stepper buttons ───────────────────────────────────────
function updateQty(id, change) {
    const input = document.getElementById(id);
    if (!input) return;
    let val = utils.parseQty(input.value) + change;
    if (val < 0) val = 0;
    input.value = val;
    const display = document.getElementById(id + '-val');
    if (display) display.textContent = val;
    calculateTotals();
}

// ── Live total calculation ────────────────────────────────────
function calculateTotals() {
    const q500  = utils.parseQty(document.getElementById('sarees500')?.value);
    const q1000 = utils.parseQty(document.getElementById('sarees1000')?.value);
    const total = (q500 * 500) + (q1000 * 1000);

    const totSareesEl = document.getElementById('totalSareesDisplay');
    const totAmtEl    = document.getElementById('totalAmountDisplay');
    if (totSareesEl) totSareesEl.textContent = q500 + q1000;
    if (totAmtEl)    totAmtEl.textContent    = utils.formatCurrency(total);

    if (document.getElementById('payment')?.value === 'Mixed') validateMixedAmounts();
}

async function refreshInvoice(sales) {
    _currentInvoice = utils.generateInvoice(utils.getSalesData(sales));
    const preview = document.getElementById('invoice-preview');
    if (preview) preview.textContent = '#' + _currentInvoice;
}

// ── Mixed payment section toggle ──────────────────────────────
function handlePaymentChange(e) {
    const method   = e?.target?.value || document.getElementById('payment')?.value || '';
    const mixedDiv = document.getElementById('mixedPaymentDiv');
    if (!mixedDiv) return;

    if (method === 'Mixed') {
        mixedDiv.classList.remove('d-none');
    } else {
        mixedDiv.classList.add('d-none');
        const ca = document.getElementById('cashAmount');
        const oa = document.getElementById('onlineAmount');
        if (ca) ca.value = '';
        if (oa) oa.value = '';
        const err = document.getElementById('mixedErrorMsg');
        if (err) err.classList.add('d-none');
    }
}

// ── Validate mixed amounts ────────────────────────────────────
function validateMixedAmounts() {
    if (document.getElementById('payment')?.value !== 'Mixed') return true;

    const q500   = utils.parseQty(document.getElementById('sarees500')?.value);
    const q1000  = utils.parseQty(document.getElementById('sarees1000')?.value);
    const total  = (q500 * 500) + (q1000 * 1000);
    const cash   = utils.parseAmount(document.getElementById('cashAmount')?.value);
    const online = utils.parseAmount(document.getElementById('onlineAmount')?.value);
    const err    = document.getElementById('mixedErrorMsg');

    if (Math.abs(cash + online - total) > 0.01) {
        if (err) err.classList.remove('d-none');
        return false;
    }
    if (err) err.classList.add('d-none');
    return true;
}

// ── Clear form ────────────────────────────────────────────────
function clearForm() {
    window.editSaleData = null;
    const formTitle = document.querySelector('h2.text-primary-custom');
    if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-cart-plus me-2"></i> New Sale';

    const form = document.getElementById('newSaleForm');
    if (form) form.reset();

    // Reset qty displays
    ['sarees500', 'sarees1000'].forEach(id => {
        const inp = document.getElementById(id);
        const disp = document.getElementById(id + '-val');
        if (inp)  inp.value = 0;
        if (disp) disp.textContent = 0;
    });

    // Reset offer selection visuals
    document.querySelectorAll('.offer-option').forEach(o => o.classList.remove('selected'));
    const def500 = document.querySelector('input[value="₹500 Offer"]');
    if (def500) {
        def500.checked = true;
        const optEl = def500.closest('.offer-option');
        if (optEl) optEl.classList.add('selected');
    }

    // Hide mixed payment section
    handlePaymentChange({ target: { value: '' } });
    calculateTotals();
}

// ── Submit sale ───────────────────────────────────────────────
async function submitSale(print = false) {
    const form = document.getElementById('newSaleForm');
    if (!form) return;

    // HTML5 validation
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const q500   = utils.parseQty(document.getElementById('sarees500')?.value);
    const q1000  = utils.parseQty(document.getElementById('sarees1000')?.value);
    const total  = q500 + q1000;
    const amount = (q500 * 500) + (q1000 * 1000);

    if (total === 0) { alert('Please add at least one saree.'); return; }

    const method = document.getElementById('payment')?.value || '';
    if (method === 'Mixed' && !validateMixedAmounts()) {
        alert('Cash and Online amounts must add up to the Total Amount.'); return;
    }

    const offerInput  = document.querySelector('input[name="offer"]:checked');
    const statusInput = document.querySelector('input[name="status"]:checked');

    const saleData = {
        invoice:      _currentInvoice,
        customerName: document.getElementById('customerName')?.value?.trim() || '',
        phone:        document.getElementById('customerPhone')?.value?.trim() || '',
        offer:        offerInput  ? offerInput.value  : '',
        sarees500:    q500,
        sarees1000:   q1000,
        totalSarees:  total,
        amount:       amount,
        payment:      method,
        cashAmount:   method === 'Mixed' ? utils.parseAmount(document.getElementById('cashAmount')?.value) : 0,
        onlineAmount: method === 'Mixed' ? utils.parseAmount(document.getElementById('onlineAmount')?.value) : 0,
        status:       statusInput ? statusInput.value : 'Paid',
        notes:        document.getElementById('notes')?.value?.trim() || '',
        date:         utils.getCurrentDate(),
        time:         utils.getCurrentTime()
    };

    // Disable buttons during save
    const buttons = form.querySelectorAll('button');
    const saveBtn = form.querySelector('.btn-primary-custom');
    const originalHTML = saveBtn ? saveBtn.innerHTML : '';

    buttons.forEach(b => b.disabled = true);
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Saving...';

    try {
        const wasEdit = !!window.editSaleData;
        if (wasEdit) {
            saleData.date = window.editSaleData.date;
            saleData.time = window.editSaleData.time;
            await api.updateSale(saleData);
            utils.showToast('✓ Sale updated successfully!', 'success');
        } else {
            await api.saveSale(saleData);
            utils.showToast('✓ Sale saved successfully!', 'success');
        }

        if (print) printInvoice(saleData);

        clearForm();

        await refreshEntireApplication();
        
        if (wasEdit) {
            app.navigate('records');
        } else {
            // refresh again inside sales view just to reset invoice number
            _currentInvoice = utils.generateInvoice(utils.getSalesData(window.salesData));
            const preview = document.getElementById('invoice-preview');
            if (preview) preview.textContent = '#' + _currentInvoice;
        }

    } catch (err) {
        utils.showToast('Failed to save: ' + err.message, 'danger');
        console.error('submitSale error:', err);
    } finally {
        buttons.forEach(b => b.disabled = false);
        if (saveBtn) saveBtn.innerHTML = originalHTML || '<i class="fa-solid fa-save me-2"></i>Save';
    }
}

// ── Print invoice ─────────────────────────────────────────────
function printInvoice(data) {
    if (!data) return;
    const inv    = data.invoice      || 'N/A';
    const name   = data.customerName || '-';
    const phone  = data.phone        || '-';
    const offer  = data.offer        || '-';
    const q500   = utils.parseQty(data.sarees500);
    const q1000  = utils.parseQty(data.sarees1000);
    const total  = utils.parseQty(data.totalSarees)  || (q500 + q1000);
    const amount = utils.parseAmount(data.amount);
    const date   = data.date         || '';
    const time   = data.time         || '';
    const method = data.payment      || '-';
    const status = data.status       || '-';
    const notes  = data.notes        || '';

    const rows500  = q500  > 0 ? `<tr><td>₹500 Saree</td><td>${q500}</td><td>₹500</td><td>₹${q500 * 500}</td></tr>` : '';
    const rows1000 = q1000 > 0 ? `<tr><td>₹1000 Saree</td><td>${q1000}</td><td>₹1000</td><td>₹${q1000 * 1000}</td></tr>` : '';

    const mixedLine = method === 'Mixed'
        ? `<br><small>Cash: ₹${data.cashAmount || 0} | Online: ₹${data.onlineAmount || 0}</small>` : '';

    const notesLine = notes
        ? `<div style="margin-top:15px;padding:10px;background:#f8f9fa;border-radius:6px">
               <strong>Notes:</strong> ${notes}
           </div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${inv} - Chaitu Sarees</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #222; max-width: 700px; margin: auto; }
        .header { text-align: center; border-bottom: 3px solid #7B002C; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { color: #7B002C; margin: 0 0 5px; font-size: 28px; }
        .header p { margin: 4px 0; color: #555; font-size: 13px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .info-col { flex: 1; }
        .info-col.right { text-align: right; }
        .info-col p { margin: 3px 0; font-size: 14px; }
        .info-col strong { color: #7B002C; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #7B002C; color: white; padding: 10px; text-align: left; }
        td { padding: 9px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
        tr:nth-child(even) td { background: #fafafa; }
        .total-row td { font-weight: bold; background: #fff3f6; font-size: 15px; }
        .payment-box { border: 1px solid #ddd; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; margin-bottom: 20px; }
        .grand-total { text-align: right; font-size: 22px; font-weight: bold; color: #7B002C; margin-bottom: 20px; }
        .footer { text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-paid { background: #d4edda; color: #155724; }
        .badge-pending { background: #f8d7da; color: #721c24; }
        @media print { body { padding: 15px; } }
    </style>
</head>
<body onload="window.print()">
    <div class="header">
        <h1>🏪 Chaitu Sarees</h1>
        <p>Old Sivalyam Backgate, Jain Temple Street, Tenali</p>
        <p>📞 +91 9494977491 | parthivaaneesh@gmail.com</p>
    </div>
    <div class="info-row">
        <div class="info-col">
            <p><strong>Customer:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Offer:</strong> ${offer}</p>
        </div>
        <div class="info-col right">
            <p><strong>Invoice:</strong> ${inv}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
        </div>
    </div>
    <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
        <tbody>
            ${rows500}
            ${rows1000}
            <tr class="total-row">
                <td colspan="2"><strong>Total (${total} Sarees)</strong></td>
                <td></td>
                <td><strong>₹${amount}</strong></td>
            </tr>
        </tbody>
    </table>
    <div class="grand-total">Total Amount: ₹${amount}</div>
    <div class="payment-box">
        <div>
            <strong>Payment:</strong> ${method}${mixedLine}<br>
            <strong>Status:</strong> <span class="badge ${status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${status}</span>
        </div>
        <div style="font-size:20px;font-weight:bold;color:#7B002C">₹${amount}</div>
    </div>
    ${notesLine}
    <div class="footer">
        <p>Thank you for shopping at <strong>Chaitu Sarees</strong>! 🙏</p>
        <p>No return or exchange on offer items.</p>
    </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        alert('Pop-up blocked! Please allow pop-ups to print the invoice.');
    }
}
