# Plstka — Website

Marketing website for **Plstka**, an AI-powered recycling platform that turns everyday
waste into rewards for households, and into measurable waste intelligence for businesses.

Static HTML/CSS/JS — no build step, no dependencies.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Homepage — hero, materials, how it works, rewards, impact, testimonials, blog, FAQ |
| `plstka-business.html` | Plstka for Business — ERP platform, franchise value chain, pricing, demo |
| `about.html` | Company story, mission, timeline, values, team |
| `products.html` | The app, accepted materials, how it works, rewards catalogue |
| `blog.html` | Article listing with category filters |
| `partners.html` | Partnership types, network, benefits, application form |
| `careers.html` | Perks, culture, open roles (filterable), hiring process |
| `contact.html` | Contact routes, form, locations, quick FAQ |

## Shared assets

- `assets/site.css` — design system: tokens, navbar, footer, buttons, type scale, animations
- `assets/site.js` — nav, scroll reveals, count-ups, EN/AR language switcher
- `assets/chat.js` — self-contained chat assistant widget (knowledge-base driven)
- `assets/materials/` — product photography for the recyclable-materials section

## Design system

| Token | Value |
|---|---|
| Primary green | `#00AE63` → `#00AE8B` (gradient) |
| Dark green | `#053C33` |
| Accent yellow | `#FFD236` |
| Soft background | `#FAFAFA` |
| Fonts | Poppins (UI), Manrope (wordmark), Roboto (footer) |

Typography uses a fluid `clamp()` scale; all motion respects `prefers-reduced-motion`.

## Running locally

No build required — serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

> Pages load `assets/site.css`, so open them through a server (or the folder) rather
> than a single file in isolation.

## Chat assistant

`assets/chat.js` answers common questions from a local knowledge base — it works
offline with no API key. To use a real LLM instead, set `CONFIG.remoteEndpoint` to
**your own backend** (which holds the API key server-side) returning
`{ reply, suggestions }`. Never put an API key in this file.

## Notes

- Business pricing and franchise investment/return figures are **illustrative
  placeholders** pending review — see the on-page disclaimers.
- Team photos, blog thumbnails and dashboard visuals are CSS/emoji placeholders
  awaiting real assets.
