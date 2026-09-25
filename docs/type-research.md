# How two reference sites handle font sizes

Measured in the browser on 2026-09-24 at 1440px and 390px viewports.

## moneyincheck.org — one dial, the root font size

- The root font-size is `min(0.578704vw, 0.990099vh, 11.111px)`. At 1440px wide
  that is 8.33px; on a 390px phone a media query switches it to 10px.
- Every size on the site is in `rem`, so the whole page scales like a poster
  with the viewport. Nothing is fixed until the 11.11px cap.
- Only the hero headline gets its own `clamp(3.6rem, 11vw, 9rem)`; a few
  sub-heads use `clamp(1.3rem, 4vw, 2rem)` style ranges.
- Line heights are also rem values, so they scale with the type
  (108px type / 160px line, 80 / 108, 40 / 44, 16.7 / 25).

Scale at 1440px (PP Editorial Old throughout):

| Role | Size | Line | Weight |
|---|---|---|---|
| Hero title | 135 | ~1.0 | 400, uppercase |
| Statement h2 | 108 | 160 | 400 |
| Statement paragraphs | 80 | 108 | 200 |
| Section statements | 40 | 44 | 200 |
| Author lead | 37 | 53 | 200 |
| Handwritten notation | 22–30 | 1.0 | 400 |
| Small heads | 25 | 40 | 400 or 800 |
| Body | 18 | 27 | 300 |
| Nav, table, metadata | 16.7 | 25 | 200 to 800 |
| Footnotes, italics | 12.5–15 | 17–20 | 200 or 400 italic |
| Tiny caps | 10–11 | 17 | 800, uppercase, 0.08em |

Scale at 390px: title 74, statement 43, statement paragraphs 27, body 22,
metadata 20. Ratio top to body drops from about 7 : 1 to 3.4 : 1.

Takeaways: weight is the second axis (200 for the biggest statements, 800
for the smallest caps). Italic and weight do the job of labels. One font.

## mont-fort.com — fixed pixel scale plus tracking

- Root 16px, no fluid rules. Sizes are fixed per breakpoint and step down
  on mobile: 50 → 36, 40 → 28, 24 → 20, 16 stays 16.
- Letter-spacing everywhere, proportional to size: about 0.04em on big caps,
  0.08em on body, 0.24em on bold eyebrows, 0.32em on the logo.
- Line height is a ratio: 1.4 on headings, 1.6 on body, 1.2 on caps.
- Two families: Century Gothic for everything, Josefin Sans for the wordmark.

Scale at 1440px:

| Role | Size | Line | Tracking | Weight |
|---|---|---|---|---|
| Wordmark | 62 | normal | 0.32em | 300 |
| Statement h2 | 50 | 70 | 0.045em | 400, uppercase |
| Section h4 | 40 | 56 | 0.04em | 400, uppercase |
| Lead paragraph | 24 | 38 | 0.02em | 400 |
| h3, place names | 20 | 28–32 | 0.04em | 400 |
| Body | 16 | 25.6 | 0.08em | 400 |
| Eyebrow | 14 | 17 | 0.24em | 700 |
| Small, nav, captions | 12 | 14–19 | 0.04–0.08em | 400 or 700 |

Takeaway: hierarchy comes from tracking and case more than from size; the
size range is narrow (12 to 50) and disciplined to multiples of 2.

## What Foreshore does, and what to borrow

Foreshore is already Money-in-Check-shaped: one display serif, a fixed 4px
scale from 12 to 160, fluid `clamp()` only on the hero and statement lines.

Worth borrowing:
1. Weight as the second axis. Set statement lines in Ultralight (200) once the
   PP Editorial Old files are in; keep 400 for titles.
2. Line heights that scale with the type on the big sizes, ratio 1.0 to 1.1
   on display, 1.35 on statements, 1.5 to 1.6 on body.
3. A tighter phone scale: hero about 72, statements 40, body 18 to 20, since
   the top-to-body ratio should fall from about 8 : 1 to about 3.5 : 1.

Not worth borrowing: the rem-as-vw trick. It makes the whole page scale as
a unit, which is elegant for a one-off poster site but fights the 4px grid
and makes body text unpredictable on odd viewports.
