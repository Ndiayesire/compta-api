/**
 * Insta Compta API — Carte d'architecture (blueprint)
 */
(function () {
  const ZONES = {
    all: { label: 'Tous', color: '#38bdf8' },
    core: { label: 'Core', color: '#a78bfa' },
    metier: { label: 'Métier', color: '#22d3ee' },
    settings: { label: 'Réf.', color: '#60a5fa' },
    fiscal: { label: 'Fiscal', color: '#f472b6' },
    perso: { label: 'Perso', color: '#a3e635' },
    app: { label: 'App', color: '#94a3b8' },
  };

  const ZONE_ORDER = ['all', 'core', 'metier', 'fiscal', 'settings', 'perso', 'app'];

  const FOLDER_MODELS = {
    'src/app': [],
    'src/modules/auth': ['User'],
    'src/modules/users': ['User', 'Role'],
    'src/modules/company': ['Company'],
    'src/modules/clients': ['Client'],
    'src/modules/employees': ['Employee'],
    'src/modules/employee-contracts': ['EmployeeContractType'],
    'src/modules/tiers': ['Tier'],
    'src/modules/tiers-transactions': ['TiersTransaction'],
    'src/modules/balances': ['Balance', 'BalanceLine'],
    'src/modules/rentals': ['Rental'],
    'src/modules/rental-usages': ['RentalUsage'],
    'src/modules/documents': ['Document'],
    'src/modules/accounting-years': ['AccountingYear'],
    'src/modules/accounting-quarters': ['AccountingQuarter'],
    'src/modules/op-turnovers': ['OpTurnover', 'OpTurnoverStamp'],
    'src/modules/op-local-purchases': ['OpLocalPurchase'],
    'src/modules/op-suspensions': ['OpSuspension'],
    'src/modules/op-importations': ['OpImportation'],
    'src/modules/op-exportations': ['OpExportation'],
    'src/modules/op-retains': ['OpRetain'],
    'src/modules/op-royalties': ['OpRoyalty'],
    'src/modules/op-exemptions': ['OpExemption'],
    'src/modules/activities': ['Activity'],
    'src/modules/notifications': ['Notification'],
    'src/modules/app-meta': ['AppMeta'],
    'src/modules/settings/countries': ['Country'],
    'src/modules/settings/regions': ['Region'],
    'src/modules/settings/currency': ['Currency'],
    'src/modules/settings/legal-forms': ['LegalForm'],
    'src/modules/settings/genders': ['Gender'],
    'src/modules/settings/languages': ['Language'],
    'src/modules/settings/payment-methods': ['PaymentMethod'],
    'src/modules/settings/contract-types': ['ContractType'],
    'src/modules/settings/identification-types': ['IdentificationType'],
    'src/modules/settings/tier-types': ['TierType'],
    'src/modules/settings/document-categories': ['DocumentCategory'],
    'src/modules/settings/permissions': ['Permission'],
    'src/modules/settings/roles': ['Role'],
    'src/modules/settings/deduction-types': ['DeductionType'],
    'src/modules/settings/property-nature-types': ['PropertyNatureType'],
    'src/modules/excel-reports': [],
  };

  const NOTES = {
    '/auth': 'POST /login @Public',
    '/clients': 'user optionnel · meta bp',
    '/employees': 'import Excel',
    '/balances': 'import lignes .xlsx',
    '/op-exemptions': 'import Excel · mois 1–12 · query year · tier auto',
    '/op-exportations': 'import Excel · ANNEE/MOIS · PAYS · tier auto',
    '/op-local-purchases': 'month/year entiers · tierId',
    '/tiers': 'exports DGID + jobs',
    '/notifications': 'GET /unread',
    '(interne)': 'Excel DGID via TiersService',
  };

  let meta = { importRoutes: [], zoneCounts: {}, fiscalModules: [] };

  const SNIPPET_LABELS = {
    entry: 'Routes HTTP',
    controller: 'Controller',
    dto: 'DTO (validation)',
    service: 'Code métier — Service',
    prisma: 'Appels Prisma',
    mysql: 'Modèle MySQL',
    output: 'Réponse JSON',
  };

  const GLOBAL_STACK = [
    { lbl: 'Clients', title: 'HTTP / REST', sub: 'Postman · Swagger · Front', color: '#38bdf8' },
    { lbl: 'API', title: 'NestJS 11', sub: 'Guards · Pipes · Interceptors · Modules', color: '#a78bfa' },
    { lbl: 'ORM', title: 'Prisma 7', sub: 'PrismaService · schema · migrations', color: '#22d3ee' },
    { lbl: 'Data', title: 'MySQL / MariaDB', sub: 'Decimal(12,2) · @map · soft delete', color: '#4ade80' },
  ];

  let modules = [];
  let selectedId = null;
  let zoneTab = 'all';
  let query = '';

  function enrich(list) {
    return list.map((m) => ({
      ...m,
      models: FOLDER_MODELS[m.folder] || [],
      notes: m.notes || NOTES[m.route] || '',
      id: m.route + '|' + m.controllers.join(','),
    }));
  }

  function label(m) {
    return m.controllers[0] || m.services[0] || m.route;
  }

  function filtered() {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (zoneTab !== 'all' && m.zone !== zoneTab) return false;
      if (!q) return true;
      return [m.route, m.folder, ...m.controllers, ...m.services, ...m.dtos, m.notes].join(' ').toLowerCase().includes(q);
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const TS_KW = new Set([
    'async', 'await', 'const', 'let', 'var', 'return', 'if', 'else', 'throw', 'new', 'class', 'export',
    'import', 'from', 'interface', 'type', 'extends', 'implements', 'private', 'readonly', 'public',
    'protected', 'static', 'typeof', 'satisfies', 'null', 'undefined', 'true', 'false', 'void', 'this',
    'super', 'constructor', 'enum', 'as', 'in', 'of', 'for', 'while', 'do', 'switch', 'case', 'break',
    'continue', 'default', 'try', 'catch', 'finally', 'delete', 'get', 'set', 'infer', 'keyof',
  ]);

  function span(cls, text) {
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  function highlightTs(source) {
    const out = [];
    let i = 0;
    const n = source.length;

    while (i < n) {
      const rest = source.slice(i);

      if (/^\/\//.test(rest)) {
        const m = rest.match(/^\/\/[^\n]*/);
        out.push(span('hl-cmt', m[0]));
        i += m[0].length;
        continue;
      }
      if (/^\/\*/.test(rest)) {
        const m = rest.match(/^\/\*[\s\S]*?\*\//);
        out.push(span('hl-cmt', m ? m[0] : rest));
        i += m ? m[0].length : n;
        continue;
      }
      if (/^['"`]/.test(rest)) {
        const q = rest[0];
        let j = 1;
        while (j < rest.length) {
          if (rest[j] === '\\') { j += 2; continue; }
          if (rest[j] === q) { j++; break; }
          j++;
        }
        out.push(span('hl-str', rest.slice(0, j)));
        i += j;
        continue;
      }
      if (/^@\w+/.test(rest)) {
        const m = rest.match(/^@\w+/);
        out.push(span('hl-dec', m[0]));
        i += m[0].length;
        continue;
      }
      if (/^\d+\.?\d*/.test(rest)) {
        const m = rest.match(/^\d+\.?\d*/);
        out.push(span('hl-num', m[0]));
        i += m[0].length;
        continue;
      }
      if (/^[a-zA-Z_$]\w*/.test(rest)) {
        const m = rest.match(/^[a-zA-Z_$]\w*/);
        const w = m[0];
        const next = rest.slice(w.length);
        if (TS_KW.has(w)) out.push(span('hl-kw', w));
        else if (w === 'prisma' && /^\.[\w$]+/.test(next)) {
          const chain = (w + next.match(/^\.[\w$]+(?:\.[\w$]+)*/)[0]);
          out.push(span('hl-prisma', chain));
          i += chain.length;
          continue;
        } else if (/^\(/.test(next)) out.push(span('hl-fn', w));
        else if (/^[A-Z]/.test(w)) out.push(span('hl-typ', w));
        else if (w === 'tx' && /^\.[\w$]+/.test(next)) {
          const chain = (w + next.match(/^\.[\w$]+(?:\.[\w$]+)*/)[0]);
          out.push(span('hl-prisma', chain));
          i += chain.length;
          continue;
        } else out.push(esc(w));
        i += w.length;
        continue;
      }

      out.push(esc(rest[0]));
      i += 1;
    }
    return out.join('');
  }

  function highlightRoutes(source) {
    return source
      .split('\n')
      .map((line) => {
        const m = line.match(/^(GET|POST|PATCH|DELETE|PUT)\s+(.+)$/);
        if (m) return `${span('hl-http', m[1])} ${span('hl-path', m[2])}`;
        if (line.startsWith('//')) return span('hl-cmt', line);
        return esc(line);
      })
      .join('\n');
  }

  function highlightPrisma(source) {
    return source
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('//')) return span('hl-cmt', line);
        const model = line.match(/^model\s+(\w+)/);
        if (model) return line.replace(/^model\s+(\w+)/, `model ${span('hl-model', model[1])}`);
        const field = line.match(/^\s+(\w+)\s+/);
        if (field && !line.includes('@@')) {
          return line.replace(/^(\s+)(\w+)(\s+)/, (_, sp, name, tail) => `${sp}${span('hl-field', name)}${tail}`);
        }
        return highlightTs(line);
      })
      .join('\n');
  }

  function highlightCode(source, snippetKey) {
    if (!source) return '';
    if (snippetKey === 'entry') return highlightRoutes(source);
    if (snippetKey === 'mysql') return highlightPrisma(source);
    if (snippetKey === 'prisma') {
      return source
        .split('\n')
        .map((line) => {
          if (line.trim().startsWith('//')) return span('hl-cmt', line);
          const m = line.match(/(await\s+)?((?:prisma|tx)\.[\w$.]+)/);
          if (m) return line.replace(m[2], span('hl-prisma', m[2]));
          return esc(line);
        })
        .join('\n');
    }
    return highlightTs(source);
  }

  function flowNode(n, kind, title, sub, tags, color, opts = {}) {
    const tagsHtml = tags?.length
      ? `<div class="flow-tags">${tags.map((t) => `<code>${t}</code>`).join('')}</div>`
      : '';
    const hoverTip = opts.hoverServices?.length
      ? `<div class="flow-hover-tip"><strong>Services liés</strong>${opts.hoverServices.map((s) => `<code>${esc(s)}</code>`).join('')}</div>`
      : '';
    const cls = ['flow-node', opts.isController ? 'is-controller' : ''].filter(Boolean).join(' ');
    const snippet = opts.snippet ? ` data-snippet="${opts.snippet}"` : '';
    return `
      <div class="${cls}" data-n="${n}" style="--nc:${color}"${snippet}${opts.isController ? ' data-role="controller"' : ''}${opts.snippet === 'service' ? ' data-kind="service"' : ''}>
        <div class="kind">${kind}</div>
        <div class="title">${title}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ''}
        ${tagsHtml}
        ${hoverTip}
      </div>`;
  }

  function previewSnippet(code) {
    if (!code) return '<span style="color:var(--muted)">Pas de code service</span>';
    return highlightCode(code, 'service');
  }

  let previewEl = null;
  let previewTimer = null;

  function showTilePreview(anchor, m) {
    if (!previewEl) previewEl = document.getElementById('arch-preview');
    if (!previewEl || !m.snippets?.service) return;
    const snip = m.snippets.service;
    const ctrl = label(m);
    previewEl.innerHTML = `
      <div class="prev-head">
        <strong>${esc(ctrl)}</strong>
        <span>${esc(snip.file)}</span>
      </div>
      <pre><code class="hl-ts">${previewSnippet(snip.code)}</code></pre>`;
    previewEl.hidden = false;
    const r = anchor.getBoundingClientRect();
    const pw = previewEl.offsetWidth || 380;
    let left = r.left - pw - 14;
    let top = r.top;
    if (left < 12) left = 12;
    if (top + 280 > window.innerHeight - 12) top = window.innerHeight - 292;
    if (top < 12) top = 12;
    previewEl.style.left = `${left}px`;
    previewEl.style.top = `${top}px`;
    previewEl.classList.add('show');
  }

  function hideTilePreview() {
    if (!previewEl) previewEl = document.getElementById('arch-preview');
    if (!previewEl) return;
    previewEl.classList.remove('show');
    previewEl.hidden = true;
  }

  function bindTilePreview(btn, m) {
    btn.addEventListener('mouseenter', () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => showTilePreview(btn, m), 120);
    });
    btn.addEventListener('mouseleave', () => {
      clearTimeout(previewTimer);
      hideTilePreview();
    });
  }

  function tileCard(m, z) {
    const ctrl = label(m);
    const primarySvc = m.services[0] || '—';
    const importBadge = hasImportNote(m) ? '<span class="tile-import">.xlsx</span>' : '';
    return `
      <button type="button" class="tile${selectedId === m.id ? ' on' : ''}" data-id="${m.id.replace(/"/g, '&quot;')}" style="--zc:${z.color}">
        <div class="tile-row">
          <span class="tile-zone">${esc(z.label)}</span>
          <span class="tile-route">${esc(m.route)}</span>
          ${importBadge}
        </div>
        <div class="tile-sub">
          <span class="tile-ctrl">${esc(ctrl)}</span>
          <span class="tile-dot">·</span>
          <span class="tile-svc">${esc(primarySvc)}</span>
        </div>
        ${m.notes ? `<div class="tile-foot"><span class="tile-badge">${esc(m.notes)}</span></div>` : ''}
      </button>`;
  }

  function tooltipHtml(m) {
    const ctrl = m.controllers.length
      ? `<div class="tip-lbl">Controller</div>${m.controllers.map((c) => `<code>${esc(c)}</code>`).join('')}`
      : '';
    const svc = m.services.length
      ? `<div class="tip-lbl svc">Services</div>${m.services.map((s) => `<code class="svc">${esc(s)}</code>`).join('')}`
      : '<div class="tip-lbl svc">Services</div><span style="color:var(--muted)">—</span>';
    return `${ctrl}${svc}`;
  }

  let tooltipEl = null;

  function bindTooltip(btn, m) {
    btn.addEventListener('mouseenter', (e) => {
      if (!tooltipEl) tooltipEl = document.getElementById('arch-tooltip');
      if (!tooltipEl) return;
      tooltipEl.innerHTML = tooltipHtml(m);
      tooltipEl.hidden = false;
      tooltipEl.classList.add('show');
      positionTooltip(e.currentTarget);
    });
    btn.addEventListener('mousemove', () => positionTooltip(btn));
    btn.addEventListener('mouseleave', () => {
      if (!tooltipEl) return;
      tooltipEl.classList.remove('show');
      tooltipEl.hidden = true;
    });
  }

  function positionTooltip(anchor) {
    if (!tooltipEl) return;
    const r = anchor.getBoundingClientRect();
    const tip = tooltipEl.getBoundingClientRect();
    let left = r.left - tip.width - 10;
    let top = r.top + (r.height - tip.height) / 2;
    if (left < 8) left = r.right + 10;
    if (top + tip.height > window.innerHeight - 8) top = window.innerHeight - tip.height - 8;
    if (top < 8) top = 8;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  function showCodePanel(snippetKey, snippets) {
    const panel = document.getElementById('arch-code-panel');
    if (!panel || !snippets) return;
    const snip = snippets[snippetKey];
    if (!snip) return;
    const lbl = SNIPPET_LABELS[snippetKey] || snippetKey;
    panel.innerHTML = `
      <div class="code-panel-head">
        <div class="code-lbl">${esc(lbl)}</div>
        <div class="code-file">${esc(snip.file)}</div>
      </div>
      <div class="code-panel-body"><pre><code class="hl-ts">${highlightCode(snip.code, snippetKey)}</code></pre></div>`;
  }

  function resetCodePanel() {
    const panel = document.getElementById('arch-code-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="code-panel-hint">
        <strong>Code métier</strong>
        Survolez une section du flux pour afficher le code source correspondant.
      </div>`;
  }

  function bindCodeHover(canvas, snippets) {
    const nodes = canvas.querySelectorAll('[data-snippet]');
    nodes.forEach((node) => {
      const key = node.dataset.snippet;
      const show = () => {
        nodes.forEach((n) => n.classList.remove('code-active'));
        node.classList.add('code-active');
        showCodePanel(key, snippets);
        if (key === 'controller') {
          const svc = canvas.querySelector('[data-kind="service"]');
          svc?.classList.add('hi-related');
        }
      };
      const hide = () => {
        node.classList.remove('code-active');
        canvas.querySelector('[data-kind="service"]')?.classList.remove('hi-related');
      };
      node.addEventListener('mouseenter', show);
      node.addEventListener('mouseleave', hide);
      node.addEventListener('focus', show);
      node.addEventListener('blur', hide);
    });
  }

  function hasImportNote(m) {
    return /import|\.xlsx/i.test(m.notes || '');
  }

  function renderImportPanel() {
    const routes = meta.importRoutes || [];
    if (!routes.length) return '';
    const items = routes
      .map(
        (r) =>
          `<li><code>${esc(r.method)} ${esc(r.path)}</code> — ${esc(r.detail)} <span style="opacity:0.65">(${esc(r.module)})</span></li>`,
      )
      .join('');
    return `
      <div class="import-panel">
        <h3>Imports Excel (.xlsx)</h3>
        <ul>${items}</ul>
      </div>`;
  }

  function formatGenerated(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return `MAJ ${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  }

  function flowLink() {
    return '<div class="flow-link"></div>';
  }

  function renderGlobal() {
    const layers = GLOBAL_STACK.map(
      (s, i) => `
        ${i ? '<div class="stack-conn">▼</div>' : ''}
        <div class="stack-layer" style="--lc:${s.color}">
          <div class="lbl">${s.lbl}</div>
          <div class="body"><strong>${s.title}</strong><span>${s.sub}</span></div>
        </div>`
    ).join('');

    const ctrl = modules.reduce((n, m) => n + m.controllers.length, 0);
    const svc = new Set(modules.flatMap((m) => m.services)).size;

    return `
      <div class="canvas-empty" style="align-items:stretch;justify-content:flex-start;padding-top:2rem">
        <div class="stack-global">
          ${layers}
        </div>
        ${renderImportPanel()}
        <p style="text-align:center;margin-top:1.5rem;font-size:0.78rem;color:var(--muted)">
          ${modules.length} modules · ${ctrl} controllers · ${svc} services · ${(meta.fiscalModules || []).length} fiscal · Cliquez une tuile à droite
        </p>
      </div>`;
  }

  function renderModule(m) {
    const z = ZONES[m.zone] || ZONES.app;
    const pub = /public|@Public/i.test(m.notes);
    const color = z.color;
    const parts = [];
    let n = 1;

    parts.push(
      flowNode(n++, 'Entrée', 'Requête HTTP', `Route <code>${m.route}</code>`, m.route !== '(interne)' ? [m.route] : ['interne'], color, { snippet: 'entry' })
    );
    parts.push(flowLink());

    if (m.controllers.length) {
      parts.push(
        flowNode(n++, 'Delivery', m.controllers[0], m.folder, m.controllers, color, {
          isController: true,
          hoverServices: m.services,
          snippet: 'controller',
        })
      );
      parts.push(flowLink());
      if (m.dtos.length) {
        parts.push(flowNode(n++, 'DTO', 'Validation', 'class-validator · camelCase JSON', m.dtos, color, { snippet: 'dto' }));
        parts.push(flowLink());
      }
    }

    parts.push(
      flowNode(n++, 'Application', m.services[0] || '—', 'Logique métier · scope JWT', m.services, color, { snippet: 'service' })
    );

    if (m.models.length) {
      parts.push(flowLink());
      parts.push(
        flowNode(n++, 'Prisma', 'PrismaService', 'Requêtes typées', m.models.map((x) => `prisma.${x.charAt(0).toLowerCase() + x.slice(1)}`), '#4ade80', { snippet: 'prisma' })
      );
      parts.push(flowLink());
      parts.push(flowNode(n++, 'MySQL', 'Tables', 'Persistance relationnelle', m.models, '#f472b6', { snippet: 'mysql' }));
    }

    parts.push(flowLink());
    parts.push(flowNode(n++, 'Sortie', 'JSON', '{ success, message, data }', ['HttpLatencyInterceptor'], '#38bdf8', { snippet: 'output' }));

    return `
      <div class="mod-diagram">
        <header class="mod-head">
          <span class="zone" style="background:${color}22;color:${color}">${z.label}</span>
          <h2>${label(m)}</h2>
          <p class="route"><code>${m.route}</code> · <code>${m.folder}</code></p>
        </header>
        <div class="mod-split">
          <div class="flow-lane">${parts.join('')}</div>
          <aside class="code-panel" id="arch-code-panel">
            <div class="code-panel-hint">
              <strong>Code métier</strong>
              Survolez une section du flux pour afficher le code source correspondant.
            </div>
          </aside>
        </div>
        <p class="mod-guard">${pub ? '@Public()' : 'JwtAuthGuard'} · ValidationPipe · MorganMiddleware</p>
        ${m.notes ? `<div class="mod-note">${m.notes}</div>` : ''}
      </div>`;
  }

  function renderCanvas() {
    const el = document.getElementById('arch-canvas');
    if (!el) return;
    const m = modules.find((x) => x.id === selectedId);
    el.innerHTML = m ? renderModule(m) : renderGlobal();
    if (m) bindCodeHover(el, m.snippets);
  }

  function renderTabs() {
    const el = document.getElementById('arch-tabs');
    if (!el) return;
    el.innerHTML = ZONE_ORDER.map((k) => {
      const z = ZONES[k];
      const count = k === 'all' ? modules.length : modules.filter((m) => m.zone === k).length;
      const cnt = k !== 'all' ? `<span class="zcnt">${count}</span>` : '';
      return `<button type="button" class="ztab${zoneTab === k ? ' on' : ''}" data-z="${k}" style="--zc:${z.color}"><span class="zdot"></span>${z.label}${cnt}</button>`;
    }).join('');

    el.querySelectorAll('.ztab').forEach((btn) => {
      btn.addEventListener('click', () => {
        zoneTab = btn.dataset.z;
        renderTabs();
        renderTiles();
      });
    });
  }

  function renderTiles() {
    const el = document.getElementById('arch-tiles');
    const stats = document.getElementById('arch-stats');
    if (!el) return;

    const list = filtered();
    el.innerHTML = list.length
      ? list.map((m) => tileCard(m, ZONES[m.zone] || ZONES.app)).join('')
      : '<div class="tile-empty">Aucun module pour ce filtre</div>';

    const ctrl = modules.reduce((n, m) => n + m.controllers.length, 0);
    const svc = new Set(modules.flatMap((m) => m.services)).size;
    if (stats) {
      stats.innerHTML = `
        <div class="kpi hl"><strong>${list.length}</strong><span>affichés</span></div>
        <div class="kpi"><strong>${modules.length}</strong><span>modules</span></div>
        <div class="kpi"><strong>${ctrl}</strong><span>ctrl</span></div>
        <div class="kpi"><strong>${svc}</strong><span>services</span></div>`;
    }

    el.querySelectorAll('.tile').forEach((btn) => {
      const m = modules.find((x) => x.id === btn.dataset.id);
      if (m) bindTilePreview(btn, m);
      btn.addEventListener('click', () => {
        hideTilePreview();
        selectedId = btn.dataset.id;
        renderTiles();
        renderCanvas();
      });
    });
  }

  async function init() {
    try {
      const res = await fetch('architecture-data.json');
      const data = await res.json();
      meta = data.meta || meta;
      modules = enrich(data.modules);
      const genEl = document.getElementById('arch-generated');
      if (genEl) genEl.textContent = formatGenerated(data.generated);
    } catch {
      document.getElementById('arch-canvas').innerHTML = '<p class="err">Exécutez <code>node scripts/scan-architecture.cjs</code></p>';
      return;
    }

    document.getElementById('arch-q')?.addEventListener('input', (e) => {
      query = e.target.value;
      renderTiles();
    });

    renderTabs();
    renderTiles();
    renderCanvas();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
