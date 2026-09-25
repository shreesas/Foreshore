# Project plan — Foreshore

*Point your phone at the beach and it shows you who lives here, and when.*

Submission for the Sunspell design and product challenge. Requirements in
[challenge-brief.md](challenge-brief.md). Board research in
[figjam-brainstorm.md](figjam-brainstorm.md). Last updated 2026-09-23.

---

## 1. The problem

A beach looks empty. Sand, water, a few gulls. But the ecosystem is there:
ghost crabs in burrows under your feet, dolphins beyond the break, sanderlings
that only work the low tide, horseshoe crabs that only come ashore on a June
night near the full moon. Almost none of it is visible to a visitor, and
nothing tells them when to look.

- Assateague Island National Seashore gets roughly 3.2 million visitors a
  year and hosts more than 300 bird species plus deer, red foxes, horseshoe
  crabs, and its wild horses. Most visitors leave having seen horses and
  gulls.
- Field guides assume you already know what to look for. ID apps like Seek
  and iNaturalist require you to first find and photograph the animal. Neither
  solves "what's here that I can't see?"
- Merlin Bird ID's Sound ID proved the pattern: hold up your phone, and it
  names birds you can hear but can't see. Nobody has done this for the shore.

### Why it matters (research)

- **Extinction of experience.** Robert Pyle (1978) and Soga & Gaston (2016)
  describe a cycle: fewer everyday encounters with nature reduce emotional
  affinity, which reduces motivation to seek nature, which reduces encounters.
  Two causes: loss of opportunity and loss of orientation. This app attacks
  orientation: the animals are there, people just don't know to look.
- **Pokémon vs. wildlife.** Balmford et al. (2002, *Science*) found UK
  children over eight could identify 78% of Pokémon but only 53% of native
  wildlife. The capacity to learn creatures is huge; the exposure is missing.
- **Noticing beats time.** Passmore & Holder (2017) showed two weeks of
  actively noticing nearby nature raised wellbeing versus controls. Richardson
  and colleagues found noticing activities explain about 50% more variance in
  nature connectedness than time spent in nature. The lever is noticing, not
  presence. This product is a noticing tool.

## 2. Target audience

**Primary: the curious visitor.** Someone at Assateague for a beach day, a
camping trip, or a weekend. Twenty to forty, enjoys nature, no field
knowledge, phone in hand, often with friends or family. They saw a dolphin
once and wondered what else was out there. This is the author's own story, and
the brief rewards a product that "only needs to exist for you."

**Secondary:** parents with kids (the Pokémon finding), and campers after
dark, when ghost crabs and foxes own the beach.

**Not for:** expert birders and researchers. eBird, Merlin, and iNaturalist
already serve them.

Design principle from the board: **don't make the user search for an animal.
Let the environment reveal it to them.**

## 3. How might we

**Primary:** How might we help a beach visitor notice the creatures already
around them, at the moment they are standing there, without needing to know
what to look for?

Supporting:
- How might we turn an ordinary-looking beach into a place that feels alive?
- How might we use time of day as the way to reveal wildlife, so the same
  beach is a different place at noon and at midnight?
- How might we make "what lives here" as easy as pointing a phone at the sky
  is for stars?

## 4. The concept

**Core loop:** Look → Notice → Learn → Return.

1. **Look.** Open the camera view. The frame is divided into habitat zones:
   sky, horizon and offshore, surf line, dry sand and dunes.
2. **Notice.** Line-art creatures draw themselves into the zone where they
   live, filtered by time of day. Drag the sun across the sky to move from
   dawn to midnight and watch the cast change.
3. **Learn.** Tap a creature: name, when it's here, how often, one good fact,
   and who it's connected to (what it eats, what eats it, who shares its
   habitat).
4. **Return.** "Come back at dusk" or "come back in June." The app sends you
   to a time, not a spot.

Data language: "seen most days," "common in summer," "after dark," "seasonal
visitor," "rare, but here." Never "here right now." Nothing is tracked live.

## 5. Storyline flow (the presentation site)

| Act | Beat | On screen |
|---|---|---|
| 1 | The hook | Full-bleed beach video at noon. Nothing moves. "I camped here in August. I saw dolphins. I wondered what else I was missing." |
| 2 | The problem | Three numbers: 3.2M visitors, 300+ bird species, most see horses and gulls. Extinction of experience in one sentence. The Pokémon stat. |
| 3 | The insight | Merlin did this for sound. Star Walk did it for the sky. Nobody has done it for the shore. |
| 4 | The idea | One line and the loop: Look, Notice, Learn, Return. |
| 5 | The flow | Phone frame, three wireframe screens, clickable: Arrive → Point → Tap. Below: the "later" list. |
| 6 | The branded screen | The camera view, live. Drag the sun. Noon: gulls and sanderlings. Dusk: ghost crabs draw in. Midnight: a fox on the tide line. Payoff line: "This beach isn't empty at all." |
| 7 | The look | Moodboard, references, palette, type, and the decisions. |
| 8 | Honesty | What's real data vs. concept, edge cases, guardrails, what's next. |

