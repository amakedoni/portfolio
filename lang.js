// Language Management System
(function() {
    'use strict';
    
    // Get current language from localStorage or default to Russian
    let currentLang = localStorage.getItem('language') || 'ru';
    
    // Set initial language attribute
    document.documentElement.lang = currentLang;
    
    // Language switching function
    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                // Handle different element types
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[lang][key];
                    // Also update aria-label if exists
                    if (element.getAttribute('aria-label')) {
                        element.setAttribute('aria-label', translations[lang][key]);
                    }
                } else if (element.tagName === 'BUTTON' && element.getAttribute('aria-label')) {
                    // For buttons, update aria-label
                    element.setAttribute('aria-label', translations[lang][key]);
                } else {
                    // For regular text elements
                    element.textContent = translations[lang][key];
                }
            }
        });
        
        // Update special elements
        updateSpecialElements(lang);
        
        // Update language toggle button
        const langText = document.querySelector('.lang-text');
        if (langText) {
            langText.textContent = lang.toUpperCase();
        }
        
        // Update mobile menu if exists
        updateMobileMenu(lang);
        
        // Dispatch custom event for language change
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
    
    // Update special elements that need custom handling
    function updateSpecialElements(lang) {
        // Update resume dropdown text
        const resumeToggle = document.querySelector('.resume-toggle');
        if (resumeToggle && translations[lang].nav_resume) {
            resumeToggle.textContent = translations[lang].nav_resume;
        }
        
        // Update mobile resume toggle
        const mobileResumeToggle = document.querySelector('.mobile-resume-toggle');
        if (mobileResumeToggle && translations[lang].nav_resume) {
            mobileResumeToggle.textContent = translations[lang].nav_resume;
        }
        
        // Update document title
        if (translations[lang].page_title) {
            document.title = translations[lang].page_title;
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && translations[lang].meta_description) {
            metaDesc.setAttribute('content', translations[lang].meta_description);
        }
    }
    
    // Update mobile menu navigation links
    function updateMobileMenu(lang) {
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        if (mobileNavLinks.length > 0) {
            const navKeys = ['nav_about', 'nav_projects', 'nav_education', 'nav_skills', 'nav_contact'];
            mobileNavLinks.forEach((link, index) => {
                if (translations[lang][navKeys[index]]) {
                    link.textContent = translations[lang][navKeys[index]];
                }
            });
        }
    }
    
    // Initialize language on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLanguageSwitcher();
            setLanguage(currentLang);
        });
    } else {
        initLanguageSwitcher();
        setLanguage(currentLang);
    }
    
    // Initialize language switcher button
    function initLanguageSwitcher() {
        const langToggle = document.querySelector('.lang-toggle');
        if (langToggle) {
            // Set initial text
            const langText = langToggle.querySelector('.lang-text');
            if (langText) {
                langText.textContent = currentLang.toUpperCase();
            }
            
            // Add click event
            langToggle.addEventListener('click', () => {
                const newLang = currentLang === 'ru' ? 'en' : 'ru';
                setLanguage(newLang);
                
                // Add visual feedback
                langToggle.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    langToggle.style.transform = '';
                }, 150);
            });
        }
    }
    
    // Expose setLanguage function globally for external use
    window.setLanguage = setLanguage;
    window.getCurrentLanguage = () => currentLang;
    
})();

// Loading Screen Handler
window.addEventListener('load', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        // Wait for minimum 2 seconds for better UX
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            // Remove from DOM after transition
            setTimeout(() => {
                loadingScreen.remove();
            }, 600);
        }, 2000);
    }
});
