import { initializeApp }                        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp }
                                                from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ------------------------------------------------------------------ */
/* Firebase init                                                        */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey:            'AIzaSyDgSUdm1Bk7dCV-R5VtIPcNAkLAszuN23E',
  authDomain:        'portfolio-recon.firebaseapp.com',
  projectId:         'portfolio-recon',
  storageBucket:     'portfolio-recon.firebasestorage.app',
  messagingSenderId: '696843373400',
  appId:             '1:696843373400:web:3e77aff536db9ffc68f32d',
  measurementId:     'G-SKDLWZHH6J',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ------------------------------------------------------------------ */
/* DOM helpers                                                          */
/* ------------------------------------------------------------------ */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function naSpan()      { return el('span', 'recon-na',      'UNAVAILABLE'); }
function loadingSpan() { return el('span', 'recon-loading', 'FETCHING...'); }
function valueSpan(t)  { return el('span', 'recon-value',   String(t));     }

function makeRow(key, valueNode) {
  const row = el('div', 'recon-row');
  row.appendChild(el('span', 'recon-key', key));
  if (typeof valueNode === 'string' || typeof valueNode === 'number') {
    row.appendChild(valueSpan(valueNode));
  } else {
    row.appendChild(valueNode);
  }
  return row;
}

function makeBlock(label, rows) {
  const block = el('div', 'recon-block');
  block.appendChild(el('div', 'recon-block-label', '// ' + label));
  for (const [key, val] of rows) block.appendChild(makeRow(key, val));
  return block;
}

/* ------------------------------------------------------------------ */
/* Utilities                                                            */
/* ------------------------------------------------------------------ */

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

function fmtOffset(mins) {
  const sign = mins <= 0 ? '+' : '-';
  const abs  = Math.abs(mins);
  return `UTC${sign}${String(Math.floor(abs/60)).padStart(2,'0')}:${String(abs%60).padStart(2,'0')}`;
}

function parseBrowser(ua) {
  const tests = [
    { name: 'Edge',    re: /Edg\/(\d+[\.\d]*)/ },
    { name: 'Opera',   re: /OPR\/(\d+[\.\d]*)/ },
    { name: 'Chrome',  re: /Chrome\/(\d+[\.\d]*)/ },
    { name: 'Firefox', re: /Firefox\/(\d+[\.\d]*)/ },
    { name: 'Safari',  re: /Version\/(\d+[\.\d]*).*Safari/ },
  ];
  for (const t of tests) { const m = ua.match(t.re); if (m) return { name: t.name, version: m[1] }; }
  return { name: 'UNKNOWN', version: '?' };
}

function parseEngine(ua) {
  if (/Gecko\/\d/.test(ua) && !/like Gecko/.test(ua)) return 'Gecko';
  if (/AppleWebKit/.test(ua) && !/Chrome/.test(ua))   return 'WebKit';
  if (/Chrome|Chromium/.test(ua))                      return 'Blink';
  if (/Gecko/.test(ua))                                return 'Gecko';
  return 'UNKNOWN';
}

function parseOS(ua) {
  if (/Windows NT 10/.test(ua))           return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua))         return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua))         return 'Windows 7';
  if (/Windows/.test(ua))                 return 'Windows';
  if (/Android ([\d.]+)/.test(ua))        return 'Android ' + ua.match(/Android ([\d.]+)/)[1];
  if (/iPhone OS ([\d_]+)/.test(ua))      return 'iOS '     + ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g,'.');
  if (/iPad.*OS ([\d_]+)/.test(ua))       return 'iPadOS '  + ua.match(/iPad.*OS ([\d_]+)/)[1].replace(/_/g,'.');
  if (/Mac OS X ([\d_]+)/.test(ua))       return 'macOS '   + ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g,'.');
  if (/Linux/.test(ua))                   return 'Linux';
  return 'UNKNOWN';
}

function getWebGL() {
  try {
    const c  = document.createElement('canvas');
    let gl   = c.getContext('webgl2');
    const ver = gl ? 'WebGL 2' : 'WebGL 1';
    if (!gl) gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { renderer: null, vendor: null, version: 'UNAVAILABLE', maxTex: null };
    const ext      = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    const vendor   = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   : null;
    const maxTex   = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    return { renderer, vendor, version: ver, maxTex };
  } catch (_) { return { renderer: null, vendor: null, version: null, maxTex: null }; }
}

