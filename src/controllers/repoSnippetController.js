(function () {

  // ── formatters — one per project, receives the nmap.org.json data ────────────

  function formatCrtsh(d) {
    var s     = d.summary || {};
    var certs = s.total_certs    || d.cert_count || 0;
    var names = s.unique_names   || 0;
    var dir   = s.direct_subdomains || 0;
    var wc    = s.wildcards      || 0;
    var leak  = s.san_leaks      || 0;
    var sep   = '─'.repeat(40);   // ────────...

    var lines = [
      '$ python3 crtsh-recon.py -d nmap.org',
      '[+] ' + certs + ' certs \xb7 ' + names + ' unique names',
      '    direct (' + dir + ')   wildcard (' + wc + ')   leak (' + leak + ')',
      sep,
    ];

    // show up to 5 entries
    var entries = (d.entries || []).slice(0, 5);
    entries.forEach(function (e) {
      var tag  = e.type === 'leak' ? 'SAN leak' : e.type;
      var name = (e.name || '').padEnd(22);
      lines.push('    ' + name + ' [' + tag + ']');
    });

    return lines.join('\n');
  }

  function formatWhois(d) {
    var a      = d.analysis || {};
    var p      = d.parsed   || {};
    var reg    = ((p.registrar || {}).name || '—');
    if (reg.length > 26) reg = reg.slice(0, 24) + '..';
    var dnssec = (p.dnssec || '—').toLowerCase();
    var sigs   = a.signals || [];
    var dSig   = sigs.find(function (s) { return s.field === 'dnssec'; });
    var dNote  = dSig ? '  [' + dSig.level + ']' : '';

    return [
      '$ python3 whois-extracter.py -d nmap.org',
      '  risk_score : ' + (a.risk_score || 0) + ' / 100  [' + (a.risk_level || 'INFO') + ']',
      '  registrar  : ' + reg,
      '  ns_type    : ' + (a.ns_type || '—'),
      '  dnssec     : ' + dnssec + dNote,
    ].join('\n');
  }

  function formatHarvester(d) {
    var emails  = (d.emails  || []).slice(0, 2);
    var sources = (d.sources || []).slice(0, 3).join(' \xb7 ');

    var lines = [
      '$ python3 harvester-importer.py -f results.json',
      '  emails : ' + (d.email_count || 0) +
        '  hosts : ' + (d.host_count  || 0) +
        '  IPs : '   + (d.ip_count    || 0),
      '  sources: ' + (sources || '—'),
    ];
    emails.forEach(function (e) { lines.push('  ' + e); });
    return lines.join('\n');
  }

  function formatWhoisDeep(d) {
    var ip    = d.ip_whois || {};
    var cidr  = ip.cidr || {};
    var asn   = ip.asn ? 'AS' + ip.asn : '—';
    var org   = ip.org_name || '—';
    if (org.length > 30) org = org.slice(0, 28) + '..';
    var block = cidr.cidr_notation || '—';
    var size  = cidr.size ? '  (' + cidr.size + ' IPs)' : '';
    var hint  = ip.hosting_hint || '—';

    return [
      '$ python3 whois-deep.py -d nmap.org',
      '  resolved   : ' + (d.resolved_ip || '—'),
      '  rir        : ' + (ip.rir || '—') + '  /  ' + asn,
      '  org        : ' + org,
      '  netblock   : ' + block + size,
      '  hosting    : ' + hint,
    ].join('\n');
  }

  function formatDigRecon(d) {
    var rec   = d.records || {};
    var a     = (rec.a || []);
    var ns    = (rec.ns || []);
    var spf   = d.spf   || {};
    var dmarc = d.dmarc || {};

    return [
      '$ python3 dig-recon.py -d nmap.org',
      '  A       : ' + (a[0] || '—') + (a.length > 1 ? '  (+' + (a.length - 1) + ')' : ''),
      '  NS      : ' + (ns[0] || '—') + (ns.length > 1 ? '  (x' + ns.length + ')' : ''),
      '  SPF     : ' + (spf.raw || 'not found') + '  [' + (spf.all || '—') + ']',
      '  DMARC   : ' + (dmarc.policy ? 'p=' + dmarc.policy + '  pct=' + (dmarc.pct != null ? dmarc.pct : '—') : 'not found'),
      '  spoofable: ' + (d.email_spoofable ? 'YES — ' + (d.spoofable_reason || '') : 'NO — fully protected'),
    ].join('\n');
  }

  function formatSubfinder(d) {
    var srcs = (d.sources   || []).slice(0, 3).join(' \xb7 ');
    var subs = (d.subdomains || []).slice(0, 2);

    var lines = [
      '$ python3 subfinder-recon.py -d nmap.org',
      '  subdomains : ' + (d.subdomain_count || 0) +
        '  wildcards : ' + (d.wildcard_count  || 0),
      '  sources    : ' + (srcs || '—'),
    ];
    subs.forEach(function (s) {
      var tag = (s.sources || []).slice(0, 2).join(', ');
      lines.push('  ' + s.name + '  [' + tag + ']');
    });
    return lines.join('\n');
  }

  function formatGobuster(d) {
    var findings = d.findings || [];
    var s2xx = findings.filter(function (f) { return f.status >= 200 && f.status < 300; });
    var s3xx = findings.filter(function (f) { return f.status >= 300 && f.status < 400; });
    var sample2 = s2xx.slice(0, 3).map(function (f) { return f.path.replace(/^\//, '') || '/'; }).join(', ');
    var sample3 = s3xx.slice(0, 2).map(function (f) { return f.path.replace(/^\//, '') || '/'; }).join(', ');

    return [
      '$ python3 gobuster-recon.py -u ' + (d.url || 'https://nmap.org'),
      '  found   : ' + (d.finding_count || 0) + ' paths',
      '  2xx     : ' + s2xx.length + (sample2 ? '  (' + sample2 + ')' : ''),
      '  3xx     : ' + s3xx.length + (sample3 ? '  (' + sample3 + ')' : ''),
      '  admin   : ' + (d.has_admin ? 'YES ⚠' : 'NO') +
        '   login: ' + (d.has_login ? 'YES ⚠' : 'NO') +
        '   phpMyAdmin: ' + (d.has_phpmyadmin ? 'YES ⚠' : 'NO'),
    ].join('\n');
  }

  function formatWpscan(d) {
    var vulns   = d.vuln_count   || 0;
    var plugins = d.plugin_count || 0;
    var users   = d.user_count   || 0;
    var xmlrpc  = d.xmlrpc_active  ? 'EXPOSED (brute-force risk)' : 'not found';
    var readme  = d.readme_exposed ? 'exposed' : 'hidden';
    var ver     = (d.wp_version || '—') + '  (' + (d.wp_version_status || 'unknown') + ')';

    return [
      '$ python3 wpscan-recon.py -u ' + (d.url || 'https://target.com'),
      '  WP      : ' + ver,
      '  vulns   : ' + vulns + '  plugins: ' + plugins + '  users: ' + users,
      '  xmlrpc  : ' + xmlrpc,
      '  readme  : ' + readme,
    ].join('\n');
  }

  function formatWhatwebRecon(d) {
    var server  = d.server || '—';
    var cms     = d.cms    || 'none';
    var php     = d.php_version || 'none';
    var xmlrpc  = (d.interesting_plugins || []).indexOf('xmlrpc') !== -1 ? 'EXPOSED ⚠' : 'NO';
    var results = d.results || [];
    var first   = results.find(function (r) { return r.http_status >= 200 && r.http_status < 300; }) || results[0] || {};
    var urlLine = first.url
      ? (first.url.replace(/^https?:\/\//, '').slice(0, 20).padEnd(20) +
         '  ' + (first.http_status || '—') +
         '  ' + (first.server || '—') +
         (first.jquery_version ? '  jQuery ' + first.jquery_version : ''))
      : '—';

    return [
      '$ python3 whatweb-recon.py -d ' + (d.domain || 'nmap.org'),
      '  server  : ' + server,
      '  cms     : ' + cms,
      '  php     : ' + php,
      '  xmlrpc  : ' + xmlrpc,
      '  ' + urlLine,
    ].join('\n');
  }

  // ── project registry ─────────────────────────────────────────────────────────

  var BASE = 'https://fmfalgun.github.io/';

  var PROJECTS = [
    {
      id:     'snippet-crtsh-recon',
      url:    BASE + 'crtsh-recon/data/domains/nmap.org.json',
      format: formatCrtsh,
    },
    {
      id:     'snippet-whois-extracter',
      url:    BASE + 'whois-extracter/data/domains/nmap.org.json',
      format: formatWhois,
    },
    {
      id:     'snippet-harvester-importer',
      url:    BASE + 'harvester-importer/data/domains/nmap.org.json',
      format: formatHarvester,
    },
    {
      id:     'snippet-subfinder-recon',
      url:    BASE + 'subfinder-recon/data/domains/nmap.org.json',
      format: formatSubfinder,
    },
    {
      id:     'snippet-whois-deep',
      url:    BASE + 'whois-deep/data/domains/nmap.org.json',
      format: formatWhoisDeep,
    },
    {
      id:     'snippet-dig-recon',
      url:    BASE + 'dig-recon/data/domains/nmap.org.json',
      format: formatDigRecon,
    },
    {
      id:     'snippet-wpscan-recon',
      url:    BASE + 'wpscan-recon/data/sites/wpscan.com.json',
      format: formatWpscan,
    },
    {
      id:     'snippet-gobuster-recon',
      url:    BASE + 'gobuster-recon/data/targets/nmap.org.json',
      format: formatGobuster,
    },
    {
      id:     'snippet-whatweb-recon',
      url:    BASE + 'whatweb-recon/data/domains/nmap.org.json',
      format: formatWhatwebRecon,
    },
  ];

  // ── loader ───────────────────────────────────────────────────────────────────

  function loadSnippet(project) {
    var el = document.getElementById(project.id);
    if (!el) return;

    fetch(project.url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        el.textContent = project.format(data);
      })
      .catch(function () {
        // network error or parse error — keep the hardcoded fallback text as-is
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    PROJECTS.forEach(loadSnippet);
  });

})();
