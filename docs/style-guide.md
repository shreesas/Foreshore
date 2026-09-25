# Foreshore style guide

Derived from the moodboard: Baskerville + Fira Sans, a sand / navy / sky / foam
palette, real beach photography, and white line-drawn creatures over it.
Everything below is implemented as Tailwind theme tokens in `src/index.css`.

## Type (final 2026-09-24: Instrument Serif)

The display face is **Instrument Serif**, loaded from Google Fonts in
`index.html` in roman and italic. It had been the stand-in for PP Editorial
Old, whose trial files never landed in `public/fonts/`, so every page load
requested eight fonts that failed while the site actually rendered in
Instrument Serif. On the evening of 2026-09-24 the user made it the true font:
the PP Editorial Old `@font-face` rules are gone, `--font-display` is
`"Instrument Serif", Georgia, serif`, chapter 06's Type block names it, and
Libre Baskerville was dropped from the Google Fonts request because nothing
used it. Instrument Serif ships one weight (400) with a true italic, so
`font-light` on the chapter headlines is inert; everything in the display face
renders at 400. `public/fonts/` is empty and can stay that way.

Display sizes are fluid: `text-display` is `clamp(72px, 12.5vw, 184px)` at
line-height 0.92 for the hero and for "It looks empty." in the branded
chapter, the only two places it appears. Fixed sizes below stay on the 4px grid.


| Role | Family | Weight | Size / line | Tailwind |
|---|---|---|---|---|
| Display headline | Instrument Serif | 400 | 96 / 96 | `font-display text-96` |
| Chapter headline | Instrument Serif | 400 (`font-light` is inert, one weight) | 40 on phones, 64 on desktop, sentence case | `font-display text-40 font-light md:text-64` |
| Sub-headline, HMW | Instrument Serif | 400 | 40 / 48 | `text-40` |
| Card title, species name | Instrument Serif | 400 | 24 / 32 or 32 / 40 | `text-24`, `text-32` |
| Scientific name, quotes | Instrument Serif italic | 400 | 16–20 | `font-display italic` |
| Lead paragraph | Fira Sans | 300 | 20 / 28 | `text-20` |
| Body, UI | Fira Sans | 300 (400–500 for buttons) | 16 / 24 | `text-16` |
| Labels, captions, metadata | Instrument Serif italic | 400 | 16 / 24, sentence case, no tracking | `font-display text-16 italic` |
| Numerals in lists | Instrument Serif | 400 | 16 / 24, tabular | `font-display text-16 tabular-nums` |

Everything sits on a 4px grid: sizes 12, 16, 20, 24, 32, 40, 48, 64, 96 and
line-heights 16, 24, 28, 32, 40, 48, 56, 72, 96.

## Layout system (after the reference pass)

References: newzealanderliveryservice.co.nz, moneyincheck.org, velourproductions.com.
What was taken from them:

- **Chapters, not sections.** Each chapter fills the viewport and opens with a
  hairline rule carrying a numbered label on the left and a context label on
  the right: `01 — THE PROBLEM ......... FIELD NOTES`.
- **Index rows, not cards.** Content is listed as numbered hairline rows.
  Columns are 48px number, a 300px title (440px for stat rows), then the
  description at 20px in a 52ch measure, so label and value sit close together
  like Money in Check's formats table. Never a 50/50 split with a dead zone.
- **Paragraph grids** follow Montfort's proportions: a 440px lead at 24px,
  an 80px gutter, then one 52ch body at 16px (chapter 06). Never a scatter of
  short 16px paragraphs in a wide grid: chapter 01's studies read as unfinished
  that way (2026-09-24) and became a 64px claim with 24px paragraphs beside it,
  the studies following in the same column as stacked index rows (`stack`),
  numbered from 01 again. Rows on the white grid drop their hairlines
  (`[&>*]:border-b-0`); the grid is lines enough.
- **No rules on a gridded ground** (2026-09-25). Wherever the field-notebook
  grid shows (hero, 01, 04, 07 and the fixed top bar over them) nothing draws
  a hairline of its own: the top bar has no bottom edge, chapter 07's closing
  block is set off by space, and chapter 04's zone labels sit under the grid's
  own lines. Rules remain only on flat grounds: chapter 02's "Introducing"
  block, chapter 03's flow rows, chapter 05's rail, the footer.
