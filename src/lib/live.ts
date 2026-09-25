import { SPECIES, isActive } from '../data/species'

/** Everything in the top bar runs on the beach's clock, not the visitor's. */
const TZ = 'America/New_York'

/**
 * The months each animal is on this beach at all (1–12), from the `when` notes in species.ts.
 * The hours alone would put horseshoe crabs on the sand every night of the year.
 */
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const SEASON: Record<string, number[]> = {
  gull: [3, 4, 5, 6, 7, 8, 9, 10, 11], // spring through fall
  dolphin: [5, 6, 7, 8, 9, 10], // May through October
  sanderling: ALL_YEAR, // most of the year
  ghostcrab: [5, 6, 7, 8, 9, 10], // summer, into early fall
  fox: ALL_YEAR,
  horseshoe: [5, 6], // May and June
}

/** How the top bar names them, and who it names first: the ones people walk past without seeing. */
const SAY: [id: string, words: string][] = [
  ['ghostcrab', 'ghost crabs'],
  ['fox', 'a red fox'],
  ['horseshoe', 'horseshoe crabs'],
  ['dolphin', 'dolphins'],
  ['sanderling', 'sanderlings'],
  ['gull', 'laughing gulls'],
]

/** The time on Assateague, like "9:41 PM". */
export function beachClock(d: Date): string {
  return d.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
}

/** Who is out on the beach right now, up to `max` of them: "ghost crabs are out", "ghost crabs and a red fox are out". */
export function whoIsOut(d: Date, max = 1): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const hour = get('hour') + get('minute') / 60
  const month = get('month')
  const out = SAY.filter(([id]) => {
    const s = SPECIES.find((x) => x.id === id)
    return !!s && isActive(hour, s.active) && SEASON[id].includes(month)
  }).slice(0, max).map(([, words]) => words)
  if (!out.length) return 'the beach is quiet'
  return `${out.join(' and ')} ${out.length === 1 && out[0].startsWith('a ') ? 'is' : 'are'} out`
}
