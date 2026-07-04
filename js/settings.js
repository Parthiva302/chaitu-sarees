// settings.js

function initSettings() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Read current state from local storage or body class
        if (document.body.classList.contains('dark-theme')) {
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-theme');
                // Basic dark mode styles can be toggled via a class in style.css
                // (Optional enhancement to add proper dark variables)
            } else {
                document.body.classList.remove('dark-theme');
            }
        });
    }
}
