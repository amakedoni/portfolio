# Portfolio Content Refresh — Design Spec

**Date:** 2026-08-13

**Status:** Approved for planning

**Scope:** Text, section purpose, and content hierarchy for `index.html`

**Content source language:** Russian, with a complete English equivalent; preserve the existing saved-language behavior

## Summary

Turn the existing one-page site into a credible personal portfolio without a visual redesign. Preserve the current navigation, layout, projects, bilingual switcher, theme, animations, and overall personality. Improve the site by giving it one clear position, replacing generic marketing language with concrete facts, reducing repetition, and removing content that looks simulated or unsupported.

The portfolio is intended for anyone interested in Alexander's work. It should introduce him and his strongest projects quickly; the downloadable resume remains the detailed source for employers.

## 1. Positioning

Present Alexander as a **Full-Stack developer who builds complete products and applies machine learning where it solves a real problem**.

This position is broader and more credible than presenting him primarily as an ML Engineer. It connects the strongest evidence already on the site—backend systems, PWAs, mobile development, delivery, and team leadership—with his practical ML direction.

Voice and tone:

- direct, specific, and confident without senior-level overclaims;
- personal but not informal;
- understandable to both technical and non-technical visitors;
- focused on problems, decisions, and finished work rather than long technology lists;
- Russian copy should read as natural Russian, not transliterated English;
- established technical terms and product names may remain in English where that is clearer.

## 2. Information Architecture

Keep the existing one-page structure and visual composition:

1. Hero
2. About
3. Selected projects and recognition
4. Skills
5. Education
6. GitHub
7. Contact

Keep `Resume` as a prominent navigation action with PDF and DOCX downloads. The hero's secondary action should also point to the resume because the resume contains the detailed career information.

Do not add blog, services, testimonials, work-history, or separate project pages in this iteration.

## 3. Hero

The hero must answer three questions immediately: who Alexander is, what he builds, and where the visitor should go next.

### Russian

**Status**

> Открыт к работе, стажировкам и совместным проектам · Москва

**Heading**

> Создаю цифровые продукты
>
> от идеи до работающей системы.

The heading may be split over the existing three display lines as needed without changing its meaning.

**Introduction**

> Я Александр — Full-Stack разработчик и студент направления «Прикладная математика и информатика» в МАИ. Проектирую backend, веб- и мобильные приложения и применяю ML там, где он решает реальную задачу.

**Actions**

- `Смотреть проекты`
- `Скачать резюме`

### English

**Status**

> Open to work, internships, and collaborative projects · Moscow

**Heading**

> I build digital products
>
> from idea to working system.

**Introduction**

> I'm Alexander, a Full-Stack developer studying Applied Mathematics and Computer Science at Moscow Aviation Institute. I design backend systems, web and mobile applications, and use ML where it solves a real problem.

**Actions**

- `View projects`
- `Download resume`

The rotating role label may remain as a visual detail, but its roles must support the main position rather than introduce five competing identities. Use at most three roles: `Full-Stack Developer`, `Backend Developer`, and `Applied ML Student`, with natural Russian equivalents.

## 4. About

Reduce the section to two useful paragraphs and remove the generic self-quotation.

### Russian

> Мне нравится собирать продукт целиком: продумывать архитектуру и данные, писать API, создавать интерфейс и доводить проект до рабочего состояния. Особое внимание уделяю offline-first подходу, производительности и понятному пользовательскому опыту.

> Изучаю машинное обучение и применяю его в учебных и продуктовых задачах. Участвую в олимпиадах, играю на гитаре. Английский — B2. Рассматриваю удалённую, гибридную и очную работу в Москве.

### English

> I enjoy building a product end to end: shaping its architecture and data model, writing APIs, creating the interface, and bringing it to a working release. I pay particular attention to offline-first behavior, performance, and a clear user experience.

> I study machine learning and apply it in educational and product projects. I take part in olympiads and play guitar. My English level is B2. I am open to remote, hybrid, and Moscow-based opportunities.

