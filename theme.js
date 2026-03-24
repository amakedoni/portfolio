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

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

})();
