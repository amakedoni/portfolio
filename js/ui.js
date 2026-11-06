// Language, navigation, contact form, skills filter and the GitHub grid.
// Runs synchronously at the end of <body> so a saved language applies before first paint.
const uiMap = {
  en: {
    skipLink: 'Skip to content',
    explore: 'Explore',
    recognitionPlain: 'Recognition',
    themeLabel: 'Theme',
    heroPlace: 'Moscow',
    floorsIntro: 'Full stack, floor by floor. Keep scrolling to go down from the interface to the metal.',
    floorKickers: ['Top floor: the interface', 'Middle floor: the server', 'Ground floor: the metal', 'Trophy room'],
    finlySub: 'Offline-first finance PWA with on-device machine learning.',
    projectSubs: ['Medication adherence platform.', 'Aerospace prototype that receives, decodes and relays telemetry.'],
    recognitionTags: ['ITMO', 'Rosatom', 'Aerospace'],
    pageTitle: 'Alexander Makedonskiy — Full-Stack & ML Engineer',
    metaDescription: 'Full-stack developer and ML student building offline-first PWAs, backend services, and machine-learning-powered tools.',
    nav: ['About', 'Work', 'Stack', 'Education', 'Contact'],
    resumeLabel: 'Resume',
    menuAria: 'Menu',
    languageAria: 'Switch language',
    themeAria: 'Toggle theme',
    heroTitle: ['Engineering', "tomorrow's", 'interfaces.'],
    heroLede: "I'm <strong>Alexander</strong> — a full-stack developer and ML student at <strong>Moscow Aviation Institute</strong>. I build performant client-server systems, offline-first PWAs, and machine-learning-powered tools that ship.",
    heroCtaPrimary: 'View work',
    heroCtaSecondary: 'Get in touch',
    sectionTitles: ['A builder with a curious mind.', 'Flagship case studies.', 'Tools of the trade.', 'Trained in rigour.', 'Open-source pulse.', "Let's build something."],
    aboutP1: 'I study <strong>Applied Mathematics & Computer Science</strong> at NRU MAI, with a deep focus on the boundary between strong engineering practice and modern machine learning. I care about systems that hold up under real conditions — offline, sluggish networks, low-end devices.',
    aboutQuote: '"Strong technical solutions live at the intersection of fundamentals and creative thinking."',
    aboutP2: 'My work spans <strong>backend services</strong> in Python/FastAPI, <strong>cross-platform mobile apps</strong> in React Native, and <strong>data-driven tools</strong> built with the PyData stack. Outside of code I play guitar, compete in olympiads, and lose evenings to ML papers.',
    aboutP3: 'English: <strong>B2 (Upper-Intermediate)</strong>. Open to remote, hybrid, and Moscow-based teams.',
    profileTag: 'Alexander · Moscow',
    stats: ['Projects shipped', 'Olympiad finals', 'Years coding', 'Hackathon teams'],
    featuredTag: 'Featured · 2026 · Team Lead',
    finlyTitle: 'Finly — offline-first finance PWA.',
    finlyRole: 'Tech-lead & Full-Stack · T1 (Innotech) × NRU MAI',
    finlyDesc: 'A fully offline PWA for personal finance (IndexedDB + Service Worker via Workbox). On-device ML transaction classification with TensorFlow.js, AI financial chat via OpenRouter, receipt scanning (QR/OCR/Gemini Vision), biometric auth (WebAuthn), voice input, and deep analytics — budgets, goals, recurring operations, anomaly detection, notifications, and JSON/CSV export.',
    finlyApp: 'Open the app',
    finlySource: 'Source',
    finlyCi: 'CI/CD: GitHub Actions (3 workflows) · 345+ tests · Lighthouse CI · Quality Gates',
    projectYears: ['2025 · Full-Stack', '2024 · CubeSat'],
    projectTitles: ['MAI Tablets — medication adherence platform.', 'Aerospace prototype — message-decoding CubeSat.'],
    projectRoles: ['Backend & React Native client', 'Pre-professional Olympiad Final'],
    projectDescs: [
      'Client-server system for tracking medication intake, with offline-first sync, time-bound QR pairing for trusted "med-friends", configurable push reminders, and strict privacy guarantees.',
      'Built a working CubeSat prototype for the Moscow Aerospace track — onboard logic for receiving, decoding and relaying telemetry messages. Engineered the firmware-side encoding pipeline.'
    ],
    recognitionTitle: 'Recognition.',
    recognitionMeta: '2022 — 2025 · Olympiads',
    recognitionItems: [
      'Finalist, ITMO Olympiad in Computer Science (2024–2025)',
      'Finalist, Rosatom Olympiad — CS & Mathematics (2022–2024)',
      'Moscow Pre-professional Olympiad — Aerospace track finalist'
    ],
    skillTabs: ['All', 'Languages', 'Backend', 'DevOps', 'ML & Data', 'Frontend & PWA'],
    skillCats: ['Languages', 'Backend', 'DevOps', 'ML & Data', 'Frontend & PWA'],
    educationPeriods: ['2025 — Present', '2022 — 2025', '2021 — 2025'],
    educationDegrees: ['Applied Mathematics & Computer Science', 'Machine Learning & Data Analysis', 'Pre-University Programme'],
    educationInst: ['NRU MAI', 'NRNU MEPhI · INTEL Institute', 'NRNU MEPhI'],
    educationDesc: [
      'Higher mathematics, Python, fundamental computer science, computing-system architecture.',
      'Applied ML — regression (Random Forest), classification (KNN, RF), clustering (K-Means), visualisation with Matplotlib & Seaborn.',
      'Advanced preparation in mathematics, computer science, and physics — the foundation for everything that came after.'
    ],
    contactTitle: 'Got a project in mind?',
    contactText: 'Open to interesting work in product engineering, ML tooling, and offline-first PWAs. Drop a line via the form, or pick your favourite channel below.',
    channelLabels: ['Email', 'Phone', 'Telegram', 'GitHub'],
    formMessage: 'Tell me about your project — what are you building, when do you need it, and what does success look like?',
    formFieldLabels: ['Your name', 'Your email', 'Tell me about your project'],
    contactSubmit: 'Send message',
    contactSubmitDone: 'Opening email...',
    ariaScrollTop: 'Back to top',
    backToTop: 'Back to top',
    footerMeta: 'Crafted in Moscow · v2026.1',
    gitStats: ['Public repositories', 'Commits in 2026', 'Active days, past year', 'Longest streak, days'],
    gitUpdated: 'Updated',
    gitContribs: ['contribution', 'contributions'],
    gitNone: 'No contributions',
    gitView: 'View profile',
    gitInfo: 'From the GitHub API, refreshed weekly.',
    roles: ['Full-Stack Engineer','ML Practitioner','PWA Specialist','Backend Architect','Mobile Builder']
  },
  ru: {
    skipLink: 'Перейти к содержимому',
    explore: 'Подробнее',
    recognitionPlain: 'Достижения',
    themeLabel: 'Тема',
    heroPlace: 'Москва',
    floorsIntro: 'Весь стек, этаж за этажом. Прокручивайте вниз — от интерфейса до железа.',
    floorKickers: ['Верхний этаж: интерфейс', 'Средний этаж: сервер', 'Нижний этаж: железо', 'Зал трофеев'],
    finlySub: 'PWA для личных финансов: работает офлайн, ML прямо на устройстве.',
    projectSubs: ['Платформа контроля приёма лекарств.', 'Аэрокосмический прототип: приём, декодирование и передача телеметрии.'],
    recognitionTags: ['ИТМО', 'РОСАТОМ', 'Аэрокосмос'],
    pageTitle: 'Александр Македонский — фулстек- и ML-инженер',
    metaDescription: 'Студент МАИ, фулстек-разработчик. Специализируюсь на Python, FastAPI, React Native и машинном обучении.',
    nav: ['Обо мне', 'Проекты', 'Стек', 'Образование', 'Контакты'],
    resumeLabel: 'Резюме',
    menuAria: 'Меню',
    languageAria: 'Переключить язык',
    themeAria: 'Переключить тему',
    heroTitle: ['Проектирую', 'интерфейсы', 'будущего.'],
    heroLede: 'Я <strong>Александр</strong> — фулстек-разработчик и студент направления машинного обучения в <strong>Московском авиационном институте</strong>. Создаю быстрые клиент-серверные системы, PWA с офлайн-режимом и ML-инструменты, которые решают реальные задачи.',
    heroCtaPrimary: 'Смотреть проекты',
    heroCtaSecondary: 'Связаться',
    sectionTitles: ['Создаю с любопытством.', 'Флагманские проекты.', 'Мой стек.', 'Сильная база.', 'Пульс открытого кода.', 'Создадим что-нибудь.'],
    aboutP1: 'Я изучаю <strong>прикладную математику и информатику</strong> в НИУ МАИ, совмещая инженерную практику с современным машинным обучением. Для меня важны системы, которые стабильно работают в реальных условиях — офлайн, при слабой сети и на недорогих устройствах.',
    aboutQuote: '«Сильные технические решения рождаются на стыке фундаментальных знаний и творческого мышления».',
    aboutP2: 'Мой опыт включает <strong>серверные сервисы</strong> на Python и FastAPI, <strong>кроссплатформенные мобильные приложения</strong> на React Native и <strong>решения на основе данных</strong> на стеке PyData. Вне кода — гитара, олимпиады и статьи по машинному обучению.',
    aboutP3: 'Английский: <strong>B2 (Upper-Intermediate)</strong>. Открыт к удалённой и гибридной работе, а также к работе в московских командах.',
    profileTag: 'Александр · Москва',
    stats: ['Реализованных проектов', 'Финалов олимпиад', 'Лет в разработке', 'Команд на хакатонах'],
    featuredTag: 'Флагман · 2026 · Тимлид',
    finlyTitle: 'Finly — PWA для личных финансов с офлайн-режимом.',
    finlyRole: 'Тимлид и фулстек-разработчик · T1 (Иннотех) × НИУ МАИ',
    finlyDesc: 'Полностью автономное PWA для управления личными финансами (IndexedDB и Service Worker через Workbox). Локальная ML-классификация транзакций на TensorFlow.js, ИИ-чат через OpenRouter, сканирование чеков (QR, OCR и Gemini Vision), биометрическая аутентификация (WebAuthn), голосовой ввод и глубокая аналитика: бюджеты, цели, повторяющиеся операции, выявление аномалий, уведомления и экспорт в JSON/CSV.',
    finlyApp: 'Открыть приложение',
    finlySource: 'Исходники',
    finlyCi: 'CI/CD: GitHub Actions (3 воркфлоу) · 345+ тестов · Lighthouse CI · Quality Gates',
    projectYears: ['2025 · Full-Stack', '2024 · CubeSat'],
    projectTitles: ['MAI Tablets — платформа контроля приёма лекарств.', 'Аэрокосмический прототип — CubeSat для декодирования сообщений.'],
    projectRoles: ['Серверная часть и клиент на React Native', 'Финал предпрофессиональной олимпиады'],
    projectDescs: [
      'Клиент-серверная система контроля приёма лекарств: автономная синхронизация, ограниченная по времени QR-связка с доверенными «мед-друзьями», гибкие push-напоминания и строгая защита данных.',
      'Собран рабочий прототип CubeSat для московского аэрокосмического трека: бортовая логика приёма, декодирования и передачи телеметрических сообщений; реализован конвейер кодирования для прошивки.'
    ],
    recognitionTitle: 'Достижения.',
    recognitionMeta: '2022 — 2025 · Олимпиады',
    recognitionItems: [
      'Финалист олимпиады ИТМО по информатике (2024–2025)',
      'Финалист олимпиады РОСАТОМ — информатика и математика (2022–2024)',
      'Финалист Московской предпрофессиональной олимпиады — трек «Аэрокосмос»'
    ],
    skillTabs: ['Все', 'Языки', 'Серверная часть', 'DevOps', 'ML и данные', 'Клиентская часть и PWA'],
    skillCats: ['Языки', 'Серверная часть', 'DevOps', 'ML и данные', 'Клиентская часть и PWA'],
    educationPeriods: ['2025 — н. в.', '2022–2025', '2021–2025'],
    educationDegrees: ['Прикладная математика и информатика', 'Машинное обучение и анализ данных', 'Довузовская подготовка'],
    educationInst: ['НИУ МАИ', 'НИЯУ МИФИ · Институт ИНТЭЛ', 'НИЯУ МИФИ'],
    educationDesc: [
      'Высшая математика, Python, фундаментальная информатика, архитектура вычислительных систем.',
      'Практическое ML: регрессия (Random Forest), классификация (KNN, RF), кластеризация (K-Means), визуализация в Matplotlib и Seaborn.',
      'Углубленная подготовка по математике, информатике и физике как основа инженерного мышления.'
    ],
    contactTitle: 'Есть проект?',
    contactText: 'Открыт к интересным задачам в продуктовой разработке, ML-инструментах и offline-first PWA. Напишите через форму или выберите удобный канал связи ниже.',
    channelLabels: ['Почта', 'Телефон', 'Telegram', 'GitHub'],
    formMessage: 'Расскажите о проекте — что делаете, какие сроки и какой результат нужен?',
    formFieldLabels: ['Ваше имя', 'Ваша электронная почта', 'Описание проекта'],
    contactSubmit: 'Отправить',
    contactSubmitDone: 'Открываю почту...',
    ariaScrollTop: 'Вернуться наверх',
    backToTop: 'Наверх',
    footerMeta: 'Сделано в Москве · v2026.1',
    gitStats: ['Публичных репозиториев', 'Коммитов в 2026', 'Активных дней за год', 'Самая длинная серия, дней'],
    gitUpdated: 'Обновлено',
    gitContribs: ['контрибуция', 'контрибуции', 'контрибуций'],
    gitNone: 'Нет контрибуций',
    gitView: 'Смотреть профиль',
    gitInfo: 'Данные GitHub API, обновляются еженедельно.',
    roles: ['Full-Stack разработчик','ML-практик','PWA-специалист','Backend-инженер','Мобильный разработчик']
  }
};

