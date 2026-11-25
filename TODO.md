# Later work (scoped, not started)

Each item is a separate task. Nothing here is done unless it says so.

## Content
- [ ] Replace the CDAC-specific wording in project and domain texts (Zero Trust project, wireless domain card, `data.js` projects) with per-position attribution; some work was CDAC, most came later. Needs owner input on which is which.
- [ ] Add what you do at SETS (Python/Django backends, nginx + keepalived, WireGuard) to `data/profile.json` as the SETS `summary`, and to About/Skills.
- [ ] Add the ETTIS-2026 (IIT Roorkee) presentation to Publications; the page lists only 2 of the 3 papers on the resume.
- [ ] Move skills, security domains, publications and the repo cards into JSON (`data/`) with the same generator pattern.
- [ ] Keep `falgun_resume.pdf` in sync: the source is `~/Projects/latex/tailored/fm-google-apm.tex` (currently published).

## SEO / correctness (from the review)
- [ ] Add `assets/img/favicon.ico` and `og-preview.png` (both 404 today).
- [ ] Sitemap: add `operatives.html` and `toolkit.html`, refresh `lastmod`.
- [ ] Privacy caption in the Recon section says nothing is stored, but `reconController.js` writes to Firebase (`addDoc`, line ~320). Fix the text or the behaviour.
- [ ] Add `<noscript>` text for the Recon section and the JS-filled pages.
- [ ] `operatives.html`, `toolkit.html`, `library.html` ship empty containers filled by JS; consider prerendering them from library-data (GitHub Action).
- [ ] Meta description on operatives says "26 researchers" while the body has none without JS.
- [ ] Richer structured data (WebSite, ProfilePage, SoftwareSourceCode); decide whether to keep the email in JSON-LD.
- [ ] Check the library shell (`?page=<name>`) returns a proper 404 for unknown pages.

## Other
- [ ] Display problem on the laptop (amdgpu ring timeouts): waiting for a choice between the LTS kernel, fewer KWin effects, or `amdgpu.dcdebugmask=0x10`.
- [ ] GATE/DSA: convert more of `~/Projects/study-notes` into topics and concepts.
