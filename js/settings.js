// settings.js

function initSettings() {
    // Override Save Information button
    const saveInfoBtn = document.querySelector('button[onclick="utils.showToast(\'Shop info updated!\')"]');
    if (saveInfoBtn) {
        saveInfoBtn.removeAttribute('onclick');
        saveInfoBtn.addEventListener('click', () => {
            const shopName = document.getElementById('shopName')?.value || '';
            const shopPhone = document.getElementById('shopPhone')?.value || '';
            localStorage.setItem('shopName', shopName);
            localStorage.setItem('shopPhone', shopPhone);
            utils.showToast('✓ Shop information saved!', 'success');
        });
    }

    // Populate Shop Info if saved
    const shopNameInp = document.getElementById('shopName');
    const shopPhoneInp = document.getElementById('shopPhone');
    if (shopNameInp && localStorage.getItem('shopName')) {
        shopNameInp.value = localStorage.getItem('shopName');
    }
    if (shopPhoneInp && localStorage.getItem('shopPhone')) {
        shopPhoneInp.value = localStorage.getItem('shopPhone');
    }

    // Override Backup Data button
    const backupBtn = document.querySelector('button[onclick="utils.showToast(\'Data Backed Up successfully!\')"]');
    if (backupBtn) {
        backupBtn.removeAttribute('onclick');
        backupBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.salesData || []));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `chaitu_sarees_backup_${utils.getCurrentDate()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            utils.showToast('✓ Backup downloaded successfully!', 'success');
        });
    }

    // Override Restore Data button
    const restoreBtn = document.querySelector('button[onclick="utils.showToast(\'Data Restored!\')"]');
    if (restoreBtn) {
        restoreBtn.removeAttribute('onclick');
        restoreBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        const parsed = JSON.parse(evt.target.result);
                        if (Array.isArray(parsed)) {
                            window.salesData = parsed;
                            utils.showToast('✓ Data restored successfully!', 'success');
                            await refreshEntireApplication();
                        } else {
                            throw new Error('Invalid backup file structure.');
                        }
                    } catch (err) {
                        utils.showToast('Failed to restore: ' + err.message, 'danger');
                    }
                };
                reader.readAsText(file);
            });
            fileInput.click();
        });
    }

    // Override Factory Reset button
    const resetBtn = document.querySelector('button[onclick*="Factory Reset"]') || 
                     document.querySelector('button[onclick*="clear all data"]');
    if (resetBtn) {
        resetBtn.removeAttribute('onclick');
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all local data? This will clear local theme preferences and local cache.')) {
                localStorage.removeItem('deletedInvoices');
                localStorage.removeItem('shopName');
                localStorage.removeItem('shopPhone');
                localStorage.removeItem('theme');
                window.salesData = [];
                utils.showToast('Local overrides cleared. Refreshing...', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        });
    }
    
    // Theme toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        if (document.body.classList.contains('dark-theme')) {
            darkModeToggle.checked = true;
        }
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}
