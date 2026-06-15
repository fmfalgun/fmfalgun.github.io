const navbar   = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

function closeMenu() {
  navLinks.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.querySelectorAll('span')[0].style.transform = '';
  hamburger.querySelectorAll('span')[1].style.opacity  = '';
  hamburger.querySelectorAll('span')[2].style.transform = '';
}

window.addEventListener('scroll', () => {
  navbar.style.background = window.scrollY > 50
    ? 'rgba(13,15,10,0.97)'
    : 'rgba(13,15,10,0.85)';
}, { passive: true });

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.querySelectorAll('span')[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
  hamburger.querySelectorAll('span')[1].style.opacity  = open ? '0' : '1';
  hamburger.querySelectorAll('span')[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
});

navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('click', e => {
  if (!navbar.contains(e.target) && navLinks.classList.contains('open')) closeMenu();
});
