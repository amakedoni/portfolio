/**
 * Theme Toggle Module
 * Handles dark/light theme switching with localStorage persistence
 * Can be used on any page of the portfolio
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'theme';
    const DARK_THEME_CLASS = 'dark-theme';
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Track which buttons already have listeners
    const initializedButtons = new WeakSet();

    /**
     * Initialize theme based on localStorage
     */
    function initTheme() {
        // Black is the site's default look; light is an explicit choice.
        document.body.classList.toggle(DARK_THEME_CLASS, localStorage.getItem(STORAGE_KEY) !== 'light');
    }

    /**
     * Setup theme toggle button event listeners
     */
    function setupThemeToggle() {
        const themeButtons = document.querySelectorAll('.theme-toggle, .mobile-theme-toggle');
        
        themeButtons.forEach(button => {
            if (!initializedButtons.has(button)) {
                initializedButtons.add(button);
                button.addEventListener('click', (event) => {
                    const x = event.clientX || window.innerWidth / 2;
                    const y = event.clientY || window.innerHeight / 2;
                    document.documentElement.style.setProperty('--theme-x', `${x}px`);
                    document.documentElement.style.setProperty('--theme-y', `${y}px`);
                    const commitTheme = () => {
                        const isDark = document.body.classList.toggle(DARK_THEME_CLASS);
                        localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
                    };

                    if (!reducedMotionMedia.matches && document.startViewTransition) {
                        document.startViewTransition(commitTheme);
                    } else {
                        commitTheme();
                    }
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
