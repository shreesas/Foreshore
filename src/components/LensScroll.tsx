import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import CameraView, { NIGHT, Scene, type Stage } from './CameraView'
import Phone from './Phone'
import { brightness, formatTime, nightness } from '../lib/time'

/**
 * Chapter 05 as a pinned scroll story, three beats long.
 *   1. The beach, full bleed, with one line: it looks empty.
 *   2. A phone rises from the bottom edge. Its screen shows the same photo,
 *      lined up with the one behind it, so it reads as a window.
 *   3. Scrolling on tilts the whole view from sky to sand. The backdrop and
 *      the window pan together; only the window adds the creatures.
 * The phone stays live the whole way: tap a creature, pick the hour.
 */

const SHIFTS = [
  { t: 6.25, label: 'Dawn', s: 'The sun comes up out of the water. Gulls first.' },
  { t: 12, label: 'Noon', s: 'Sanderlings at the surf line, a dolphin past the break.' },
  { t: 19.5, label: 'Dusk', s: 'The light goes warm. Ghost crabs surface.' },
  { t: 23.5, label: 'Midnight', s: 'A fox on the tide line. Horseshoe crabs in June.' },
]

/** The shift closest to the clock, wrapping past midnight, so exactly one button reads as on. */
const nearest = (t: number) =>
  SHIFTS.reduce((best, m) => {
    const d = (x: number) => Math.min(Math.abs(t - x), 24 - Math.abs(t - x))
    return d(m.t) < d(best.t) ? m : best
  })

const SHADOW = { textShadow: '0 1px 3px rgba(2,49,70,0.7), 0 2px 16px rgba(2,49,70,0.5)' }
/** By day the photo is bright: until the phone dims it, the overlay text goes black, with no shadow. Children keep saying text-paper; the token flips. */
const DAY_INK = { '--color-paper': '#023146' } as CSSProperties