if (localStorage.getItem('theme') === 'light') document.body.classList.remove('dark-theme');

const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

function currentLang() {
  return (localStorage.getItem('language') || 'en').toLowerCase() === 'ru' ? 'ru' : 'en';
}

function lookup(t, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), t);
}

function fillRepeat(el, text) {
  const repeated = `${text} ✺ `.repeat(8);
  el.innerHTML = '';
  for (let row = 0; row < 3; row += 1) {
    const rowEl = document.createElement('div');
    rowEl.className = 'mq-row';
    const track = document.createElement('div');
    track.className = 'mq-track';
    for (let copy = 0; copy < 2; copy += 1) {
      const span = document.createElement('span');
      span.textContent = repeated;
      span.style.whiteSpace = 'pre';
      track.appendChild(span);
    }
    rowEl.appendChild(track);
    el.appendChild(rowEl);
  }
}

function applyLanguage(lang) {
  const t = uiMap[lang] || uiMap.en;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
  document.title = t.pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', t.metaDescription);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = lookup(t, el.dataset.i18n);
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const value = lookup(t, el.dataset.i18nHtml);
    if (value != null) el.innerHTML = value;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const value = lookup(t, el.dataset.i18nAria);
    if (value != null) el.setAttribute('aria-label', value);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = lookup(t, el.dataset.i18nPlaceholder);
    if (value != null) el.placeholder = value;
  });
  document.querySelectorAll('[data-i18n-repeat]').forEach((el) => {
    const value = lookup(t, el.dataset.i18nRepeat);
    if (value != null) fillRepeat(el, value);
  });
  document.querySelectorAll('.lang-text').forEach((el) => { el.textContent = lang.toUpperCase(); });
  document.dispatchEvent(new CustomEvent('portfolio:language', { detail: { lang, roles: t.roles } }));
}

