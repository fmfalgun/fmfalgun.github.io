const outlineItems = document.querySelectorAll('.home-outline .outline-item');
const sections = document.querySelectorAll('section[id]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      outlineItems.forEach(item => {
        item.classList.toggle('outline-active', item.dataset.target === entry.target.id);
      });
    }
  });
}, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

sections.forEach(sec => observer.observe(sec));

outlineItems.forEach(item => {
  item.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById(item.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
