// utils.js - Shared utility functions

const utils = {
    // ── Currency formatter ─────────────────────────────────────
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    },

    // ── Invoice number generator ───────────────────────────────
    // Format: CS-YYYYMMDD-001
    generateInvoice(salesList) {
        const d = new Date();
        const year  = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day   = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const prefix = `CS-${dateStr}-`;

        // Find highest sequence for today
        let maxSeq = 0;
        (salesList || []).forEach(s => {
            if (s.invoice && s.invoice.startsWith(prefix)) {
                const seq = parseInt(s.invoice.replace(prefix, ''), 10);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        });

        return prefix + String(maxSeq + 1).padStart(3, '0');
    },

    // ── Bootstrap Toast ────────────────────────────────────────
    showToast(message, type = 'success') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) return;
        const toastBody = document.getElementById('toast-message');
        if (toastBody) toastBody.textContent = message;
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        toastEl.classList.add(`text-bg-${type}`);
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
    },

    // ── Date helpers (Forced to Asia/Kolkata Timezone) ─────────
    formatKolkataDate(date) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const parts = formatter.formatToParts(date);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            return `${year}-${month}-${day}`;
        } catch (e) {
            const d = new Date(date);
            return d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
        }
    },

    getCurrentDate() {
        return this.formatKolkataDate(new Date());
    },

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    },

    getYesterdayDate() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return this.formatKolkataDate(d);
    },

    getCurrentMonth() {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit'
            });
            const parts = formatter.formatToParts(new Date());
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            return `${year}-${month}`;
        } catch (e) {
            const d = new Date();
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
    },

    // ── Safe number parsers ────────────────────────────────────
    parseQty(val) {
        const n = parseInt(val, 10);
        return isNaN(n) || n < 0 ? 0 : n;
    },

    parseAmount(val) {
        const n = parseFloat(val);
        return isNaN(n) || n < 0 ? 0 : n;
    },

    // ── Centralized Sales Stats Calculation ────────────────────
    calculateSalesStats(sales) {
        const today = this.getCurrentDate();
        const month = this.getCurrentMonth(); // YYYY-MM

        let todaySales = 0;
        let monthlySales = 0;
        
        let cashAllTime = 0;
        let onlineAllTime = 0;
        let pendingAllTime = 0;
        
        let cashMonthly = 0;
        let onlineMonthly = 0;
        
        let sarees500 = 0;
        let sarees1000 = 0;
        let totalSarees = 0;
        
        let customers500 = 0;
        let customers1000 = 0;
        const uniquePhones = new Set();
        
        let totalBills = sales.length;
        let paidBills = 0;
        let pendingBills = 0;

        const onlineMethods = ['PhonePe', 'Google Pay', 'Paytm', 'UPI',
                               'Debit Card', 'Credit Card', 'Bank Transfer'];

        const paymentTotals = {
            'Cash': 0,
            'PhonePe': 0,
            'Google Pay': 0,
            'Paytm': 0,
            'UPI': 0,
            'Debit Card': 0,
            'Credit Card': 0,
            'Bank Transfer': 0,
            'Mixed': 0,
            'Pending': 0,
            'Other': 0
        };

        const salesByDate = {};   // date -> total amount
        const salesByMonth = {};  // YYYY-MM -> total amount

        (sales || []).forEach(s => {
            const amt = this.parseAmount(s.amount);
            const isPaid = s.status === 'Paid';
            const isPending = s.status === 'Pending';
            
            // Unique customers
            if (s.phone) uniquePhones.add(String(s.phone));

            // Saree quantities
            const q500 = this.parseQty(s.sarees500);
            const q1000 = this.parseQty(s.sarees1000);
            sarees500 += q500;
            sarees1000 += q1000;
            totalSarees += (q500 + q1000);

            // Offer customer counts
            if (s.offer === '₹500 Offer') customers500++;
            if (s.offer === '₹1000 Offer') customers1000++;

            // Sales by date/month (all statuses)
            if (s.date) {
                salesByDate[s.date] = (salesByDate[s.date] || 0) + amt;
                const m = s.date.substring(0, 7);
                salesByMonth[m] = (salesByMonth[m] || 0) + amt;
            }

            // Today's Sales
            if (s.date === today) {
                todaySales += amt;
            }

            // Monthly Sales
            if (s.date && s.date.startsWith(month)) {
                monthlySales += amt;
            }

            // Payment & Bill calculations
            if (isPending) {
                pendingAllTime += amt;
                pendingBills++;
                paymentTotals['Pending'] = (paymentTotals['Pending'] || 0) + amt;
            } else if (isPaid) {
                paidBills++;
                
                // All-Time Payment Breakdown
                if (s.payment === 'Cash') {
                    cashAllTime += amt;
                    paymentTotals['Cash'] = (paymentTotals['Cash'] || 0) + amt;
                } else if (s.payment === 'Mixed') {
                    const cashAmt = this.parseAmount(s.cashAmount);
                    const onlineAmt = this.parseAmount(s.onlineAmount);
                    cashAllTime += cashAmt;
                    onlineAllTime += onlineAmt;
                    paymentTotals['Cash'] = (paymentTotals['Cash'] || 0) + cashAmt;
                    paymentTotals['Mixed'] = (paymentTotals['Mixed'] || 0) + onlineAmt;
                } else if (onlineMethods.includes(s.payment)) {
                    onlineAllTime += amt;
                    paymentTotals[s.payment] = (paymentTotals[s.payment] || 0) + amt;
                } else {
                    onlineAllTime += amt;
                    paymentTotals['Other'] = (paymentTotals['Other'] || 0) + amt;
                }

                // Monthly Collection Breakdown
                if (s.date && s.date.startsWith(month)) {
                    if (s.payment === 'Cash') {
                        cashMonthly += amt;
                    } else if (s.payment === 'Mixed') {
                        cashMonthly += this.parseAmount(s.cashAmount);
                        onlineMonthly += this.parseAmount(s.onlineAmount);
                    } else if (onlineMethods.includes(s.payment)) {
                        onlineMonthly += amt;
                    } else {
                        onlineMonthly += amt;
                    }
                }
            }
        });

        const totalRevenue = (sales || []).reduce((sum, s) => sum + this.parseAmount(s.amount), 0);
        const avgBill = (sales || []).length > 0 ? Math.round(totalRevenue / sales.length) : 0;

        return {
            todaySales,
            monthlySales,
            cashAllTime,
            onlineAllTime,
            pendingAllTime,
            cashMonthly,
            onlineMonthly,
            sarees500,
            sarees1000,
            totalSarees,
            customers500,
            customers1000,
            uniqueCustomers: uniquePhones.size,
            totalBills,
            paidBills,
            pendingBills,
            avgBill,
            paymentTotals,
            salesByDate,
            salesByMonth
        };
    }
};