- **Long lists** fold into two columns of compact rows rather than one tall
  column of single lines.
- **Type does the work.** Every chapter's headline is one size: the display
  serif, light, 40px on phones and 64px on desktop, sentence case (set
  2026-09-24, matching chapter 01's "I camped here in May"). Only the hero and
  "It looks empty." go bigger and uppercase. There are no eyebrows: secondary
  information is set in the display face, italic, sentence case, 16px, the way
  "A novel by…" is on moneyincheck.org. Numbers in lists use the display face
  with tabular figures.
- **Paper grid.** A faint 160px grid behind the hero and the species chapter,
  the field-notebook the line art is drawn on. The navy chapter gets the same
  grid at 6% white.
- **Margin notes.** Caveat handwriting for the scroll hint and the payoff line.
  Figure captions ("Fig. 1 —") under images.
- **A strip that never stops.** A marquee of the species on navy tiles, paused
  on hover. Since 2026-09-24 it sits between chapter 02 and the flow (chapter 03)
  as its own hairline band, not inside the species chapter.
- **Smooth scroll.** Lenis with lerp 0.1, disabled under reduced motion.
- **Top bar.** Fixed, translucent paper, wordmark left, chapter links center,
  a live clock right.

## Space and shape

- Spacing uses Tailwind's default 4px scale. Section padding is 96px (128px on
  desktop). Card padding is 24px. Gaps are 12, 24, or 32.
- Content column is 1120px wide.
- Radii: 16px for chips and inputs, 28px for the bottom sheet, 44px for the
  phone frame. The page itself uses no rounded boxes; only hairlines.
