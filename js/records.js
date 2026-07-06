// records.js

// Module state – safe to be global because only one page loads at a time
let _allRecords  = [];
let _filteredRecords = [];

// ── Called from refreshEntireApplication ──────────────────────
async function refreshSalesRecords(sales) {
    if (Array.isArray(sales)) {
        if (!document.getElementById('recordsTbody')) return;
        _allRecords = utils.getSalesData(sales).slice();
        applyRecordFilters();
        return;
    }

    if (!window.salesData || window.salesData.length === 0) {
        await refreshEntireApplication();
    } else {
        _allRecords = utils.getSalesData(window.salesData).slice();
        applyRecordFilters();
    }
}

function updateRecordsUI(sales) {
    if (!document.getElementById('recordsTbody')) return;
    _allRecords = utils.getSalesData(sales).slice(); // keep a copy
    applyRecordFilters();
}

async function initRecords() {
    _allRecords = utils.getSalesData(window.salesData).slice();
    applyRecordFilters();
    _bindRecordFilters();
}

// ── Bind filter event listeners ───────────────────────────────
function _bindRecordFilters() {
    const q = (id) => document.getElementById(id);

    const sc = q('searchCustomer');
    if (sc && !sc._bound) {
        sc.addEventListener('input', applyRecordFilters);
        sc._bound = true;
    }

    const si = q('searchInvoice');
    if (si && !si._bound) {
        si.addEventListener('input', applyRecordFilters);
        si._bound = true;
    }

    const fd = q('filterDate');
    if (fd && !fd._bound) {
        fd.addEventListener('change', () => {
            const cc = q('customDateContainer');
            if (fd.value === 'Custom') {
                cc && cc.classList.remove('d-none');
            } else {
                cc && cc.classList.add('d-none');
                applyRecordFilters();
            }
        });
        fd._bound = true;
    }

    const cd = q('customDate');
    if (cd && !cd._bound) {
        cd.addEventListener('change', applyRecordFilters);
        cd._bound = true;
    }
}

// ── Apply filters and re-render ───────────────────────────────
function applyRecordFilters() {
    const q = (id) => document.getElementById(id);

    const searchCust = (q('searchCustomer')?.value || '').toLowerCase().trim();
    const searchInv  = (q('searchInvoice')?.value  || '').toLowerCase().trim();
    const dateFilter = q('filterDate')?.value || 'All';
    const customDate = q('customDate')?.value || '';

    const today     = utils.getCurrentDate();
    const yesterday = utils.getYesterdayDate();

    _filteredRecords = _allRecords.filter(s => {
        const name  = (s.customerName || '').toLowerCase();
        const phone = String(s.phone || '');
        const inv   = (s.invoice || '').toLowerCase();

        const matchCust = !searchCust || name.includes(searchCust) || phone.includes(searchCust);
        const matchInv  = !searchInv  || inv.includes(searchInv);

        let matchDate = true;
        if      (dateFilter === 'Today')     matchDate = s.date === today;
        else if (dateFilter === 'Yesterday') matchDate = s.date === yesterday;
        else if (dateFilter === 'Custom' && customDate) matchDate = s.date === customDate;

        return matchCust && matchInv && matchDate;
    });

    renderRecordsTable(_filteredRecords);
}