Keep the portrait. Replace the four animated counters with four static, verifiable profile markers:

- `МАИ / MAI`
- `Full-Stack`
- `ML & Data`
- `English B2`

Do not present project, hackathon, contribution, or experience counts unless they can be deterministically verified from a maintained source.

## 5. Selected Projects

Keep the current three-project hierarchy: Finly as the featured project, followed by MAI Tablets and CubeSat. Each project should communicate context, Alexander's role, the engineering problem, the most important decisions, and a demonstrable result. Avoid feature-list paragraphs.

### Finly

**Label:** `2026 · Командный проект · Тимлид / Full-Stack`

**Title:** `Finly — offline-first PWA для личных финансов`

**Russian description**

> Руководил разработкой PWA, которое сохраняет основной функционал без подключения к сети. Клиентская архитектура построена на IndexedDB и Workbox; для категоризации транзакций используется TensorFlow.js, а AI-ассистент и обработка чеков дополняют основные финансовые сценарии.

**Evidence line**

> Автоматизированная проверка: 345+ тестов, три GitHub Actions workflow и Lighthouse CI.

Keep the live application and source links. Keep a concise stack containing only the most relevant technologies.

**English description**

> Led the development of a PWA that keeps its core functionality available without a network connection. The client architecture uses IndexedDB and Workbox; TensorFlow.js categorizes transactions, while an AI assistant and receipt processing support the core finance workflows.

**Evidence line**

> Automated verification: 345+ tests, three GitHub Actions workflows, and Lighthouse CI.

### MAI Tablets

**Label:** `2025 · Full-Stack`

**Title:** `MAI Tablets — контроль приёма лекарств`

**Russian description**

> Разработал клиент-серверную систему с backend на FastAPI и мобильным клиентом React Native. Приложение синхронизирует данные после работы без сети, поддерживает ограниченное по времени QR-подключение доверенных пользователей и настраиваемые напоминания.

**English description**

> Built a client-server system with a FastAPI backend and a React Native mobile client. The application synchronizes data after offline use and supports time-limited QR pairing for trusted users and configurable reminders.

Do not add repository links until the exact public URLs are verified.

### CubeSat

**Label:** `2024 · Олимпиадный проект / Olympiad project`

**Title:** `CubeSat — прототип системы передачи сообщений`

**Russian description**

> В составе финального задания аэрокосмического трека собрал рабочий прототип CubeSat. Реализовал бортовую логику приёма, декодирования и передачи телеметрических сообщений, а также программную часть кодирования.

**English description**

> Built a working CubeSat prototype for the final stage of an aerospace olympiad track. Implemented onboard logic for receiving, decoding, and relaying telemetry messages, together with the software-side encoding pipeline.

Keep the recognition block directly below the projects, but use one compact list without repeating the CubeSat technical description.

## 6. Skills

Keep the filterable visual structure but remove numeric proficiency scores. Unsupported percentages make the portfolio less credible and are difficult to interpret.

Use five evidence-based categories:

- **Languages:** Python, TypeScript, JavaScript, C/C++
- **Backend & Data:** FastAPI, PostgreSQL, SQLAlchemy
- **Frontend & Mobile:** React, React Native, Expo, Tailwind CSS
- **PWA & ML:** IndexedDB, Workbox, TensorFlow.js, scikit-learn, Pandas, NumPy
- **Tools & Delivery:** Git, Docker, GitHub Actions, Lighthouse CI

React Native must not appear under DevOps. The large technology marquee should either use the same verified set or be shortened to prevent it from contradicting the structured skills section.

## 7. Education

Keep all three cards and their current chronology. Use concise, factual descriptions:

- **НИУ МАИ, 2025 — настоящее время:** Прикладная математика и информатика. Высшая математика, программирование, алгоритмы и устройство вычислительных систем.
- **НИЯУ МИФИ / Институт ИНТЭЛ, 2022 — 2025:** Очный курс по машинному обучению и анализу данных. Регрессия, классификация, кластеризация и визуализация данных.
- **Предуниверситарий НИЯУ МИФИ, 2021 — 2025:** Углублённая подготовка по математике, информатике и физике.