window.PortfolioUI = { roles: () => (uiMap[currentLang()] || uiMap.en).roles, lang: currentLang };

applyLanguage(currentLang());

document.querySelector('.lang-toggle')?.addEventListener('click', () => {
  applyLanguage(currentLang() === 'ru' ? 'en' : 'ru');
  renderGitHub();
});

// Menu: the panel eases open, then rows rise in; closing plays it back in reverse.
const pill = document.querySelector('.bar-pill');
const menuBtn = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.bar-panel');
const accordions = [...document.querySelectorAll('[data-accordion]')];

function setAccordion(item, open) {
  const button = item.querySelector('.mi-row');
  const sub = item.querySelector('.mi-sub');
  button.setAttribute('aria-expanded', String(open));
  item.classList.toggle('is-open', open);
  sub.style.maxHeight = open ? `${sub.scrollHeight}px` : '0px';
  // Keep the panel's explicit height in step while it is settling.
  if (pill.classList.contains('open') && menuPanel.style.height !== 'auto') {
    menuPanel.style.height = 'auto';
  }
}
accordions.forEach((item) => {
  item.querySelector('.mi-row').addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    accordions.forEach((other) => { if (other !== item) setAccordion(other, false); });
    setAccordion(item, open);
  });
});

function setMenu(open, restoreFocus = false) {
  if (!pill || !menuBtn || !menuPanel) return;
  const wasOpen = pill.classList.contains('open');
  if (open === wasOpen) return;
  pill.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    window.lenis?.stop();
    menuPanel.style.height = `${menuPanel.scrollHeight}px`;
    const onOpened = (event) => {
      if (event.propertyName !== 'height') return;
      menuPanel.removeEventListener('transitionend', onOpened);
      if (pill.classList.contains('open')) menuPanel.style.height = 'auto';
    };
    menuPanel.addEventListener('transitionend', onOpened);
  } else {
    window.lenis?.start();
    accordions.forEach((item) => setAccordion(item, false));
    menuPanel.style.height = `${menuPanel.scrollHeight}px`;
    void menuPanel.offsetHeight;
    menuPanel.style.height = '0px';
    if (restoreFocus) menuBtn.focus();
  }
}
menuBtn?.addEventListener('click', () => setMenu(!pill.classList.contains('open')));
document.querySelectorAll('.bar-panel a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (event) => {
  if (pill?.classList.contains('open') && !pill.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false, true);
});

