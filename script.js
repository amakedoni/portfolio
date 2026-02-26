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

    // Mobile Menu
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
                        <li><a href="resume.pdf" download>PDF</a></li>
                        <li><a href="resume.docx" download>DOCX</a></li>
                    </ul>
                </div>
            </div>
        `;
        document.body.appendChild(mobileMenu);

        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const resumeDropdown = mobileMenu.querySelector('.mobile-resume-dropdown');
        const resumeToggle = resumeDropdown.querySelector('.mobile-resume-toggle');
        const resumeMenu = resumeDropdown.querySelector('.mobile-resume-menu');

        const toggleMenu = () => {
            const isOpen = body.classList.toggle('mobile-menu-open');
            menuToggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.documentElement.style.overflow = isOpen ? 'hidden' : '';
            if (!isOpen) resumeDropdown.classList.remove('open');
        };

        menuToggle?.addEventListener('click', toggleMenu);

        mobileMenu.querySelectorAll('.mobile-nav-links a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });

        mobileMenu.addEventListener('click', (e) => {
            const clickedOnInteractive = e.target.closest(
                '.mobile-nav-links a, .mobile-controls, .mobile-theme-toggle, .mobile-resume-dropdown, .mobile-resume-toggle, .mobile-resume-menu a'
            );
            if (!clickedOnInteractive && body.classList.contains('mobile-menu-open')) {
                toggleMenu();
            }
        });

        resumeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            resumeDropdown.classList.toggle('open');
            resumeToggle.setAttribute('aria-expanded', resumeDropdown.classList.contains('open') ? 'true' : 'false');
            
            if (resumeDropdown.classList.contains('open')) {
                const container = document.querySelector('.mobile-menu');
                if (container) {
                    const buttonTop = resumeToggle.offsetTop;
                    container.scrollTo({
                        top: Math.max(0, buttonTop - container.clientHeight * 0.8),
                        behavior: 'smooth'
                    });
                }
            }
        });

        resumeMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                resumeDropdown.classList.remove('open');
                resumeToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (resumeDropdown.classList.contains('open') && !resumeDropdown.contains(e.target) && e.target !== resumeToggle) {
                resumeDropdown.classList.remove('open');
                resumeToggle.setAttribute('aria-expanded', 'false');
            }
        });

        mobileMenu.querySelector('.mobile-theme-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('dark-theme');
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                body.classList.remove('mobile-menu-open');
                document.documentElement.style.overflow = '';
                menuToggle?.setAttribute('aria-expanded', 'false');
                resumeDropdown.classList.remove('open');
                if (window.getComputedStyle(mobileMenu).display !== 'none') {
                    mobileMenu.style.display = 'none';
                }
            } else {
                mobileMenu.style.display = 'block';
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
