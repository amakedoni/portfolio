// Unified DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;

    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        body.classList.add('dark-theme');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    // Resume dropdown functionality (desktop)
    const dropdown = document.querySelector('.resume-dropdown');
    if (dropdown) {
        const toggle = dropdown.querySelector('.resume-toggle');
        const menu = dropdown.querySelector('.resume-menu');

        function updateAria(expanded) {
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            dropdown.classList.toggle('open', !isOpen);
            updateAria(!isOpen);
        });

        document.addEventListener('click', () => {
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                updateAria(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                updateAria(false);
                toggle.focus();
            }
        });

        // Animation on download
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const original = link.textContent;
                link.textContent = 'Скачивание...';
                setTimeout(() => {
                    link.textContent = original;
                }, 1200);
            });
        });
    }

    // Mobile Menu Setup
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (menuToggle && !document.querySelector('.mobile-menu')) {
        // Create mobile menu structure
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.setAttribute('role', 'dialog');
        mobileMenu.setAttribute('aria-label', 'Мобильное меню');
        
        // Clone navigation links
        const desktopLinks = document.querySelectorAll('.nav-links > li');
        let mobileLinksHTML = '';
        
        desktopLinks.forEach(li => {
            const link = li.querySelector('a');
            if (link && !li.classList.contains('resume-dropdown')) {
                const href = link.getAttribute('href');
                const text = link.textContent;
                const i18nKey = link.getAttribute('data-i18n');
                mobileLinksHTML += `<a href="${href}" ${i18nKey ? `data-i18n="${i18nKey}"` : ''}>${text}</a>`;
            }
        });
        
        mobileMenu.innerHTML = `
            <div class="mobile-menu-header">
                <div class="mobile-menu-logo">Alexander Makedonskiy</div>
            </div>
            <nav class="mobile-nav-links">
                ${mobileLinksHTML}
                <div class="mobile-resume-dropdown">
                    <button class="mobile-resume-toggle" data-i18n="nav_resume" aria-haspopup="true" aria-expanded="false">Резюме</button>
                    <div class="mobile-resume-menu">
                        <a href="resume.pdf" download="Македонский_Александр_резюме.pdf">PDF</a>
                        <a href="resume.docx" download="Македонский_Александр_резюме.docx">DOCX</a>
                    </div>
                </div>
            </nav>
            <div class="mobile-controls">
                <button class="mobile-lang-toggle" aria-label="Переключить язык">
                    <span class="mobile-lang-text">RU</span>
                </button>
                <button class="mobile-theme-toggle" aria-label="Переключить тему">
                    <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(mobileMenu);
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        document.body.appendChild(backdrop);
        
        // Toggle menu function
        const toggleMenu = () => {
            const isOpen = body.classList.toggle('mobile-menu-open');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            
            if (isOpen) {
                document.documentElement.style.overflow = 'hidden';
                mobileMenu.setAttribute('aria-hidden', 'false');
                // Apply language to mobile menu
                const currentLang = localStorage.getItem('language') || 'ru';
                if (typeof window.setLanguage === 'function') {
                    window.setLanguage(currentLang);
                }
            } else {
                document.documentElement.style.overflow = '';
                mobileMenu.setAttribute('aria-hidden', 'true');
                const resumeDropdown = mobileMenu.querySelector('.mobile-resume-dropdown');
                if (resumeDropdown) {
                    resumeDropdown.classList.remove('open');
                }
            }
        };
        
        // Menu toggle button click
        menuToggle.addEventListener('click', toggleMenu);
        
        // Backdrop click to close
        backdrop.addEventListener('click', toggleMenu);
        
        // Close menu when clicking navigation links
        mobileMenu.querySelectorAll('.mobile-nav-links > a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
        
        // Mobile resume dropdown
        const mobileResumeDropdown = mobileMenu.querySelector('.mobile-resume-dropdown');
        const mobileResumeToggle = mobileResumeDropdown.querySelector('.mobile-resume-toggle');
        const mobileResumeMenu = mobileResumeDropdown.querySelector('.mobile-resume-menu');
        
        mobileResumeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = mobileResumeDropdown.classList.toggle('open');
            mobileResumeToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        
        // Close resume dropdown when clicking resume links
        mobileResumeMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                const original = link.textContent;
                link.textContent = 'Скачивание...';
                setTimeout(() => {
                    link.textContent = original;
                    toggleMenu();
                }, 800);
            });
        });
        
        // Mobile theme toggle
        const mobileThemeToggle = mobileMenu.querySelector('.mobile-theme-toggle');
        mobileThemeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
        
        // Mobile language toggle
        const mobileLangToggle = mobileMenu.querySelector('.mobile-lang-toggle');
        const mobileLangText = mobileLangToggle.querySelector('.mobile-lang-text');
        
        // Set initial language
        const currentLang = localStorage.getItem('language') || 'ru';
        mobileLangText.textContent = currentLang.toUpperCase();
        
        mobileLangToggle.addEventListener('click', () => {
            const newLang = currentLang === 'ru' ? 'en' : 'ru';
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(newLang);
                mobileLangText.textContent = newLang.toUpperCase();
            }
        });
        
        // Close menu on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && body.classList.contains('mobile-menu-open')) {
                toggleMenu();
            }
        });
        
        // Close menu when resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && body.classList.contains('mobile-menu-open')) {
                toggleMenu();
            }
        });
    }

    // Contact form
    const form = document.getElementById('contact-form');
    if (form) {
        const successContainer = document.querySelector('.form-success-container');
        const successMsg = successContainer?.querySelector('.form-success');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const gotcha = form.querySelector('[name="_gotcha"]');
            if (gotcha && gotcha.value) {
                alert('Обнаружен спам!');
                return;
            }

            const formData = new FormData(form);
            const name = formData.get('name') || 'без имени';
            formData.append('subject', `Новое сообщение от ${name}`);

            const data = Object.fromEntries(formData.entries());
            const json = JSON.stringify(data);

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>отправляется</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a 9 9 0 1 1-6.219-8.56"></path></svg>';

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });

                const result = await response.json();

                if (response.ok && result.success === true) {
                    form.reset();
                    if (successMsg) {
                        successMsg.querySelector('span').textContent = 'Сообщение отправлено! Отвечу в течение 24 часов.';
                    }
                    if (successContainer) {
                        successContainer.style.maxHeight = '200px';
                        successContainer.classList.add('open');
                        setTimeout(() => {
                            successContainer.style.maxHeight = '0px';
                            successContainer.classList.remove('open');
                        }, 5000);
                    }
                } else {
                    throw new Error(result.message || 'Ошибка отправки');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось отправить сообщение. Напишите напрямую на email.');
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }, 1000);
            }
        });
    }
});

// Scroll to top button
const scrollToTopBtn = document.querySelector('.scroll-to-top');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Unified Intersection Observer for all animated elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements that need animation
const elementsToObserve = [
    ...document.querySelectorAll('.fade-in'),
    ...document.querySelectorAll('.timeline-item'),
    ...document.querySelectorAll('.about-text p')
];

elementsToObserve.forEach(element => {
    observer.observe(element);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll effect
const header = document.querySelector('header');
if (header) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Add focus visible styles for keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});
