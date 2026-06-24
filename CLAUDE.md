# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Static HTML + CSS + vanilla JS (ES modules). No build step, no package manager, no framework. Deploys directly from `main` to GitHub Pages at `fmfalgun.github.io`.

## Serving locally

Open any HTML file directly in a browser, or use any static server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

ES modules (`type="module"`) require a server — `file://` will fail with CORS errors for those scripts.

## Architecture

Three pages: `index.html` (home), `operatives.html`, `toolkit.html`.

Content in `index.html` is **static HTML** (not JS-rendered) — this is intentional for SEO and no-JS users. JS enriches the page after load.

**MVC split in `src/`:**

| Layer | Files |
|-------|-------|
| Models | `src/models/data.js` — structured content exports |
| Views | `src/views/hero.js` (live clock), `src/views/projects.js` |
| Controllers | `src/controllers/` — one file per behaviour |

**Controllers on `index.html`:**
- `navController.js` — scroll opacity, hamburger toggle, scroll spy
- `animationController.js` — IntersectionObserver fade-ins
- `reconController.js` — passive recon section; fetches visitor IP via `ipapi.co`, then writes the full fingerprint payload to Firebase Firestore (`portfolio-recon` project)
- `homeOutlineController.js` — right-side sticky section navigator
- `portWidgetController.js` — port analyzer widget; fetches from the sibling `port-analyzer` GitHub Pages site's static JSON
- `repoSnippetController.js` — live `<pre>` snippets; fetches `nmap.org.json` from each sibling recon repo's `data/domains/` path and formats it with per-project formatters

`portWidgetController.js` and `repoSnippetController.js` are loaded as plain `<script>` (not `type="module"`); all others use `type="module"`.

## Data-driven pages

### OPERATIVES (`data/operatives/`)

One JSON per person + `manifest.json` (array of filenames). `operativesController.js` reads the manifest, fetches each file, and groups cards by `domain` field. To add a person: create the JSON and add its filename to `manifest.json`.

### TOOLKIT (`data/toolkit/`)

Two-level manifest system. Top-level `manifest.json` lists categories with a `type` of `phases` or `flat`. Each phase/flat directory has its own `manifest.json` (plain filename array). Tool JSON files live inside those directories. To add a tool: create the JSON and add to the right sub-manifest.

## CSS

Design tokens live in `assets/css/base/variables.css`. Component styles are split into `assets/css/components/`. The terminal/hacker aesthetic uses `Share Tech Mono` for monospace elements and CSS variables `--color-accent`, `--bg-primary`, etc.

## External dependencies

All loaded from CDNs — no local install needed:
- Google Fonts (Share Tech Mono, Rajdhani, Inter)
- Firebase JS SDK v10 from `gstatic.com` (used only in `reconController.js`)

Live data comes from sibling GitHub Pages repos under `https://fmfalgun.github.io/<repo-name>/data/`. Snippets fall back silently to hardcoded text if the fetch fails.
