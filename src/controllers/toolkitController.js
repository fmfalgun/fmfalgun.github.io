/**
 * toolkitController.js
 * Fetches tool data from JSON manifests and renders the toolkit page.
 *
 * Data flow:
 *   data/toolkit/manifest.json
 *     → per-phase or per-category manifest.json  (array of filenames)
 *       → individual tool JSON files
 *
 * GitHub Pages serves static files only — no directory listing.
 * Manifests act as the index so JS knows which files to fetch.
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
    tool.author  ? `<span class="tool-tag tool-tag-author">${escapeHtml(tool.author)}</span>` : '',
    tool.org     ? `<span class="tool-tag tool-tag-org">${escapeHtml(tool.org)}</span>` : '',
    tool.language? `<span class="tool-tag tool-tag-lang">${escapeHtml(tool.language)}</span>` : '',
  ].filter(Boolean).join('');

  return `
    <article class="tool-card" aria-label="${escapeHtml(tool.name)}">
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

function renderPhase(phaseName, tools) {
  return `
    <div class="toolkit-phase">
      <div class="toolkit-phase-header">
        <span class="toolkit-phase-title">// ${escapeHtml(phaseName)}</span>
        <span class="toolkit-phase-count">${tools.length} tool${tools.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="toolkit-grid">
        ${tools.map(renderToolCard).join('\n')}
      </div>
    </div>
  `.trim();
}

function renderCategory(cat, content, idx) {
  const label = `[${String(idx + 1).padStart(2, '0')} // ${cat.name.toUpperCase()}]`;
  return `
    <section class="toolkit-category section">
      <div class="container">
        <div class="toolkit-category-header">
          <div class="toolkit-category-label">${escapeHtml(label)}</div>
          <h2 class="toolkit-category-title">${escapeHtml(cat.name)}</h2>
        </div>
        ${content}
      </div>
    </section>
  `.trim();
}

/* ─── Stats bar ─────────────────────────────────────────────── */

function updateStats(totalTools) {
  const el = document.getElementById('toolkit-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="toolkit-stat">
      <span class="toolkit-stat-value">${totalTools}</span>
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

/* ─── Main loader ───────────────────────────────────────────── */

async function loadToolkit() {
  const root = document.getElementById('toolkit-root');
  if (!root) return;

  root.innerHTML = `<div class="container"><p class="toolkit-loading">// LOADING TOOLKIT DATA...</p></div>`;

  let manifest;
  try {
    manifest = await fetchJSON(MANIFEST);
  } catch (err) {
    root.innerHTML = `<div class="container"><p class="toolkit-error">// ERROR: Could not load toolkit manifest. ${escapeHtml(err.message)}</p></div>`;
    return;
  }

  const categoryHTMLs = [];
  let totalTools = 0;

  for (let i = 0; i < manifest.categories.length; i++) {
    const cat = manifest.categories[i];
    let content = '';

    try {
      if (cat.type === 'phases') {
        const phaseHTMLs = [];
        for (const phase of cat.phases) {
          try {
            const tools = await fetchTools(phase.manifest);
            totalTools += tools.length;
            phaseHTMLs.push(renderPhase(phase.name, tools));
          } catch (err) {
            phaseHTMLs.push(`<p class="toolkit-error">// ERROR loading ${escapeHtml(phase.name)}: ${escapeHtml(err.message)}</p>`);
          }
        }
        content = phaseHTMLs.join('\n');
      } else if (cat.type === 'flat') {
        const tools = await fetchTools(cat.manifest);
        totalTools += tools.length;
        content = `<div class="toolkit-grid">${tools.map(renderToolCard).join('\n')}</div>`;
      }
    } catch (err) {
      content = `<p class="toolkit-error">// ERROR loading ${escapeHtml(cat.name)}: ${escapeHtml(err.message)}</p>`;
    }

    categoryHTMLs.push(renderCategory(cat, content, i));
  }

  root.innerHTML = categoryHTMLs.join('\n');
  updateStats(totalTools);
}

/* ─── Boot ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', loadToolkit);
