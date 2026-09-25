import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import LineArt from './LineArt'
import Phone from './Phone'
import { SPECIES, ZONES, isActive } from '../data/species'
import { formatTime } from '../lib/time'
import { RETURN, RULES, linkedSpecies, shortSize } from '../data/return'

/*
  Clickable wireframe, four screens: Look → Notice → Learn → Return.
  Structure borrowed from travel-app onboarding patterns: a full-bleed hero
  with an organic wave edge into the content, a location tag over the hero,
  a chip row as the category axis (ours is time of day), a three-stat row on
  the detail, and one filled full-width CTA per screen.

  Second pass against the mobile-app-ui-design skill:
  - Four type sizes only (12 meta, 16 body and controls, 24 titles and stat
    values, 48 the one number per screen) and two weights (300 body, 400 on
    buttons). Values are always louder than their labels.
  - Every tappable thing is at least 44px tall. Rows are 40px of text plus a rule.
  - One filled CTA per screen, in the thumb zone. Secondary actions are text.
  - Learn and Return scroll under a pinned CTA instead of clamping copy.
  - Groups are 8px inside, 24px between.
  - The peak is Learn (the creature draws itself in), the ending is Return
    (what you noticed, when to come back, the rules, and no pins).
*/

const STEPS = [
  { title: 'Look', hint: 'Explore without an account.' },
  { title: 'Notice', hint: 'Pick the time of day and tap a creature.' },
  { title: 'Learn', hint: 'Learn more about each creature.' },
  { title: 'Return', hint: 'The best time to see them. Learn about who else is out there.' },
] as const

/** The margin note at each tab, written in beside the one tap that moves the flow on. */
const NEXT = ['start here', 'tap a creature', 'plan a visit', 'now look up'] as const

const WIRE = 'var(--color-wire)'

/** Caveat, the margin-note hand, for labels that sit on the photo. */
const HAND = { fontFamily: 'var(--font-hand)' } as const

const HOURS = [
  { label: 'Dawn', t: 5.75, greet: 'Good morning' },
  { label: 'Day', t: 12, greet: 'Good afternoon' },
  { label: 'Dusk', t: 19.6, greet: 'Good evening' },
  { label: 'Night', t: 22.5, greet: 'Good night' },
] as const

/** Band tops in the wireframe frame, percent of its height. The camera photo has its own bands; this frame is shorter. */
const BAND: Record<keyof typeof ZONES, number> = { sky: 0, offshore: 40, surf: 58, sand: 74 }

/** Where each creature sits in the wireframe frame: left edge and vertical centre, percent. Each stays inside its band. */
const SPOT: Record<string, { x: number; y: number; scale?: number }> = {
  gull: { x: 8, y: 20 },
  dolphin: { x: 12, y: 51 },
  sanderling: { x: 20, y: 67 },
  horseshoe: { x: 8, y: 68 },
  ghostcrab: { x: 8, y: 81 },
  fox: { x: 30, y: 92, scale: 0.7 },
}

