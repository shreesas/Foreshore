/** All time math for the camera view. `t` is hours, 0–24. Sun hours are late-summer Assateague. */

export const SUNRISE = 5.75
export const SUNSET = 19.75
const DAY_LEN = SUNSET - SUNRISE

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

/** 0 at sunrise/sunset, 1 at solar noon, 0 all night. */
export function daylight(t: number): number {
  return Math.max(0, Math.sin((Math.PI * (t - SUNRISE)) / DAY_LEN))
}

/** 1 right at sunrise or sunset, fading to 0 about 75 minutes away. */
export function twilight(t: number): number {
  const d = Math.min(Math.abs(t - SUNRISE), Math.abs(t - SUNSET))
  return Math.max(0, 1 - d / 1.25)
}

/** 1 in full night, 0 in full day. */
export function nightness(t: number): number {
  return 1 - Math.min(1, daylight(t) * 2.5 + twilight(t) * 0.7)
}

export function phase(t: number): Phase {
  if (t >= SUNRISE - 0.75 && t < SUNRISE + 1.25) return 'dawn'
  if (t >= SUNRISE + 1.25 && t < SUNSET - 1.75) return 'day'
  if (t >= SUNSET - 1.75 && t < SUNSET + 0.5) return 'dusk'
  return 'night'
}

export const PHASE_LABEL: Record<Phase, string> = {
  dawn: 'Dawn',
  day: 'Daytime',
  dusk: 'Dusk',
  night: 'Night',
}

export function formatTime(t: number): string {
  let h = Math.floor(t)
  let m = Math.round((t - h) * 60)
  if (m === 60) { m = 0; h += 1 }
  h = h % 24
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Where the sun or moon sits on the sky arc, as percent of the camera photo (the horizon is at 59%). */
export function celestial(t: number): { kind: 'sun' | 'moon'; x: number; y: number } {
  const isDay = t >= SUNRISE && t < SUNSET
  const frac = isDay ? (t - SUNRISE) / DAY_LEN : ((t - SUNSET + 24) % 24) / (24 - DAY_LEN)
  return { kind: isDay ? 'sun' : 'moon', x: 24 + frac * 52, y: 58 - 44 * Math.sin(Math.PI * frac) }
}

/** 1 in the golden half hour after sunrise, fading out about 90 minutes either side. */
export function dawnness(t: number): number {
  return Math.max(0, 1 - Math.abs(t - (SUNRISE + 0.4)) / 1.6)
}

/** 1 in the half hour before sunset, fading out about 90 minutes either side. */
export function duskness(t: number): number {
  return Math.max(0, 1 - Math.abs(t - (SUNSET - 0.4)) / 1.6)
}

/** 1 in full bright daylight, 0 once the light starts to go golden. */
export function brightness(t: number): number {
  const d = Math.max(0, Math.min(1, (daylight(t) - 0.3) / 0.35))
  return d * (1 - Math.max(dawnness(t), duskness(t)))
}