function canvasFingerprint() {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = '#0D0F0A'; ctx.fillRect(0,0,200,50);
    ctx.fillStyle = '#D4882A'; ctx.fillText('FM//SEC recon v1', 2, 2);
    ctx.fillStyle = '#3D4A3E'; ctx.beginPath(); ctx.arc(170,25,15,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#E8E4D9'; ctx.fillText('★', 163, 17);
    return djb2(c.toDataURL());
  } catch (_) { return null; }
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

async function runRecon() {
  const grid = document.getElementById('recon-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const ua         = navigator.userAgent;
  const browser    = parseBrowser(ua);
  const engine     = parseEngine(ua);
  const os         = parseOS(ua);
  const webgl      = getWebGL();
  const conn       = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isMobile   = /Mobi|Android/i.test(ua);
  const isTablet   = !isMobile && navigator.maxTouchPoints > 1 && window.innerWidth < 1200;
  const deviceType = isMobile ? 'MOBILE' : isTablet ? 'TABLET' : 'DESKTOP';

  const lsAvail = (() => { try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return 'YES'; } catch(_){ return 'NO'; } })();
  const ssAvail = (() => { try { sessionStorage.setItem('__t','1'); sessionStorage.removeItem('__t'); return 'YES'; } catch(_){ return 'NO'; } })();

  let pdfViewer = 'UNAVAILABLE';
  if (typeof navigator.pdfViewerEnabled !== 'undefined') {
    pdfViewer = navigator.pdfViewerEnabled ? 'YES' : 'NO';
  } else {
    pdfViewer = Array.from(navigator.plugins||[]).some(p=>/pdf/i.test(p.name)) ? 'YES (PLUGIN)' : 'NO';
  }

  let loadTime = null;
  try {
    const pt = performance.timing;
    if (pt?.loadEventEnd && pt?.navigationStart) {
      const ms = pt.loadEventEnd - pt.navigationStart;
      if (ms > 0) loadTime = ms;
    }
  } catch(_) {}

  const cfp         = canvasFingerprint();
  const utcOffset   = fmtOffset(new Date().getTimezoneOffset());
  const localTime   = new Date().toLocaleString(navigator.language, { hour12: false });
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'YES' : 'NO';
  const highContrast  = window.matchMedia('(prefers-contrast: more)').matches  ? 'MORE' :
                        window.matchMedia('(prefers-contrast: less)').matches  ? 'LESS' : 'NO PREFERENCE';

  let orientation = null;
  try { if (screen.orientation?.type) orientation = screen.orientation.type; } catch(_) {}

  let javaEnabled = 'NO';
  try { javaEnabled = navigator.javaEnabled() ? 'YES' : 'NO'; } catch(_) {}

  /* ---------- GROUP 1: IP — loading placeholders ---------- */
  const ipKeys = ['IP ADDRESS','CITY','REGION','COUNTRY','ISP / ORG','LATITUDE','LONGITUDE','ASN','TIMEZONE (IP)'];
  const ipValueSpans = {};
  const ipBlock = makeBlock('NETWORK / LOCATION', ipKeys.map(k => {
    const s = loadingSpan(); ipValueSpans[k] = s; return [k, s];
  }));
  grid.appendChild(ipBlock);

  /* ---------- GROUP 2: Browser ---------- */
  grid.appendChild(makeBlock('BROWSER', [
    ['USER AGENT',       ua],
    ['BROWSER',          `${browser.name} ${browser.version}`],
    ['ENGINE',           engine],
    ['COOKIES ENABLED',  navigator.cookieEnabled ? 'YES' : 'NO'],
    ['DO NOT TRACK',     navigator.doNotTrack ?? naSpan()],
    ['LOCAL STORAGE',    lsAvail],
    ['SESSION STORAGE',  ssAvail],
    ['PDF VIEWER',       pdfViewer],
  ]));

  /* ---------- GROUP 3: OS/Device ---------- */
  grid.appendChild(makeBlock('OS / DEVICE', [
    ['OPERATING SYSTEM', os],
    ['PLATFORM',         navigator.platform || naSpan()],
    ['CPU CORES',        navigator.hardwareConcurrency != null ? String(navigator.hardwareConcurrency) : naSpan()],
    ['DEVICE MEMORY',    navigator.deviceMemory != null ? navigator.deviceMemory + ' GB (approx)' : naSpan()],
    ['TOUCH SUPPORT',    navigator.maxTouchPoints > 0 ? `YES (${navigator.maxTouchPoints} points)` : 'NO'],
    ['DEVICE TYPE',      deviceType],
  ]));

  /* ---------- GROUP 4: Screen ---------- */
  grid.appendChild(makeBlock('SCREEN', [
    ['RESOLUTION',       `${screen.width}×${screen.height}`],
    ['AVAIL RESOLUTION', `${screen.availWidth}×${screen.availHeight}`],
    ['VIEWPORT',         `${window.innerWidth}×${window.innerHeight}`],
    ['COLOR DEPTH',      `${screen.colorDepth} bit`],
    ['PIXEL RATIO',      `${window.devicePixelRatio}x`],
    ['ORIENTATION',      orientation || naSpan()],
  ]));

  /* ---------- GROUP 5: WebGL ---------- */
  grid.appendChild(makeBlock('GRAPHICS (WebGL)', [
    ['GPU RENDERER',     webgl.renderer || naSpan()],
    ['GPU VENDOR',       webgl.vendor   || naSpan()],
    ['WEBGL VERSION',    webgl.version  || naSpan()],
    ['MAX TEXTURE SIZE', webgl.maxTex != null ? String(webgl.maxTex) : naSpan()],
  ]));

  /* ---------- GROUP 6: Network client ---------- */
  grid.appendChild(makeBlock('NETWORK (CLIENT)', [
    ['CONNECTION TYPE',  conn?.effectiveType              || naSpan()],
    ['DOWNLINK EST.',    conn?.downlink != null ? conn.downlink + ' Mbps' : naSpan()],
    ['SAVE DATA MODE',   conn?.saveData != null ? (conn.saveData ? 'ON' : 'OFF') : naSpan()],
    ['ONLINE STATUS',    navigator.onLine ? 'ONLINE' : 'OFFLINE'],
  ]));

  /* ---------- GROUP 7: Locale ---------- */
  grid.appendChild(makeBlock('LOCALE / TIME', [
    ['BROWSER LANGUAGE', navigator.language],
    ['ALL LANGUAGES',    (navigator.languages || [navigator.language]).join(', ')],
    ['TIMEZONE',         Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['UTC OFFSET',       utcOffset],
    ['LOCAL TIME',       localTime],
  ]));

  /* ---------- GROUP 8: Preferences ---------- */
  grid.appendChild(makeBlock('PREFERENCES', [
    ['COLOR SCHEME',    colorScheme],
    ['REDUCED MOTION',  reducedMotion],
    ['HIGH CONTRAST',   highContrast],
  ]));

  /* ---------- GROUP 9: Battery ---------- */
  const battBlock = makeBlock('BATTERY', []);
  grid.appendChild(battBlock);
  if (typeof navigator.getBattery === 'function') {
    const battKeys = ['LEVEL','CHARGING','TIME TO FULL','TIME TO DISCHARGE'];
    const battSpans = {};
    for (const k of battKeys) { const s = loadingSpan(); battSpans[k] = s; battBlock.appendChild(makeRow(k, s)); }
    navigator.getBattery().then(bat => {
      const set = (k, v) => { battSpans[k].className = 'recon-value'; battSpans[k].textContent = v; };
      set('LEVEL',            Math.round(bat.level * 100) + '%');
      set('CHARGING',         bat.charging ? 'YES' : 'NO');
      set('TIME TO FULL',     bat.charging && bat.chargingTime !== Infinity ? Math.round(bat.chargingTime/60) + ' min' : 'N/A');
      set('TIME TO DISCHARGE',!bat.charging && bat.dischargingTime !== Infinity ? Math.round(bat.dischargingTime/60) + ' min' : 'N/A');
    }).catch(() => { for (const k of battKeys) { battSpans[k].className = 'recon-na'; battSpans[k].textContent = 'UNAVAILABLE'; } });
  } else {
    battBlock.appendChild(makeRow('BATTERY API', naSpan()));
  }

  /* ---------- GROUP 10: Misc / Fingerprint ---------- */
  grid.appendChild(makeBlock('MISC / FINGERPRINT', [
    ['REFERRER',          document.referrer || 'DIRECT'],
    ['PAGE LOAD TIME',    loadTime ? loadTime + ' ms' : naSpan()],
    ['PLUGINS COUNT',     String(navigator.plugins.length)],
    ['CANVAS FINGERPRINT',cfp || naSpan()],
    ['JAVA ENABLED',      javaEnabled],
    ['CPU THREADS',       navigator.hardwareConcurrency != null ? String(navigator.hardwareConcurrency) : naSpan()],
  ]));

  /* ================================================================ */
  /* IP fetch — fill GROUP 1 + save everything to Firestore           */
  /* ================================================================ */

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 3000);
  let ipData       = {};

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    const d = await res.json();
    ipData  = d;

    const fill = (key, val) => {
      const span = ipValueSpans[key];
      span.className   = val ? 'recon-value' : 'recon-na';
      span.textContent = val || 'UNAVAILABLE';
    };
    fill('IP ADDRESS',    d.ip);
    fill('CITY',          d.city);
    fill('REGION',        d.region);
    fill('COUNTRY',       d.country_name ? `${d.country_name} (${d.country_code})` : d.country_code);
    fill('ISP / ORG',     d.org);
    fill('LATITUDE',      d.latitude  != null ? String(d.latitude)  : null);
    fill('LONGITUDE',     d.longitude != null ? String(d.longitude) : null);
    fill('ASN',           d.asn);
    fill('TIMEZONE (IP)', d.timezone);
  } catch (_) {
    clearTimeout(timeout);
    for (const key of ipKeys) { ipValueSpans[key].className = 'recon-na'; ipValueSpans[key].textContent = 'REQUEST BLOCKED'; }
  }

  /* ---------- Save to Firestore ---------- */
  try {
    await addDoc(collection(db, 'visitors'), {
      timestamp: serverTimestamp(),
      // Network / IP
      ip:           ipData.ip           || null,
      city:         ipData.city         || null,
      region:       ipData.region       || null,
      country:      ipData.country_name || null,
      countryCode:  ipData.country_code || null,
      isp:          ipData.org          || null,
      latitude:     ipData.latitude     ?? null,
      longitude:    ipData.longitude    ?? null,
      asn:          ipData.asn          || null,
      timezoneIP:   ipData.timezone     || null,
      // Browser
      userAgent:    ua,
      browser:      `${browser.name} ${browser.version}`,
      engine,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack:   navigator.doNotTrack || null,
      localStorage: lsAvail,
      sessionStorage: ssAvail,
      pdfViewer,
      // OS / Device
      os,
      platform:     navigator.platform  || null,
      cpuCores:     navigator.hardwareConcurrency ?? null,
      deviceMemory: navigator.deviceMemory        ?? null,
      touchPoints:  navigator.maxTouchPoints,
      deviceType,
      // Screen
      screenResolution: `${screen.width}×${screen.height}`,
      availResolution:  `${screen.availWidth}×${screen.availHeight}`,
      viewport:         `${window.innerWidth}×${window.innerHeight}`,
      colorDepth:   screen.colorDepth,
      pixelRatio:   window.devicePixelRatio,
      orientation:  orientation || null,
      // Graphics
      gpuRenderer:  webgl.renderer || null,
      gpuVendor:    webgl.vendor   || null,
      webglVersion: webgl.version  || null,
      maxTextureSize: webgl.maxTex ?? null,
      // Network client
      connectionType: conn?.effectiveType  || null,
      downlink:       conn?.downlink       ?? null,
      saveData:       conn?.saveData       ?? null,
      online:         navigator.onLine,
      // Locale
      language:     navigator.language,
      languages:    (navigator.languages || [navigator.language]).join(', '),
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset,
      // Preferences
      colorScheme,
      reducedMotion,
      highContrast,
      // Fingerprint / Misc
      canvasFingerprint: cfp || null,
      pluginsCount: navigator.plugins.length,
      referrer:     document.referrer || 'DIRECT',
      javaEnabled,
      pageLoadMs:   loadTime || null,
    });
  } catch (err) {
    console.warn('Firestore write failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', runRecon);