/** The organic edge where a hero image drips into the content below it. */
function WaveEdge() {
  const d = 'M0 16 C 28 4, 52 28, 84 18 S 136 0, 168 12 S 226 30, 258 14 S 302 2, 320 10'
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-8 w-full" viewBox="0 0 320 32" preserveAspectRatio="none">
      <path d={`${d} V 32 H 0 Z`} fill="var(--color-wire-bg)" />
      <path d={d} fill="none" stroke="var(--color-wire)" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Handwritten note over a hero: location, zone, anything with a pin. */
function Tag({ children, className = '' }: { children: string; className?: string }) {
  return <span style={HAND} className={`text-24 leading-none text-ink ${className}`}>{children}</span>
}

/** Value first, label under it. The value is always the louder of the two. */
function Stat({ big, label, onClick }: { big: string; label: string; onClick?: () => void }) {
  const cls = 'min-w-0 border-l border-dashed border-wire pl-3 text-left first:border-0 first:pl-0'
  const inner = (
    <>
      <p className={`font-display text-24 leading-none tabular-nums text-ink ${onClick ? 'underline decoration-dashed decoration-wire underline-offset-4' : ''}`}>{big}</p>
      <p className="mt-2 text-12 text-ink-muted uppercase tracking-wide">{label}{onClick ? ' →' : ''}</p>
    </>
  )
  return onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>
}

/** Hairline list row, 40px tall so it reads as a target even when it isn't one. With `onClick` it is one. */
function Row({ left, right, onClick }: { left: string; right?: string; onClick?: () => void }) {
  const cls = 'flex min-h-10 w-full items-center justify-between gap-4 border-b border-dashed border-wire py-2 text-left text-16 text-ink'
  const inner = (
    <>
      <span>{left}</span>
      {right && <span className="shrink-0 text-12 text-ink-muted uppercase tracking-wide">{right}</span>}
      {onClick && <span className="shrink-0 text-ink-muted">→</span>}
    </>
  )
  return onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>
}

/** Which creature a connection line is about, if it names one in the cast: 'Chased by laughing gulls' → gull. */

/** The one filled button per screen. Weight 400 is the second of the two weights. `next` marks it for the margin note. */
function Primary({ children, onClick, hug = false, next = false }: { children: string; onClick?: () => void; hug?: boolean; next?: boolean }) {
  return (
    <button onClick={onClick} data-next={next || undefined} className={`min-h-12 rounded-full bg-navy text-16 font-normal text-paper ${hug ? 'px-[30px]' : 'w-full px-6'}`}>
      {children}
    </button>
  )
}

/** Sticky footer that keeps the CTA in the thumb zone while the body scrolls. */
function Footer({ children }: { children: ReactNode }) {
  return <div className="relative shrink-0 border-t border-dashed border-wire bg-wire-bg px-5 pb-5 pt-3">{children}</div>
}

/** Leading measurement of a size string: '3 ft nose to tail · 10 lb' → '3 ft'. */

const SCROLL = 'min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/** Where the next tap is, in the flow's own pixels: its left edge, its middle, and the phone's left side. */
type Mark = { key: string; tab: number; x: number; y: number; edge: number }

/**
 * The margin note, in the same hand as the tags on the photo: a few words beside the phone and an
 * arrow drawn into the tap that moves the flow on. It draws itself in, the way the creatures do.
 * Wide screens only, where the phone has a margin to write in.
 */
function Note({ tab, x, y, edge }: Omit<Mark, 'key'>) {
  const still = useReducedMotion()
  // Above the tap, except on the two footers, where the words would sit on the button over it.
  const v = tab >= 2 ? 1 : -1
  const s = { x: edge - 8, y: y + v * 32 } // just past the end of the words
  const t = { x: x - 6, y } // just short of the tap
  const dx = t.x - s.x
  const c = { x: t.x - dx * 0.45, y: t.y + v * 16 }
  const a = Math.atan2(t.y - c.y, t.x - c.x)
  const barb = (turn: number) => `${t.x - 10 * Math.cos(a + turn)} ${t.y - 10 * Math.sin(a + turn)}`
  const draw = (delay: number, duration: number) =>
    still ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay, duration, ease: 'easeOut' as const } }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 hidden text-ink xl:block">
      <motion.p
        style={{ ...HAND, left: edge - 16, top: y + v * 22 }}
        className={`absolute w-max max-w-36 -translate-x-full text-right text-24 leading-none ${v < 0 ? '-translate-y-full' : ''}`}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {NEXT[tab]}
      </motion.p>
      <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d={`M ${s.x} ${s.y} C ${s.x + dx * 0.5} ${s.y + v * 10}, ${c.x} ${c.y}, ${t.x} ${t.y}`} {...draw(0.15, 0.5)} />
        <motion.path d={`M ${barb(0.5)} L ${t.x} ${t.y} L ${barb(-0.5)}`} {...draw(0.6, 0.15)} />
      </svg>
    </div>
  )
}

/**
 * Pass `tab` and `onTab` to drive the flow from outside (chapter 03's rows do); without them it keeps its own.
 */
