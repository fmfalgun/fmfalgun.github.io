function initTimestamp() {
  const el = document.getElementById('hud-time');
  if (!el) return;

  function tick() {
    el.textContent = new Date().toLocaleTimeString('en-IN', {
      hour12: false,
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' IST';
  }

  tick();
  setInterval(tick, 1000);
}

initTimestamp();
