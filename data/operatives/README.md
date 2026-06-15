# OPERATIVES — Data Directory

People who built the tools, protocols, and techniques behind security research. Cards on `operatives.html` are loaded dynamically from these JSON files.

## File structure

```
operatives/
  manifest.json          ← array of filenames; JS reads this to know what exists
  elizabeth-feinler.json
  paul-mockapetris.json
  ... (one file per person, kebab-case filename)
```

## Person JSON format

```json
{
  "name": "Full Name",
  "handle": "alias or null",
  "domain": "DNS & Internet Infrastructure",
  "era": "1972–1989",
  "org": "Stanford Research Institute (SRI)",
  "why_notable": "One paragraph.",
  "links": {
    "Label": "https://..."
  }
}
```

## How to add a new person

1. Create `<kebab-name>.json` in this directory using the format above
2. Add `"<kebab-name>.json"` to `manifest.json`

The page re-groups cards by `domain` automatically on every load.

## Domain values (existing)

- DNS & Internet Infrastructure
- Certificate Transparency & PKI
- Reconnaissance & OSINT Tools
- Subdomain Enumeration & ProjectDiscovery
- Wordlists & Data Sources
- Unix / Systems Foundations
- Anonymous / Unknown
- Search Engine Hacking & Web Archives
- Pentest Tools & Bug Bounty Research
- Classic Tools

Use an existing domain value to slot into an existing group, or introduce a new one to create a new section header.

## Source

All 26 initial entries sourced from `/home/fmf/Projects/web-vapt/people-log.md`.
