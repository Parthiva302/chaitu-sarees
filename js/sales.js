// sales.js

let currentInvoiceNumber = '';

function initSales() {
    // Generate Invoice Number
    // Get last invoice from cache if available
    let lastInv = '';
    if (salesDataCache.length > 0) {
        lastInv = salesDataCache[0].invoiceNumber;
    }
    currentInvoiceNumber = utils.generateInvoiceNumber(lastInv);
    document.getElementById('invoice-preview').textContent = '#' + currentInvoiceNumber;

    // Offer Selection Styling
    const offerRadios = document.querySelectorAll('input[name="offerCategory"]');
    offerRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.offer-option').forEach(opt => opt.classList.remove('selected'));
            e.target.closest('.offer-option').classList.add('selected');
        });
    });

    // Payment Method change event
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', handlePaymentMethodChange);
    }
    
    // Mixed Inputs calculation
    document.getElementById('cashAmount').addEventListener('input', validateMixedAmounts);
    document.getElementById('onlineAmount').addEventListener('input', validateMixedAmounts);
}

function updateQty(id, change) {
    const input = document.getElementById(id);
    const display = document.getElementById(`${id}-val`);
    
    let current = parseInt(input.value, 10);
    let newVal = current + change;
    
    if (newVal < 0) newVal = 0;
    
    input.value = newVal;
    display.textContent = newVal;
    
    calculateTotals();
}

function calculateTotals() {
    const q500 = utils.parseQty(document.getElementById('qty500').value);
    const q1000 = utils.parseQty(document.getElementById('qty1000').value);
    
    const totalSarees = q500 + q1000;
    const totalAmount = (q500 * 500) + (q1000 * 1000);
    
    document.getElementById('totalSareesDisplay').textContent = totalSarees;
    document.getElementById('totalAmountDisplay').textContent = utils.formatCurrency(totalAmount);
    
    // Also trigger mixed amounts validation if visible
    if (document.getElementById('paymentMethod').value === 'Mixed') {
        validateMixedAmounts();
    }
}

function handlePaymentMethodChange(e) {
    const method = e.target.value;
    const mixedDiv = document.getElementById('mixedPaymentDiv');
    
    if (method === 'Mixed') {
        mixedDiv.classList.remove('d-none');
    } else {
        mixedDiv.classList.add('d-none');
        document.getElementById('cashAmount').value = '';
        document.getElementById('onlineAmount').value = '';
        document.getElementById('mixedErrorMsg').classList.add('d-none');
    }
}

function validateMixedAmounts() {
    const method = document.getElementById('paymentMethod').value;
    if (method !== 'Mixed') return true;
    
    const q500 = utils.parseQty(document.getElementById('qty500').value);
    const q1000 = utils.parseQty(document.getElementById('qty1000').value);
    const totalAmount = (q500 * 500) + (q1000 * 1000);
    
    const cash = parseFloat(document.getElementById('cashAmount').value) || 0;
    const online = parseFloat(document.getElementById('onlineAmount').value) || 0;
    
    const errorMsg = document.getElementById('mixedErrorMsg');
    
    if ((cash + online) !== totalAmount) {
        errorMsg.classList.remove('d-none');
        return false;
    } else {
        errorMsg.classList.add('d-none');
        return true;
    }
}

