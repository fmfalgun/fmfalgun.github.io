# TOOLKIT — Data Directory

Tools studied in depth during web-vapt training, organised by category and phase. Cards on `toolkit.html` are loaded dynamically from these JSON files.

## File structure

```
toolkit/
  manifest.json                          ← top-level: lists all categories + their manifest paths
  hacking-tools/
    phase1-reconnaissance/
      manifest.json
      subfinder.json
      whois.json
      ...
    phase2-scanning/
      manifest.json
      nmap.json
      whatweb.json
  unix-tools/
    manifest.json
    wc.json
    ssh-sftp.json
```

## Top-level `manifest.json` format

```json
{
  "categories": [
    {
      "name": "Hacking Tools",
      "type": "phases",
      "phases": [
        { "name": "Phase 1 — Reconnaissance", "manifest": "data/toolkit/hacking-tools/phase1-reconnaissance/manifest.json" },
        { "name": "Phase 2 — Scanning & Enumeration", "manifest": "data/toolkit/hacking-tools/phase2-scanning/manifest.json" }
      ]
    },
    {
      "name": "Unix Tools",
      "type": "flat",
      "manifest": "data/toolkit/unix-tools/manifest.json"
    }
  ]
}
```

## Per-directory `manifest.json` format

Plain array of filenames:
```json
["subfinder.json", "whois.json", "dig.json"]
```

## Tool JSON format

```json
{
  "name": "subfinder",
  "purpose": "Passive subdomain enumeration via public sources",
  "author": "Bhomesh Koli (Ice3man543)",
  "org": "ProjectDiscovery",
  "year": "2018",
  "language": "Go",
  "phase": "Phase 1 — Reconnaissance",
  "category": "Hacking Tools",
  "why_notable": "Concise paragraph on significance.",
  "links": {
    "GitHub": "https://github.com/projectdiscovery/subfinder"
  }
}
```

## How to add a new tool

1. Create `<tool-name>.json` in the correct phase/type subdirectory
2. Add `"<tool-name>.json"` to the `manifest.json` in that same subdirectory

To add a new phase: add its entry to `data/toolkit/manifest.json` under the relevant category, create the subdirectory, and add a `manifest.json` inside it.

## Phase assignments

| Tool | Directory |
|------|-----------|
| whois, theHarvester, dig, subfinder, crt.sh, dnsdumpster, fierce, amass, httprobe, gau, waybackurls, google-dorks, seclists, assetnote | `hacking-tools/phase1-reconnaissance/` |
| nmap, whatweb | `hacking-tools/phase2-scanning/` |
| wc, ssh-sftp | `unix-tools/` |

## Source

Tool history sourced from `/home/fmf/Projects/web-vapt/history/tools/` and `/home/fmf/Projects/web-vapt/history/unix-tools/`.
