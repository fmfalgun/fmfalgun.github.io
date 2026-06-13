# Falgun Marothia — Cybersecurity Portfolio

Personal portfolio for **Falgun Marothia**, Project Engineer at CDAC, IoT wireless security researcher.

**Live:** [fmfalgun.github.io](https://fmfalgun.github.io)

---

## Stack

Static HTML + CSS + vanilla JS (ES modules). No build tools, no frameworks — deploys directly via GitHub Pages.

Fonts: `Share Tech Mono` · `Rajdhani` · `Inter` (Google Fonts)

---

## Architecture — MVC

```
portfolio/
├── index.html                   # View shell — all content (SEO-safe static HTML)
├── 404.html                     # Custom 404 page
├── robots.txt
├── sitemap.xml
├── src/
│   ├── models/
│   │   └── data.js              # All content as structured JS exports
│   ├── views/
│   │   ├── hero.js              # Live SYS.TIME HUD clock
│   │   └── projects.js          # Re-exports project data for future filtering
│   └── controllers/
│       ├── navController.js     # Scroll opacity, hamburger, scroll spy
│       └── animationController.js  # Intersection observer fade-ins
├── assets/
│   ├── css/
│   │   ├── base/
│   │   │   ├── variables.css    # Design tokens
│   │   │   └── reset.css        # Global resets
│   │   └── components/
│   │       ├── nav.css
│   │       ├── hero.css
│   │       ├── cards.css        # About, Skills, Projects, Publications
│   │       └── contact.css      # Contact, Footer, responsive
│   └── img/                     # Favicon, profile photo
└── public/
    └── docs/
        └── resume.pdf           # ← ADD YOUR RESUME HERE
```

> Content lives in `index.html` (not JS-rendered) so crawlers, LinkedIn previews, and no-JS users all see the full page.

---

## Deploy to GitHub Pages

1. Create repo named `fmfalgun.github.io`
2. Push all files to `main` branch
3. Settings → Pages → Deploy from branch → main / root

---

## Customisation Checklist

- [ ] Add `resume.pdf` to `public/docs/`
- [ ] Add profile photo to `assets/img/` and wire into `index.html`
- [ ] Add favicon to `assets/img/favicon.ico` and update `<link rel="icon">` in `index.html`
- [ ] Update Open Graph image URL in `index.html` when a preview image is ready
- [ ] Add GitHub repo links to project cards in `index.html` once repos are public
- [ ] Update `sitemap.xml` lastmod date after major content changes

---

*Built for purpose. Not for decoration.*
