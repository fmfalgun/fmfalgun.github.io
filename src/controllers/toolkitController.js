/**
 * toolkitController.js
 * Fetches tool data from JSON manifests and renders the toolkit page.
 *
 * Features:
 *   - Collapsible category and phase group sections
 *   - Sticky right-side outline with IntersectionObserver highlighting
 *   - Real-time search bar
 *   - Filter panel (phase, category, language, org) with AND logic
 *   - Dynamic language + org chip population
 *   - Stats bar updated on filter/search changes
 *
 * Data flow:
 *   data/toolkit/manifest.json
 *     → per-phase or per-category manifest.json  (array of filenames)
 *       → individual tool JSON files
 */

const MANIFEST = 'data/toolkit/manifest.json';

/* ─── Fetch helpers ─────────────────────────────────────────── */

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

async function fetchTools(manifestPath) {
  const filenames = await fetchJSON(manifestPath);
  const dir = manifestPath.replace(/\/[^/]+$/, '/');
  const results = await Promise.allSettled(
    filenames.map(f => fetchJSON(dir + f))
  );
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

/* ─── Rendering ─────────────────────────────────────────────── */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLinks(links) {
  if (!links || typeof links !== 'object') return '';
  const entries = Object.entries(links);
  if (!entries.length) return '';
  return `<div class="tool-links">${
    entries.map(([label, url]) =>
      `<a href="${escapeHtml(url)}" class="tool-link" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`
    ).join('')
  }</div>`;
}

function renderToolCard(tool) {
  const tags = [
    tool.author   ? `<span class="tool-tag tool-tag-author">${escapeHtml(tool.author)}</span>` : '',
    tool.org      ? `<span class="tool-tag tool-tag-org">${escapeHtml(tool.org)}</span>` : '',
    tool.language ? `<span class="tool-tag tool-tag-lang">${escapeHtml(tool.language)}</span>` : '',
  ].filter(Boolean).join('');

  // Data attributes used for search and filtering
  const dataAttrs = [
    `data-name="${escapeHtml(tool.name)}"`,
    `data-purpose="${escapeHtml(tool.purpose)}"`,
    `data-author="${escapeHtml(tool.author)}"`,
    `data-org="${escapeHtml(tool.org)}"`,
    `data-language="${escapeHtml(tool.language)}"`,
    `data-why="${escapeHtml(tool.why_notable)}"`,
    `data-phase="${escapeHtml(tool.phase)}"`,
    `data-category="${escapeHtml(tool.category)}"`,
  ].join(' ');

  return `
    <article class="tool-card" aria-label="${escapeHtml(tool.name)}" ${dataAttrs}>
      <div class="tool-card-top">
        <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
        ${tool.year ? `<span class="tool-year">${escapeHtml(tool.year)}</span>` : ''}
      </div>
      ${tool.purpose ? `<p class="tool-purpose">${escapeHtml(tool.purpose)}</p>` : ''}
      ${tags ? `<div class="tool-meta">${tags}</div>` : ''}
      ${tool.why_notable ? `<p class="tool-notable">${escapeHtml(tool.why_notable)}</p>` : ''}
      ${renderLinks(tool.links)}
    </article>
  `.trim();
}

/* ─── Build collapsible sections ────────────────────────────── */

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildPhaseGroup(phaseName, tools, categoryName) {
  // For flat (unix) categories, use the category name as the id base so the
  // outline link target matches. 'unix' is kept only as the data-phase sentinel
  // for filter matching.
  const isFlat = phaseName === 'unix';
  const id = 'group-' + slugify(isFlat ? categoryName : phaseName);
  const phaseAttr = isFlat ? 'unix' : escapeHtml(phaseName);
  const displayTitle = isFlat ? categoryName : phaseName;
  return `
    <section class="tool-phase-group" id="${id}" data-phase="${phaseAttr}" data-category="${escapeHtml(categoryName)}">
      <button class="group-toggle-btn" aria-expanded="true">
        <span class="group-title">${escapeHtml(displayTitle)}</span>
        <span class="group-count badge">${tools.length}</span>
        <span class="toggle-arrow">▾</span>
      </button>
      <div class="group-body">
        <div class="tools-grid">
          ${tools.map(renderToolCard).join('\n')}
        </div>
      </div>
    </section>
  `.trim();
}

function buildCategoryGroup(catName, phaseGroupsHTML) {
  const id = 'cat-' + slugify(catName);
  return `
    <div class="tool-category" id="${id}">
      <button class="category-toggle-btn" aria-expanded="true">
        <span class="category-title">${escapeHtml(catName)}</span>
        <span class="toggle-arrow">▾</span>
      </button>
      <div class="category-body">
        ${phaseGroupsHTML}
      </div>
    </div>
  `.trim();
}

/* ─── Outline ────────────────────────────────────────────────── */

function buildOutline(manifest) {
  const ol = document.getElementById('outline-list');
  if (!ol) return;
  ol.innerHTML = '';

  for (const cat of manifest.categories) {
    const catLi = document.createElement('li');
    catLi.className = 'outline-category-label';
    catLi.textContent = cat.name;
    ol.appendChild(catLi);

    if (cat.type === 'phases') {
      for (const phase of cat.phases) {
        const id = 'group-' + slugify(phase.name);
        const li = document.createElement('li');
        li.className = 'outline-item';
        li.dataset.target = id;
        li.innerHTML = `<a href="#${id}">${escapeHtml(phase.name)}</a>`;
        ol.appendChild(li);
      }
    } else {
      const id = 'group-' + slugify(cat.name);
      const li = document.createElement('li');
      li.className = 'outline-item';
      li.dataset.target = id;
      li.innerHTML = `<a href="#${id}">${escapeHtml(cat.name)}</a>`;
      ol.appendChild(li);
    }
  }
}

/* ─── Collapsible toggle logic ───────────────────────────────── */

function setGroupOpen(btn, open) {
  const body = btn.nextElementSibling;
  if (!body) return;
  btn.setAttribute('aria-expanded', String(open));
  if (open) {
    body.style.maxHeight = body.scrollHeight + 'px';
  } else {
    // Freeze current height first so transition starts from it
    body.style.maxHeight = body.scrollHeight + 'px';
    // Force reflow
    body.offsetHeight; // eslint-disable-line no-unused-expressions
    body.style.maxHeight = '0px';
  }
}

function initCollapsibles(container) {
  // Set initial max-height for all open bodies
  container.querySelectorAll('.group-body, .category-body').forEach(body => {
    body.style.maxHeight = body.scrollHeight + 'px';
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.group-toggle-btn, .category-toggle-btn');
    if (!btn) return;
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    setGroupOpen(btn, !isExpanded);
  });
}

/* ─── Outline IntersectionObserver ──────────────────────────── */

function initOutlineObserver() {
  const outlineItems = document.querySelectorAll('.outline-item');
  if (!outlineItems.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        outlineItems.forEach(item => item.classList.remove('outline-active'));
        const active = document.querySelector(`.outline-item[data-target="${id}"]`);
        if (active) active.classList.add('outline-active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tool-phase-group').forEach(group => {
    observer.observe(group);
  });
}

/* ─── Outline click → scroll + expand ───────────────────────── */

function initOutlineClicks() {
  const ol = document.getElementById('outline-list');
  if (!ol) return;

  ol.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();

    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    // Expand the group if collapsed
    const groupBtn = target.querySelector(':scope > .group-toggle-btn');
    if (groupBtn && groupBtn.getAttribute('aria-expanded') === 'false') {
      setGroupOpen(groupBtn, true);
    }

    // Also expand the parent category if collapsed
    const parentCategory = target.closest('.tool-category');
    if (parentCategory) {
      const catBtn = parentCategory.querySelector(':scope > .category-toggle-btn');
      if (catBtn && catBtn.getAttribute('aria-expanded') === 'false') {
        setGroupOpen(catBtn, true);
      }
    }

    // After expanding (transitions are 0.3s), scroll
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 320);
  });
}

