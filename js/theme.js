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

    // Track which buttons already have listeners
    const initializedButtons = new WeakSet();

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
     * Setup theme toggle button event listeners
     */
    function setupThemeToggle() {
        const themeButtons = document.querySelectorAll('.theme-toggle, .mobile-theme-toggle');
        
        themeButtons.forEach(button => {
            if (!initializedButtons.has(button)) {
                initializedButtons.add(button);
                button.addEventListener('click', () => {
                    const isDark = document.body.classList.toggle(DARK_THEME_CLASS);
                    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
                });
            }
        });
    }

    /**
     * Initialize theme and setup listeners with retry for dynamic elements
     */
    function init() {
        initTheme();
        setupThemeToggle();
        
        // Retry setup after 100ms to catch dynamically created buttons (mobile menu)
        setTimeout(setupThemeToggle, 100);
        setTimeout(setupThemeToggle, 500);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also setup on window load (catches late dynamic elements)
    window.addEventListener('load', setupThemeToggle);

})();
