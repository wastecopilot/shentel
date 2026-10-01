# Shentel Authorized Retailer — static site

Plain HTML/CSS/JS. No build step.

| Path | Contents |
| --- | --- |
| `index.html` | Landing page |
| `legal/*.html` | 8 legal pages |
| `404.html` | Not-found page |
| `assets/css/styles.css` | All styles (compiled Tailwind) |
| `assets/js/main.js` | Animations & interactions (smooth scroll, reveals, parallax, magnetic buttons, card tilt, header, ZIP checker, FAQ) |
| `assets/js/lenis.min.js` | Smooth-scroll library |
| `assets/media/` | Web fonts |
| `images/` | Photography |
| `vercel.json` | Vercel config (caching + security headers) |

## Deploy on Vercel

Import this repository in Vercel → Framework Preset **Other** → leave Build Command and Output
Directory empty → Deploy. Vercel serves the files as-is.

## Editing

This folder is generated from the Next.js source project. Change prices/copy in
`lib/content.ts` there and run `npm run export:html`, then commit and push this folder.
