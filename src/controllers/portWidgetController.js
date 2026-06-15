const PA_STATIC = 'https://fmfalgun.github.io/port-analyzer/data/ports.json';
const PA_SITE   = 'https://fmfalgun.github.io/port-analyzer';

let cache = null;

async function loadPorts() {
  if (cache) return cache;
  const res = await fetch(PA_STATIC);
  if (!res.ok) throw new Error('fetch failed');
  cache = await res.json();
  return cache;
}

function renderResult(portNum, data) {
  const entry = data[String(portNum)];
  if (!entry) {
    return `<div class="pw-not-found">
      Port ${portNum} is not in the pre-built dataset (${data._meta?.port_count ?? '?'} ports covered).
      <a href="${PA_SITE}?q=${portNum}" target="_blank" rel="noopener noreferrer" class="pw-link">Try full analysis ↗</a>
    </div>`;
  }

  const risk    = (entry.risk_level || 'LOW').toUpperCase();
  const topTech = entry.techniques?.[0];
  const kevStr  = entry.kev_count > 0
    ? `<span class="pw-kev">| KEV: ${entry.kev_count}</span>`
    : '';
  const techStr = topTech
    ? `<div class="pw-technique">${topTech.technique_id} — ${topTech.name}</div>`
    : '';

  return `
    <div class="pw-header">
      <span class="pw-port">:<span class="pw-portnum">${entry.port}</span></span>
      <span class="pw-service">${entry.service_name ?? 'unknown'}</span>
      <span class="pw-risk pw-risk--${risk.toLowerCase()}">${risk}</span>
    </div>
    <div class="pw-stats">
      <span>CVEs: ${entry.cve_count}</span>${kevStr}
    </div>
    ${techStr}
    <a href="${PA_SITE}?q=${entry.port}" target="_blank" rel="noopener noreferrer" class="pw-link">Full analysis on Port Analyzer ↗</a>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const input  = document.getElementById('portfolio-port-input');
  const btn    = document.getElementById('portfolio-port-btn');
  const result = document.getElementById('portfolio-port-result');
  if (!input || !btn || !result) return;

  async function analyze() {
    const raw = input.value.trim();
    const n   = parseInt(raw, 10);
    if (!raw || isNaN(n) || n < 0 || n > 65535) {
      result.innerHTML = '<span class="pw-error">Enter a valid port number (0–65535).</span>';
      result.hidden = false;
      return;
    }
    btn.textContent = '...';
    btn.disabled = true;
    try {
      const data = await loadPorts();
      result.innerHTML = renderResult(n, data);
    } catch {
      result.innerHTML = `<span class="pw-error">Load failed. <a href="${PA_SITE}" target="_blank" class="pw-link">Open Port Analyzer ↗</a></span>`;
    } finally {
      btn.textContent = 'ANALYZE';
      btn.disabled = false;
      result.hidden = false;
    }
  }

  btn.addEventListener('click', analyze);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') analyze(); });
});
