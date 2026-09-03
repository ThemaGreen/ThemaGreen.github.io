# Portfolio v2 — deployment guide

Everything here is static. **No build step, no framework, no dependencies to install.**
Copy these files into the **root** of whichever repository serves your site
(GitHub Pages, Netlify, Vercel — all work as-is) and it runs.

## File manifest

Preserve this structure exactly — the HTML references these paths.

```
index.html            The portfolio
job-match.html        Job Match Explorer
favicon.svg           Brand monogram favicon
styles/
  site.css            The entire design system
scripts/
  data.js             ← ALL CONTENT LIVES HERE. Edit this, never the HTML.
  site.js             Portfolio behaviour
  job-match.js        Job-match scoring engine
  icons.js            Inline SVG icon set
```

## Media assets

The case studies link to these files. They are **not** part of this package — carry
them over from your existing site repo and drop them in the root alongside
`index.html`:

| File | Used by |
| --- | --- |
| `TitanicIncidentAnalysis.png` | Titanic human factors analysis card |
| `Library Site Redesign.png` | GMU library redesign card |
| `BigbellySolar.jpg` | Bigbelly partnership card |
| `BikeSim.png` | UMass human performance lab card |
| `Incident Investigation & Analysis - Thema's Team.pptx (1).pdf` | Titanic case study link |
| `Website Redesign - Group Project (Thema).pptx (1).pdf` | GMU library case study link |
| `PSYC-461 BigBelly Clean Presentation Deck  (1).mp4` | Bigbelly case study link |

Missing images degrade gracefully — the card falls back to a generated brand plate
instead of showing a broken box — so the site works even if you deploy before
copying the media across. Missing PDFs and video will simply 404 on click.

To change or remove an asset reference, edit the `image` and `links` fields on that
project in `scripts/data.js`.

## Editing content

Everything lives in `scripts/data.js`:

- `PROFILE` — name, headline, location, links, hero stats, marquee capabilities.
- `EXPERIENCE` — roles, reverse-chronological.
- `EDUCATION` — schools, credentials, coursework.
- `PROJECTS` — the case studies. Each one drives its card, its case-study drawer,
  its command-palette entry, and its Job Match evidence, so adding a project once
  updates everything.
- `SKILLS` — capability groups and the animated meters.
- `VALUES`, `TESTIMONIALS`, `TESTIMONIAL_FORM`.

Each project's `keywords` array is what the Job Match Explorer scores against.
Adding accurate keywords to a project is the highest-leverage edit you can make.

Note: `data.js` is an ES module loaded with `<script type="module">`, so the site
must be served over `http://` or `https://` — opening `index.html` directly from the
filesystem (`file://`) will be blocked by CORS. To preview locally, run
`python3 -m http.server` in the folder and visit `http://localhost:8000`.

## What this replaces

The previous site loaded jQuery, particles.js, Font Awesome (≈60 KB of CSS plus four
font files), and reCAPTCHA, and carried four broken references:

- `jobMatch.html` — did not exist. Replaced by a working `job-match.html`.
- `script.js` — did not exist. Replaced by ES modules under `scripts/`.
- `projects/titanic-incident-analysis.html` — did not exist. Case studies now open in
  an in-page drawer, so there are no per-project files that can go missing.
- `yal.png` — did not exist. Image-less cards render a generated brand plate.

The two deck links were also missing a ` (1)` in the filename and 404'd; they now
point at the real filenames.

## Features

- **Command palette** (`⌘K` / `Ctrl+K`, or `/`) — fuzzy search across every case
  study and section, plus actions: toggle theme, copy email, print to PDF.
- **Case-study drawer** — every project opens a full write-up with focus trapping,
  escape-to-close, and a deep link (`#case-{id}`, e.g. `#case-hmtc`) you can send
  straight to a recruiter.
- **Job Match Explorer** — see below.
- **Live project search + category filters**, with the top three matches ranked.
- **Dark mode**, remembered in `localStorage`, defaulting to the OS preference.
- **Print stylesheet** — `⌘P` produces a clean document with expanded link URLs.

## How the Job Match Explorer scores

It is a transparent heuristic, and it says so on the page. It runs entirely in the
browser; nothing is uploaded or stored.

1. The posting is tokenised into words and two-word phrases; boilerplate is dropped.
2. Each remaining term is checked against two vocabularies: the **evidence lexicon**
   (built from the projects, skills, and roles in `data.js`) and an **extra lexicon**
   of common job-domain terms that are deliberately *not* in the portfolio.
3. Terms in neither are noise and are excluded from both sides of the ratio, so
   "opportunity" and "collaborate" cannot inflate the score.
4. **Score** = share of in-domain content the documented work answers, with a floor
   on the denominator so a posting that is mostly out-of-domain cannot score highly
   off a small overlapping slice.
5. Terms in the extra lexicon but not the evidence lexicon are reported as **gaps**.

Calibration against four sample postings:

| Posting | Score | Verdict |
| --- | --- | --- |
| Human factors engineer, autonomous flight | 96 | Strong fit |
| UX researcher | 96 | Strong fit |
| Senior ML platform engineer (k8s/Terraform/Spark/Go) | 47 | Partial fit, gaps named |
| Registered nurse manager | 35 | Different field |

## Accessibility

Single `h1`, no heading-level skips, all images have `alt`, all controls have
accessible names, one `main` landmark, visible focus rings, a skip link, live regions
on search results and form errors, full keyboard operation of the palette and drawer,
and `prefers-reduced-motion` / `prefers-reduced-data` / `prefers-contrast` support.
Body text meets WCAG 2.2 AA contrast in both themes.

## Third-party requests

Only two, both optional:

- **Google Fonts** (Fraunces, Inter, JetBrains Mono) — if blocked or offline, the
  site falls back to a system serif/sans stack and still looks correct.
- **formsubmit.co** — the contact form action. Change the `action` on `#contactForm`
  in `index.html` to point somewhere else, or replace it with your own handler.

The testimonial modal loads a Google Form in an iframe, and only when opened.

## Set these before going live

These came from your LinkedIn profile and are visible claims — please check them:

- **Cioré start date** shows `2025` (`EXPERIENCE` → `ciore` → `start`); LinkedIn does
  not give the month.
- **Royal Aeronautical Society** shows `2026 — Present` (`EXPERIENCE` → `raes`).
- **Skill meter percentages** in `SKILLS` are a reasonable self-assessment I set for
  you. They render as numbers on the page — set them yourself.
- **Hero stat "25+ applied projects"** (`PROFILE.stats`) is an estimate; 18 are
  actually documented on the page.
