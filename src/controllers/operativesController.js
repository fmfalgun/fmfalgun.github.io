/**
 * operativesController.js
 * Fetches manifest.json, then fetches each person JSON individually,
 * groups cards by domain, and renders them into collapsible section groups
 * with a sticky outline, search bar, and filter chips.
 *
 * GitHub Pages constraint: static hosting cannot list directory contents,
 * so we rely on manifest.json to know which files exist.
 */

const MANIFEST_URL = 'data/operatives/manifest.json';
const DATA_BASE    = 'data/operatives/';

// Canonical domain order for display
const DOMAIN_ORDER = [
  'DNS & Internet Infrastructure',
  'Certificate Transparency & PKI',
  'Reconnaissance & OSINT Tools',
  'Subdomain Enumeration & ProjectDiscovery',
  'Wordlists & Data Sources',
  'Unix / Systems Foundations',
  'Anonymous / Unknown',
  'Search Engine Hacking & Web Archives',
  'Pentest Tools & Bug Bounty Research',
  'Classic Tools',
];

/**
 * Fetch JSON from a URL, return parsed object or null on error.
 */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[operatives] Failed to fetch ${url}:`, err.message);
    return null;
  }
}

/**
 * Build the HTML string for a single operative card.
 */
function buildCard(person) {
  const handleLine = person.handle
    ? `<div class="operative-handle">[${person.handle}]</div>`
    : '';

  const linksHTML = Object.entries(person.links || {})
    .map(([label, url]) =>
      `<a class="operative-link" href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
    )
    .join('');

  const linksSection = linksHTML
    ? `<div class="operative-links">${linksHTML}</div>`
    : '';

  // Store searchable text as data attributes for fast filtering
  const searchText = [
    person.name || '',
    person.handle || '',
    person.org || '',
    person.why_notable || '',
  ].join(' ').toLowerCase();

  return `
    <article class="operative-card" data-search="${searchText.replace(/"/g, '&quot;')}">
      <div class="operative-card-header">
        <div>
          <div class="operative-name">${person.name}</div>
          ${handleLine}
        </div>
        <div class="operative-era">${person.era || ''}</div>
      </div>
      <div class="operative-org">${person.org || ''}</div>
      <p class="operative-why">${person.why_notable || ''}</p>
      ${linksSection}
    </article>
  `.trim();
}

/**
 * Slugify a domain name into a valid HTML id.
 */
