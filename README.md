# Kosárbarát – waitlist landing page

Static landing page for the pre-launch group ordering app (people in the same area combine Temu orders so shared item types pay import charges only once). Built from the product brief "Product Brief: Group Ordering App".

Pure HTML and CSS, with one small script for the placeholder waitlist form. No build step.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Hungarian page (primary) |
| `en/index.html` | English version |
| `assets/styles.css` | All styles, animations and the CSS-only savings toggle |
| `assets/main.js` | Placeholder form handling, share links |
| `assets/favicon.svg` | Logo mark |

Page sections, top to bottom: hero, the problem, how it works, savings example (organizer split chart, then the joiner preview and minimum-order graphic), organizers / joiners, trust, FAQ, waitlist form, footer with the independence disclaimer.

Messaging rules (from user feedback): talk about people in your local area ("környékeden élők"), not neighbours ("szomszédok"); never call the product an "app" (describe what happens, or use "we"); the English page uses typical British names in the examples; the launch is nationwide, so no Budapest or district prioritisation; no app fees or pricing, no technical details (hosting, sign-in provider), no trust-based limits. Show 2,300 HUF only as an extra cost per item type, never on its own where it could read as a saving.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Placeholders and open items

- **Product name.** "Kosárbarát" (kosár = cart, barát = friend; domain kosarbarat.hu). The page copy is built around people in your local area becoming "cart friends" / "kosárbarátok". Register the domain if not done yet.
- **Waitlist form.** Nothing is sent. `assets/main.js` validates the form, logs the data to the console and shows the "check your inbox / share in your area" panel. Replace the `TODO` with the real service (double opt-in, EU storage).
- **Privacy notice and imprint.** The footer and consent links point to `#adatvedelem` / `#impresszum` (`#privacy` / `#imprint` in English). They are required before collecting emails.
- **Fonts.** Loaded from Google Fonts. Self-host them before launch to avoid sending visitor IPs to Google (GDPR).
- **Figures.** Numbers come from the brief's approved claims table, except the illustrative joiner example (Dóra's / Daisy's organizers and the 1,490 HUF phone case), which uses the same 2,305 HUF per item type and 50/50–70/30 splits. Recheck 2,300 HUF per item type against a real checkout after 1 November 2026.

## Notes

- No shop logos, colours, fonts or screenshots are used. Illustrations are inline SVG.
- Animations respect `prefers-reduced-motion`. Scroll reveals use CSS scroll-driven animations where supported; other browsers show the content without them.
