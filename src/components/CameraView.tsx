import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useTransform, type MotionValue } from 'motion/react'
import LineArt from './LineArt'
import { activeAt, isActive, SPECIES, ZONES, type Species } from '../data/species'
import { RETURN, RULES, linkedSpecies, shortSize } from '../data/return'
import { brightness, celestial, dawnness, daylight, duskness, formatTime, nightness, phase, twilight, type Phase } from '../lib/time'

/**
 * The branded screen. One photo of this beach fills the stage behind the
 * phone, and the phone shows the exact same photo at the exact same place,
 * so the frame reads as a window rather than a mockup. Scroll tilts the
 * view from sky to sand; both the backdrop and the window ride the same pan.
 * Time of day grades the world in both. Only the phone adds the life:
 * creatures anchored to the photo arrive as the pan reaches their zone,
 * and only when the hour is right.
 *
 * The UI follows the Notice / Learn / Return wireframes in chapter 03:
 * a greeting and one metadata line up top, four hour chips in the thumb
 * zone, a Learn sheet with a three-stat row and linked connections, and a
 * per-animal Return page on demand. Type on the phone is 12 / 16 / 24 / 48.
 */

export const PHOTO = { src: '/img/shore.jpg', ratio: 2000 / 1334 }
/** The photo is zoomed past cover so there is room to pan. */
export const ZOOM = 1.3

export interface Stage { w: number; h: number }

/**
 * Photo box: cover the stage, then zoom, centred horizontally. `travel` is
 * how far it pans (negative). It runs a little past cover so the dry sand
 * clears the phone's own footer at the end; the strip that opens at the
 * stage bottom is night, under a fade.
 */
export const OVERRUN = 0.29
export function photoBox(stage: Stage) {
  const w = Math.max(stage.w, stage.h * PHOTO.ratio) * ZOOM
  const h = w / PHOTO.ratio
  return { w, h, left: (stage.w - w) / 2, travel: stage.h - h - Math.round(stage.h * OVERRUN) }
}

// Deterministic star field, kept to the sky part of the photo.
const STARS = (() => {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 90 }, () => ({ x: rnd() * 100, y: rnd() * 52, r: 0.5 + rnd() * 1.2, d: rnd() * 4 }))
})()

/** The hour chips. Selection follows the phase of the day, so the site's rail and the chips agree. */
const CHIPS: { label: string; t: number; phase: Phase }[] = [
  { label: 'Dawn', t: 6.25, phase: 'dawn' },
  { label: 'Day', t: 12, phase: 'day' },
  { label: 'Dusk', t: 19.5, phase: 'dusk' },
  { label: 'Night', t: 23, phase: 'night' },
]

/** Scene grading stays true to the photo, not the brand palette: a moonlit blue-black night. */
export const NIGHT = '#023146'

const GREET: Record<Phase, string> = { dawn: 'Good morning', day: 'Good afternoon', dusk: 'Good evening', night: 'Good night' }

/** Caveat, the margin-note hand, for labels that sit on the photo. */
const HAND = { fontFamily: 'var(--font-hand)' } as const
const SHADOW = { textShadow: '0 1px 2px rgba(2,49,70,0.7), 0 0 10px rgba(2,49,70,0.5)' } as const
/** Bright daylight washes out white, so by day the creatures draw larger, in black, with no shadow. */
const DAY_INK = '#023146'

