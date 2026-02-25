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

    // Resume dropdown functionality
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

    // Mobile Menu - Enhanced version
    if (!document.querySelector('.mobile-menu')) {
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <div class="mobile-nav-links">
                <a href="#about">Обо мне</a>
                <a href="#projects">Проекты</a>
                <a href="#education">Образование</a>
                <a href="#skills">Навыки</a>
                <a href="#contact">Контакты</a>
            </div>
            <div class="mobile-controls">
                <button class="mobile-theme-toggle" aria-label="Переключить тему">
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </button>
                <div class="mobile-resume-dropdown">
                    <button class="mobile-resume-toggle" aria-haspopup="true" aria-expanded="false">Резюме</button>
                    <ul class="mobile-resume-menu">
                        <li><a href="resume.pdf" download="Македонский_Александр_резюме.pdf">Скачать PDF</a></li>
                        <li><a href="resume.docx" download="Македонский_Александр_резюме.docx">Скачать DOCX</a></li>
                    </ul>
                </div>
            </div>
        `;
        document.body.appendChild(mobileMenu);

        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const resumeDropdown = mobileMenu.querySelector('.mobile-resume-dropdown');
        const resumeToggle = resumeDropdown.querySelector('.mobile-resume-toggle');
        const resumeMenu = resumeDropdown.querySelector('.mobile-resume-menu');

        // Toggle mobile menu
        const toggleMenu = () => {
            const isOpen = body.classList.toggle('mobile-menu-open');
            menuToggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.documentElement.style.overflow = isOpen ? 'hidden' : '';
            if (!isOpen) {
                resumeDropdown.classList.remove('open');
                resumeToggle.setAttribute('aria-expanded', 'false');
            }
        };

        menuToggle?.addEventListener('click', toggleMenu);

        // Close menu on navigation link click
        mobileMenu.querySelectorAll('.mobile-nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Smooth scroll offset for mobile
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    toggleMenu();
                    setTimeout(() => {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            });
        });

        // Close menu on backdrop click
        mobileMenu.addEventListener('click', (e) => {
            const clickedOnInteractive = e.target.closest(
                '.mobile-nav-links a, .mobile-controls, .mobile-theme-toggle, .mobile-resume-dropdown, .mobile-resume-toggle, .mobile-resume-menu a'
            );
            if (!clickedOnInteractive && body.classList.contains('mobile-menu-open')) {
                toggleMenu();
            }
        });

        // Resume dropdown in mobile menu
        resumeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = resumeDropdown.classList.toggle('open');
            resumeToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close resume dropdown on link click
        resumeMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const original = link.textContent;
                link.textContent = 'Скачивается...';
                setTimeout(() => {
                    link.textContent = original;
                    resumeDropdown.classList.remove('open');
                    resumeToggle.setAttribute('aria-expanded', 'false');
                }, 1000);
            });
        });

        // Mobile theme toggle
        mobileMenu.querySelector('.mobile-theme-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('dark-theme');
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        });

        // Close mobile menu on resize to desktop
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    body.classList.remove('mobile-menu-open');
                    document.documentElement.style.overflow = '';
                    menuToggle?.setAttribute('aria-expanded', 'false');
                    resumeDropdown.classList.remove('open');
                }
            }, 250);
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && body.classList.contains('mobile-menu-open')) {
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

            // Spam check
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
            submitBtn.innerHTML = '<span>отправляется...</span>';

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
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }, 100);
    }, { passive: true });

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
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            e.preventDefault();
            const headerOffset = 80;
            const elementPosition = targetElement.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll effect
const header = document.querySelector('header');
if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// Add focus visible styles for keyboard navigation
let isKeyboardNav = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        isKeyboardNav = true;
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    if (isKeyboardNav) {
        isKeyboardNav = false;
        document.body.classList.remove('keyboard-nav');
    }
});

// Prevent body scroll when mobile menu is open
function preventBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
}

function allowBodyScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

// Performance optimization: Debounce resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy load images (if needed in future)
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src || img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}