export default function Wireflow({ tab: shown, onTab }: { tab?: number; onTab?: (tab: number) => void }) {
  // Tabs: 0 Look, 1 Notice, 2 Learn, 3 Return. Learn is a sheet over Notice, not a screen,
  // so three screens carry the four tabs under the phone.
  const [own, setOwn] = useState(0)
  const tab = shown ?? own
  const go = (t: number) => { setOwn(t); onTab?.(t) }
  const step = tab === 0 ? 0 : tab === 3 ? 2 : 1
  const sheet = tab === 2
  const [hour, setHour] = useState(2)
  const [sel, setSel] = useState('ghostcrab')
  const open = (id: string) => { setSel(id); go(2) }
  const toBeach = () => go(1)
  const toReturn = () => go(3)

  const h = HOURS[hour]
  const cast = SPECIES.filter((s) => isActive(h.t, s.active))
  // On Notice the note points at the ghost crab when it's out, otherwise at whoever is.
  const pick = (cast.find((s) => s.id === 'ghostcrab') ?? cast[0])?.id

  // Find the tap marked data-next and measure it for the note, once the phone is on screen and the
  // tap has stopped moving (the Learn sheet slides up on a spring). A mark from an earlier tab is never drawn.
  const root = useRef<HTMLDivElement>(null)
  const seen = useInView(root, { once: true, margin: '-80px' })
  const [mark, setMark] = useState<Mark | null>(null)
  const key = `${tab}.${hour}.${sel}`
  useEffect(() => {
    if (!seen) return
    const read = (): Mark | null => {
      const el = root.current
      const next = el?.querySelector<HTMLElement>('[data-next]')
      const frame = el?.querySelector<HTMLElement>('[data-screen]')?.parentElement
      if (!el || !next || !frame) return null
      const a = el.getBoundingClientRect()
      // .grow-xl zooms the flow on very large screens: rects come back zoomed, the note's own
      // left and top don't, so bring the rects back to the flow's pixels.
      const k = el.offsetWidth ? a.width / el.offsetWidth : 1
      const b = next.getBoundingClientRect()
      const f = frame.getBoundingClientRect()
      return { key, tab, x: Math.round((b.left - a.left) / k), y: Math.round((b.top + b.height / 2 - a.top) / k), edge: Math.round((f.left - a.left) / k) }
    }
    // Two reads a beat apart have to agree before the hand draws anything.
    let last: Mark | null = null
    let tries = 0
    let id = 0
    const settle = () => {
      const m = read()
      if (m && last && m.x === last.x && m.y === last.y) setMark(m)
      else if (++tries < 20) { last = m; id = window.setTimeout(settle, 120) }
    }
    id = window.setTimeout(settle, 300)
    const again = () => { const m = read(); if (m) setMark(m) }
    window.addEventListener('resize', again)
    document.fonts?.addEventListener('loadingdone', again)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', again)
      document.fonts?.removeEventListener('loadingdone', again)
    }
  }, [seen, key, tab])
  const sp = SPECIES.find((s) => s.id === sel) ?? SPECIES[3]
  const r = RETURN[sp.id]
  const alsoOut = SPECIES.filter((s) => s.id !== sp.id && isActive(r.t, s.active)).slice(0, 3)

  return (
    <div ref={root} className="relative flex flex-col items-center gap-6">
      {/* the wireframe itself, the phone and its tabs: chapter 03's cursor folds down to its dot over this */}
      <div data-cursor="dot" className="flex flex-col items-center gap-6">
        <Phone wire>
          <div className="flex h-full flex-col text-wire">
            {step === 0 && (
              <>
                <div className="wire-hatch relative flex-1 overflow-hidden">
                  <Tag className="absolute left-5 top-14">Assateague Island, MD</Tag>
                  <div className="absolute right-5 top-[88px] opacity-70"><LineArt id="gull" scale={1} color={WIRE} animate={false} shadow={false} /></div>
                  <div className="absolute left-6 top-[44%] opacity-70"><LineArt id="dolphin" scale={1.4} color={WIRE} animate={false} shadow={false} /></div>
                  <div className="absolute bottom-20 right-5 opacity-70"><LineArt id="ghostcrab" scale={1.3} color={WIRE} animate={false} shadow={false} /></div>
                  <p className="absolute bottom-12 right-5 text-12 text-ink-muted uppercase tracking-wide">camera · facing east</p>
                  <WaveEdge />
                </div>
                <div className="px-5 pb-5 pt-1">
                  <p className="font-display text-48 leading-none text-ink">See who<br />lives here.</p>
                  <p className="mt-2 max-w-[28ch] text-16 text-ink-muted">Point your phone at the beach. The creatures that live in that part of the frame draw themselves in, at the hour they're actually out.</p>
                  <div className="relative mt-6">
                    <Primary onClick={() => go(1)} hug next>Look around →</Primary>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="relative flex h-full flex-col px-5 pb-5 pt-12">
                <p className="font-display text-24 italic leading-none text-ink">{h.greet}</p>
                <p className="mt-2 text-12 tabular-nums text-ink-muted uppercase tracking-wide">{formatTime(h.t)} · low tide 2:10 pm</p>
                <div className="wire-box relative mt-4 flex-1 overflow-hidden rounded-2xl">
                  {(Object.keys(ZONES) as (keyof typeof ZONES)[]).map((z) => (
                    <div key={z} className={`absolute inset-x-0 flex justify-end pr-3 pt-1 ${BAND[z] ? 'border-t border-dashed border-wire' : ''}`} style={{ top: `${BAND[z]}%` }}>
                      <span className="text-12 uppercase tracking-wide text-ink-muted">{ZONES[z].label}</span>
                    </div>
                  ))}
                  {cast.map((s) => (
                    <button key={s.id} onClick={() => open(s.id)} data-next={(tab === 1 && s.id === pick) || undefined} className="absolute flex min-h-11 -translate-y-1/2 items-center gap-2" style={{ left: `${SPOT[s.id].x}%`, top: `${SPOT[s.id].y}%` }}>
                      <LineArt id={s.id} scale={SPOT[s.id].scale ?? 0.8} color={WIRE} animate={false} shadow={false} />
                      <span style={HAND} className="whitespace-nowrap text-24 leading-none text-ink">{s.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-12 text-ink-muted uppercase tracking-wide">Pick the time of day</p>
                <div className="relative mt-2 grid grid-cols-4 gap-2">
                  {HOURS.map((x, i) => (
                    <button key={x.label} onClick={() => setHour(i)} aria-pressed={i === hour} className={`flex min-h-12 items-center justify-center rounded-xl border text-16 ${i === hour ? 'border-navy bg-navy/5 text-ink' : 'border-dashed border-wire text-ink-muted'}`}>
                      {x.label}
                    </button>
                  ))}
                </div>

                {/* Learn: a sheet over the frame. Tap outside or "Back to the beach" to keep exploring. */}
                <AnimatePresence>
                  {sheet && (
                    <>
                      <motion.button
                        aria-label="Close"
                        onClick={toBeach}
                        className="absolute inset-0 z-10 bg-navy/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      />
                      <motion.div
                        className="absolute inset-x-0 bottom-0 z-20 flex max-h-[82%] flex-col rounded-t-[28px] border border-b-0 border-dashed border-wire bg-wire-bg"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                      >
                        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-wire" />
                        <div data-lenis-prevent className={`${SCROLL} px-5 pb-4 pt-4`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-display text-24 leading-tight text-ink">{sp.name}</p>
                              <p className="text-16">{sp.scientific}</p>
                              <p className="mt-2 text-12 text-ink-muted uppercase tracking-wide">{sp.when} · {sp.frequency}</p>
                            </div>
                            <div className="shrink-0 pt-1"><LineArt key={sp.id} id={sp.id} scale={0.8} color={WIRE} animate shadow={false} /></div>
                          </div>
                          <Tag className="mt-3 block">{`${ZONES[sp.zone].label} · this beach`}</Tag>
                          <div className="mt-6 flex justify-between gap-3 border-y border-dashed border-wire py-3">
                            <Stat big={r.time} label="Best chance" onClick={toReturn} />
                            <Stat big={shortSize(sp.size)} label="Size" />
                            <Stat big={ZONES[sp.zone].label} label="Zone" />
                          </div>
                          <p className="mt-6 text-16 text-ink">{sp.fact}</p>
                          <div className="mt-6">
                            <p className="text-16">Connected to</p>
                            {sp.connections.map((c) => {
                              const id = linkedSpecies(c)
                              return <Row key={c} left={c} onClick={id ? () => setSel(id) : undefined} />
                            })}
                          </div>
                        </div>
                        <Footer>
                          <Primary onClick={toBeach}>Back to the beach</Primary>
                          <button onClick={toReturn} className="mt-1 flex min-h-11 w-full items-center justify-center text-16 text-ink-muted"><span data-next>{`${r.cta} →`}</span></button>
                        </Footer>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="wire-hatch relative shrink-0 px-5 pb-10 pt-12">
                  <p className="text-12 text-ink-muted uppercase tracking-wide">You noticed the {sp.name.toLowerCase()}.</p>
                  <p className="mt-6 text-16">{r.when}</p>
                  <p className="mt-2 font-display text-48 leading-none tabular-nums text-ink">{r.time}</p>
                  <p className="mt-2 max-w-[26ch] text-16 text-ink-muted">{r.note}</p>
                  <div className="absolute -right-3 top-10 opacity-40"><LineArt id={sp.id} scale={0.9} color={WIRE} animate={false} shadow={false} /></div>
                  <WaveEdge />
                </div>
                <div data-lenis-prevent className={`${SCROLL} px-5 pb-4 pt-2`}>
                  <p className="text-16 font-medium">Also out then</p>
                  {alsoOut.map((s) => <Row key={s.id} left={s.name} right={ZONES[s.zone].label} />)}
                  {alsoOut.length === 0 && (
                    <p className="border-b border-dashed border-wire py-2 text-16 text-ink-muted">Nobody else. That hour belongs to the {sp.name.toLowerCase()}.</p>
                  )}
                  <p className="mt-6 text-16 font-medium">Before you go</p>
                  {RULES.map((x) => <Row key={x} left={x} />)}
                </div>
                <Footer>
                  <p style={HAND} className="mb-3 text-24 leading-none text-ink">No pins. Just a time.</p>
                  <Primary onClick={toBeach} next>Back to the beach</Primary>
                </Footer>
              </>
            )}
          </div>
        </Phone>

        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button key={s.title} onClick={() => go(i)} className={`rounded-full px-3 py-1 font-display text-16 transition ${i === tab ? 'bg-navy text-paper' : 'text-ink-muted hover:bg-foam'}`}>
              {i + 1} · {s.title}
            </button>
          ))}
        </div>
      </div>
      <p className="max-w-[320px] text-center text-16 text-ink-muted">{STEPS[tab].hint}</p>

      {mark?.key === key && <Note key={mark.key} tab={mark.tab} x={mark.x} y={mark.y} edge={mark.edge} />}
    </div>
  )
}