/** The world: the photo graded by the hour, with the sun or moon on its arc. Used behind the phone and inside it. */
export function Scene({ time, stage, pan, children }: { time: number; stage: Stage; pan: MotionValue<number>; children?: ReactNode }) {
  const box = photoBox(stage)
  const top = useTransform(() => box.travel * pan.get())
  const d = daylight(time)
  const tw = twilight(time)
  const n = nightness(time)
  const body = celestial(time)
  const dawn = dawnness(time)
  const dusk = duskness(time)
  const bright = brightness(time)
  // Three looks, mixed by the hour. The photo was shot in soft late light, so each look is a
  // colour wash (blend mode "color" keeps the photo's luminance, swaps its hue) plus a filter:
  //   dawn   a saturated orange-gold sky, yellow at the sun, a dark warm foreground
  //   day    a bright beach: cyan sky, turquoise water, near-white sand
  //   dusk   lavender above, a peach band at the horizon, cool violet water and sand
  const grade = `brightness(${0.42 + 0.58 * d + 0.16 * tw + 0.3 * dawn + 0.15 * dusk + 0.1 * bright}) saturate(${0.65 + 0.35 * d + 0.12 * tw + 0.1 * dawn + 0.35 * bright}) contrast(${1 + 0.06 * bright})`
  const near = body.kind === 'sun' ? Math.max(dawn, dusk) : 0 // the sun is big and glowing at the horizon

  return (
    <motion.div className="absolute" style={{ width: box.w, height: box.h, left: box.left, top, willChange: 'top' }}>
      <img src={PHOTO.src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: grade }} draggable={false} />
      {/* bright day */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: bright * 0.7,
          background: 'linear-gradient(180deg, rgb(30,140,235) 0%, rgb(80,175,240) 40%, rgb(120,200,235) 57%, rgb(30,190,190) 60%, rgb(80,205,200) 70%, rgb(250,242,220) 78%, rgb(250,244,225) 100%)',
          mixBlendMode: 'color',
        }}
      />
      {/* dawn */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: dawn * 0.35,
          background: 'linear-gradient(180deg, rgb(255,110,40) 0%, rgb(255,140,40) 30%, rgb(255,185,50) 50%, rgb(255,215,80) 58%, rgb(255,140,50) 61%, rgb(150,70,40) 75%, rgb(90,50,40) 100%)',
          mixBlendMode: 'color',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: dawn * 0.18,
          background: `radial-gradient(ellipse 60% 40% at ${body.x}% ${body.y}%, rgba(255,230,140,0.9) 0%, rgba(255,170,60,0.5) 40%, rgba(255,120,40,0) 100%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* dusk */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: dusk * 0.32,
          background: 'linear-gradient(180deg, rgb(115,90,175) 0%, rgb(160,130,200) 35%, rgb(215,170,180) 50%, rgb(245,190,145) 58%, rgb(225,170,150) 61%, rgb(110,105,165) 72%, rgb(95,95,150) 100%)',
          mixBlendMode: 'color',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: dusk * 0.12,
          background: 'linear-gradient(180deg, rgba(90,70,150,0.6) 0%, rgba(120,100,170,0.2) 45%, rgba(250,200,150,0.35) 58%, rgba(60,60,110,0.5) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* night */}
      <div className="pointer-events-none absolute inset-0" style={{ background: NIGHT, opacity: n * 0.55, mixBlendMode: 'multiply' }} />
      {/* stars */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: n }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.1} fill="#fff" style={{ animation: `twinkle ${3 + s.d}s ease-in-out infinite`, animationDelay: `${s.d}s` }} />
        ))}
      </svg>
      {/* sun or moon, on one arc across the sky. The sun swells and goes orange as it meets the horizon. */}
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left,top] duration-200"
        style={{
          left: `${body.x}%`,
          top: `${body.y}%`,
          width: body.kind === 'sun' ? 56 + 40 * near : 36,
          height: body.kind === 'sun' ? 56 + 40 * near : 36,
          background: body.kind === 'sun'
            ? `radial-gradient(circle, rgba(255,251,232,0.9) 0%, ${near > 0.5 ? 'rgba(255,211,106,0.7)' : 'rgba(255,230,163,0.65)'} 50%, rgba(255,200,120,0) 100%)`
            : 'radial-gradient(circle, #ffffff 0%, #ddf1f1 70%)',
          boxShadow: body.kind === 'sun'
            ? `0 0 ${80 + 140 * near}px ${30 + 50 * near}px rgba(255,${Math.round(210 - 60 * near)},${Math.round(140 - 80 * near)},${0.28 + 0.2 * near})`
            : '0 0 48px 14px rgba(221,241,241,0.35)',
          opacity: body.kind === 'sun' ? 0.7 : n,
        }}
      />
      {/* moon glint on the water */}
      <div
        className="pointer-events-none absolute -translate-x-1/2"
        style={{ left: `${body.x}%`, top: '60%', width: 90, height: '14%', opacity: body.kind === 'moon' ? n * 0.45 : 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0))', filter: 'blur(8px)' }}
      />
      {children}
    </motion.div>
  )
}

/** A creature pinned to the photo. It draws itself in each time the pan brings it into view. */
function Creature({ s, root, day, onSelect }: { s: Species; root: HTMLElement | null; day: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [visits, setVisits] = useState(0)
  // The screen is a narrow slice of a wide photo, so a creature anchored near the slice's edge
  // would be clipped. Nudge it sideways until the drawing and its label sit inside the screen,
  // with room for its idle drift.
  const [shift, setShift] = useState(0)
  const shiftRef = useRef(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !root) return
    const EDGE = 18
    const fit = () => {
      const r = el.getBoundingClientRect()
      const b = root.getBoundingClientRect()
      const l = r.left - shiftRef.current
      const rt = r.right - shiftRef.current
      let next = 0
      if (rt - l > b.width - EDGE * 2) next = b.left + b.width / 2 - (l + rt) / 2
      else if (l < b.left + EDGE) next = b.left + EDGE - l
      else if (rt > b.right - EDGE) next = b.right - EDGE - rt
      next = Math.round(next)
      if (next !== shiftRef.current) { shiftRef.current = next; setShift(next) }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    ro.observe(el)
    return () => ro.disconnect()
  }, [root])
  useEffect(() => {
    const el = ref.current
    if (!el || !root) return
    let was = false
    const io = new IntersectionObserver(
      ([e]) => {
        const now = e.intersectionRatio > 0.6
        if (now && !was) setVisits((v) => v + 1)
        was = now
      },
      { root, threshold: [0, 0.6, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [root])
  return (
    <motion.button
      ref={ref}
      onClick={onSelect}
      className="bob absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${s.x}%`, top: `${s.y}%`, marginLeft: shift }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visits > 0 ? 1 : 0 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.5 }}
      aria-label={`${s.name}: ${s.frequency}`}
    >
      <LineArt key={visits} id={s.id} scale={(s.scale ?? 1) * 1.2} animate={visits > 0} idle color={day ? DAY_INK : undefined} shadow={!day} />
      <span className={`whitespace-nowrap leading-none transition-colors duration-700 text-24 font-medium ${day ? '' : 'text-paper'}`} style={day ? { ...HAND, color: DAY_INK } : { ...HAND, ...SHADOW }}>{s.name}</span>
    </motion.button>
  )
}

