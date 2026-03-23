/**
 * Theme Toggle Module
 * Handles dark/light theme switching with localStorage persistence
 * Can be used on any page of the portfolio
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'theme';
    const DARK_THEME_CLASS = 'dark-theme';
    const MEDIA_QUERY = '(prefers-color-scheme: dark)';

    /**
     * Initialize theme based on localStorage or OS preference
     */
    function initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const prefersDark = window.matchMedia(MEDIA_QUERY).matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add(DARK_THEME_CLASS);
        }
    }

    /**
     * Toggle theme and save to localStorage
     * @param {HTMLElement} toggleButton - The theme toggle button element
     */
    function setupThemeToggle(toggleButton) {
        if (!toggleButton) return;

        toggleButton.addEventListener('click', () => {
            document.body.classList.toggle(DARK_THEME_CLASS);
            const isDark = document.body.classList.contains(DARK_THEME_CLASS);
            localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
        });
    }

    /**
     * Setup all theme toggle buttons on the page
     */
    function setupAllThemeToggles() {
        const toggles = document.querySelectorAll('.theme-toggle, .mobile-theme-toggle');
        toggles.forEach(setupThemeToggle);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            setupAllThemeToggles();
        });
    } else {
        initTheme();
        setupAllThemeToggles();
    }

    // Expose for external use if needed
    window.ThemeToggle = {
        init: initTheme,
        setup: setupThemeToggle,
        setupAll: setupAllThemeToggles
    };

})();