- Phone frame is 320 × 693 (9 : 19.5) with a 10px bezel, black by default. In the branded chapter the bezel turns light grey (#d7dbe0) at night so the phone reads against the dark scene.

## Color

| Token | Hex | Use |
|---|---|---|
| sand | `#d4a373` | The warm spark. Sun, dawn, one detail per screen |
| sand-light | `#f3e6d3` | Pale warm ground for a section |
| navy | `#023146` | Headline and body text, primary buttons, marquee tiles, dark sections |
| night | `#021a2b` | Deepest navy, shadows |
| sky | `#52beb0` | The teal accent. Active states, highlights, focus rings. Never text on a light ground |
| sky-light | `#c9e9e4` | Pale teal ground for a section |
| foam | `#c8e8e6` | Mint a step deeper, chips and tiles |
| paper | `#ddf1f1` | The mint page ground |
| white | `#ffffff` | Panels, the sheet, white section grounds |
| ink | `#023146` | Body text (same as navy) |
| ink-muted | `#4f6b7a` | Secondary text |
| line | `#b3dbd8` | Borders and dividers |
| wire, wire-bg | `#a3a3a3`, `#ffffff` | Wireframe screens only. Neutral grey and white, no blue cast; the frame is `#f3f3f2` |
| dusk | `#d4a373` | Kept for old call sites; same as sand |

Palette changed 2026-09-24 to indigo / teal / yellow / mint; token names stayed so class names did not change. Contrast: ink on paper is 9.5 : 1. Ink-muted on paper is 5.8 : 1. Paper on navy is 9.5 : 1. Teal and yellow are decorative on mint and pass only on indigo (5.0 : 1 and 7.1 : 1).
navy is 12.6 : 1. Sky is decorative on white and passes only on navy.

## Line art

- Five creatures are finished: laughing gull, bottlenose dolphin, sanderling,
  ghost crab, red fox. They were drawn by hand, traced with VTracer, and the
  originals live in `public/img/animals/`. The horseshoe crab still uses a
  placeholder sketch and is kept out of the camera view until it is drawn.
- `public/art/<id>.svg` are the cleaned copies: a tight `viewBox`, no
  width or height, and `fill="currentColor"` (the traced outlines are filled
  shapes, not strokes). Regenerate with browser-measured bounds if a drawing
  changes.
- The `LineArt` component paints a drawing through a CSS mask, so one file
  is white over footage, navy on paper, and grey in the wireframes. Sizes per
  species live in `species.ts` (`art.w`, 68 to 132px at scale 1);
  `art.flip` mirrors a creature so it faces into the frame.
- Legibility over footage is two things: the cleaned SVGs carry a
  `stroke` of about 0.5% of their width (halved 2026-09-24; at 1.1% the fox
  started to clog) so the traced lines are about one and a half times the drawn weight, and `LineArt` adds a layered navy halo (three drop
  shadows) when `shadow` is on. The dark radial pool (`.scrim`) behind each
  creature was removed on 2026-09-24 for the marker-doodle look. Cast rows
  and wireframes turn the halo off.
- Finished drawings wipe in left to right over 1.4s (`clip-path`), like a
  pen pass; the clip ends outset so a turned wing or the halo is not cut off
  afterwards. Placeholder sketches still use the `stroke-dashoffset` draw-in.
- In the camera view creatures move (`idle`). Each trace is one fused
  silhouette, so `LineArt` paints the same mask in layers, clips each layer
  to one part with a percent `clip-path` polygon and turns it on its joint
  while the rest of the drawing holds still (the `RIG` table in
  `LineArt.tsx`). A cut runs through the joint, where rotation moves nothing,
  so seams stay hidden at site sizes. Sanderling: legs run, a stop, a run back, no
  turn (the user found the mirror flip jarring), 6s. Gull: three wing beats, a
  glide, three more, the body lifting on each downstroke, 9s. Ghost crab:
  legs scuttle during the sidesteps, the big claw lifts and the eyes flick
  between them, 7s. Fox: stands and paws at the sand with the near front leg,
  rocks on the hind leg, swishes its tail and breathes, 10s. Nothing turns
  round: the user found mirrored line drawings jarring, so no creature flips. Horseshoe crab: the tail sweeps 8° each way
  and the shell rocks against it, 3.4s. Dolphin: the arc, unchanged. The
  polygons were placed by sampling the traced paths in a browser; to check a
  rig, colour its `[data-part]` layers. The button still carries the 4px
  `.bob`.
- Reduced motion: no wipe, no draw-in, no bob, no rig motion, no Ken Burns.

## The camera view

- One photo, `public/img/shore.jpg` (2000 × 1334, soft daylight, all four
  habitat bands). Chapter 05 is a pinned scroll story (`LensScroll`): the
  photo fills the stage, a phone rises from the bottom edge, and its screen
  shows the same photo at the same place, so it reads as a window. Scroll
  then tilts the view from sky to sand; the backdrop and the window pan
  together. The photo is zoomed 1.3× past cover so there is room to pan.
- The hour grades the world in both the backdrop and the window (sun, moon,
  stars, dusk warmth). Only the window adds the life: creatures, zone
  labels, the greeting and the hour chips. Labels and creatures fade out
  under the header (a mask on their layer) so nothing collides with it.
- The phone UI follows the chapter 03 wireframes (2026-09-24): greeting in
  the serif italic at 24 over one 12-caps metadata line; four 48px hour
  chips, Dawn / Day / Dusk / Night, selected by phase; no count, no
  "pointing at" line, no slider (the site's rail beside the phone moves the
  day). Learn is a sheet (name 24, scientific 16, 12-caps meta, Caveat zone
  tag, Best chance / Size / Zone stat row, fact, linked "Connected to"
  rows, pinned "Back to the beach" plus the animal's "Come back …" text
  action). Return is the per-animal page from `src/data/return.ts`, shared
  with the wireframe. Type on the phone is 12 / 16 / 24 / 48 only.
- Zones are bands of the photo, not the frame: sky 3–52%, offshore 60–72%,
  surf line 74–81%, dry sand 82–96%; the horizon sits at 59%. Creature
  anchors are photo coordinates; keep x between 43 and 57 and y between 10
  and 90 because the phone is a narrow window on a wide photo. Each creature
  draws itself in when the pan brings it into view (IntersectionObserver
  against the frame), and again on every return.
- The footer says which zone the middle of the frame is pointing at, read
  off the pan transform.
- Time is one number, 0–24. Sunrise 5:45, sunset 7:45 (late summer).
- Grading is three layers on the photo: a brightness and saturation filter
  driven by daylight, a warm soft-light gradient driven by twilight, and a
  navy multiply overlay plus stars (top 40% only) driven by nightness.
- Sun and moon share one arc across the top 40% of the photo. The moon adds
  a soft glint on the water at the horizon.
- The only instrument is the time scrubber. Quick chips: Dawn, Noon, Dusk,
  Night.
- Creatures are drawn at 1.35× their `art.w`, with no dark pool behind them,
  and their names are set in Caveat at 24px like a margin note instead of a
  pill. An ambient marker-doodle layer was tried on 2026-09-24 and rejected.
- "Back to the beach" closes the card and the HUD stays put. A three-second
  "Now look up." pause that hid the HUD was removed on 2026-09-24.
- Not used any more: the four crossfaded video clips. The cuts are kept in
  `source-assets/video/cuts/` in case the idea comes back.

## Voice

Short sentences. Field-guide confidence, no exclamation marks. Frequency
language instead of live claims: "Seen most days," "After dark," "Seasonal,
in numbers." Never "here right now."

## Swapping in real assets

- Video: only `public/video/foam.mp4` (Fig. 1) ships. The phone-shot
  originals are in `source-assets/video/`, the 540p cuts made with macOS
  `avconvert` in `source-assets/video/cuts/`.
- Line art: add a cleaned SVG to `public/art/` and an `art` entry on the
  species in `species.ts`. Any species without `art` stays in the cast
  list ("Drawing to come") and out of the camera view and marquee.
- Species: `src/data/species.ts` holds zone, anchor, active hours, and copy.

## Wireframe screens (chapter 03)

Refined 2026-09-24 against a dive-travel app reference (onboarding, home, detail, book). What carried over, and how it maps to Foreshore:

- **Full-bleed hero with an organic wave edge** into the content below. Reference used it on the welcome and detail screens; we use it on Look, Learn, and Return. `WaveEdge` in `Wireflow.tsx` draws the edge; `.wire-hatch` is the borderless hatch fill for full-bleed heroes.
- **Tag pill over the hero** (their "Maldives") becomes our location on Look and the habitat zone on Learn.
- **Greeting tied to context** (their "Good morning Lars") becomes a time greeting with no account: "Good evening · 7:36 pm · low tide 2:10 pm".
- **Category chip row** (their Tiger Sharks / Reef Dives) becomes the hour row, Dawn / Day / Dusk / Night, because time is our category axis. The chips change the cast in the frame.
- **Three-stat row** on the detail (nights, budget, water temp) becomes Best chance / Size / Zone.
- **One filled full-width CTA** per screen: Look around, Come back tonight, Remind me. The wireframe keeps navy fill for the primary action and dashed outline for the secondary.
- **Detail is real data.** Tapping any creature opens its own Learn and Return screens from `species.ts`, plus a small `RETURN` map for the time each one sends you to.
- Skipped from the reference: card carousels, hearts and favourites, and prices. None fit the no-collecting, no-accounts guardrails.

### UI kit pass (2026-09-24)

Second pass against the `mobile-app-ui-design` skill (installed in `.claude/skills/`). Its principles were applied; its stylistic defaults (Tailwind cards, glassmorphism, its own font picks) were not. Fonts stay the project's own stack, display serif / Fira Sans / Caveat (the display serif became Instrument Serif for good later that day, see Type above).

- **Four type sizes on the phone**: 12 for metadata, 16 for body and controls, 24 for titles and stat values, 48 for the one number per screen. Two weights: 300 body, 400 on the filled button. The 20 and 32 steps are gone from the wireframe.
- **Values louder than labels.** Stat values are 24 over 12-point italic labels; the "3 to notice" count is 24. Times and stats use tabular figures.
- **44pt targets.** Buttons are 48 tall, hour chips 48, the back link 44, secondary text actions 44, list rows 40 plus a rule.
- **One filled CTA per screen**, always in the bottom third. Return's "Start over" became a text action under "Remind me".
- **Scroll instead of clamp.** Learn and Return scroll under a pinned footer, so the fact is no longer cut to three lines.
- **Spacing rhythm**: 8 inside a group, 24 between groups.
- **Selected chip** uses the accent at 5%: navy border and `navy/5` fill.
- **Empty state** for "Also out then" is a sentence, not placeholder bars.
- **Peak and ending.** Learn is the peak: the tapped creature wipes in. Return is the ending: "You noticed the ghost crab", the time, the rules, and "No pins. Just a time." kept in the footer so it is never below the fold.

### Wireframe pass 3 (2026-09-24, user notes)

- No numbered tap callouts on the screens.
- Look hero: gull at 0.7, dolphin, ghost crab (the sanderling is gone). The CTA hugs its text with 30px side padding instead of filling the width.
- On the phone, everything is Fira Sans except handwritten labels (Caveat 24): creature names in the frame, the location and zone notes over heroes, and "No pins. Just a time." No pills. The one title per screen (Look headline, Notice greeting, Learn species name, Return time) keeps the display serif; every other line is Fira Sans. The step tabs under the phone keep the display face because they are site chrome.
- Notice: creatures at 0.85 with spots spread so nothing overlaps at any of the four hours; the hint reads "pick the time of day".
- Return: the reminder is gone. The only action is "Start over", dashed outline, 48 tall.
- Type on the phone, final: display serif at 48 (Look headline, Return time) and 24 (greeting, species name, stat values, the "3" count); Caveat 24 for handwritten labels; Fira Sans 16 for body, rows and controls (400 on filled buttons); Fira Sans 12 in all caps with wide tracking for metadata. No 24pt Fira and no Fira italic anywhere; the only italic is the serif greeting on Notice. The "N to notice" count was removed from Notice.

### Wireframe flow, revised (2026-09-24)

Learn is no longer a screen. Tapping a creature on Notice slides a sheet up over the frame (28px top radius, dashed hairline, 82% max height, body scrolls under a pinned footer). Tap the dimmed frame or "Back to the beach" to close it and keep exploring.

- **Return is on demand, per animal.** Two doors from the sheet: the "Best chance" time in the stat row is tappable, and a text action under the primary button reads "Come back tonight →" (or the animal's own line). Return itself ends with "Back to the beach", not "Start over".
- **Connections link.** A "Connected to" row that names another creature in the cast (laughing gull, sanderling, ghost crab, horseshoe crab) is a row with an arrow; tapping it swaps the sheet to that creature. Rows that name something outside the cast (mole crabs, sea turtles) stay plain.
- The tabs under the phone still read Look · Notice · Learn · Return; "Learn" opens Notice with the sheet up.

### Cursor in the flow chapter (2026-09-24)

Anywhere on chapter 03's yellow ground, a mouse pointer becomes a navy pill reading "Try the Wireframe" (Fira Sans 16 at 400, paper text, the same fill as the filled button), so readers know the phone can be used before they reach it. It starts at the section's edge, not the phone's: scroll the yellow under a still mouse and the pill appears; scroll it away and the normal cursor returns. A 10px navy dot with a white ring marks the exact click point, and the pill hangs 12px below and to the right of it so the chip or creature under the pointer stays visible. Near the right or bottom edge of the window it swings to the other side. The native cursor is hidden only while the pill shows, and the fixed nav keeps its own cursor. Touch and pen are untouched. `PillCursor.tsx` wraps the flow `Chapter` in `App.tsx`.

### Scene grading is photographic, not brand (2026-09-24)

After the palette change the branded chapter went purple at night and yellow at dusk, because the grade layers used the `night` and `dusk` tokens. The user asked for colors as close to reality as possible even where they leave the palette. So the scene in `CameraView.tsx` and the stage in `LensScroll.tsx` use their own constants: `NIGHT` `#061228` (a moonlit blue-black) for the night multiply, the bottom fade, the stage background and text shadows, and `rgba(242,150,80)` (golden hour amber) for the dusk soft-light. The brand tokens still drive everything else in the chapter: buttons, chips, the phone bezel, the sheet.

### Three looks for the scene (2026-09-24, from three reference photos)

The hour mixes three colour washes over shore.jpg. Each is a gradient with `mix-blend-mode: color`, which keeps the photo's luminance and swaps its hue, plus a filter tweak. Weights come from `dawnness`, `brightness` and `duskness` in `lib/time.ts`; night still multiplies `NIGHT` on top.

- **Dawn** (reference: sun on the horizon, whole sky orange-gold). Orange at the top, gold at mid sky, yellow at the horizon, a dark warm foreground. A screen-blended radial glow sits on the sun. Wash at 35%, brightness +0.3, saturation +0.1 (softened twice on request; the first cut at 90% was far too intense). The sun swells to 96px and goes orange, with a wide amber glow, as it meets the horizon.
- **Day** (reference: bright tropical beach). Cyan sky, turquoise water, near-white sand. Brightness +0.1, saturation +0.35, contrast +6%. This is the first time noon has not carried the photo's late-afternoon gold.
- **Dusk** (reference: lavender sky over wet sand). Violet at the top through lavender to a peach band at the horizon, cool violet water and sand, a light multiply to take it down. Wash at 32%, brightness +0.15.

The sun and moon rise from and set into the photo's real horizon (`HORIZON` in `lib/time.ts`, 58%). On wide screens the dawn sun sits at the left edge, behind the shift rail; in the phone it is out of frame, so dawn reads as the glow on the water.

### Camera footer on a wave panel (2026-09-24)

The greeting, the time and tide line, and the hour chips in the camera view no longer float over the photo. They sit together on a paper (mint) panel whose top edge is an organic wave, the same idea as `WaveEdge` in the wireframe and the dive-app reference the user shared. Text on the panel is ink, the active chip is filled navy. The panel keeps the controls visibly apart from the scene so they never blend into the sand.

### No zone labels on the prototype (2026-09-24)

The camera prototype no longer prints Sky / Offshore / Surf line / Dry sand over the photo. The bands still drive where creatures live and what the footer reports, but the picture names them itself. The wireframe keeps its zone labels: there the frame is a hatched box and the words are the only thing that says what each band is.

### Beat 1 line and the bottom fade (2026-09-24)

"It looks empty." and its caption are near-black (#0b0b0f) in bright daylight and paper at every other hour, with no text shadow. The dark fade along the bottom of the stage is gone from beat 1; it only appears in the last fifth of the scroll, where the pan opens the night strip under the photo.

### The branded chapter keeps the first palette (2026-09-24)

After the site moved to indigo / teal / yellow / mint, the user asked for chapter 05 alone to go back to sand `#d4a373`, navy `#02304a`, sky `#8fc4d8` and the pale mint `#ddf1f1`. `SECTION_PALETTE` in `LensScroll.tsx` overrides the colour tokens on the section element, so the phone, the sheet, the chips and the rail inside it use navy and sky while the rest of the site stays indigo. Scene grading is still photographic and the bezel is still black / grey.

### Field clips (2026-09-24)

The margin clips in chapter 01 are square now, not 9:16, and they zig-zag down the page: sunrise (left), midnight (right), sanderling (left), foam (right), each about 240px lower than the last, alternating start and end alignment inside their column. The ghosted sun clip was removed. Under the lg breakpoint the strip drops every second clip by 40px for the same stagger. Each clip slides in from its own side, driven by scroll: 240px, over the ~230px of scroll between its top meeting the bottom of the screen and reaching 70% of the way down. Because the clips are ~240px apart and alternate sides, only one is ever moving. Scrolling back reverses it. Under reduced motion it only fades. The grid clips horizontal overflow so clips waiting off-screen never widen the page. The foam clip (Fig. 1) no longer carries drawings over it; the only place creatures sit on footage is the branded chapter.

### The clips fill the margins (2026-09-24)

The user found the margin clips too small, with too much empty page around them (on a 1512px laptop they were 193px, and the essay's 546px sat in a 785px middle track). The middle track is now exactly the essay's 62ch, and both margins take the rest of the width (`minmax(190px, 1fr)`). The clips are 88% of their margin, still alternating edges. That makes them about 205px at 1280, 310px on a 14-inch laptop, and 394px from 1920. From `xl` the vertical offsets are percentages of the margin's width (the next clip on the other side starts 60% down, and clips on the same side are 14% apart), so the zig-zag keeps its rhythm as the clips grow: about 210px steps at 1512. At `lg` the margins are 190px and the essay wraps taller, so the clips keep the old fixed 240/260px steps. The clips are re-cut at 960×960 from the originals so they stay sharp on Retina at the larger size. Each matches the old 480/540px cut frame for frame, with the same framing and colour: horses is `horses.mov` in full, crop x=180, HLG→SDR via zscale npl=203 + hable; sanderling is `sanderling bird.MOV` from 6 s; sunrise is `sun rise & birds fly by.MOV` from 0 s; night is `night beach.mov` from 3 s. The last three are centre squares. Sunrise and night keep their HLG (HDR) tags. The sanderling is converted to standard range with the same hable recipe as horses, then graded: whites capped at 0.9, mids at 0.45, warmer mids and highlights, and saturation at 0.85. The filter chain is kept next to the old cuts in `source-assets/video/clips-480/sanderling-grade.txt`. On the user's HDR MacBook screen, 46% of the ungraded sanderling frame sat above page white (the surf and wet sand), so it glowed next to the others. The sunrise has 10% above page white and the night 2%, so they look normal. Graded, its average brightness is 0.50, against 0.56 for horses. They weigh 1.4–5.7 MB each, so `Clip` loads and plays a video only within one screen of the viewport, pauses it further away, and never loads the copies hidden at the current breakpoint. The old cuts are kept in `source-assets/video/clips-480/`.

### The three numbers sit on a panel (2026-09-24)

The stat rows in chapter 01 (3.2 million / 300+ / Horses & seagulls) sit on a flat rectangle: paper fill, a navy/20 hairline border, 24–40px side padding, square corners, last row without its rule. It is the one place the paper grid is masked, so the numbers read as a table pinned to the page rather than lines drawn on it. Still no rounded cards anywhere on the site.

### Chapter 02: headline and argument side by side (2026-09-24)

"The gap" label is gone. Two body paragraphs (20/24px, 60ch) carry the argument: Merlin reacts, Star Walk works from a schedule, and the beach keeps one too. From 1440px they sit beside the headline, so every Mac laptop gets the split at its default size (1440, 1470, 1512, 1728). The headline keeps its natural width (713px at 64px), then an 80px gutter, then the paragraphs, dropped 7px so their cap height lines up with the headline's. That leaves about 500px for the paragraphs at 1440px (45 characters a line, running about two headline lines past it), about 580px on a 14-inch MacBook Pro, and the full 60ch from 1920px, where they run seven lines against the headline's three. Below 1440px the column beside the headline is too narrow for 24px text (about 350px at 1280px), so the paragraphs stack under it with a 96px gap. The split started at 2xl (1536px) at first, which left the 14-inch MacBook Pro (1512px) stacked with the right half empty.

### A ground per chapter (2026-09-24)

Every chapter now has its own background so a new section reads as new content. Adjacent sections never share a tone. `Chapter` takes `paper`, `grid`, `foam`, `sand`, `sky` or `navy`.

| Section | Ground |
|---|---|
| Hero | mint with the grid |
| 01 The problem | pale yellow `sand-light` |
| 02 The insight | pale teal `sky-light` |
| Cast strip | mint band with hairlines |
| 03 The flow | pale yellow |
| 04 Who lives here | mint with the grid |
| 05 The branded screen | the photo |
| 06 The look | pale teal |
| 07 Honesty | indigo with the grid; ink tokens flip to mint inside it |

Ink on pale yellow is 9.2 : 1 and muted ink 5.6 : 1. On pale teal they are 7.6 : 1 and 4.6 : 1.


### Final palette, "Shore" (2026-09-24)

After trying indigo / teal / yellow / mint, the user settled on navy `#023146`, teal `#52beb0`, mint `#ddf1f1` and white, and dropped the indigo because it sat at the same lightness as the navy and read as two dark blues with one job. Sand `#d4a373` was added back as the only warm colour. Roles follow 60 / 30 / 10: mint and white ground, navy text and dark sections, teal accent, sand as a spark. The branded chapter no longer overrides the tokens; the whole site now matches it.

Section grounds, final: hero mint grid, 01 white with the grid, 02 pale teal, cast strip on the same pale teal as 02, no rules, so it reads as the end of the insight section, 03 pale sand, 04 mint grid, 05 photo, 06 white, 07 navy. Navy on mint 11.7 : 1, on white 13.7 : 1. Teal as text only on navy (6.1 : 1).

### Moodboard assembles on scroll (2026-09-24)

Chapter 06 no longer shows `moodboard.jpg` as one flat image. `Moodboard.tsx` rebuilds it from the separate pieces the user exported to `public/img/moodboard/` (web copies in `public/img/moodboard/web/`: photos as JPEG at natural size up to 1200px, the crab and dolphin as transparent PNGs; 1.7 MB against 6.4 MB for the composite). Each piece sits where it does on the original board, in a 1400 × 788 frame.

The board pins while you scroll through a 230vh track and the pieces arrive one after another from the nearest edge: ocean (right), beach (left), surfers and dune path (top), dune grass and whale cloud (bottom), then the crab (left) and the dolphin (right) on top. Each gets a tenth of the scroll to start and a fifth to arrive; scrolling back takes it apart. The board is capped at `(88vh − 72px)` tall so board and caption always fit; when that makes it narrower than the column it sits centred, with the caption starting under its left edge. Reduced motion shows it assembled with no pin.

The sanderling cutout on the original board had no separate file, so it is not in the scroll version yet. Add it as one more entry in `PIECES`.

### 1600px content column (2026-09-24)

Content never runs wider than 1600px; backgrounds, photos and grids still fill the screen. `Chapter` caps its inner column with `mx-auto max-w-[1600px]` inside the full-width section, the nav caps at 1680px including its 40px padding, and the footer and the branded chapter's closing line use the same column. In the branded chapter, absolutely placed text uses `.edge-l` / `.edge-r` (in `index.css`), which resolve to `max(40px, (100% − 1600px) / 2)` so the heading, "It looks empty.", the shift rail and the side note line up with every other chapter; the rail's dark fade widens with it. The flow chapter's phone column is `min(40vw, 640px)` so it can't outgrow the cap. Below 1680px wide nothing changes. The landing hero is untouched.

### Responsive pass (2026-09-24)

Audited at 390, 768, 1024, 1280, 1440, 1680, 1920 × 1080 and 2560 × 1300/1440 for sideways overflow, text off screen, text colliding with text, and pinned blocks taller than the window. Fixes:

- **Tablet.** The flow chapter (rows + wireframe phone) stays one column until `lg` (1024); at 768 the 360px phone column squeezed the rows and pushed the page 123px wide. The chapter 01 lead + paragraph grid stays stacked until `xl` (1280), where the right side has room for its own two columns.
- **Cast pile in the column.** The GravityCast stage sits in the same 1600px column as the text (full width only on phones), so on wide monitors the pile and "Grab one. Throw it." line up with the paragraph above instead of spreading to the screen edges. `body { overflow-x: clip }` stays as a backstop.
- **Big monitors.** Fixed-size pieces step up instead of shrinking into the middle: the margin clips grow with their flexible margins (see "The clips fill the margins"); the branded phone is `clamp(320px, 16vw, 420px)`, still bound by screen height; the wireframe phone scales as one piece with `.grow-xl` (zoom 1.15 at ≥1900 × 1100, 1.3 at ≥2300 × 1250), height-guarded so the pinned phone always fits.
- The landing hero was not touched.

### Side padding (2026-09-24)

Content sits 24px from the screen edge on phones, 40px on tablets (`md`), and 70px on desktop (`lg`, 1024px and up), inside the 1600px cap. Chapters, the nav (capped at 1740 = 1600 + 2 × 70), the footer, the branded chapter's heading, closing line and `.edge-l` / `.edge-r` text all follow it. The landing hero keeps its own padding.

### References panel (2026-09-25)

The brief asks for the references behind the look, so the footer carries a `References` button (display italic, underlined, 44px tall on phones) that opens `src/components/References.tsx`: a flat paper panel over the page, square corners, a navy/20 hairline, a 40/48 display heading, a display-italic subline, then hairline rows grouped as Research, Images and drawings, Type, Data, Built with. Only public things go in it: papers with DOI links, NPS and Maryland DNR, Google Fonts, image sourcing (found reference images for the moodboard, Unsplash for the chapter 04 animal photos), the dataset and the keyless APIs, the stack. No file paths, board links or process notes. It is a portal on `body`, `role="dialog"` with `aria-modal`; Escape, Close and the dimmed page close it; focus goes to Close on open and back to the button on close; Tab wraps inside. While open, `html` and `body` overflow are held, the overlay carries `data-lenis-prevent`, the backdrop is `touch-none`, and App stops Lenis (`lenisRef`) and restarts it on close. On phones it is a full-width bottom sheet capped at 88svh. Exit is a 0.2s tween so it unmounts promptly.