/* ─── Filter + Search state ─────────────────────────────────── */

const filters = { phase: 'all', category: 'all', language: 'all', org: 'all' };
let searchQuery = '';

function cardMatchesFilters(card) {
  const phase    = card.dataset.phase    || '';
  const category = card.dataset.category || '';
  const language = card.dataset.language || '';
  const org      = card.dataset.org      || '';

  if (filters.phase !== 'all') {
    // 'unix' phase filter means category === 'Unix Tools'
    if (filters.phase === 'unix') {
      if (category !== 'Unix Tools') return false;
    } else {
      if (phase !== filters.phase) return false;
    }
  }
  if (filters.category !== 'all' && category !== filters.category) return false;
  if (filters.language !== 'all' && language !== filters.language) return false;
  if (filters.org      !== 'all' && org      !== filters.org)      return false;

  return true;
}

function cardMatchesSearch(card, query) {
  if (!query) return true;
  const haystack = [
    card.dataset.name,
    card.dataset.purpose,
    card.dataset.author,
    card.dataset.org,
    card.dataset.why,
  ].join(' ').toLowerCase();
  return haystack.includes(query);
}

function applyFiltersAndSearch() {
  const query = searchQuery.trim().toLowerCase();
  const allCards = document.querySelectorAll('.tool-card');
  let visibleTotal = 0;

  allCards.forEach(card => {
    const show = cardMatchesFilters(card) && cardMatchesSearch(card, query);
    card.style.display = show ? '' : 'none';
    if (show) visibleTotal++;
  });

  // Show/collapse groups based on visible cards
  document.querySelectorAll('.tool-phase-group').forEach(group => {
    const visibleInGroup = [...group.querySelectorAll('.tool-card')]
      .some(c => c.style.display !== 'none');

    group.style.display = visibleInGroup ? '' : 'none';

    const btn = group.querySelector(':scope > .group-toggle-btn');
    if (btn) {
      if (visibleInGroup && btn.getAttribute('aria-expanded') === 'false') {
        setGroupOpen(btn, true);
      }
      // Update badge count
      const badge = btn.querySelector('.group-count');
      if (badge) {
        const n = [...group.querySelectorAll('.tool-card')]
          .filter(c => c.style.display !== 'none').length;
        badge.textContent = n;
      }
    }
  });

  // Show/collapse category groups based on visible phase groups
  document.querySelectorAll('.tool-category').forEach(catGroup => {
    const visiblePhases = [...catGroup.querySelectorAll('.tool-phase-group')]
      .some(g => g.style.display !== 'none');
    catGroup.style.display = visiblePhases ? '' : 'none';
  });

  updateStats(visibleTotal);
}

