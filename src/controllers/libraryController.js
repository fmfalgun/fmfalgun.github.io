/**
 * libraryController.js
 * Fills the Library page with one card per page listed in the library repo's
 * library.json. Choosing a card opens that page, which is served by the
 * library repo's GitHub Pages site. A page added to library.json shows up
 * here with no change to this repo.
 */

const LIBRARY_BASE = 'https://fmfalgun.github.io/library/';
const MANIFEST_URL = `${LIBRARY_BASE}library.json`;

const grid  = document.getElementById('library-grid');
const count = document.getElementById('library-count');

/**
 * Fetch the library manifest and return its list of pages.
 * Returns null when the request fails or the JSON has no `pages` array,
 * so the caller can show one error message instead of a half-built page.
 */
async function fetchPages() {
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();
    return Array.isArray(manifest.pages) ? manifest.pages : null;
  } catch (err) {
    console.warn(`[library] Failed to fetch ${MANIFEST_URL}:`, err.message);
    return null;
  }
}

/**
 * Build one card (a link to the page) from a manifest entry.
 * Text is set with textContent, never as HTML, because the manifest is
 * data from another repo.
 */
function buildCard(page) {
  const card = document.createElement('a');
  card.className = 'library-card';
  card.href = `${LIBRARY_BASE}${page.file}`;
  card.setAttribute('role', 'listitem');

  const title = document.createElement('div');
  title.className = 'library-card-title';
  title.textContent = page.title;

  const desc = document.createElement('p');
  desc.className = 'library-card-desc';
  desc.textContent = page.description || '';

  const tags = document.createElement('div');
  tags.className = 'library-card-tags';
  (page.tags || []).forEach(label => {
    const tag = document.createElement('span');
    tag.className = 'library-card-tag';
    tag.textContent = label.toUpperCase();
    tags.appendChild(tag);
  });

  card.append(title, desc, tags);
  return card;
}

/**
 * Render the list, or an error message when the manifest could not be loaded.
 */
async function init() {
  const pages = await fetchPages();
  if (!pages) {
    count.textContent = 'UNAVAILABLE';
    grid.innerHTML = '<p class="library-error">The library list could not be loaded. Try again later.</p>';
    return;
  }
  count.textContent = `${pages.length} PAGES`;
  grid.replaceChildren(...pages.map(buildCard));
}

init();
