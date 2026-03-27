(function () {
  if (!window.matchMedia('(prefers-color-scheme: dark)').matches) return;

  const css = `
    body, .swagger-ui { background-color: #0f172a !important; color: #e2e8f0 !important; }
    .swagger-ui .topbar { background: #020617 !important; border-bottom: 3px solid #0ea5e9 !important; }
    .swagger-ui .info h2.title { color: #f1f5f9 !important; }
    .swagger-ui .info .description p { color: #94a3b8 !important; }
    .swagger-ui .filter input { border: 1px solid #334155 !important; background: #1e293b !important; color: #e2e8f0 !important; }
    .swagger-ui .opblock-tag { color: #f1f5f9 !important; border-bottom: 1px solid #1e293b !important; }
    .swagger-ui .opblock-tag:hover { background: #1e293b !important; }
    .swagger-ui .opblock-tag-section { background: #0f172a !important; }
    .swagger-ui .opblock { background: #1e293b !important; box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important; }
    .swagger-ui .opblock.is-open { box-shadow: 0 2px 8px rgba(14,165,233,0.25) !important; }
    .swagger-ui .opblock.opblock-patch { background: rgba(212,135,206,0.08) !important; border-color: #d487ce !important; }
    .swagger-ui .opblock-summary-description { color: #94a3b8 !important; }
    .swagger-ui .opblock-summary-path { color: #e2e8f0 !important; }
    .swagger-ui .opblock-summary-path a span { color: #cbd5e1 !important; }
    .swagger-ui .opblock-body, .swagger-ui .opblock-description-wrapper { background: #0f172a !important; }
    .swagger-ui .opblock-section-header { background: #1e293b !important; border-bottom: 1px solid #334155 !important; }
    .swagger-ui table thead tr th, .swagger-ui table thead tr td { color: #94a3b8 !important; border-bottom: 1px solid #1e293b !important; }
    .swagger-ui .parameter__name { color: #e2e8f0 !important; }
    .swagger-ui input, .swagger-ui textarea, .swagger-ui select { background: #1e293b !important; border: 1px solid #334155 !important; color: #e2e8f0 !important; }
    .swagger-ui section.models { background: #1e293b !important; border: 1px solid #334155 !important; }
    .swagger-ui section.models h4 { color: #f1f5f9 !important; }
    .swagger-ui section.models .model-container { background: rgba(255,255,255,0.03) !important; }
    .swagger-ui .opblock-section-header label, .swagger-ui .tab li,
    .swagger-ui .response-col_description, .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5, .swagger-ui label,
    .swagger-ui p, .swagger-ui td, .swagger-ui li { color: #cbd5e1 !important; }
    .swagger-ui .microlight, .swagger-ui .highlight-code { background: #020617 !important; color: #7dd3fc !important; border-radius: 6px !important; }
    ::-webkit-scrollbar-track { background: #0f172a !important; }
    ::-webkit-scrollbar-thumb { background: #334155 !important; }
    ::-webkit-scrollbar-thumb:hover { background: #0ea5e9 !important; }
  `;

  const style = document.createElement('style');
  style.id = 'swagger-dark-mode';
  style.textContent = css;

  // Inject after DOM is ready
  function inject() {
    if (!document.getElementById('swagger-dark-mode')) {
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Re-inject after Swagger finishes rendering (it re-renders dynamically)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('swagger-dark-mode')) {
      document.head.appendChild(style);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();