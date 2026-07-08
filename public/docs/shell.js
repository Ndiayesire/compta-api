(function () {
  const COLLAPSE_KEY = 'insta-docs-sidebar-collapsed';
  const THEME_KEY = 'insta-docs-theme';
  const page = document.body.dataset.page;
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const mobileToggle = document.querySelector('.menu-toggle');
  const mobileClose = document.querySelector('.sidebar-close');
  const collapseBtn = document.querySelector('.sidebar-collapse');
  const collapseLabel = document.querySelector('.sidebar-collapse-label');

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    document.querySelectorAll('[data-theme-set]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.themeSet === theme);
    });
    localStorage.setItem(THEME_KEY, theme);
  }

  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    applyTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
  });

  document.querySelectorAll('[data-theme-set]').forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeSet));
  });

  if (localStorage.getItem(COLLAPSE_KEY) === '1') {
    document.body.classList.add('sidebar-collapsed');
  }

  function updateCollapseUi(collapsed) {
    collapseBtn?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    collapseBtn?.setAttribute('aria-label', collapsed ? 'Déplier le menu' : 'Replier le menu');
    if (collapseLabel) {
      collapseLabel.textContent = collapsed ? 'Ouvrir' : 'Réduire';
    }
  }

  updateCollapseUi(document.body.classList.contains('sidebar-collapsed'));

  function setCollapsed(nextCollapsed) {
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    localStorage.setItem(COLLAPSE_KEY, nextCollapsed ? '1' : '0');
    updateCollapseUi(nextCollapsed);
  }

  collapseBtn?.addEventListener('click', () => {
    setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  });

  function closeMobile() {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('visible');
    document.body.classList.remove('mobile-nav-open');
  }

  function openMobile() {
    sidebar?.classList.add('open');
    backdrop?.classList.add('visible');
    document.body.classList.add('mobile-nav-open');
  }

  mobileToggle?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) closeMobile();
    else openMobile();
  });

  mobileClose?.addEventListener('click', closeMobile);

  backdrop?.addEventListener('click', closeMobile);

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === page);
  });

  document.querySelectorAll('.sidebar .nav-link, .sidebar-profile').forEach((link) => {
    link.addEventListener('click', closeMobile);
  });

  if (page !== 'guide') return;

  const links = document.querySelectorAll('.nav-group a.nav-link[href^="#"]');
  const sections = [...links]
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        links.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    },
    { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
})();
