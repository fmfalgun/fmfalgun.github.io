/**
 * operativesController.js
 * Fetches manifest.json, then fetches each person JSON individually,
 * groups cards by domain, and renders them into #operatives-grid.
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

  return `
    <article class="operative-card">
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
 * Render all people into the grid, grouped by domain.
 */
function renderGrid(container, people) {
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

  let html = '';
  let domainIndex = 0;
  for (const domain of domainKeys) {
    const cards = groups[domain];
    domainIndex++;
    html += `
      <div class="domain-group">
        <div class="domain-header">
          <span class="domain-header-label">[${String(domainIndex).padStart(2, '0')}]</span>
          <span class="domain-header-title">${domain}</span>
          <span class="domain-header-count">${cards.length} operative${cards.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="operatives-grid">
          ${cards.map(buildCard).join('\n')}
        </div>
      </div>
    `.trim();
  }

  container.innerHTML = html;
}

/**
 * Main entry point — called on DOMContentLoaded.
 */
async function initOperatives() {
  const container = document.getElementById('operatives-grid');
  if (!container) return;

  container.innerHTML = '<p class="operatives-loading">LOADING OPERATIVE DOSSIERS...</p>';

  // 1. Fetch manifest
  const manifest = await fetchJSON(MANIFEST_URL);
  if (!manifest || !Array.isArray(manifest)) {
    container.innerHTML = '<p class="operatives-error">// ERROR: manifest.json not found or malformed</p>';
    return;
  }

  // 2. Fetch all person files concurrently
  const results = await Promise.all(
    manifest.map(filename => fetchJSON(`${DATA_BASE}${filename}`))
  );

  // Filter out any nulls (failed fetches)
  const people = results.filter(Boolean);

  if (people.length === 0) {
    container.innerHTML = '<p class="operatives-error">// ERROR: no operative data loaded</p>';
    return;
  }

  // 3. Update the count badge
  const countEl = document.getElementById('operatives-count');
  if (countEl) countEl.textContent = `${people.length} OPERATIVES INDEXED`;

  // 4. Render
  renderGrid(container, people);
}

document.addEventListener('DOMContentLoaded', initOperatives);
