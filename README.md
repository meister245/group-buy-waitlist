# Szomszédkosár – waitlist landing page

Static landing page for the pre-launch group ordering app (neighbours combine Temu orders so shared item types pay import charges only once). Built from the product brief "Product Brief: Group Ordering App".

Pure HTML and CSS, with one small script for the placeholder waitlist form. No build step.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Hungarian page (primary) |
| `en/index.html` | English version |
| `assets/styles.css` | All styles, animations and the CSS-only savings toggle |
| `assets/main.js` | Placeholder form handling, "other town" field, share links |
| `assets/favicon.svg` | Logo mark |

Page sections follow the brief, top to bottom: hero, the problem, how it works, savings example, organizers / joiners, pricing, trust, FAQ, waitlist form, footer with the independence disclaimer.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Placeholders and open items

- **Product name.** "Szomszédkosár" is a working name. The brief lists the name and domain as an open decision.
- **Waitlist form.** Nothing is sent. `assets/main.js` validates the form, logs the data to the console and shows the "check your inbox / invite your neighbours" panel. Replace the `TODO` with the real service (double opt-in, EU storage).
- **Privacy notice and imprint.** The footer and consent links point to `#adatvedelem` / `#impresszum` (`#privacy` / `#imprint` in English). They are required before collecting emails.
- **Fonts.** Loaded from Google Fonts. Self-host them before launch to avoid sending visitor IPs to Google (GDPR).
- **Figures.** All numbers come from the brief's approved claims table. Recheck 2,300 HUF per item type and the 69,184 HUF limit against a real checkout after 1 November 2026.

## Notes

- No shop logos, colours, fonts or screenshots are used. Illustrations are inline SVG.
- Animations respect `prefers-reduced-motion`. Scroll reveals use CSS scroll-driven animations where supported; other browsers show the content without them.
