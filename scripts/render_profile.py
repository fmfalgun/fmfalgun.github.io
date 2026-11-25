"""Renders data/profile.json into the marked blocks of index.html.

Purpose: keep the role, employer and location text in ONE place (the JSON) while
index.html stays plain static HTML for crawlers and no-JS visitors.

Usage:  python3 scripts/render_profile.py          # rewrite index.html
        python3 scripts/render_profile.py --check  # exit 1 if index.html is stale

Blocks in index.html look like  <!-- BEGIN:name --> ... <!-- END:name -->  and
only the text between the two comments is ever replaced.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROFILE_PATH = ROOT / "data" / "profile.json"
PAGE_PATH = ROOT / "index.html"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def month_label(value):
    """Turns '2026-09' into 'Sep 2026'; None (still ongoing) becomes 'Present'."""
    if value is None:
        return "Present"
    year, month = value.split("-")
    return f"{MONTHS[int(month) - 1]} {year}"


def split_positions(profile):
    """Returns (current, previous_list). Exactly one position may have end=null.

    Raises ValueError otherwise, because the page needs one unambiguous 'now'.
    """
    open_ones = [p for p in profile["positions"] if p["end"] is None]
    if len(open_ones) != 1:
        raise ValueError(f"expected exactly one position with end=null, found {len(open_ones)}")
    past = [p for p in profile["positions"] if p["end"] is not None]
    past.sort(key=lambda p: p["end"], reverse=True)
    return open_ones[0], past


def esc(text):
    """HTML-escapes text for element content and double-quoted attributes."""
    return html.escape(text, quote=True)


def long_description(profile, current, past):
    """Full sentence used by the meta description."""
    ex = f" (ex-{past[0]['org_short']} {past[0]['title']})" if past else ""
    degree = profile["education"]["degree"].replace(" in ", " ")
    return (f"{profile['name']} — {current['title']} at {current['org_short']}{ex}, specialising "
            f"in IoT wireless security (BLE, Wi-Fi, Zigbee), ML-based IDS, and Zero Trust "
            f"architectures. {degree}, DIAT Pune.")


def short_description(current):
    """One-line summary used by the social cards."""
    return f"{current['title']} at {current['org_short']} — IoT wireless security, ML/IDS, Zero Trust."


def render_meta_description(profile, current, past):
    """<meta name=description> line."""
    return f'  <meta name="description" content="{esc(long_description(profile, current, past))}" />'


def render_meta_og(profile, current, past):
    """Open Graph description line."""
    return f'  <meta property="og:description" content="{esc(short_description(current))}" />'


def render_meta_twitter(profile, current, past):
    """Twitter card description line."""
    return f'  <meta name="twitter:description" content="{esc(short_description(current))}" />'


def render_jsonld(profile, current, past):
    """The schema.org Person block: current job as worksFor, past ones as alumniOf."""
    edu = profile["education"]
    alumni = [{"@type": "EducationalOrganization", "name": edu["org_ld"]}]
    alumni += [{"@type": "Organization", "name": p["org_full"]} for p in past]
    person = {
        "@context": "https://schema.org", "@type": "Person", "name": profile["name"],
        "jobTitle": current["title"],
        "worksFor": {"@type": "Organization", "name": current["org_full"]},
        "url": profile["site_url"], "email": profile["email"],
        "sameAs": [profile["github"], profile["linkedin"]],
        "alumniOf": alumni,
        "knowsAbout": ["IoT Security", "Wireless Security", "BLE", "Wi-Fi", "Zigbee",
                       "Machine Learning", "Intrusion Detection Systems", "Zero Trust"],
    }
    body = json.dumps(person, indent=2, ensure_ascii=False)
    return '  <script type="application/ld+json">\n' + body + "\n  </script>"


def render_eyebrow(profile, current, past):
    """Small line above the name in the hero."""
    text = f"{current['org_short']} — {current['title'].upper()}"
    return f'        <p class="hero-eyebrow">{esc(text)}</p>'


def render_hud(profile, current, past):
    """Bottom-left HUD location value."""
    return f'        <span class="hud-value">{esc(profile["hud_location"])}</span>'


def render_about(profile, current, past):
    """First About paragraph: current role, then the previous ones with dates."""
    edu = profile["education"]
    text = (f"{esc(current['title'])} at <strong>{esc(current['org_short'])} "
            f"({esc(current['org_full'])})</strong>, {esc(profile['research_line'])}.")
    for p in past:
        summary = f", {esc(p['summary'])}" if p["summary"] else ""
        text += (f" Previously {esc(p['title'])} at <strong>{esc(p['org_short'])} "
                 f"({esc(p['org_full'])})</strong> ({month_label(p['start'])} – "
                 f"{month_label(p['end'])}){summary}.")
    text += f" {esc(edu['degree'])} from <strong>{esc(edu['org'])}</strong>."
    return f"            <p>\n              {text}\n            </p>"


def render_field_rows(profile, current, past):
    """ROLE (and PREVIOUS) rows of the FIELD DATA card."""
    row = '              <li><span class="fd-key">{}</span><span class="fd-val">{}</span></li>'
    rows = [row.format("ROLE", esc(f"{current['title']}, {current['org_short']}"))]
    if past:
        rows.append(row.format("PREVIOUS", esc(f"{past[0]['title']}, {past[0]['org_short']} "
                                              f"({month_label(past[0]['start'])} – {month_label(past[0]['end'])})")))
    return "\n".join(rows)


RENDERERS = {"meta-description": render_meta_description, "meta-og": render_meta_og,
             "meta-twitter": render_meta_twitter, "jsonld": render_jsonld, "eyebrow": render_eyebrow,
             "hud": render_hud, "about": render_about, "role-rows": render_field_rows}


def apply_block(page, name, content):
    """Replaces the text between the BEGIN/END comments of block `name`.

    Raises KeyError if the markers are missing: a silent no-op would let the
    page drift from the JSON without anyone noticing.
    """
    pattern = re.compile(rf"(<!-- BEGIN:{name} -->\n).*?(\n\s*<!-- END:{name} -->)", re.S)
    if not pattern.search(page):
        raise KeyError(f"markers for block '{name}' not found in index.html")
    return pattern.sub(lambda m: m.group(1) + content + m.group(2), page, count=1)


def render_page(profile, page):
    """Returns `page` with every block regenerated from `profile`."""
    current, past = split_positions(profile)
    for name, render in RENDERERS.items():
        page = apply_block(page, name, render(profile, current, past))
    return page


def main():
    """CLI entry: rewrite index.html, or with --check just compare. Returns exit code."""
    profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    old = PAGE_PATH.read_text(encoding="utf-8")
    new = render_page(profile, old)
    if "--check" in sys.argv:
        print("index.html is up to date" if new == old else "index.html is STALE: run scripts/render_profile.py")
        return 0 if new == old else 1
    PAGE_PATH.write_text(new, encoding="utf-8")
    print("index.html updated" if new != old else "index.html already up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
