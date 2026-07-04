// records.js

let allRecords = [];

async function initRecords() {
    allRecords = await api.getSales();
    renderTable(allRecords);
    
    // Bind filters
    document.getElementById('searchCustomer').addEventListener('input', filterRecords);
    document.getElementById('searchInvoice').addEventListener('input', filterRecords);
    document.getElementById('filterDate').addEventListener('change', (e) => {
        const customContainer = document.getElementById('customDateContainer');
        if (e.target.value === 'Custom') {
            customContainer.classList.remove('d-none');
        } else {
            customContainer.classList.add('d-none');
            filterRecords();
        }
    });
    document.getElementById('customDate').addEventListener('change', filterRecords);
}

function renderTable(data) {
    const tbody = document.getElementById('recordsTbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No records found.</td></tr>';
        return;
    }
    
    data.forEach((s, index) => {
        const statusBadge = s.status === 'Paid' ? 'bg-success' : 'bg-danger';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fw-bold text-primary-custom">${s.invoice}</span></td>
            <td>${s.date}<br><small class="text-muted">${s.time}</small></td>
            <td>${s.customerName}<br><small class="text-muted">${s.phone}</small></td>
            <td>
                <div><span class="badge bg-success me-1">500</span> x ${s.sarees500}</div>
                <div><span class="badge bg-info me-1">1000</span> x ${s.sarees1000}</div>
            </td>
            <td class="fw-bold">₹${s.amount}</td>
            <td>${s.payment}</td>
            <td><span class="badge ${statusBadge}">${s.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewRecord(${index})"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-danger"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRecords() {
    const searchCust = document.getElementById('searchCustomer').value.toLowerCase();
    const searchInv = document.getElementById('searchInvoice').value.toLowerCase();
    const dateFilter = document.getElementById('filterDate').value;
    const customDate = document.getElementById('customDate').value;
    
    const today = utils.getCurrentDate();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yYear = yesterdayDate.getFullYear();
    const yMonth = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterdayDate.getDate()).padStart(2, '0');
    const yesterday = `${yYear}-${yMonth}-${yDay}`;
    
    const filtered = allRecords.filter(s => {
        let matchCust = s.customerName.toLowerCase().includes(searchCust) || s.phone.includes(searchCust);
        let matchInv = s.invoice.toLowerCase().includes(searchInv);
        let matchDate = true;
        
        if (dateFilter === 'Today') {
            matchDate = (s.date === today);
        } else if (dateFilter === 'Yesterday') {
            matchDate = (s.date === yesterday);
        } else if (dateFilter === 'Custom' && customDate) {
            matchDate = (s.date === customDate);
        }
        
        return matchCust && matchInv && matchDate;
    });
    
    renderTable(filtered);
}

function viewRecord(index) {
    const s = allRecords[index];
    const body = document.getElementById('recordDetailsBody');
    body.innerHTML = `
        <div class="row">
            <div class="col-6">
                <p class="mb-1 text-muted">Invoice</p>
                <h6 class="fw-bold">${s.invoice}</h6>
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted">Date & Time</p>
                <h6 class="fw-bold">${s.date} ${s.time}</h6>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-6">
                <p class="mb-1 text-muted">Customer Name</p>
                <h6 class="fw-bold">${s.customerName}</h6>
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted">Phone Number</p>
                <h6 class="fw-bold">${s.phone}</h6>
            </div>
        </div>
        <hr>
        <table class="table table-bordered">
            <thead class="table-light">
                <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
            </thead>
            <tbody>
                <tr><td>₹500 Sarees</td><td>${s.sarees500}</td><td>₹${s.sarees500 * 500}</td></tr>
                <tr><td>₹1000 Sarees</td><td>${s.sarees1000}</td><td>₹${s.sarees1000 * 1000}</td></tr>
                <tr class="fw-bold"><td>Total</td><td>${s.totalSarees}</td><td>₹${s.amount}</td></tr>
            </tbody>
        </table>
        <div class="row mt-3">
            <div class="col-6">
                <p class="mb-1 text-muted">Payment Method</p>
                <h6 class="fw-bold">${s.payment}</h6>
                ${s.payment === 'Mixed' ? `<small>Cash: ₹${s.cashAmount}, Online: ₹${s.onlineAmount}</small>` : ''}
            </div>
            <div class="col-6 text-end">
                <p class="mb-1 text-muted">Status</p>
                <h6><span class="badge ${s.status === 'Paid' ? 'bg-success' : 'bg-danger'}">${s.status}</span></h6>
            </div>
        </div>
        ${s.notes ? `<div class="mt-3"><p class="mb-1 text-muted">Notes</p><p>${s.notes}</p></div>` : ''}
    `;
    const modal = new bootstrap.Modal(document.getElementById('viewRecordModal'));
    modal.show();
}
