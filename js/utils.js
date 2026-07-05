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
    getLocalDateKey(dateInput) {
        if (!dateInput) return '';
        
        let d;
        if (typeof dateInput === 'string') {
            const trimmed = dateInput.trim();
            if (!trimmed) return '';
            
            // If it's just a date string like "2026-07-05", new Date() will parse it as UTC midnight.
            // When formatted to Asia/Kolkata, it remains the same day (5:30 AM IST).
            d = new Date(trimmed);
        } else if (dateInput instanceof Date) {
            d = dateInput;
        } else {
            d = new Date(dateInput);
        }

        if (isNaN(d.getTime())) return '';

        try {
            return d.toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata'
            });
        } catch (e) {
            // Fallback if en-CA or timeZone is not supported
            return d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
        }
    },

    getCurrentDate() {
        return this.getLocalDateKey(new Date());
    },

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    },

    getYesterdayDate() {
        const yesterdayTimestamp = Date.now() - 86400000;
        return this.getLocalDateKey(new Date(yesterdayTimestamp));
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

    normalizeDateKey(value) {
        return this.getLocalDateKey(value);
    },

    getSalesData(sales) {
        return Array.isArray(sales) ? sales : (window.salesData || []);
    },

    buildSalesAnalytics(sales) {
        const list = this.getSalesData(sales);
        const today = this.getCurrentDate();
        const month = this.getCurrentMonth();

        const analytics = {
            todaySales: 0,
            monthlySales: 0,
            totalRevenue: 0,
            cashAllTime: 0,
            onlineAllTime: 0,
            pendingAllTime: 0,
            cashMonthly: 0,
            onlineMonthly: 0,
            sarees500: 0,
            sarees1000: 0,
            totalSarees: 0,
            customers500: 0,
            customers1000: 0,
            uniqueCustomers: 0,
            totalBills: list.length,
            paidBills: 0,
            pendingBills: 0,
            avgBill: 0,
            paymentTotals: {
                Cash: 0,
                PhonePe: 0,
                'Google Pay': 0,
                Paytm: 0,
                UPI: 0,
                'Debit Card': 0,
                'Credit Card': 0,
                'Bank Transfer': 0,
                Mixed: 0,
                Pending: 0,
                Other: 0
            },
            salesByDate: {},
            salesByMonth: {}
        };

        const uniquePhones = new Set();
        const onlineMethods = new Set([
            'PhonePe',
            'Google Pay',
            'Paytm',
            'UPI',
            'Debit Card',
            'Credit Card',
            'Bank Transfer'
        ]);

        list.forEach(s => {
            const amount = this.parseAmount(s.amount);
            const isPaid = s.status === 'Paid';
            const isPending = s.status === 'Pending';
            const q500 = this.parseQty(s.sarees500);
            const q1000 = this.parseQty(s.sarees1000);
            const cashAmount = this.parseAmount(s.cashAmount);
            const onlineAmount = this.parseAmount(s.onlineAmount);
            const payment = String(s.payment || '').trim();
            const saleDate = this.normalizeDateKey(s.date);

            analytics.totalRevenue += amount;

            if (s.phone) uniquePhones.add(String(s.phone));
            analytics.sarees500 += q500;
            analytics.sarees1000 += q1000;
            analytics.totalSarees += q500 + q1000;

            if (s.offer === '₹500 Offer') analytics.customers500++;
            if (s.offer === '₹1000 Offer') analytics.customers1000++;

            if (saleDate) {
                analytics.salesByDate[saleDate] = (analytics.salesByDate[saleDate] || 0) + amount;
                const saleMonth = saleDate.substring(0, 7);
                analytics.salesByMonth[saleMonth] = (analytics.salesByMonth[saleMonth] || 0) + amount;
            }

            if (saleDate === today) analytics.todaySales += amount;
            if (saleDate && saleDate.startsWith(month)) analytics.monthlySales += amount;

            if (isPending) {
                analytics.pendingAllTime += amount;
                analytics.pendingBills++;
                analytics.paymentTotals.Pending += amount;
                return;
            }

            if (!isPaid) {
                analytics.paymentTotals.Other += amount;
                return;
            }

            analytics.paidBills++;

            if (payment === 'Cash') {
                analytics.cashAllTime += amount;
                if (saleDate && saleDate.startsWith(month)) analytics.cashMonthly += amount;
                analytics.paymentTotals.Cash += amount;
                return;
            }

            if (payment === 'Mixed') {
                analytics.cashAllTime += cashAmount;
                analytics.onlineAllTime += onlineAmount;
                if (saleDate && saleDate.startsWith(month)) {
                    analytics.cashMonthly += cashAmount;
                    analytics.onlineMonthly += onlineAmount;
                }
                analytics.paymentTotals.Cash += cashAmount;
                analytics.paymentTotals['Google Pay'] += onlineAmount;
                analytics.paymentTotals.Mixed += cashAmount + onlineAmount;
                return;
            }

            if (onlineMethods.has(payment)) {
                analytics.onlineAllTime += amount;
                if (saleDate && saleDate.startsWith(month)) analytics.onlineMonthly += amount;
                analytics.paymentTotals[payment] += amount;
                return;
            }

            analytics.onlineAllTime += amount;
            if (saleDate && saleDate.startsWith(month)) analytics.onlineMonthly += amount;
            analytics.paymentTotals.Other += amount;
        });

        analytics.uniqueCustomers = uniquePhones.size;
        analytics.avgBill = list.length > 0 ? Math.round(analytics.totalRevenue / list.length) : 0;
        return analytics;
    },

    calculateRevenue(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            todaySales: analytics.todaySales,
            monthlySales: analytics.monthlySales,
            totalRevenue: analytics.totalRevenue,
            avgBill: analytics.avgBill,
            salesByDate: analytics.salesByDate,
            salesByMonth: analytics.salesByMonth
        };
    },

    calculateCustomers(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            uniqueCustomers: analytics.uniqueCustomers,
            totalBills: analytics.totalBills,
            paidBills: analytics.paidBills,
            pendingBills: analytics.pendingBills,
            customers500: analytics.customers500,
            customers1000: analytics.customers1000
        };
    },

    calculatePayments(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            cashAllTime: analytics.cashAllTime,
            onlineAllTime: analytics.onlineAllTime,
            pendingAllTime: analytics.pendingAllTime,
            cashMonthly: analytics.cashMonthly,
            onlineMonthly: analytics.onlineMonthly,
            paymentTotals: analytics.paymentTotals,
            totalBills: analytics.totalBills,
            paidBills: analytics.paidBills,
            pendingBills: analytics.pendingBills
        };
    },

    calculateOfferStats(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            customers500: analytics.customers500,
            customers1000: analytics.customers1000
        };
    },

    calculateSareesSold(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            sarees500: analytics.sarees500,
            sarees1000: analytics.sarees1000,
            totalSarees: analytics.totalSarees
        };
    },

    calculatePending(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            pendingAllTime: analytics.pendingAllTime,
            pendingBills: analytics.pendingBills
        };
    },

    // ── Centralized Sales Stats Calculation ────────────────────
    calculateSalesStats(sales) {
        const analytics = this.buildSalesAnalytics(sales);
        return {
            todaySales: analytics.todaySales,
            monthlySales: analytics.monthlySales,
            cashAllTime: analytics.cashAllTime,
            onlineAllTime: analytics.onlineAllTime,
            pendingAllTime: analytics.pendingAllTime,
            cashMonthly: analytics.cashMonthly,
            onlineMonthly: analytics.onlineMonthly,
            sarees500: analytics.sarees500,
            sarees1000: analytics.sarees1000,
            totalSarees: analytics.totalSarees,
            customers500: analytics.customers500,
            customers1000: analytics.customers1000,
            uniqueCustomers: analytics.uniqueCustomers,
            totalBills: analytics.totalBills,
            paidBills: analytics.paidBills,
            pendingBills: analytics.pendingBills,
            avgBill: analytics.avgBill,
            paymentTotals: analytics.paymentTotals,
            salesByDate: analytics.salesByDate,
            salesByMonth: analytics.salesByMonth
        };
    }
};