document.querySelector('.scroll-to-top')?.addEventListener('click', () => {
  if (window.PortfolioMotion?.scrollTo) window.PortfolioMotion.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: reducedMotionMedia.matches ? 'auto' : 'smooth' });
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
});

const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const lang = currentLang();
  const t = uiMap[lang] || uiMap.en;
  const labels = contactForm.querySelectorAll('[data-submit-label]');
  const formData = new FormData(contactForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const subject = lang === 'ru'
    ? `Портфолио: сообщение от ${name}`
    : `Portfolio inquiry from ${name}`;
  const body = lang === 'ru'
    ? `Имя: ${name}\nEmail: ${email}\n\nСообщение:\n${message}`
    : `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  contactForm.dataset.submitting = 'true';
  labels.forEach((el) => { el.textContent = t.contactSubmitDone; });
  window.location.href = `mailto:aleximlord@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  setTimeout(() => {
    labels.forEach((el) => { el.textContent = (uiMap[currentLang()] || uiMap.en).contactSubmit; });
    delete contactForm.dataset.submitting;
  }, 1600);
});

// Skills filter.
const skillTabs = document.querySelectorAll('.skills-tabs .tab');
skillTabs.forEach((tab) => tab.addEventListener('click', () => {
  const cat = tab.dataset.cat;
  skillTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.ticket').forEach((ticket) => {
    ticket.hidden = cat !== 'all' && ticket.dataset.cat !== cat;
  });
  const tickets = document.querySelector('.tickets');
  if (tickets) tickets.scrollLeft = 0;
}));