Avoid decorative phrases such as “the foundation for everything that came after.”

## 8. GitHub

Keep the section but change its purpose from simulated “live activity” to a transparent route to real work.

**Russian heading:** `Код и эксперименты.`

**English heading:** `Code and experiments.`

**Russian text**

> В GitHub — исходный код учебных и продуктовых проектов, эксперименты и история разработки. Основные работы собраны выше, полный профиль доступен по ссылке.

**English text**

> My GitHub contains source code for educational and product projects, experiments, and development history. The main projects are featured above; the complete profile is available through the link.

Remove the randomized contribution graph, simulated streak, and manually entered activity totals. Keep the GitHub profile link. A real API-backed activity view can be designed later as a separate feature.

## 9. Contact

Use a neutral invitation suitable for employers, collaborators, and interested visitors.

### Russian

**Heading:** `Открыт к новым задачам.`

> Если хотите обсудить работу, стажировку, совместный проект или просто познакомиться — напишите удобным способом. Быстрее всего отвечаю в Telegram и по электронной почте.

**Form note:** `После отправки откроется ваше почтовое приложение с подготовленным письмом.`

### English

**Heading:** `Open to new opportunities.`

> If you would like to discuss a role, internship, collaborative project, or simply connect, use any of the channels below. Telegram and email are the quickest ways to reach me.

**Form note:** `Submitting the form opens your email application with a prepared message.`

Remove the unsupported promise to reply within 24 hours. Keep email, phone, Telegram, and GitHub. The interface must accurately describe the existing mailto behavior and must not claim that the message was sent by the site.

## 10. Localization and Metadata

- Every user-facing sentence must have both Russian and English copy.
- Section display headings must be localized; the Russian site must not retain English marketing headings unless they are product or technology names.
- Keep one content source in the active `index.html` implementation; do not update the unused legacy translation file unless the implementation is explicitly changed to consume it.
- Update title, description, Open Graph, Twitter, JSON-LD, and visible positioning to describe the same role.
- In JSON-LD, represent MAI as education or affiliation, not as an employer.
- Preserve names, URLs, and downloadable resume paths.

## 11. Content Integrity

Do not invent:

- commercial employment or client claims;
- user counts, revenue, conversion, or performance gains;
- GitHub activity, streak, or repository totals;
- project links that are not present and verified;
- seniority or production ML experience.

The existing `345+ tests`, `three workflows`, and project-role statements may remain because they are already presented as project evidence, but they should be checked against the Finly repository before publication if access is available.

## 12. Implementation Boundaries

This iteration changes content and only the minimum markup or styling required to support it:

- preserve the current design system, theme switcher, responsive layout, motion, and page composition;
- change the hero's second action from contact to resume;
- replace animated profile counters with static fact labels;
- remove the generic quote;
- remove or replace simulated GitHub content;
- remove skill percentages while retaining category filtering;
- do not create new pages, a CMS, a backend, or a live GitHub integration.

## 13. Verification

Before considering the content refresh complete:

1. Review both languages at desktop and mobile widths.
2. Confirm that switching languages updates every visible text node without mixed-language headings.
3. Confirm that all project, social, contact, and resume links work.
4. Confirm that the contact form states and performs its mailto behavior accurately.
5. Search the rendered content for simulated GitHub claims, proficiency percentages, generic quote text, and the 24-hour reply promise.
6. Check that metadata and JSON-LD match the visible Full-Stack plus applied-ML position.
7. Verify that no unsupported claims or unverified project links were added.

## 14. Out of Scope

- A full visual redesign.
- Separate project case-study pages.
- A real-time GitHub API integration.
- New project screenshots or custom graphics.
- Rewriting or regenerating the downloadable resume files.
- Adding analytics, a contact backend, blog, CMS, or external services.