function domainToId(domain) {
  return 'group-' + domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Render all domain groups as collapsible sections and build the outline.
 */
function renderGroups(sectionsContainer, outlineList, people) {
  // Group by domain
  const groups = {};
  for (const person of people) {
    const domain = person.domain || 'Uncategorised';
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(person);
  }

  // Sort groups by canonical order, then alphabetically for any extras
  const domainKeys = [
    ...DOMAIN_ORDER.filter(d => groups[d]),
    ...Object.keys(groups).filter(d => !DOMAIN_ORDER.includes(d)).sort(),
  ];

  let sectionsHTML = '';
  let outlineHTML = '';

  for (const domain of domainKeys) {
    const cards = groups[domain];
    const id = domainToId(domain);

    sectionsHTML += `
      <section class="operative-group" id="${id}" data-domain="${domain}">
        <button class="group-toggle-btn" aria-expanded="true">
          <span class="group-title">${domain}</span>
          <span class="group-count badge">${cards.length}</span>
          <span class="toggle-arrow">&#9662;</span>
        </button>
        <div class="group-body">
          <div class="operatives-grid">
            ${cards.map(buildCard).join('\n')}
          </div>
        </div>
      </section>
    `.trim();

    outlineHTML += `
      <li class="outline-item" data-target="${id}">
        <a href="#${id}">${domain}</a>
      </li>
    `.trim();
  }

  sectionsContainer.innerHTML = sectionsHTML;
  outlineList.innerHTML = outlineHTML;

  return domainKeys;
}

/**
 * Set the max-height of a group-body so the CSS transition works.
 * When expanding we set it to scrollHeight then clear it after transition.
 * When collapsing we set it to scrollHeight first (for animation), then 0.
 */
function expandGroup(btn, body) {
  btn.setAttribute('aria-expanded', 'true');
  body.style.maxHeight = body.scrollHeight + 'px';
  body.addEventListener('transitionend', function onEnd() {
    body.removeEventListener('transitionend', onEnd);
    body.style.maxHeight = ''; // let CSS handle it (unconstrained)
  }, { once: true });
}

function collapseGroup(btn, body) {
  // Pin to current height before animating to 0
  body.style.maxHeight = body.scrollHeight + 'px';
  // Force reflow so the browser registers the starting value
  // eslint-disable-next-line no-unused-expressions
  body.offsetHeight;
  btn.setAttribute('aria-expanded', 'false');
  body.style.maxHeight = '0';
}

/**
 * Toggle a single group open/closed.
 */
function toggleGroup(section) {
  const btn  = section.querySelector('.group-toggle-btn');
  const body = section.querySelector('.group-body');
  if (!btn || !body) return;
  if (btn.getAttribute('aria-expanded') === 'true') {
    collapseGroup(btn, body);
  } else {
    expandGroup(btn, body);
  }
}

/**
 * Ensure a group is expanded (no-op if already open).
 */
function ensureExpanded(section) {
  const btn  = section.querySelector('.group-toggle-btn');
  const body = section.querySelector('.group-body');
  if (!btn || !body) return;
  if (btn.getAttribute('aria-expanded') !== 'true') {
    expandGroup(btn, body);
  }
}

/**
 * Wire up collapsible toggle buttons.
 */
function initToggles(sectionsContainer) {
  sectionsContainer.addEventListener('click', function (e) {
    const btn = e.target.closest('.group-toggle-btn');
    if (!btn) return;
    const section = btn.closest('.operative-group');
    if (section) toggleGroup(section);
  });
}

/**
 * Build filter chips from the domain list and wire up click behaviour.
 */
function initFilterChips(chipsContainer, domainKeys, sectionsContainer, outlineList) {
  // Build chips for each domain
  const domainChipsHTML = domainKeys
    .map(domain => `<button class="chip" data-domain="${domain}">${domain}</button>`)
    .join('');
  // Insert after the ALL chip
  chipsContainer.insertAdjacentHTML('beforeend', domainChipsHTML);

  chipsContainer.addEventListener('click', function (e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    // Update active chip
    chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const selected = chip.dataset.domain;
    const sections = sectionsContainer.querySelectorAll('.operative-group');
    const outlineItems = outlineList.querySelectorAll('.outline-item');

    if (selected === 'all') {
      // Show all groups
      sections.forEach(sec => {
        sec.style.display = '';
      });
      outlineItems.forEach(li => {
        li.style.display = '';
      });
    } else {
      // Show only matching group, hide others
      sections.forEach(sec => {
        if (sec.dataset.domain === selected) {
          sec.style.display = '';
          ensureExpanded(sec);
        } else {
          sec.style.display = 'none';
        }
      });
      outlineItems.forEach(li => {
        const targetId = li.dataset.target;
        const targetSec = sectionsContainer.querySelector(`#${targetId}`);
        li.style.display = (targetSec && targetSec.dataset.domain === selected) ? '' : 'none';
      });
    }
  });
}

/**
 * Wire up real-time search filtering.
 */
function initSearch(searchInput, sectionsContainer, outlineList) {
  searchInput.addEventListener('input', function () {
    const query = searchInput.value.trim().toLowerCase();
    const sections = sectionsContainer.querySelectorAll('.operative-group');
    const outlineItems = outlineList.querySelectorAll('.outline-item');

    sections.forEach(sec => {
      // Skip sections already hidden by filter chips
      if (sec.style.display === 'none') return;

      const cards = sec.querySelectorAll('.operative-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const text = card.dataset.search || '';
        if (!query || text.includes(query)) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      const btn  = sec.querySelector('.group-toggle-btn');
      const body = sec.querySelector('.group-body');

      if (visibleCount === 0) {
        // Auto-collapse groups with no matches
        if (btn && btn.getAttribute('aria-expanded') === 'true') {
          collapseGroup(btn, body);
        }
      } else {
        // Auto-expand groups that have matches
        if (btn && btn.getAttribute('aria-expanded') !== 'true') {
          expandGroup(btn, body);
        }
      }

      // Update badge count
      const badge = sec.querySelector('.group-count');
      if (badge) badge.textContent = visibleCount;
    });
  });
}

/**
 * Wire up the sticky outline: scroll-spy via IntersectionObserver,
 * and click-to-scroll with auto-expand.
 */
function initOutline(sectionsContainer, outlineList) {
  // Click on outline item → smooth scroll + expand
  outlineList.addEventListener('click', function (e) {
    e.preventDefault();
    const link = e.target.closest('a');
    if (!link) return;
    const id = link.getAttribute('href').replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    ensureExpanded(target);

    // After potential expand animation starts, scroll
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  });

  // IntersectionObserver for active outline item
  const items = outlineList.querySelectorAll('.outline-item');
  const idToItem = {};
  items.forEach(li => {
    idToItem[li.dataset.target] = li;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const li = idToItem[entry.target.id];
        if (!li) return;
        if (entry.isIntersecting) {
          items.forEach(i => i.classList.remove('outline-active'));
          li.classList.add('outline-active');
        }
      });
    },
    { threshold: 0.1, rootMargin: '-80px 0px -60% 0px' }
  );

  sectionsContainer.querySelectorAll('.operative-group').forEach(sec => {
    observer.observe(sec);
  });
}

