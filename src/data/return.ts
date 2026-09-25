import { SPECIES } from './species'

/** What the Return screen promises for each creature. `t` is the hour it points you to. */
export interface Plan { when: string; time: string; t: number; cta: string; note: string }

export const RETURN: Record<string, Plan> = {
  gull: { when: 'Right now', time: 'Look up', t: 12, cta: 'Look up now', note: 'They work the tide line all day and nest on the bay islands behind you.' },
  dolphin: { when: 'Tomorrow', time: '6:30 am', t: 6.5, cta: 'Come back at dawn', note: 'Calm water, early. Watch just past the breakers for a line of fins rolling through.' },
  sanderling: { when: 'Low tide', time: '2:10 pm', t: 14.2, cta: 'Come back at low tide', note: 'They chase each wave out and race it back. Stand still and they come to you.' },
  ghostcrab: { when: 'Tonight', time: '8:45 pm', t: 21.5, cta: 'Come back tonight', note: 'Sunset is 7:45. Ghost crabs surface about an hour after. Bring a red light and stay off the dunes.' },
  fox: { when: 'First light', time: '5:30 am', t: 5.5, cta: 'Come back at first light', note: "You probably won't see the fox. You will see its tracks, before anyone else walks the beach." },
  horseshoe: { when: 'June', time: 'Full moon', t: 22, cta: 'Come back in June', note: "Evening high tide near the full or new moon, May and June. Don't flip them." },
}

/** The guardrails, as a checklist on the way out the door. */
export const RULES = ['Red light, not white', 'Stay off the dunes', 'Forty feet from the horses']

/** "8–12 ft · ~600 lb" → "8–12 ft", for the stat row. */
export const shortSize = (s: string) => s.match(/^[\d–.~]+ ?[a-z]+/)?.[0] ?? s

/** A connection line that names another cast creature links to it. */
export const linkedSpecies = (line: string) => SPECIES.find((s) => line.toLowerCase().includes(s.name.toLowerCase()))?.id
