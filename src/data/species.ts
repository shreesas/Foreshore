// Prototype dataset. Timing and seasonality follow NPS Assateague species notes;
// nothing here is tracked live. Drawings live in public/art; a species without
// `art` stays in the cast list but is not drawn into the camera view.

export type Zone = 'sky' | 'offshore' | 'surf' | 'sand'

// Bands are percent of the camera photo's height (public/img/shore.jpg). The horizon sits at 59%.
export const ZONES: Record<Zone, { label: string; band: [number, number] }> = {
  sky: { label: 'Sky', band: [3, 52] },
  offshore: { label: 'Offshore', band: [60, 72] },
  surf: { label: 'Surf line', band: [74, 81] },
  sand: { label: 'Dry sand', band: [82, 96] },
}

export interface Art {
  /** File under public/art. */
  src: string
  /** viewBox width / height, so the mask box has the drawing's proportions. */
  ratio: number
  /** Rendered width in px at scale 1. */
  w: number
  /** Flip horizontally so the creature faces into the frame. */
  flip?: boolean
}

export interface Species {
  id: string
  name: string
  scientific: string
  zone: Zone
  /** Anchor in the camera photo (public/img/shore.jpg), percent of its width and height. The phone is a narrow window on a wide photo, so keep x within 43–57 and y within 10–95. Creatures that are out at the same hour alternate left and right and sit about 10.5% apart vertically, so they clear each other at 1.2×. */
  x: number
  y: number
  scale?: number
  art?: Art
  /** Active window in hours (0–24). May wrap past midnight. */
  active: [number, number]
  when: string
  frequency: string
  bestTime: string
  size: string
  fact: string
  connections: string[]
}

export const SPECIES: Species[] = [
  {
    id: 'gull',
    name: 'Laughing gull',
    scientific: 'Leucophaeus atricilla',
    zone: 'sky',
    x: 47, y: 26, scale: 1,
    art: { src: '/art/gull.svg', ratio: 1.773, w: 132 },
    active: [5.5, 20],
    when: 'Daylight, spring through fall',
    frequency: 'Seen most days',
    bestTime: 'Any time the sun is up',
    size: '16 in · wingspan 40 in',
    fact: 'The black hood and the laugh are summer only. In winter the hood fades to a smudge behind the eye.',
    connections: ['Steals from sanderlings at the tide line', 'Nests on the bay marsh islands'],
  },
  {
    id: 'dolphin',
    name: 'Bottlenose dolphin',
    scientific: 'Tursiops truncatus',
    zone: 'offshore',
    x: 55, y: 63, scale: 0.9,
    art: { src: '/art/dolphin.svg', ratio: 0.91, w: 68, flip: true },
    active: [6, 18.5],
    when: 'Daylight, May through October',
    frequency: 'Common in summer',
    bestTime: 'Early morning, calm water',
    size: '8–12 ft · ~600 lb',
    fact: 'Look for a line of dorsal fins rolling through the swell just past the breakers. They herd fish against the sandbars.',
    connections: ['Follows schools of menhaden', 'Shares the coast with passing humpbacks in fall'],
  },
  {
    id: 'sanderling',
    name: 'Sanderling',
    scientific: 'Calidris alba',
    zone: 'surf',
    x: 45, y: 73.5, scale: 1,
    art: { src: '/art/sanderling.svg', ratio: 1.736, w: 92 },
    active: [6, 19.75],
    when: 'Daylight, most of the year',
    frequency: 'Seen most days',
    bestTime: 'Low tide',
    size: '8 in · 2 oz',
    fact: 'The small pale birds that sprint after each wave and race back as it returns, probing for mole crabs the surf uncovers.',
    connections: ['Eats mole crabs and horseshoe crab eggs', 'Chased by laughing gulls'],
  },
  {
    id: 'ghostcrab',
    name: 'Ghost crab',
    scientific: 'Ocypode quadrata',
    zone: 'sand',
    x: 56, y: 84, scale: 1,
    art: { src: '/art/ghostcrab.svg', ratio: 1.937, w: 120 },
    active: [19.5, 6],
    when: 'After dark, summer',
    frequency: 'Common on this beach',
    bestTime: 'An hour after sunset, with a red light',
    size: '2 in across',
    fact: 'Those holes in the dry sand are their burrows, up to four feet deep. At night they come out to hunt mole crabs.',
    connections: ['Hunts mole crabs at the tide line', 'Digs into sea turtle nests'],
  },
  {
    id: 'fox',
    name: 'Red fox',
    scientific: 'Vulpes vulpes',
    zone: 'sand',
    x: 44, y: 95, scale: 1,
    art: { src: '/art/fox.svg', ratio: 1.893, w: 128, flip: true },
    active: [21, 5.5],
    when: 'Night and dawn, all year',
    frequency: 'Regular, rarely seen',
    bestTime: 'First light, look for tracks',
    size: '3 ft nose to tail · 10 lb',
    fact: 'Foxes patrol the tide line at night for whatever the sea left behind. Their tracks are the first thing on the beach at dawn.',
    connections: ['Scavenges the wrack line', 'Preys on ghost crabs and plover eggs'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe crab',
    scientific: 'Limulus polyphemus',
    zone: 'surf',
    x: 44, y: 73, scale: 0.8,
    art: { src: '/art/horseshoe.svg', ratio: 1.317, w: 110 },
    active: [20.5, 3],
    when: 'Night high tides, May and June',
    frequency: 'Seasonal, in numbers',
    bestTime: 'Evening high tide near the full or new moon',
    size: '18 in · 4 lb',
    fact: 'Older than the dinosaurs. On late-spring nights near the full and new moon they come ashore by the thousands to spawn.',
    connections: ['Eggs feed sanderlings and red knots', 'Eaten by loggerhead turtles'],
  },
]

/** Species with a finished drawing: the ones the camera view can show. */
export const DRAWN = SPECIES.filter((s) => s.art)

export function isActive(t: number, [a, b]: [number, number]): boolean {
  return a <= b ? t >= a && t < b : t >= a || t < b
}

export function activeAt(t: number): Species[] {
  return DRAWN.filter((s) => isActive(t, s.active))
}