/**
 * Populate #mobile-toc-list from the already-rendered .operative-group elements.
 */
function buildMobileToc() {
  const list = document.getElementById('mobile-toc-list');
  const trigger = document.getElementById('mobile-toc-trigger');
  const drawer  = document.getElementById('mobile-toc-drawer');
  if (!list) return;

  const groups = document.querySelectorAll('.operative-group');
  groups.forEach(group => {
    const domain = group.dataset.domain || group.id;
    const id     = group.id;

    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href        = `#${id}`;
    a.textContent = domain;

    a.addEventListener('click', e => {
      e.preventDefault();

      // Close the drawer
      if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.textContent = 'SECTIONS ▾';
      }

      // Expand the target group if collapsed
      const target = document.getElementById(id);
      if (target) {
        ensureExpanded(target);
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });

    li.appendChild(a);
    list.appendChild(li);
  });
}

/**
 * Wire up the mobile TOC FAB toggle and outside-click close.
 */
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

/**
 * Main entry point — called on DOMContentLoaded.
 */
async function initOperatives() {
  const sectionsContainer = document.getElementById('operatives-sections');
  const outlineList       = document.getElementById('outline-list');
  const chipsContainer    = document.getElementById('filter-chips');
  const searchInput       = document.getElementById('search-input');

  if (!sectionsContainer) return;

  sectionsContainer.innerHTML = '<p class="operatives-loading">LOADING OPERATIVE DOSSIERS...</p>';

  // 1. Fetch manifest
  const manifest = await fetchJSON(MANIFEST_URL);
  if (!manifest || !Array.isArray(manifest)) {
    sectionsContainer.innerHTML = '<p class="operatives-error">// ERROR: manifest.json not found or malformed</p>';
    return;
  }

  // 2. Fetch all person files concurrently
  const results = await Promise.all(
    manifest.map(filename => fetchJSON(`${DATA_BASE}${filename}`))
  );

  // Filter out any nulls (failed fetches)
  const people = results.filter(Boolean);

  if (people.length === 0) {
    sectionsContainer.innerHTML = '<p class="operatives-error">// ERROR: no operative data loaded</p>';
    return;
  }

  // 3. Update the count badge
  const countEl = document.getElementById('operatives-count');
  if (countEl) countEl.textContent = `${people.length} OPERATIVES INDEXED`;

  // 4. Render groups + outline
  const domainKeys = renderGroups(sectionsContainer, outlineList, people);

  // 5. Wire up interactions
  initToggles(sectionsContainer);
  if (chipsContainer) initFilterChips(chipsContainer, domainKeys, sectionsContainer, outlineList);
  if (searchInput)    initSearch(searchInput, sectionsContainer, outlineList);
  if (outlineList)    initOutline(sectionsContainer, outlineList);

  // 6. Mobile TOC
  buildMobileToc();
  initMobileToc();
}

document.addEventListener('DOMContentLoaded', initOperatives);
