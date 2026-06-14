/**
 * reconController.js
 * Passive browser fingerprint recon — collects everything JS can see
 * and renders it into #recon-grid as labeled data blocks.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function naSpan() {
  const s = el('span', 'recon-na');
  s.textContent = 'UNAVAILABLE';
  return s;
}

function loadingSpan() {
  const s = el('span', 'recon-loading');
  s.textContent = 'FETCHING...';
  return s;
}

function valueSpan(text) {
  const s = el('span', 'recon-value');
  s.textContent = String(text);
  return s;
}

/** Build a single key/value row. valueNode may be a string or a DOM node. */
function makeRow(key, valueNode) {
  const row = el('div', 'recon-row');
  const k = el('span', 'recon-key', key);
  row.appendChild(k);
  if (typeof valueNode === 'string' || typeof valueNode === 'number') {
    row.appendChild(valueSpan(valueNode));
  } else {
    row.appendChild(valueNode);
  }
  return row;
}

/** Build a complete block with a label and an array of [key, value] pairs. */
function makeBlock(label, rows) {
  const block = el('div', 'recon-block');
  const lbl = el('div', 'recon-block-label', '// ' + label);
  block.appendChild(lbl);
  for (const [key, val] of rows) {
    block.appendChild(makeRow(key, val));
  }
  return block;
}

/** djb2 hash → short hex fingerprint */
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep 32-bit unsigned
  }
  return h.toString(16).padStart(8, '0');
}

/** Format minutes offset → ±HH:MM */
function fmtOffset(mins) {
  const sign = mins <= 0 ? '+' : '-';
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

/* ------------------------------------------------------------------ */
/* GROUP 2 — Browser parsing                                            */
/* ------------------------------------------------------------------ */

function parseBrowser(ua) {
  const tests = [
    { name: 'Edge',    re: /Edg\/(\d+[\.\d]*)/ },
    { name: 'Opera',   re: /OPR\/(\d+[\.\d]*)/ },
    { name: 'Chrome',  re: /Chrome\/(\d+[\.\d]*)/ },
    { name: 'Firefox', re: /Firefox\/(\d+[\.\d]*)/ },
    { name: 'Safari',  re: /Version\/(\d+[\.\d]*).*Safari/ },
  ];
  for (const t of tests) {
    const m = ua.match(t.re);
    if (m) return { name: t.name, version: m[1] };
  }
  return { name: 'UNKNOWN', version: '?' };
}

function parseEngine(ua) {
  if (/Gecko\/\d/.test(ua) && !/like Gecko/.test(ua)) return 'Gecko';
  if (/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) return 'WebKit';
  if (/Chrome|Chromium/.test(ua)) return 'Blink';
  if (/Gecko/.test(ua)) return 'Gecko';
  return 'UNKNOWN';
}

function parseOS(ua) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android (\d+[\.\d]*)/.test(ua)) return 'Android ' + ua.match(/Android (\d+[\.\d]*)/)[1];
  if (/iPhone OS ([\d_]+)/.test(ua)) return 'iOS ' + ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g, '.');
  if (/iPad.*OS ([\d_]+)/.test(ua)) return 'iPadOS ' + ua.match(/iPad.*OS ([\d_]+)/)[1].replace(/_/g, '.');
  if (/Mac OS X ([\d_]+)/.test(ua)) return 'macOS ' + ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g, '.');
  if (/Linux/.test(ua)) return 'Linux';
  return 'UNKNOWN';
}

/* ------------------------------------------------------------------ */
/* GROUP 5 — WebGL                                                      */
/* ------------------------------------------------------------------ */

function getWebGL() {
  try {
    const c = document.createElement('canvas');
    let gl = c.getContext('webgl2');
    const ver = gl ? 'WebGL 2' : 'WebGL 1';
    if (!gl) gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { renderer: null, vendor: null, version: 'UNAVAILABLE', maxTex: null };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    const vendor   = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   : null;
    const maxTex   = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    return { renderer, vendor, version: ver, maxTex };
  } catch (_) {
    return { renderer: null, vendor: null, version: null, maxTex: null };
  }
}

