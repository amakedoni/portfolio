// Navigation, contact form, tool drawers and the GitHub panel.

const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

// Drawings below the first screen name their file in data-href, and get it as they come within a screen and a half.
// Each drawing is its own file (scripts/split-stickers.cjs), so a visitor who never scrolls never downloads them.
const stickerWatch = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    stickerWatch.unobserve(entry.target);
    entry.target.querySelectorAll('use[data-href]').forEach(loadSticker);
  }), { rootMargin: '150% 0px' })
  : null;
function loadSticker(use) {
  use.setAttribute('href', use.dataset.href);
  use.removeAttribute('data-href');
}
window.PortfolioStickers = {
  watch(use) {
    if (stickerWatch) stickerWatch.observe(use.ownerSVGElement || use);
    else loadSticker(use);
  },
};
document.querySelectorAll('use[data-href]').forEach((use) => window.PortfolioStickers.watch(use));

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
  const labels = contactForm.querySelectorAll('[data-submit-label]');
  const formData = new FormData(contactForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const subject = `Portfolio inquiry from ${name}`;
  const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  contactForm.dataset.submitting = 'true';
  labels.forEach((el) => { el.textContent = "Opening email..."; });
  window.location.href = `mailto:aleximlord@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  contactForm.querySelector('[data-status-ready]').hidden = true;
  contactForm.querySelector('[data-status-sent]').hidden = false;

  setTimeout(() => {
    labels.forEach((el) => { el.textContent = "Send message"; });
    delete contactForm.dataset.submitting;
  }, 1600);
});

// Tool drawers: one open at a time. A mouse opens them by passing over, touch and keyboard by pressing.
const toolsEl = document.querySelector('[data-tools]');
if (toolsEl) {
  const stacked = window.matchMedia('(max-width: 1000px)');
  const drawers = [...toolsEl.querySelectorAll('.tool')];
  let lastOpened = -Infinity;
  // Their places, for the CSS that slides them along on a wide screen.
  drawers.forEach((drawer, index) => drawer.style.setProperty('--i', String(index)));
  const markOpen = () => toolsEl.style.setProperty('--open', String(Math.max(0, drawers.findIndex((item) => item.classList.contains('open')))));
  markOpen();
  const openDrawer = (drawer) => {
    toolsEl.classList.add('is-used');
    drawers.forEach((item) => {
      const open = item === drawer;
      item.classList.toggle('open', open);
      item.querySelector('.tool-spine').setAttribute('aria-expanded', String(open));
    });
    markOpen();
  };
  toolsEl.classList.add('is-live');
  drawers.forEach((drawer) => {
    const spine = drawer.querySelector('.tool-spine');
    spine.addEventListener('click', () => {
      openDrawer(drawer);
      if (stacked.matches) spine.scrollIntoView({ block: 'nearest' });
    });
    // Real movement only: a resting pointer must not open whatever scrolls under it. The pause lets a sliding drawer
    // settle, or the one that slides under the pointer would open next and set off a chain.
    drawer.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || stacked.matches || drawer.classList.contains('open')) return;
      if ((!event.movementX && !event.movementY) || toolsEl.classList.contains('is-scrubbing')) return;
      if (event.timeStamp - lastOpened < 450) return;
      lastOpened = event.timeStamp;
      openDrawer(drawer);
    });
  });
}

// GitHub panel: real numbers from assets/data/github.json, written by scripts/update-github-stats.mjs.
fetch('/assets/data/github.json')
  .then((response) => (response.ok ? response.json() : null))
  .then((data) => {
    const gridEl = document.getElementById('git-cells');
    if (!data || !gridEl) return;
    const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.querySelectorAll('[data-git]').forEach((el) => {
      if (data[el.dataset.git] != null) el.textContent = String(data[el.dataset.git]);
    });
    gridEl.setAttribute('role', 'img');
    gridEl.setAttribute('aria-label', `${data.contributionsPastYear} GitHub contributions in the past year`);
    const fragment = document.createDocumentFragment();
    data.weeks.forEach((week, column) => week.forEach((day) => {
      const date = new Date(`${day.date}T00:00:00Z`);
      const count = day.count ? `${day.count} contribution${day.count === 1 ? '' : 's'}` : 'No contributions';
      const cell = document.createElement('div');
      cell.className = `git-cell lvl-${day.level}`;
      cell.style.gridColumn = String(column + 1);
      cell.style.gridRow = String(date.getUTCDay() + 1);
      cell.dataset.tooltip = `${count} · ${dateFormat.format(date)}`;
      fragment.appendChild(cell);
    }));
    gridEl.appendChild(fragment);

    const langs = document.getElementById('git-langs');
    data.languages.slice(0, 4).forEach((language) => {
      const li = document.createElement('li');
      li.textContent = `${language.name} ${language.share}%`;
      langs?.appendChild(li);
    });
    const updated = document.getElementById('git-updated');
    if (updated) updated.textContent = `Updated: ${dateFormat.format(new Date(data.generatedAt))}.`;
    const yearLabel = document.querySelector('[data-git-year]');
    if (yearLabel) yearLabel.textContent = `Commits in ${data.year}`;
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