// GitHub panel: real numbers from assets/data/github.json, written by scripts/update-github-stats.mjs.
let githubData = null;

function contributionText(t, count, lang) {
  if (!count) return t.gitNone;
  if (lang === 'ru') {
    const tens = count % 100;
    const units = count % 10;
    const form = tens >= 11 && tens <= 14 ? 2 : units === 1 ? 0 : units >= 2 && units <= 4 ? 1 : 2;
    return `${count} ${t.gitContribs[form]}`;
  }
  return `${count} ${t.gitContribs[count === 1 ? 0 : 1]}`;
}

function renderGitHub() {
  const gridEl = document.getElementById('git-cells');
  if (!gridEl || !githubData) return;
  const lang = currentLang();
  const t = uiMap[lang] || uiMap.en;
  const dateFormat = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  document.querySelectorAll('[data-git]').forEach((el) => {
    const value = githubData[el.dataset.git];
    if (value != null) el.textContent = String(value);
  });
  gridEl.innerHTML = '';
  gridEl.setAttribute('role', 'img');
  gridEl.setAttribute('aria-label', `${githubData.contributionsPastYear} GitHub contributions in the past year`);
  const fragment = document.createDocumentFragment();
  githubData.weeks.forEach((week, c) => week.forEach((day, r) => {
    const cell = document.createElement('div');
    cell.className = `git-cell lvl-${day.level}`;
    cell.style.gridColumn = String(c + 1);
    cell.style.gridRow = String(new Date(`${day.date}T00:00:00Z`).getUTCDay() + 1);
    cell.dataset.tooltip = `${contributionText(t, day.count, lang)} · ${dateFormat.format(new Date(`${day.date}T00:00:00Z`))}`;
    cell.style.setProperty('--delay', `${c * 12 + r * 6}ms`);
    fragment.appendChild(cell);
  }));
  gridEl.appendChild(fragment);

  const langs = document.getElementById('git-langs');
  if (langs) {
    langs.innerHTML = '';
    githubData.languages.slice(0, 4).forEach((language) => {
      const li = document.createElement('li');
      li.textContent = `${language.name} ${language.share}%`;
      langs.appendChild(li);
    });
  }
  const updated = document.getElementById('git-updated');
  if (updated) updated.textContent = `${t.gitUpdated}: ${dateFormat.format(new Date(githubData.generatedAt))}.`;
  document.querySelectorAll('[data-i18n="gitStats.1"]').forEach((el) => {
    el.textContent = lang === 'ru' ? `Коммитов в ${githubData.year}` : `Commits in ${githubData.year}`;
  });
}

fetch('/assets/data/github.json')
  .then((response) => (response.ok ? response.json() : null))
  .then((data) => {
    githubData = data;
    renderGitHub();
    document.dispatchEvent(new CustomEvent('portfolio:github-rendered'));
  })
  .catch(() => {});

const gitTooltip = document.getElementById('git-tooltip');
const gitCells = document.getElementById('git-cells');
if (gitTooltip && gitCells) {
  gitCells.addEventListener('mouseover', (event) => {
    const text = event.target.dataset?.tooltip;
    if (!text) return;
    gitTooltip.textContent = text;
    gitTooltip.hidden = false;
    const rect = event.target.getBoundingClientRect();
    gitTooltip.style.left = `${Math.min(rect.left, window.innerWidth - 260)}px`;
    gitTooltip.style.top = `${rect.bottom + 8}px`;
  });
  gitCells.addEventListener('mouseleave', () => { gitTooltip.hidden = true; });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
