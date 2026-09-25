# FigJam brainstorm — distilled brief

Source board: https://www.figma.com/board/co0qxWRlz1m8O2Zm5o3YGw/Untitled
Pulled 2026-09-23 via the Figma MCP connector.

## The concept

**Working title:** See the life you can't see
**Tagline:** "Discover the hidden life of Assateague Island."

A location-aware exploration app that reveals the hidden wildlife around you at
Assateague Island. You point your phone toward the ocean, beach, or sky, and the
app visualizes animals in three layers. Tap an animal to learn what it is, how
big it is, where it was last tracked, and how it connects to the ecosystem.

The concept is *making the invisible ecosystem visible*. AR is only the
interaction that makes that happen, not the product. Avoid over-promising
"right now": show data freshness instead ("Last tracked 3 hrs ago", "Seen in
this area this week", "Commonly found here").

## Three data layers (the information architecture)

| Layer | Meaning | Example |
|---|---|---|
| HERE NOW (green) | Individually tagged animals recently tracked near you | Maya, loggerhead turtle, 2.1 mi offshore, 3 hours ago |
| PASSING THROUGH (yellow) | Migratory species that travel through this spot this season | Humpback whales, Sept–Nov |
| LIVES HERE (blue) | The resident ecosystem and its relationships | Ghost crab → sanderling ("Sanderlings feed on small crabs") |

## Core product loop

LOOK → DISCOVER → FOLLOW → CONNECT

- LOOK: point your phone at the environment
- DISCOVER: see wildlife associated with that location
- FOLLOW: explore an individual animal's movement or migration
- CONNECT: understand the ecosystem around it

## The user journey (from the board)

1. Open the app. "ASSATEAGUE ISLAND. There's more here than meets the eye." [Explore around me]
2. Point the phone at the ocean. Camera view with creatures shown as constellation points anchored to the landscape, not literal animals. "3 creatures nearby."
3. Tap the turtle. LOGGERHEAD TURTLE, Caretta caretta, last tracked 2.4 mi offshore, 4 ft · ~350 lb. "Follow its journey" shows movement on a map.
4. "But the turtle isn't the only thing here. Explore this habitat." Move from individual animal to ecosystem.
5. Discover the chain: ghost crab → sanderling → loggerhead turtle → bottlenose dolphin. Show documented relationships only. Payoff: "Oh. This beach isn't empty at all."

## MVP: six screens only

1. **Welcome** — Assateague Island, "See the life you can't see."
2. **Explore** — map/location + "Explore around me"
3. **AR discovery** — the hero screen; most visual-design effort goes here
4. **Animal detail** — photo/illustration, species, size, location, tracking date
5. **Journey** — animal movement/migration visualization
6. **Ecosystem** — "What's connected to this habitat?" species → relationships → habitat

### Explicit non-goals for the prototype

No user accounts, social features, gamification, animal collecting, badges,
notifications, camera species ID, nationwide coverage, every animal, complex
filters, or a database browser.

## Primary user

The curious beachgoer, 20–40, visiting Assateague for a beach day, camping,
or vacation. Enjoys nature, no deep marine knowledge, phone in hand, likely
with friends or family. Design principle: **don't make the user search for an
animal; let the environment reveal it to them.**

## Curated species set (from board sketches and 3D model references)

- Loggerhead sea turtle (Caretta caretta) — HERE NOW, tagged "Maya"
- Bottlenose dolphin (Tursiops truncatus) — HERE NOW / seen recently
- Humpback whale — PASSING THROUGH, Sept–Nov
- Ghost crab (Ocypode quadrata) — LIVES HERE, "right here, common on this beach"
- Sanderling (Calidris alba) — LIVES HERE, feeds on small crabs
- Atlantic horseshoe crab (Limulus polyphemus) — LIVES HERE
- Blue crab — LIVES HERE (bays)
- Northern diamondback terrapin — LIVES HERE (salt marshes; Maryland state reptile)
- Assateague wild horses appear in the mood-board photos

Species reference screenshots on the board group Assateague fauna as: Marine
Mammals & Large Species, Crabs & Invertebrates, Fish & Bay Life.

## Tech direction (from the board)

- React + Vite (done), Tailwind or fastest styling, Framer Motion for transitions
- Mapbox/MapLibre if a map is wanted
- Data: OBIS API (occurrence), Movebank (tracking), plus a small curated local JSON
- Images: Wikimedia Commons / NOAA with attribution
- Fake the AR layer: a camera-style screen with anchored animals and subtle motion

## Visual direction (mood board)

Bioluminescent night-sky-meets-ocean palette; constellation-line motifs redrawn
as migration paths. Reference mockups pinned: a dark editorial museum-ticket app
(Botticelli / Vincent), a deep-blue dive app ("Dive Where Few Ever Will"), a
real-time ship-tracking app, and a botanical field-guide app ("Pear"). Photos of
Assateague surf and wild horses on the beach.

## 3D model references (Sketchfab)

- Ghost Crab — https://sketchfab.com/3d-models/ghost-crab-bcddabc7f7d642399e1cf6731804b9ac
- Ghost Crab (CrisLArt) — https://sketchfab.com/3d-models/ghost-crab-80ec152417844ed69b9488243953cd15
- Blue Crab — https://sketchfab.com/3d-models/blue-crab-301e727647c54965802aa8270e3b4902
- Blue crab (C.J. Goldman) — https://sketchfab.com/3d-models/blue-crab-6cf206cdd27c4b42a0fc439ffb2e7505
- Atlantic horseshoe crab — https://sketchfab.com/3d-models/atlantic-horseshoe-crab-83d671d2c26b4cdaa25177e305386ab3
- Bottlenose Dolphin — https://sketchfab.com/3d-models/bottlenose-dolphin-4f5ac424036145a08166701e1a62288c
- Sanderling and Polar Sea Star — https://sketchfab.com/3d-models/sanderling-and-polar-sea-star-009059d29da14895b557112bcd43f39c
- Loggerhead Turtle — https://sketchfab.com/3d-models/loggerhead-turtle-42aaed2a8085424b9aeaa3f3394eeb3a
- Loggerhead Sea Turtle "Shelly" — https://sketchfab.com/3d-models/model-47a-loggerhead-sea-turtle-c438e81e796d41d9a6ae4cc147ef8d4f

## Earlier ideas on the board (not pursued)

Mind map of alternatives: travel journal, photo collage, pet breed finder,
climate/glacier visualization, carbon tracker, hazard alerts, book
recommendations, coffee ritual companion, fashion/outfit generator, plant and
pet care, camping checklist, save money. The sea-creature tracker was chosen as
"the strongest one: genuinely niche, nobody's built it, natural mechanic."