export default function LensScroll({ time, onTimeChange }: { time: number; onTimeChange: (t: number) => void }) {
  const wrap = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage | null>(null)
  const current = nearest(time)
  const day = brightness(time) > 0.5
  const [win, setWin] = useState({ x: 0, y: 0 })

  const { scrollYProgress: p } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  // Once the phone is most of the way up, the beach around it has dimmed (see `focus`), so the
  // chapter's type goes light even by day.
  const [focused, setFocused] = useState(false)
  useMotionValueEvent(p, 'change', (v) => setFocused(v > 0.3))
  const ink = day && !focused ? DAY_INK : SHADOW
  const stageH = stage?.h ?? 900
  // Motion turns these into native scroll-timeline animations, and WAAPI fills
  // any missing 0% / 100% keyframe with the element's underlying value, so
  // every range below runs the full 0–1 and holds at each end.
  // Beat 1 line holds, then gives way as the phone comes up.
  const intro = useTransform(p, [0, 0.2, 0.32, 1], [1, 1, 0, 0])
  const introY = useTransform(p, [0, 0.2, 0.32, 1], [0, 0, -24, -24])
  // Beat 2: the phone rises from below the fold.
  const ease = (t: number) => 1 - Math.pow(1 - t, 3)
  const lift = useTransform(p, [0, 0.14, 0.46, 1], [stageH * 1.08, stageH * 1.08, 0, 0], { ease: [ease, ease, ease] })
  // ...and as it comes up, the beach around it dims, so the window is the one lit thing on the stage.
  const focus = useTransform(p, [0, 0.14, 0.46, 1], [0, 0, 1, 1])
  // Beat 3: sky to sand.
  const pan = useTransform(p, [0, 0.48, 0.96, 1], [0, 0, 1, 1])
  const strip = useTransform(p, [0, 0.8, 0.96, 1], [0, 0, 1, 1])
  const rail = useTransform(p, [0, 0.44, 0.56, 1], [0, 0, 1, 1])
  const railY = useTransform(p, [0, 0.44, 0.56, 1], [16, 16, 0, 0])
  // The note beside the phone comes in once it's up, and stays while you explore.
  const hint = useTransform(p, [0, 0.46, 0.54, 1], [0, 0, 1, 1])

  // Measure the stage and where the phone screen sits in it at rest.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const s = { w: el.clientWidth, h: el.clientHeight }
      setStage((cur) => (cur && cur.w === s.w && cur.h === s.h ? cur : s))
      const screen = phoneRef.current?.querySelector<HTMLElement>('[data-screen]')
      if (!screen) return
      const a = el.getBoundingClientRect()
      const b = screen.getBoundingClientRect()
      const w = { x: Math.round(b.left - a.left), y: Math.round(b.top - a.top - lift.get()) }
      setWin((cur) => (cur.x === w.x && cur.y === w.y ? cur : w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (phoneRef.current) ro.observe(phoneRef.current)
    return () => ro.disconnect()
  }, [lift])

  return (
    <>
      <section id="screen" ref={wrap} className="relative text-paper" style={{ background: NIGHT, height: '380vh' }}>
        <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden" style={{ background: NIGHT }}>
          {/* the world */}
          {stage && <Scene time={time} stage={stage} pan={pan} />}
          {/* the lens: the beach around the phone dims as it rises, darkest at the edges. The phone paints above this, so its window stays lit. */}
          <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: focus, background: 'radial-gradient(ellipse 60% 80% at 50% 56%, rgba(2,49,70,0.3) 0%, rgba(2,49,70,0.62) 100%)' }} />
          {/* the pan runs a little past the photo; fade the strip it opens into the night below. Only once the strip is opening, so the photo stays clean before that. */}
          <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%]" style={{ opacity: strip, background: 'linear-gradient(180deg, rgba(2,49,70,0) 0%, rgba(2,49,70,0.55) 60%, rgba(2,49,70,0.95) 100%)' }} />

          {/* chapter heading, the same as every other chapter's */}
          <header className="absolute inset-x-0 top-0 z-20 px-6 pt-24 transition-colors duration-700 md:px-10 md:pt-32 lg:px-[70px]" style={ink}>
            <h2 className="mx-auto max-w-[1600px] font-display text-32 leading-none text-paper md:text-48">
              <span className="mr-4 tabular-nums text-paper/70">05</span>The branded screen
            </h2>
          </header>

          {/* beat 1 */}
          <motion.div className="edge-l pointer-events-none absolute bottom-12 z-10 transition-colors duration-700 md:bottom-16" style={{ opacity: intro, y: introY, color: day ? '#023146' : 'var(--color-paper)' }}>
            <p className="font-display text-20 italic opacity-85 md:text-24">Assateague, east beach. Two in the afternoon.</p>
            <h2 className="mt-2 font-display text-display uppercase leading-none">It looks empty.</h2>
          </motion.div>

          {/* a soft dark fade so the rail reads over bright surf */}
          <motion.div className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[calc(max(2.5rem,(100%-1600px)/2)+520px)] lg:w-[calc(max(70px,(100%-1600px)/2)+520px)] md:block" style={{ opacity: rail, background: 'linear-gradient(90deg, rgba(2,49,70,0.6) 0%, rgba(2,49,70,0.4) 60%, rgba(2,49,70,0) 100%)' }} />

          {/* beat 3, the rail: plain text that follows the phone's hour */}
          {/* centred in the space under the chapter heading, never behind it */}
          <div className="edge-l pointer-events-none absolute bottom-8 top-[216px] z-10 hidden items-center-safe md:flex">
          <motion.div className="w-[340px] text-paper transition-colors duration-700 lg:w-[500px]" style={{ opacity: rail, y: railY, ...ink }}>
            {/* chapter-headline size (40/64 light, same as every chapter), allowed wider than the rail; broken by hand so "four" never runs under the phone */}
            <h2 className="w-[680px] max-w-[calc(100vw-80px)] font-display text-40 font-light md:text-64">One beach,<br />four shifts.</h2>
            <ol className="mt-8 border-t border-paper/40">
              {SHIFTS.map((m, i) => {
                const active = m === current
                return (
                  <li key={m.label} aria-current={active ? 'true' : undefined} className={`grid grid-cols-[32px_1fr_auto] items-baseline gap-x-3 border-b border-paper/40 py-3 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
                    <span className="font-display text-16 tabular-nums">0{i + 1}</span>
                    <span>
                      <span className="block font-display text-24">{m.label}</span>
                      <span className="mt-1 block text-16 text-paper/85">{m.s}</span>
                    </span>
                    <span className="text-12 uppercase tracking-wider">{formatTime(m.t)}</span>
                  </li>
                )
              })}
            </ol>
          </motion.div>
          </div>

          {/* the phone */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-28">
            <motion.div
              ref={phoneRef}
              className="pointer-events-auto relative"
              style={{ y: lift, width: 'min(clamp(320px, 16vw, 420px), calc(100vw - 32px), calc((100svh - 160px) * 9 / 19.5))' }}
            >
              <Phone fluid bezel={nightness(time) > 0.5 ? 'var(--color-paper)' : '#023146'}>
                {stage && <CameraView time={time} onTimeChange={onTimeChange} stage={stage} pan={pan} window={win} lift={lift} />}
              </Phone>
              {/* beat 3, the note: in the margin-note hand like chapter 03's, with an arrow into the phone.
                  Wide screens only, where the beach beside the phone has room for it. */}
              <motion.div className="pointer-events-none absolute left-full top-[34%] hidden text-paper lg:block" style={{ opacity: hint }}>
                <svg aria-hidden width="72" height="48" viewBox="0 0 72 48" className="absolute left-0 top-0 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(2,49,70,0.7))' }}>
                  <path d="M66 16 C54 -4 28 34 6 36" />
                  <path d="M14.3 30.4 L6 36 L15.2 40" />
                </svg>
                <p className="ml-20 w-max text-24 leading-8 xl:text-32 xl:leading-10" style={{ fontFamily: 'var(--font-hand)', ...SHADOW }}>
                  Scroll to explore the beach,<br />tap whoever turns up
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* the line that lands it, on the same night as the strip above so the two read as one */}
      <div className="px-6 py-24 text-paper md:px-10 md:py-32 lg:px-[70px]" style={{ background: NIGHT }}>
        <div className="mx-auto grid max-w-[1600px] gap-8 md:grid-cols-[1fr_1fr] md:items-end md:gap-20">
          <p className="text-40 text-sky md:text-48" style={{ fontFamily: 'var(--font-hand)' }}>"This beach isn't empty at all."</p>
          <p className="max-w-[44ch] text-20 text-paper/85 md:text-24">
            Same sand, same water. Gulls and sanderlings work the day shift. An hour after sunset, ghost crabs come up out of the holes you walked over at noon. Later, a fox takes the tide line.
          </p>
        </div>
      </div>
    </>
  )
}
