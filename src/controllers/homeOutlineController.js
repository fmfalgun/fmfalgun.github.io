const outlineItems = document.querySelectorAll('.home-outline .outline-item');
const sections     = document.querySelectorAll('section[id]');
const heroSection  = document.getElementById('hero');
const homeOutline  = document.getElementById('home-outline');

// Hide desktop outline while hero is in viewport, show once scrolled past it
const heroObserver = new IntersectionObserver(([entry]) => {
  homeOutline.classList.toggle('visible', !entry.isIntersecting);
}, { threshold: 0.1 });
if (heroSection) heroObserver.observe(heroSection);

// Highlight current section in outline as user scrolls
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      outlineItems.forEach(item => {
        item.classList.toggle('outline-active', item.dataset.target === entry.target.id);
      });
    }
  });
}, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

sections.forEach(sec => sectionObserver.observe(sec));

// Smooth scroll on desktop outline click
outlineItems.forEach(item => {
  item.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById(item.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Mobile TOC ──
const tocTrigger = document.getElementById('mobile-toc-trigger');
const tocDrawer  = document.getElementById('mobile-toc-drawer');

if (tocTrigger && tocDrawer) {
  tocTrigger.addEventListener('click', () => {
    const isOpen = tocDrawer.classList.toggle('open');
    tocTrigger.setAttribute('aria-expanded', String(isOpen));
    tocDrawer.setAttribute('aria-hidden', String(!isOpen));
    tocTrigger.textContent = isOpen ? 'SECTIONS ▴' : 'SECTIONS ▾';
  });

  // Close drawer after link click and smooth-scroll
  tocDrawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      tocDrawer.classList.remove('open');
      tocTrigger.setAttribute('aria-expanded', 'false');
      tocDrawer.setAttribute('aria-hidden', 'true');
      tocTrigger.textContent = 'SECTIONS ▾';
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#mobile-toc') && tocDrawer.classList.contains('open')) {
      tocDrawer.classList.remove('open');
      tocTrigger.setAttribute('aria-expanded', 'false');
      tocDrawer.setAttribute('aria-hidden', 'true');
      tocTrigger.textContent = 'SECTIONS ▾';
    }
  });
}
