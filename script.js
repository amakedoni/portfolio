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

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================

const scrollProgressContainer = document.querySelector('.scroll-progress-container');
const scrollProgressBar = document.querySelector('.scroll-progress-bar');

if (scrollProgressContainer && scrollProgressBar) {
    let lastScrollTop = 0;
    let ticking = false;
    let lastMilestone = 0;

    function updateScrollProgress() {
        // Calculate scroll percentage
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;

        // Update progress bar width
        scrollProgressBar.style.width = scrolled + '%';

        // Add active class when scrolling (shows glow dot)
        if (scrolled > 0) {
            scrollProgressBar.classList.add('active');
            scrollProgressContainer.classList.remove('at-top');
        } else {
            scrollProgressBar.classList.remove('active');
            scrollProgressContainer.classList.add('at-top');
        }

        // Milestone animation (25%, 50%, 75%, 100%)
        const currentMilestone = Math.floor(scrolled / 25) * 25;
        if (currentMilestone > lastMilestone && currentMilestone > 0) {
            scrollProgressBar.classList.add('milestone');
            setTimeout(() => {
                scrollProgressBar.classList.remove('milestone');
            }, 600);
            lastMilestone = currentMilestone;
        }

        // Reset milestone when scrolling back up significantly
        if (scrolled < lastMilestone - 10) {
            lastMilestone = Math.floor(scrolled / 25) * 25;
        }

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollProgress);
            ticking = true;
        }
    }

    // Listen to scroll events
    window.addEventListener('scroll', requestTick, { passive: true });

    // Initial update on page load
    updateScrollProgress();

    // Update on window resize
    window.addEventListener('resize', () => {
        requestTick();
    });
}

// Optional: Add percentage indicator tooltip (advanced feature)
// Uncomment to enable:
/*
if (scrollProgressBar) {
    const tooltip = document.createElement('div');
    tooltip.className = 'scroll-progress-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        top: 8px;
        right: -50px;
        background: var(--accent);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
    `;
    document.body.appendChild(tooltip);

    let tooltipTimeout;
    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = Math.round((winScroll / height) * 100);

        tooltip.textContent = scrolled + '%';
        tooltip.style.opacity = '1';
        tooltip.style.right = '20px';

        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.right = '-50px';
        }, 1500);
    }, { passive: true });
}
*/
// ============================================
// TYPING EFFECT (с поддержкой переводов)
// ============================================

const typingElement = document.getElementById('typing-text');

let typeTimeout = null;
let typingState = {
    phraseIndex: 0,
    charIndex: 0,
    isDeleting: false
};

const typeSpeed = 120;
const deleteSpeed = 60;
const pauseAfterType = 1500;
const pauseAfterDelete = 5000; // было 500 — дольше пауза перед новым словом


function getPhrases() {
    const lang = localStorage.getItem('language') || 'ru';
    return (translations[lang] && translations[lang].hero_typing_phrases)
        ? translations[lang].hero_typing_phrases
        : ['Full-Stack Developer', 'ML Enthusiast', 'Developer'];
}

function typeEffect() {
    if (!typingElement) return;

    const phrases = getPhrases();
    if (typingState.phraseIndex >= phrases.length) typingState.phraseIndex = 0;

    const currentPhrase = phrases[typingState.phraseIndex];

    if (!typingState.isDeleting) {
        // Печатаем следующий символ
        typingState.charIndex++;
        typingElement.textContent = currentPhrase.substring(0, typingState.charIndex);

        if (typingState.charIndex >= currentPhrase.length) {
            // Фраза написана полностью — ждём и начинаем удалять
            typingState.isDeleting = true;
            typeTimeout = setTimeout(typeEffect, pauseAfterType);
            return;
        }

        typeTimeout = setTimeout(typeEffect, typeSpeed);

    } else {
        // Удаляем последний символ
        typingState.charIndex--;
        typingElement.textContent = currentPhrase.substring(0, typingState.charIndex);

        if (typingState.charIndex <= 0) {
            // Всё удалено — переходим к следующей фразе
            typingState.charIndex = 0;
            typingState.isDeleting = false;
            typingState.phraseIndex = (typingState.phraseIndex + 1) % phrases.length;
            typeTimeout = setTimeout(typeEffect, pauseAfterDelete);
            return;
        }

        typeTimeout = setTimeout(typeEffect, deleteSpeed);
    }
}


if (typingElement) {
    setTimeout(typeEffect, 1200);
}

// ✅ Слушаем document (так диспатчит lang.js)
document.addEventListener('languageChanged', () => {
    if (typeTimeout) clearTimeout(typeTimeout);
    if (typingElement) {
        typingElement.textContent = '';
        typingState.charIndex = 0;
        typingState.isDeleting = false;
        typingState.phraseIndex = 0;
    }
    setTimeout(typeEffect, 300);
});


// ============================================
// SKILL BARS ANIMATION
// ============================================
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-card').forEach(card => {
    skillObserver.observe(card);
});

// ============================================
// PROJECT MICRO-ANIMATIONS
// ============================================

// Ripple on project-link click
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${e.clientX - rect.left - size / 2}px;
            top: ${e.clientY - rect.top - size / 2}px;
        `;

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Animate timeline line when projects section enters view
const projectsBlock = document.querySelector('.projects-unified');
if (projectsBlock) {
    const lineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear-line');
                lineObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    lineObserver.observe(projectsBlock);
}