// ── Render table ──────────────────────────────────────────────
function renderRecordsTable(data) {
    const tbody = document.getElementById('recordsTbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">' +
            '<i class="fa-solid fa-inbox fa-2x mb-3 d-block"></i>No records found.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(s => {
        const statusClass = s.status === 'Paid' ? 'bg-success' : 'bg-danger';
        const inv = (s.invoice || '').replace(/'/g, "\\'");
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fw-bold text-primary-custom">${s.invoice || '-'}</span></td>
            <td>${s.date || '-'}<br><small class="text-muted">${s.time || '-'}</small></td>
            <td>${s.customerName || '-'}<br><small class="text-muted">${s.phone || '-'}</small></td>
            <td>
                <div><span class="badge bg-success me-1">₹500</span>x ${s.sarees500}</div>
                <div><span class="badge bg-info me-1">₹1000</span>x ${s.sarees1000}</div>
            </td>
            <td class="fw-bold">${utils.formatCurrency(s.amount)}</td>
            <td>${s.payment || '-'}</td>
            <td><span class="badge ${statusClass}">${s.status || '-'}</span></td>
            <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewSaleRecord('${inv}')" title="View"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editSaleRecord('${inv}')" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                ${s.status === 'Pending' ? `<button class="btn btn-sm btn-outline-success me-1" onclick="openPaymentModal('${inv}')" title="Mark as Paid"><i class="fa-solid fa-sack-dollar"></i></button>` : ''}
                <button class="btn btn-sm btn-outline-info me-1" onclick="reprintInvoice('${inv}')" title="Print"><i class="fa-solid fa-print"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSaleRecord('${inv}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── View modal ────────────────────────────────────────────────
function viewSaleRecord(invoice) {
    const s = _allRecords.find(r => r.invoice === invoice);
    if (!s) { utils.showToast('Record not found', 'warning'); return; }

    const body = document.getElementById('recordDetailsBody');
    if (!body) return;

    const mixedInfo = s.payment === 'Mixed'
        ? `<small class="text-muted d-block">Cash: ${utils.formatCurrency(s.cashAmount)} | Online: ${utils.formatCurrency(s.onlineAmount)}</small>`
        : '';

    body.innerHTML = `
        <div class="row g-3">
            <div class="col-6">
                <p class="mb-1 text-muted small">Invoice</p>
                <h6 class="fw-bold">${s.invoice}</h6>
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted small">Date &amp; Time</p>
                <h6 class="fw-bold">${s.date} ${s.time}</h6>
            </div>
            <div class="col-6">
                <p class="mb-1 text-muted small">Customer</p>
                <h6 class="fw-bold">${s.customerName}</h6>
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted small">Phone</p>
                <h6 class="fw-bold">${s.phone}</h6>
            </div>
        </div>
        <hr>
        <table class="table table-bordered table-sm mb-3">
            <thead class="table-light">
                <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody>
                ${s.sarees500 > 0 ? `<tr><td>₹500 Saree</td><td>${s.sarees500}</td><td>₹500</td><td>${utils.formatCurrency(s.sarees500 * 500)}</td></tr>` : ''}
                ${s.sarees1000 > 0 ? `<tr><td>₹1000 Saree</td><td>${s.sarees1000}</td><td>₹1000</td><td>${utils.formatCurrency(s.sarees1000 * 1000)}</td></tr>` : ''}
                <tr class="fw-bold table-secondary"><td>Total</td><td>${s.totalSarees}</td><td>-</td><td>${utils.formatCurrency(s.amount)}</td></tr>
            </tbody>
        </table>
        <div class="row">
            <div class="col-6">
                <p class="mb-1 text-muted small">Payment</p>
                <h6 class="fw-bold">${s.payment}</h6>
                ${mixedInfo}
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted small">Status</p>
                <h6><span class="badge ${s.status === 'Paid' ? 'bg-success' : 'bg-danger'} fs-6">${s.status}</span></h6>
            </div>
        </div>
        ${s.notes ? `<hr><p class="mb-1 text-muted small">Notes</p><p>${s.notes}</p>` : ''}
        <div class="text-end mt-3 pt-2 border-top">
            <button class="btn btn-accent text-white" onclick="reprintInvoice('${invoice}')">
                <i class="fa-solid fa-print me-1"></i> Re-Print Invoice
            </button>
        </div>`;

    new bootstrap.Modal(document.getElementById('viewRecordModal')).show();
}

// ── Re-print from records ──────────────────────────────────────
function reprintInvoice(invoice) {
    const s = _allRecords.find(r => r.invoice === invoice);
    if (s && typeof printInvoice === 'function') printInvoice(s);
}

// ── Edit Record ───────────────────────────────────────────────
function editSaleRecord(invoice) {
    const s = _allRecords.find(r => r.invoice === invoice);
    if (!s) { utils.showToast('Record not found', 'warning'); return; }
    window.editSaleData = s;
    app.navigate('sales');
}

// ── Payment Modal ─────────────────────────────────────────────
let _paymentInvoice = '';
function openPaymentModal(invoice) {
    const s = _allRecords.find(r => r.invoice === invoice);
    if (!s) return;
    _paymentInvoice = invoice;
    
    document.getElementById('paymentModalInvoice').textContent = s.invoice;
    document.getElementById('paymentModalCustomer').textContent = s.customerName;
    document.getElementById('paymentModalAmount').textContent = utils.formatCurrency(s.amount);
    
    const paymentSel = document.getElementById('paymentModalMethod');
    if (paymentSel) paymentSel.value = s.payment || 'Cash';
    
    new bootstrap.Modal(document.getElementById('updatePaymentModal')).show();
}

async function confirmPayment() {
    const method = document.getElementById('paymentModalMethod').value;
    const btn = document.querySelector('#updatePaymentModal .btn-primary-custom');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Updating...';
    }
    
    try {
        await api.updatePayment(_paymentInvoice, 'Paid', method);
        utils.showToast('✅ Payment Updated Successfully', 'success');
        
        const modalEl = document.getElementById('updatePaymentModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        await refreshEntireApplication();
    } catch (err) {
        utils.showToast('Failed to update payment: ' + err.message, 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Confirm Payment';
        }
    }
}

// ── Delete record ─────────────────────────────────────────────
let _deleteInvoice = '';
function deleteSaleRecord(invoice) {
    _deleteInvoice = invoice;
    document.getElementById('deleteModalInvoiceText').textContent = 'Invoice: ' + invoice;
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
}

async function confirmDeleteSale() {
    if (!_deleteInvoice) return;
    const invoice = _deleteInvoice;
    
    const btn = document.querySelector('#deleteConfirmModal .btn-danger');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Deleting...';
    }

    // Save to local blacklist immediately so it never reappears in this client
    const deleted = JSON.parse(localStorage.getItem('deletedInvoices') || '[]');
    if (!deleted.includes(invoice)) {
        deleted.push(invoice);
        localStorage.setItem('deletedInvoices', JSON.stringify(deleted));
    }

    // Remove from local cache
    window.salesData = (window.salesData || []).filter(s => s.invoice !== invoice);

    // Call actual delete API on Google Sheets in background/try-catch
    try {
        await api.deleteSale(invoice);
        utils.showToast('✓ Record deleted.', 'success');
    } catch (err) {
        console.error('deleteSaleRecord API error:', err);
        utils.showToast('Record deleted locally.', 'warning');
    }
    
    const modalEl = document.getElementById('deleteConfirmModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Refresh application UI
    await refreshEntireApplication();
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Delete';
    }
}

// ── Export to CSV ─────────────────────────────────────────────
function exportSalesToCSV() {
    const data = _filteredRecords.length > 0 ? _filteredRecords : _allRecords;
    if (data.length === 0) {
        utils.showToast('No records to export', 'warning');
        return;
    }
    
    let csv = 'Invoice,Date,Time,Customer Name,Phone,Offer,500 Qty,1000 Qty,Total Qty,Amount,Payment,Status,Notes\n';
    data.forEach(s => {
        const row = [
            s.invoice,
            s.date,
            s.time,
            `"${(s.customerName || '').replace(/"/g, '""')}"`,
            s.phone,
            s.offer,
            s.sarees500,
            s.sarees1000,
            s.totalSarees,
            s.amount,
            s.payment,
            s.status,
            `"${(s.notes || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sales_records_${utils.getCurrentDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    utils.showToast('Exported successfully!', 'success');
}

// Keep old names as aliases for backwards compatibility
const filterRecords = applyRecordFilters;
function viewRecord(inv)   { viewSaleRecord(inv); }
function deleteRecord(inv) { deleteSaleRecord(inv); }
const exportRecords = exportSalesToCSV;