/* Sheet and Return furniture, the branded twins of the wireframe's Stat, Row, Primary and Footer. */

/** Value first, label under it. The value is always the louder of the two. */
function Stat({ big, label, onClick }: { big: string; label: string; onClick?: () => void }) {
  const cls = 'min-w-0 border-l border-line pl-3 text-left first:border-0 first:pl-0'
  const inner = (
    <>
      <p className={`whitespace-nowrap font-display text-24 leading-none tabular-nums text-ink ${onClick ? 'underline decoration-line underline-offset-4' : ''}`}>{big}</p>
      <p className="mt-2 whitespace-nowrap text-12 font-medium uppercase tracking-wide text-ink">{label}{onClick ? ' →' : ''}</p>
    </>
  )
  return onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>
}

/** Hairline list row, 40px tall so it reads as a target even when it isn't one. With `onClick` it is one. */
function Row({ left, right, onClick }: { left: string; right?: string; onClick?: () => void }) {
  const cls = 'flex min-h-10 w-full items-center justify-between gap-3 border-b border-line py-2 text-left text-16'
  const inner = (
    <>
      <span className="text-ink">{left}</span>
      <span className="shrink-0 text-ink-muted">{right ?? (onClick ? '→' : '')}</span>
    </>
  )
  return onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>
}

