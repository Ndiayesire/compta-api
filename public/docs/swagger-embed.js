(function () {
  if (typeof SwaggerUIBundle === 'undefined') return;

  let storeSubscribed = false;

  function getSwaggerSystem() {
    const ui = window.ui;
    if (!ui) return null;
    return typeof ui.getSystem === 'function' ? ui.getSystem() : ui;
  }

  function hideSwaggerInfo() {
    document.querySelectorAll('#swagger-ui .information-container, #swagger-ui .info').forEach((el) => {
      el.style.display = 'none';
    });
  }

  function syncAuthorizeButton() {
    const btn = document.getElementById('swagger-authorize-btn');
    if (!btn) return;

    const system = getSwaggerSystem();
    const authorized = system?.authSelectors?.authorized?.();
    const isAuthed = Boolean(authorized && authorized.size > 0);

    btn.classList.toggle('is-unlocked', isAuthed);
    btn.setAttribute('aria-pressed', isAuthed ? 'true' : 'false');
    const label = btn.querySelector('.api-authorize-label');
    if (label) {
      label.textContent = isAuthed ? 'Autorisé' : 'Authorize';
    }
  }

  function applyFilter(value) {
    const system = getSwaggerSystem();
    if (system?.layoutActions?.updateFilter) {
      system.layoutActions.updateFilter(value);
    }
  }

  function openAuthorize() {
    const system = getSwaggerSystem();
    if (system?.authActions?.showDefinitions && system?.authSelectors?.definitionsToAuthorize) {
      system.authActions.showDefinitions(system.authSelectors.definitionsToAuthorize());
    }
  }

  function bindToolbar() {
    const filterInput = document.getElementById('swagger-filter-input');
    const authBtn = document.getElementById('swagger-authorize-btn');

    if (filterInput && filterInput.dataset.bound !== '1') {
      filterInput.dataset.bound = '1';
      filterInput.addEventListener('input', (event) => {
        applyFilter(event.target.value);
      });
    }

    if (authBtn && authBtn.dataset.bound !== '1') {
      authBtn.dataset.bound = '1';
      authBtn.addEventListener('click', openAuthorize);
    }

    const system = getSwaggerSystem();
    if (system?.getStore && !storeSubscribed) {
      storeSubscribed = true;
      system.getStore().subscribe(syncAuthorizeButton);
    }

    syncAuthorizeButton();
  }

  function onSwaggerReady() {
    hideSwaggerInfo();
    bindToolbar();
  }

  window.ui = SwaggerUIBundle({
    url: '/api-internal-json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
    persistAuthorization: true,
    filter: true,
    docExpansion: 'none',
    tagsSorter: 'alpha',
    validatorUrl: null,
    onComplete: onSwaggerReady,
  });
})();