/* ------------------------------------------------------------------ */
/* GROUP 10 — Canvas fingerprint                                        */
/* ------------------------------------------------------------------ */

function canvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = '#0D0F0A';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#D4882A';
    ctx.fillText('FM//SEC recon v1', 2, 2);
    ctx.fillStyle = '#3D4A3E';
    ctx.beginPath();
    ctx.arc(170, 25, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E8E4D9';
    ctx.fillText('★', 163, 17);
    const data = c.toDataURL();
    return djb2(data);
  } catch (_) {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main render                                                          */
/* ------------------------------------------------------------------ */

async function runRecon() {
  const grid = document.getElementById('recon-grid');
  if (!grid) return;

  // Clear placeholder
  grid.innerHTML = '';

  const ua = navigator.userAgent;
  const browser = parseBrowser(ua);
  const engine  = parseEngine(ua);
  const os      = parseOS(ua);
  const webgl   = getWebGL();
  const conn    = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isMobile = /Mobi|Android/i.test(ua);
  const isTablet = !isMobile && navigator.maxTouchPoints > 1 && window.innerWidth < 1200;
  const deviceType = isMobile ? 'MOBILE' : isTablet ? 'TABLET' : 'DESKTOP';

  /* ---------- Local storage test ---------- */
  function storageAvail(type) {
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return 'YES'; }
    catch (_) { return 'NO'; }
  }
  const lsAvail = (() => {
    try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return 'YES'; } catch(_) { return 'NO'; }
  })();
  const ssAvail = (() => {
    try { sessionStorage.setItem('__t','1'); sessionStorage.removeItem('__t'); return 'YES'; } catch(_) { return 'NO'; }
  })();

  /* ---------- PDF viewer ---------- */
  let pdfViewer = 'UNAVAILABLE';
  if (typeof navigator.pdfViewerEnabled !== 'undefined') {
    pdfViewer = navigator.pdfViewerEnabled ? 'YES' : 'NO';
  } else {
    const plugins = Array.from(navigator.plugins || []);
    pdfViewer = plugins.some(p => /pdf/i.test(p.name)) ? 'YES (PLUGIN)' : 'NO';
  }

  /* ---------- Page load time ---------- */
  let loadTime = naSpan();
  try {
    const pt = performance.timing;
    if (pt && pt.loadEventEnd && pt.navigationStart) {
      const ms = pt.loadEventEnd - pt.navigationStart;
      if (ms > 0) loadTime = ms + ' ms';
    }
  } catch(_) {}

  /* ---------- Canvas fingerprint ---------- */
  const cfp = canvasFingerprint();

  /* ---------- UTC offset ---------- */
  const utcOffset = fmtOffset(new Date().getTimezoneOffset());

  /* ---------- Local time ---------- */
  const localTime = new Date().toLocaleString(navigator.language, { hour12: false });

  /* ---------- Color scheme / media ---------- */
  const colorScheme   = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'YES' : 'NO';
  const highContrast  = window.matchMedia('(prefers-contrast: more)').matches ? 'MORE' :
                        window.matchMedia('(prefers-contrast: less)').matches ? 'LESS' : 'NO PREFERENCE';

  /* ---------- Screen orientation ---------- */
  let orientation = naSpan();
  try {
    if (screen.orientation && screen.orientation.type) {
      orientation = screen.orientation.type;
    }
  } catch(_) {}

  /* ---------- Java ---------- */
  let javaEnabled = 'NO';
  try { javaEnabled = navigator.javaEnabled() ? 'YES' : 'NO'; } catch(_) {}

  /* ============================================================ */
  /* GROUP 1 — Network/IP: render with loading placeholders first */
  /* ============================================================ */

  // We render IP block with loading spans then fill them in after fetch
  const ipKeys = ['IP ADDRESS','CITY','REGION','COUNTRY','ISP / ORG','LATITUDE','LONGITUDE','ASN','TIMEZONE (IP)'];
  const ipValueSpans = {};
  const ipRows = ipKeys.map(k => {
    const span = loadingSpan();
    ipValueSpans[k] = span;
    return [k, span];
  });
  const ipBlock = makeBlock('NETWORK / LOCATION', ipRows);
  grid.appendChild(ipBlock);

  /* ==================== */
  /* GROUP 2 — Browser    */
  /* ==================== */
  grid.appendChild(makeBlock('BROWSER', [
    ['USER AGENT',         ua],
    ['BROWSER',           `${browser.name} ${browser.version}`],
    ['ENGINE',            engine],
    ['COOKIES ENABLED',   navigator.cookieEnabled ? 'YES' : 'NO'],
    ['DO NOT TRACK',      navigator.doNotTrack !== null && navigator.doNotTrack !== undefined ? String(navigator.doNotTrack) : naSpan()],
    ['LOCAL STORAGE',     lsAvail],
    ['SESSION STORAGE',   ssAvail],
    ['PDF VIEWER',        pdfViewer],
  ]));

  /* ====================== */
  /* GROUP 3 — OS / Device  */
  /* ====================== */
  grid.appendChild(makeBlock('OS / DEVICE', [
    ['OPERATING SYSTEM',  os],
    ['PLATFORM',          navigator.platform || naSpan()],
    ['CPU CORES',         navigator.hardwareConcurrency != null ? String(navigator.hardwareConcurrency) : naSpan()],
    ['DEVICE MEMORY',     navigator.deviceMemory != null ? navigator.deviceMemory + ' GB (approx)' : naSpan()],
    ['TOUCH SUPPORT',     navigator.maxTouchPoints > 0 ? `YES (${navigator.maxTouchPoints} points)` : 'NO'],
    ['DEVICE TYPE',       deviceType],
  ]));

  /* ==================== */
  /* GROUP 4 — Screen     */
  /* ==================== */
  grid.appendChild(makeBlock('SCREEN', [
    ['RESOLUTION',        `${screen.width}×${screen.height}`],
    ['AVAIL RESOLUTION',  `${screen.availWidth}×${screen.availHeight}`],
    ['VIEWPORT',          `${window.innerWidth}×${window.innerHeight}`],
    ['COLOR DEPTH',       `${screen.colorDepth} bit`],
    ['PIXEL RATIO',       `${window.devicePixelRatio}x`],
    ['ORIENTATION',       orientation],
  ]));

  /* ==================== */
  /* GROUP 5 — WebGL/GPU  */
  /* ==================== */
  grid.appendChild(makeBlock('GRAPHICS (WebGL)', [
    ['GPU RENDERER',      webgl.renderer || naSpan()],
    ['GPU VENDOR',        webgl.vendor   || naSpan()],
    ['WEBGL VERSION',     webgl.version  || naSpan()],
    ['MAX TEXTURE SIZE',  webgl.maxTex != null ? String(webgl.maxTex) : naSpan()],
  ]));

  /* ==================== */
  /* GROUP 6 — Network    */
  /* ==================== */
  grid.appendChild(makeBlock('NETWORK (CLIENT)', [
    ['CONNECTION TYPE',   conn?.effectiveType   || naSpan()],
    ['DOWNLINK EST.',     conn?.downlink != null ? conn.downlink + ' Mbps' : naSpan()],
    ['SAVE DATA MODE',    conn?.saveData != null ? (conn.saveData ? 'ON' : 'OFF') : naSpan()],
    ['ONLINE STATUS',     navigator.onLine ? 'ONLINE' : 'OFFLINE'],
  ]));

  /* ========================= */
  /* GROUP 7 — Locale / Time   */
  /* ========================= */
  grid.appendChild(makeBlock('LOCALE / TIME', [
    ['BROWSER LANGUAGE',  navigator.language],
    ['ALL LANGUAGES',     (navigator.languages || [navigator.language]).join(', ')],
    ['TIMEZONE',          Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['UTC OFFSET',        utcOffset],
    ['LOCAL TIME',        localTime],
  ]));

  /* ========================= */
  /* GROUP 8 — Preferences     */
  /* ========================= */
  grid.appendChild(makeBlock('PREFERENCES', [
    ['COLOR SCHEME',      colorScheme],
    ['REDUCED MOTION',    reducedMotion],
    ['HIGH CONTRAST',     highContrast],
  ]));

  /* ==================== */
  /* GROUP 9 — Battery    */
  /* ==================== */
  const battBlock = makeBlock('BATTERY', []);
  grid.appendChild(battBlock);

  if (typeof navigator.getBattery === 'function') {
    // Render loading rows
    const battKeys = ['LEVEL','CHARGING','TIME TO FULL','TIME TO DISCHARGE'];
    const battSpans = {};
    for (const k of battKeys) {
      const span = loadingSpan();
      battSpans[k] = span;
      battBlock.appendChild(makeRow(k, span));
    }
    navigator.getBattery().then(bat => {
      battSpans['LEVEL'].className = 'recon-value';
      battSpans['LEVEL'].textContent = Math.round(bat.level * 100) + '%';
      battSpans['CHARGING'].className = 'recon-value';
      battSpans['CHARGING'].textContent = bat.charging ? 'YES' : 'NO';
      battSpans['TIME TO FULL'].className = 'recon-value';
      battSpans['TIME TO FULL'].textContent = bat.charging && bat.chargingTime !== Infinity
        ? Math.round(bat.chargingTime / 60) + ' min'
        : bat.chargingTime === Infinity ? 'N/A' : 'NOT CHARGING';
      battSpans['TIME TO DISCHARGE'].className = 'recon-value';
      battSpans['TIME TO DISCHARGE'].textContent = !bat.charging && bat.dischargingTime !== Infinity
        ? Math.round(bat.dischargingTime / 60) + ' min'
        : 'N/A';
    }).catch(() => {
      for (const k of battKeys) {
        battSpans[k].className = 'recon-na';
        battSpans[k].textContent = 'UNAVAILABLE';
      }
    });
  } else {
    const lbl = battBlock.querySelector('.recon-block-label');
    const row = makeRow('BATTERY API', naSpan());
    battBlock.appendChild(row);
  }

  /* ==================== */
  /* GROUP 10 — Misc      */
  /* ==================== */
  grid.appendChild(makeBlock('MISC / FINGERPRINT', [
    ['REFERRER',          document.referrer || 'DIRECT'],
    ['PAGE LOAD TIME',    loadTime],
    ['PLUGINS COUNT',     String(navigator.plugins.length)],
    ['CANVAS FINGERPRINT',cfp || naSpan()],
    ['JAVA ENABLED',      javaEnabled],
    ['CPU THREADS',       navigator.hardwareConcurrency != null ? String(navigator.hardwareConcurrency) : naSpan()],
  ]));

  /* ============================================================ */
  /* IP fetch — populate GROUP 1 rows after async resolve        */
  /* ============================================================ */

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    const d = await res.json();

    const fill = (key, val) => {
      const span = ipValueSpans[key];
      span.className = val ? 'recon-value' : 'recon-na';
      span.textContent = val || 'UNAVAILABLE';
    };

    fill('IP ADDRESS',   d.ip);
    fill('CITY',         d.city);
    fill('REGION',       d.region);
    fill('COUNTRY',      d.country_name ? `${d.country_name} (${d.country_code})` : d.country_code);
    fill('ISP / ORG',    d.org);
    fill('LATITUDE',     d.latitude != null ? String(d.latitude) : null);
    fill('LONGITUDE',    d.longitude != null ? String(d.longitude) : null);
    fill('ASN',          d.asn);
    fill('TIMEZONE (IP)',d.timezone);
  } catch (_) {
    for (const key of ipKeys) {
      const span = ipValueSpans[key];
      span.className = 'recon-na';
      span.textContent = 'REQUEST BLOCKED';
    }
  }
}

document.addEventListener('DOMContentLoaded', runRecon);
