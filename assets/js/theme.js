document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateToggleIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const targetTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
        updateToggleIcon(targetTheme);

        // GSAP transition if available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo('body', { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
        }
    });

    function updateToggleIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }
});