function clearForm() {
    document.getElementById('newSaleForm').reset();
    
    document.getElementById('qty500').value = 0;
    document.getElementById('qty500-val').textContent = 0;
    document.getElementById('qty1000').value = 0;
    document.getElementById('qty1000-val').textContent = 0;
    
    document.querySelectorAll('.offer-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('input[value="₹500 Offer"]').checked = true;
    document.querySelector('input[value="₹500 Offer"]').closest('.offer-option').classList.add('selected');
    
    handlePaymentMethodChange({target: {value: ''}});
    calculateTotals();
}

async function submitSale(print = false) {
    const form = document.getElementById('newSaleForm');
    
    // Basic Validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const q500 = utils.parseQty(document.getElementById('qty500').value);
    const q1000 = utils.parseQty(document.getElementById('qty1000').value);
    const totalSarees = q500 + q1000;
    const totalAmount = (q500 * 500) + (q1000 * 1000);
    
    if (totalSarees === 0) {
        alert("Please add at least one saree.");
        return;
    }
    
    const method = document.getElementById('paymentMethod').value;
    if (method === 'Mixed' && !validateMixedAmounts()) {
        alert("Cash and Online amounts do not add up to Total Amount.");
        return;
    }
    
    const saleData = {
        invoiceNumber: currentInvoiceNumber,
        customerName: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        offerCategory: document.querySelector('input[name="offerCategory"]:checked').value,
        qty500: q500,
        qty1000: q1000,
        totalSarees: totalSarees,
        amount: totalAmount,
        paymentMethod: method,
        cashAmount: method === 'Mixed' ? parseFloat(document.getElementById('cashAmount').value) : 0,
        onlineAmount: method === 'Mixed' ? parseFloat(document.getElementById('onlineAmount').value) : 0,
        paymentStatus: document.querySelector('input[name="paymentStatus"]:checked').value,
        notes: document.getElementById('notes').value,
        date: utils.getCurrentDate(),
        time: utils.getCurrentTime()
    };
    
    try {
        const btnSave = document.querySelector('.btn-primary-custom');
        const originalText = btnSave.innerHTML;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btnSave.disabled = true;
        
        await api.saveSale(saleData);
        
        utils.showToast("Sale Saved Successfully!");
        
        if (print) {
            printInvoice(saleData);
        }
        
        clearForm();
        initSales(); // Regenerate invoice number
        
    } catch (error) {
        alert("Failed to save sale: " + error.message);
    } finally {
        const btnSave = document.querySelector('.btn-primary-custom');
        btnSave.innerHTML = '<i class="fa-solid fa-save me-2"></i> Save';
        btnSave.disabled = false;
    }
}

function printInvoice(data) {
    // Generate Invoice HTML for printing
    const printWindow = window.open('', '_blank');
    
    const html = `
    <html>
    <head>
        <title>Invoice - ${data.invoiceNumber}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #7B002C; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #7B002C; margin: 0; }
            .header p { margin: 5px 0; font-size: 14px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; }
            .totals { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px;}
            @media print {
                .no-print { display: none; }
            }
        </style>
    </head>
    <body onload="window.print(); window.close();">
        <div class="no-print" style="text-align: right; margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #7B002C; color: white; border: none; cursor: pointer;">Print</button>
        </div>
        <div class="header">
            <h1>Chaitu Sarees</h1>
            <p>123 Mega Shopping Mall, Hyderabad, 500001</p>
            <p>Phone: +91 9876543210</p>
        </div>
        <div class="details">
            <div>
                <strong>Customer:</strong> ${data.customerName}<br>
                <strong>Phone:</strong> ${data.phone}
            </div>
            <div style="text-align: right;">
                <strong>Invoice:</strong> ${data.invoiceNumber}<br>
                <strong>Date:</strong> ${data.date} ${data.time}<br>
                <strong>Offer:</strong> ${data.offerCategory}
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.qty500 > 0 ? `
                <tr>
                    <td>₹500 Saree</td>
                    <td>${data.qty500}</td>
                    <td>₹500</td>
                    <td>₹${data.qty500 * 500}</td>
                </tr>` : ''}
                ${data.qty1000 > 0 ? `
                <tr>
                    <td>₹1000 Saree</td>
                    <td>${data.qty1000}</td>
                    <td>₹1000</td>
                    <td>₹${data.qty1000 * 1000}</td>
                </tr>` : ''}
            </tbody>
        </table>
        <div class="totals">
            <p>Total Sarees: ${data.totalSarees}</p>
            <p>Total Amount: ₹${data.amount}</p>
        </div>
        <div class="details" style="border: 1px solid #ddd; padding: 10px;">
            <div>
                <strong>Payment Method:</strong> ${data.paymentMethod}<br>
                <strong>Status:</strong> ${data.paymentStatus}
            </div>
        </div>
        <div class="footer">
            <p>Thank you for shopping with Chaitu Sarees!</p>
            <p>No Return, No Exchange on Offer Items.</p>
        </div>
    </body>
    </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}