/* ─── Filter chips ───────────────────────────────────────────── */

function initFilterChips() {
  document.querySelectorAll('.filter-chips').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      // Toggle active on the clicked chip; deactivate siblings
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterType = group.dataset.filterType;
      const value = chip.dataset.value;
      if (filterType in filters) {
        filters[filterType] = value;
      }

      applyFiltersAndSearch();
    });
  });
}

/* ─── Search input ───────────────────────────────────────────── */

function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    searchQuery = input.value;
    applyFiltersAndSearch();
  });
}

/* ─── Populate dynamic chips ─────────────────────────────────── */

function populateDynamicChips(allTools) {
  const languages = [...new Set(
    allTools.map(t => t.language).filter(Boolean).sort()
  )];
  const orgs = [...new Set(
    allTools.map(t => t.org).filter(Boolean).sort()
  )];

  const langContainer = document.getElementById('lang-chips');
  if (langContainer) {
    languages.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.value = lang;
      btn.textContent = lang;
      langContainer.appendChild(btn);
    });
  }

  const orgContainer = document.getElementById('org-chips');
  if (orgContainer) {
    orgs.forEach(org => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.value = org;
      btn.textContent = org;
      orgContainer.appendChild(btn);
    });
  }
}

/* ─── Stats bar ─────────────────────────────────────────────── */