function Primary({ children, onClick }: { children: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-12 w-full items-center justify-center rounded-full bg-navy text-16 font-normal text-paper">{children}</button>
}

const SCROLL = 'soft-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain'

export default function CameraView({
  time,
  onTimeChange,
  stage,
  pan,
  window: win,
  lift,
}: {
  time: number
  onTimeChange: (t: number) => void
  /** The stage the phone sits in. */
  stage: Stage
  /** 0 = pointing at the sky, 1 = pointing at the sand. */
  pan: MotionValue<number>
  /** Where this screen sits in the stage when the phone is at rest, px. */
  window: { x: number; y: number }
  /** How far the phone is currently lifted below rest, px. The window counters it so the photo stays put. */
  lift: MotionValue<number>
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const counter = useTransform(() => -lift.get())
  const box = photoBox(stage)
  const top = useTransform(() => box.travel * pan.get())

  const here = activeAt(time)
  const sel = SPECIES.find((s) => s.id === selected) ?? null
  const plan = sel ? RETURN[sel.id] : null
  const alsoOut = sel && plan ? SPECIES.filter((s) => s.id !== sel.id && isActive(plan.t, s.active)).slice(0, 3) : []
  const ph = phase(time)

  const close = () => {
    setSelected(null)
    setReturning(false)
  }

  const layer = { width: stage.w, height: stage.h, left: -win.x, top: -win.y, y: counter }

  return (
    <div ref={setRoot} className="relative h-full w-full overflow-hidden font-sans text-paper select-none" style={{ background: NIGHT }}>
      {/* A stage-sized layer, offset so the photo lines up with the one behind the phone. */}
      <motion.div className="absolute" style={layer}>
        <Scene time={time} stage={stage} pan={pan} />
      </motion.div>

      {/* The life, on the same layer. It runs to the top edge now that the greeting lives in the bottom panel. */}
      <div className="absolute inset-0">
        <motion.div className="absolute" style={layer}>
          <motion.div className="absolute" style={{ width: box.w, height: box.h, left: box.left, top }}>
            {/* No zone labels on the photo: the wireframe names the bands, the prototype lets the picture do it. */}
            {/* creatures */}
            <AnimatePresence>
              {here.map((s) => <Creature key={s.id} s={s} root={root} day={ph === 'day'} onSelect={() => { setReturning(false); setSelected(s.id) }} />)}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* greeting, the metadata line and the hour, all in the thumb zone on a paper panel with an organic top edge so the controls sit apart from the photo */}
      <footer className="absolute inset-x-0 bottom-0 bg-paper px-5 pb-5 pt-4 text-ink">
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 -top-9 h-10 w-full" viewBox="0 0 320 40" preserveAspectRatio="none">
          <path d="M0 22 C 30 6, 58 34, 92 20 S 150 0, 184 14 S 244 36, 276 16 S 306 4, 320 12 V 40 H 0 Z" fill="var(--color-paper)" />
        </svg>
        <p className="font-display text-24 leading-none text-ink">{GREET[ph]}</p>
        <p className="mt-2 text-12 font-medium uppercase tracking-wide tabular-nums text-ink">{formatTime(time)} · low tide 2:10 pm</p>
        <p className="mt-6 text-12 font-medium uppercase tracking-wide text-ink">Pick the time of day</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CHIPS.map((c) => {
            const on = ph === c.phase
            return (
              <button
                key={c.label}
                onClick={() => onTimeChange(c.t)}
                aria-pressed={on}
                className={`flex min-h-12 items-center justify-center rounded-xl border text-16 transition ${on ? 'border-navy bg-navy text-paper' : 'border-navy/30 text-ink hover:border-navy/60'}`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </footer>

      {/* Learn: a sheet over the frame. Tap the beach above it to keep exploring; the one button plans the return. */}
      <AnimatePresence>
        {sel && plan && !returning && (
          <>
            <motion.button
              key="dim"
              aria-label="Close"
              onClick={close}
              className="absolute inset-0 z-10 bg-navy/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              key="sheet"
              className="absolute inset-x-0 bottom-0 z-20 flex max-h-[82%] flex-col rounded-t-[28px] bg-paper text-ink"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line" />
              <div data-lenis-prevent className={`${SCROLL} px-5 pb-4 pt-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-24 leading-tight">{sel.name}</h3>
                    <p className="text-16">{sel.scientific}</p>
                    <p className="mt-2 text-12 font-medium uppercase tracking-wide text-ink">{sel.when} · {sel.frequency}</p>
                  </div>
                  <div className="shrink-0 pt-1"><LineArt key={sel.id} id={sel.id} scale={0.8} color="var(--color-ink)" animate shadow={false} /></div>
                </div>
                <p className="mt-3 text-24 leading-none text-ink" style={HAND}>{ZONES[sel.zone].label} · this beach</p>
                <div className="mt-6 flex justify-between gap-2 border-y border-line py-3">
                  <Stat big={plan.time} label="Best chance" onClick={() => setReturning(true)} />
                  <Stat big={shortSize(sel.size)} label="Size" />
                  <Stat big={ZONES[sel.zone].label} label="Zone" />
                </div>
                <p className="mt-6 text-16 text-ink">{sel.fact}</p>
                <div className="mt-6">
                  <p className="text-16">Connected to</p>
                  {sel.connections.map((c) => {
                    const id = linkedSpecies(c)
                    return <Row key={c} left={c} onClick={id ? () => setSelected(id) : undefined} />
                  })}
                </div>
              </div>
              <div className="shrink-0 border-t border-line px-5 pb-5 pt-3">
                <Primary onClick={() => setReturning(true)}>{`${plan.cta} →`}</Primary>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Return: the ending, on demand. A time to come back, who else is out, the rules. No pins. */}
      <AnimatePresence>
        {sel && plan && returning && (
          <motion.div
            key="return"
            className="absolute inset-0 z-30 flex flex-col bg-paper text-ink"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="relative shrink-0 bg-foam/60 px-5 pb-8 pt-12">
              <LineArt key={sel.id} id={sel.id} scale={1.17} color="var(--color-ink)" animate shadow={false} />
              <p className="mt-4 text-12 font-medium uppercase tracking-wide text-ink">You noticed the {sel.name.toLowerCase()}.</p>
              <p className="mt-6 text-16">{plan.when}</p>
              <p className="mt-2 font-display text-48 leading-none tabular-nums text-ink">{plan.time}</p>
              <p className="mt-2 max-w-[26ch] text-16 text-ink-muted">{plan.note}</p>
            </div>
            <div data-lenis-prevent className={`${SCROLL} px-5 pb-4 pt-2`}>
              <p className="text-16 font-medium">Also out then</p>
              {alsoOut.map((s) => <Row key={s.id} left={s.name} right={ZONES[s.zone].label} />)}
              {alsoOut.length === 0 && <p className="border-b border-line py-2 text-16 text-ink-muted">Nobody else. That hour belongs to the {sel.name.toLowerCase()}.</p>}
              <p className="mt-6 text-16 font-medium">Before you go</p>
              {RULES.map((x) => <Row key={x} left={x} />)}
            </div>
            <div className="shrink-0 border-t border-line px-5 pb-5 pt-3">
              <p className="mb-3 text-24 leading-none text-ink" style={HAND}>No pins. Just a time.</p>
              <Primary onClick={close}>Back to the beach</Primary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