The emotional arc: empty → curious → revealed → responsible.

## 6. Edge cases (note them, don't build them)

- **Not at Assateague.** v1 is one island. Later: any coast, using
  iNaturalist and GBIF occurrence data by location and month.
- **No GPS or permission denied.** Fall back to choosing a location by hand.
- **Pointed at nothing.** Indoors or at the ground: a gentle "point at the
  shore" hint, no creatures.
- **Night.** The camera sees black. The simulated scene takes over, which is
  the feature, not a failure.
- **Sensitive species.** Piping plover nests, sea turtle nests: never show a
  precise spot. Show "nesting season, closed areas" and where not to walk.
  Follow iNaturalist's practice of obscuring threatened species locations.
- **Weak signal at the beach.** Everything bundled; the app works offline.
- **Seasons.** The time control covers the day. Season is a toggle later.
- **Expectation gap.** They look and see nothing. The copy sets it up:
  "commonly here," plus "best chance: dawn, low tide."
- **Safety.** Horses: stay 40 feet away. Don't flip horseshoe crabs. Don't dig
  out crab burrows. Don't shine lights at nesting turtles.
- **Accessibility.** Reduced motion (skip the drawing animation), screen
  reader labels for each creature, contrast of white line art over bright
  midday sand (add a soft scrim).
- **Desktop vs. phone.** Tilt on phone, drag on desktop, both move the view.

## 7. Black Mirror scenario

1. **The crowd machine.** The app shows the rare thing precisely. Everyone
   goes there. Plover nests get trampled and horses get mobbed. This already
   happens with rare-bird alerts and geotagged posts; it is why iNaturalist
   obscures sensitive species to a 0.2 degree cell.
2. **The extraction game.** Add collecting, streaks, and badges, and the beach
   becomes a hunting map. People flash lights at ghost crabs and flip
   horseshoe crabs for a badge.
3. **The filter.** You watch the beach through the phone. The dolphin isn't
   real until the app says so. The reveal replaces the experience it was meant
   to open.
4. **The surveillance shore.** Every animal tagged and live. Poachers get a
   map. Visitors expect wildlife on demand and are angry when the ocean
   doesn't deliver.

**Guardrails, as design decisions:**
- "Commonly here," never live positions.
- No precise locations for sensitive species.
- No collecting, badges, or streaks.
- "Come back at dusk" nudges you to a time, not a spot.
- Every card ends with one button, "Back to the beach", and there is no feed
  to keep scrolling. (A timed "Now look up." pause was tried and removed on
  2026-09-24: it hid the controls with no sign they would return.)

## 8. Does this need any API keys?

**For the challenge submission: no.** The prototype uses a curated JSON
dataset, a looping video, and browser APIs. It deploys as static files on
Vercel Drop, which also provides the HTTPS the camera and sensors require.

If it grows into real data later, everything needed is keyless:

| Need | Source | Key? |
|---|---|---|
| What's been seen here, by month | iNaturalist API v1 `observations` by lat/lng/radius | No |
| Species occurrence, global | GBIF occurrence API | No |
| Marine occurrences | OBIS API | No |
| Tides (low tide, spawning high tides) | NOAA CO-OPS API, station 8570283 Ocean City Inlet | No |
| Sunrise, sunset, moon phase | sunrise-sunset.org or Open-Meteo | No |
| Camera feed | `getUserMedia` | Permission only |
| Tilt to move zones | `DeviceOrientation` (iOS needs a tap to request) | Permission only |
| Location | `Geolocation` | Permission only |

Avoid Mapbox and Google Maps for now; both need keys and neither is needed.

## 9. Research to cite in the presentation

- Pyle, R. M. (1978). The extinction of experience. *Horticulture*.
- Soga, M. & Gaston, K. J. (2016). Extinction of experience: the loss of
  human–nature interactions. *Frontiers in Ecology and the Environment*.
- Balmford, A. et al. (2002). Why conservationists should heed Pokémon.
  *Science*.
- Passmore, H.-A. & Holder, M. D. (2017). Noticing nature: individual and
  social benefits of a two-week intervention. *Journal of Positive
  Psychology*.
- Richardson, M. et al. (2021). Actively noticing nature (not just time in
  nature) helps promote nature connectedness. *Ecopsychology*.
- NPS, Assateague Island National Seashore: visitation and species lists.
- Maryland DNR: horseshoe crab spawning peaks on evening high tides near the
  full and new moons of May and June.
- Cornell Lab, Merlin Sound ID: the "reveal what you can't see" precedent.
- iNaturalist geoprivacy policy: the precedent for obscuring sensitive
  species.

## 10. Scope for tomorrow

Build: presentation site, three wireframe screens, one branded screen (camera
view with sun control and line art), moodboard section, deploy.

Cut: bay side, seasons, live camera, tracked individuals, connections graph
beyond a simple list. All go in the "later" list on the site.