function updateStats(visibleTools) {
  const el = document.getElementById('toolkit-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="toolkit-stat">
      <span class="toolkit-stat-value" id="stat-tools">${visibleTools}</span>
      <span class="toolkit-stat-label">TOOLS DOCUMENTED</span>
    </div>
    <div class="toolkit-stat">
      <span class="toolkit-stat-value">2</span>
      <span class="toolkit-stat-label">CATEGORIES</span>
    </div>
    <div class="toolkit-stat">
      <span class="toolkit-stat-value">3</span>
      <span class="toolkit-stat-label">PHASES</span>
    </div>
  `;
}

/* ─── Mobile TOC ────────────────────────────────────────────── */

function buildMobileToc() {
  const list = document.getElementById('mobile-toc-list');
  if (!list) return;
  list.innerHTML = '';

  let lastCategory = null;

  document.querySelectorAll('.tool-phase-group').forEach(group => {
    const categoryName = group.dataset.category || '';
    const groupTitle   = group.querySelector('.group-title');
    if (!groupTitle) return;

    // Emit a non-clickable category label whenever the category changes
    if (categoryName && categoryName !== lastCategory) {
      const labelLi = document.createElement('li');
      labelLi.className = 'mobile-toc-category-label';
      labelLi.textContent = categoryName;
      list.appendChild(labelLi);
      lastCategory = categoryName;
    }

    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = '#' + group.id;
    a.textContent = groupTitle.textContent;

    a.addEventListener('click', e => {
      e.preventDefault();

      // Close drawer
      const drawer  = document.getElementById('mobile-toc-drawer');
      const trigger = document.getElementById('mobile-toc-trigger');
      if (drawer)  { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); trigger.textContent = 'SECTIONS ▾'; }

      // Find target group
      const target = document.getElementById(group.id);
      if (!target) return;

      // Expand the group if collapsed
      const groupBtn = target.querySelector(':scope > .group-toggle-btn');
      if (groupBtn && groupBtn.getAttribute('aria-expanded') === 'false') {
        setGroupOpen(groupBtn, true);
      }

      // Also expand the parent category if collapsed
      const parentCategory = target.closest('.tool-category');
      if (parentCategory) {
        const catBtn = parentCategory.querySelector(':scope > .category-toggle-btn');
        if (catBtn && catBtn.getAttribute('aria-expanded') === 'false') {
          setGroupOpen(catBtn, true);
        }
      }

      // After expanding (transitions are 0.3s), scroll
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 320);
    });

    li.appendChild(a);
    list.appendChild(li);
  });
}

function initMobileToc() {
  const trigger = document.getElementById('mobile-toc-trigger');
  const drawer  = document.getElementById('mobile-toc-drawer');
  if (!trigger || !drawer) return;

  trigger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));
    trigger.textContent = isOpen ? 'SECTIONS ▴' : 'SECTIONS ▾';
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#mobile-toc') && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      trigger.textContent = 'SECTIONS ▾';
    }
  });
}

/* ─── Main loader ───────────────────────────────────────────── */

async function loadToolkit() {
  const sectionsEl = document.getElementById('toolkit-sections');
  if (!sectionsEl) return;

  sectionsEl.innerHTML = `<p class="toolkit-loading">// LOADING TOOLKIT DATA...</p>`;

  let manifest;
  try {
    manifest = await fetchJSON(MANIFEST);
  } catch (err) {
    sectionsEl.innerHTML = `<p class="toolkit-error">// ERROR: Could not load toolkit manifest. ${escapeHtml(err.message)}</p>`;
    return;
  }

  const allTools = [];
  const categoryHTMLs = [];

  for (const cat of manifest.categories) {
    try {
      if (cat.type === 'phases') {
        const phaseGroupHTMLs = [];
        for (const phase of cat.phases) {
          try {
            const tools = await fetchTools(phase.manifest);
            // Stamp category onto tools that might not have it
            tools.forEach(t => { if (!t.category) t.category = cat.name; });
            allTools.push(...tools);
            phaseGroupHTMLs.push(buildPhaseGroup(phase.name, tools, cat.name));
          } catch (err) {
            phaseGroupHTMLs.push(
              `<p class="toolkit-error">// ERROR loading ${escapeHtml(phase.name)}: ${escapeHtml(err.message)}</p>`
            );
          }
        }
        categoryHTMLs.push(buildCategoryGroup(cat.name, phaseGroupHTMLs.join('\n')));

      } else if (cat.type === 'flat') {
        const tools = await fetchTools(cat.manifest);
        tools.forEach(t => { if (!t.category) t.category = cat.name; });
        allTools.push(...tools);
        // Flat categories get a single phase group using 'unix' as the phase sentinel
        const phaseGroupHTML = buildPhaseGroup('unix', tools, cat.name);
        // Flat categories have no nested category wrapper — just the phase group
        categoryHTMLs.push(phaseGroupHTML);
      }
    } catch (err) {
      categoryHTMLs.push(
        `<p class="toolkit-error">// ERROR loading ${escapeHtml(cat.name)}: ${escapeHtml(err.message)}</p>`
      );
    }
  }

  sectionsEl.innerHTML = categoryHTMLs.join('\n');

  // After DOM is populated:
  populateDynamicChips(allTools);
  updateStats(allTools.length);
  buildOutline(manifest);
  initCollapsibles(sectionsEl);
  initOutlineObserver();
  initOutlineClicks();
  initFilterChips();
  initSearch();
  buildMobileToc();
  initMobileToc();
}

/* ─── Boot ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', loadToolkit);
