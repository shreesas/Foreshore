import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import Chapter from './components/Chapter'
import GravityCast from './components/GravityCast'
import Constellation from './components/Constellation'
import IndexRow from './components/IndexRow'
import LensScroll from './components/LensScroll'
import LineArt from './components/LineArt'
import Moodboard from './components/Moodboard'
import PillCursor from './components/PillCursor'
import References from './components/References'
import Reveal from './components/Reveal'
import ScrollHint from './components/ScrollHint'
import Wireflow from './components/Wireflow'
import { beachClock, whoIsOut } from './lib/live'
import { SPECIES } from './data/species'

/** The tide in the foreshore drawing: five seconds out, five back in, forever, with a
 *  one-second slack at each turn. Eased like a real tide. */
const TIDE = { duration: 5, ease: 'easeInOut', delay: 0.4, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 } as const

/**
 * A ghost crab on the foreshore that keeps the tide's clock: out once the water has
 * left its patch of slope, then it walks slowly up the beach (right to left), staying
 * ahead of the flood, and fades out. `x`, `y` are where its feet meet the slope; `angle` is the slope.
 * The drawing is used as an alpha mask so it can be painted navy inside the SVG.
 */
const CRAB_RATIO = 1939 / 1001
/** The drawing's width at LineArt scale 1, so a diagram width can be turned into a scale. */
const CRAB_W = SPECIES.find((s) => s.id === 'ghostcrab')?.art?.w ?? 120
function TideCrab({ id, x, y, w, angle, run, still }: { id: string; x: number; y: number; w: number; angle: number; run: number; still: boolean | null }) {
  const h = w / CRAB_RATIO
  // The rigged drawing is mounted the moment the tide's "low" animation starts, so its legs
  // (the `tidecrab` rig, on the same 12 s clock and 0.4 s delay) agree with the fade and the run.
  const [out, setOut] = useState(false)
  // One 12 s cycle, matching TIDE: 0–5 ebb, 5–6 slack low, 6–11 flood, 11–12 slack high.
  // The crab comes out once the ebb has passed it, forages through slack low, then runs up the
  // beach ahead of the flood: `run` units along the slope (the group is rotated to it) with
  // the water's own easing, so it keeps its lead, and goes to ground near the high-water mark.
  const c = (t: number) => t / 12
  const low = still
    ? { opacity: 1, x: 0, transition: { duration: 0 } }
    : {
        opacity: [0, 0, 1, 1, 0, 0],
        x: [0, 0, -run, 0],
        transition: {
          opacity: { duration: 12, times: [0, c(3.6), c(4.4), c(10.3), c(11), 1], ease: 'easeInOut' as const, repeat: Infinity, delay: TIDE.delay },
          x: { duration: 12, times: [0, c(6), c(11), 1], ease: ['linear', 'easeInOut', 'linear'] as const, repeat: Infinity, delay: TIDE.delay },
        },
      }
  // The foreignObject box is twice the drawing so sidesteps and a lifted claw are never clipped;
  // the drawing sits bottom-centre on the anchor, where the masked image used to stand.
  return (
    <g transform={`rotate(${angle} ${x} ${y})`} data-crab={id}>
      <motion.g variants={{ high: { opacity: 0, x: 0 }, low }} onAnimationStart={(definition) => { if (definition === 'low') setOut(true) }}>
        <foreignObject x={x - w} y={y - 2 * h} width={2 * w} height={2 * h} style={{ overflow: 'visible' }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
            {(out || still) && <LineArt id="ghostcrab" rig="tidecrab" scale={w / CRAB_W} idle color="var(--color-navy)" shadow={false} animate={false} />}
          </div>
        </foreignObject>
      </motion.g>
    </g>
  )
}

const NAV = [
  ['why', 'Why'],
  ['flow', 'Flow'],
  ['species', 'Cast'],
  ['screen', 'Screen'],
  ['look', 'Style'],
] as const

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function Label({ children, tone = 'paper' }: { children: ReactNodeLike; tone?: 'paper' | 'navy' }) {
  return (
    <h4 className={`font-display text-24 md:text-32 ${tone === 'navy' ? 'text-paper' : 'text-ink'}`}>{children}</h4>
  )
}
type ReactNodeLike = React.ReactNode

/**
 * A navy panel that carries on the page's field-notebook grid instead of cutting it off.
 * The grid is painted from the section's corner, so the panel measures how far in it sits
 * and shifts its own grid by that much; the lines run straight through.
 */
function GridPanel({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState('-1px -1px')
  useLayoutEffect(() => {
    const el = ref.current
    const section = el?.closest('section')
    if (!el || !section) return
    const measure = () => {
      const a = section.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      setPos(`${a.left - b.left - 1}px ${a.top - b.top - 1}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(section)
    return () => ro.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`bg-navy ${className}`}
      style={{
        backgroundImage: 'linear-gradient(rgba(221,241,241,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(221,241,241,0.10) 1px, transparent 1px)',
        backgroundSize: 'var(--grid) var(--grid)',
        backgroundPosition: pos,
      }}
    >
      {children}
    </div>
  )
}

/** A captioned field clip: label in the display face, date under it. `dim` fades it back like a ghost image. */
function Clip({ src, poster, label, date, className = '', dim = false, from = 'left', children }: { src: string; poster?: string; label: string; date: string; className?: string; dim?: boolean; from?: 'left' | 'right'; children?: React.ReactNode }) {
  // Slides in from its own margin in step with the scroll, like a clipping pulled onto the page.
  // Progress runs from the clip's top meeting the bottom of the screen (0) to that top reaching
  // 70% of the way down (1), about 230px of scroll. The clips sit roughly 250px apart down the
  // page, alternating sides, so only one is ever moving. Scrolling back reverses it.
  const ref = useRef<HTMLElement>(null)
  const still = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'start 70%'] })
  const off = still ? 0 : from === 'left' ? -240 : 240
  const full = dim ? 0.3 : 1
  const x = useTransform(p, [0, 1], [off, 0])
  const opacity = useTransform(p, [0, 0.6, 1], [0, full, full])
  // The clips are 960px and 1–6 MB each, so each one only loads and plays within a screen of the viewport,
  // and pauses when it's further away. The set hidden at this breakpoint never intersects, so it never loads.
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { rootMargin: '100% 0px' })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return (
    <motion.figure ref={ref} className={className} style={{ x, opacity }}>
      <div className="relative aspect-square w-full overflow-hidden bg-foam">
        <video ref={video} src={src} poster={poster} muted loop playsInline preload="none" className="h-full w-full object-cover" />
        {children}
      </div>
      {(label || date) && (
        <figcaption className="mt-2">
          {label && <p className="font-display text-16 leading-tight text-ink-muted">{label}</p>}
          {date && <p className="mt-1 text-12 text-ink-muted">{date}</p>}
        </figcaption>
      )}
    </motion.figure>
  )
}

export default function App() {
  // The branded screen opens at dusk: warm light, and the ghost crab on its way up.
  const [time, setTime] = useState(19.5)
  // Chapter 03's rows and its wireframe show the same step; either one moves both.
  const [flowTab, setFlowTab] = useState(0)
  // The references panel over the page, opened from the footer. Lenis stops while it is open.
  const [refs, setRefs] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)
  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (refs) lenis.stop()
    else lenis.start()
  }, [refs])
  const now = useClock()
  // With reduced motion the foreshore drawing shows low water straight away.
  const still = useReducedMotion()
  const tide = still ? { duration: 0 } : TIDE

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    lenisRef.current = lenis
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null }
  }, [])

  // The top bar keeps the beach's time wherever you're reading from, and says who is out on the sand in it.
  const clock = beachClock(now)
  const out = whoIsOut(now)
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <>
      {/* top bar */}
      <nav className="fixed inset-x-0 top-0 z-30 bg-paper/85 text-ink backdrop-blur">
        <div className="relative mx-auto flex h-14 max-w-[1740px] items-center justify-between px-6 text-16 md:px-10 lg:px-[70px]">
          <a href="#top" className="font-display text-24 leading-none md:text-32">Foreshore</a>
          {/* centred on the page, not between the logo and the clock line, which is longer than the logo */}
          <div className="hidden gap-8 md:absolute md:left-1/2 md:flex md:-translate-x-1/2">
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="font-normal hover:opacity-70">{label}</a>)}
          </div>
          {/* "on Assateague" drops out where the links need the room; who's out needs lg and up */}
          <p className="flex items-baseline gap-2 whitespace-nowrap font-normal">
            <span className="tabular-nums">{clock}<span className="md:hidden xl:inline"> on Assateague</span></span>
            <span className="hidden text-ink-muted lg:inline">·</span>
            <span className="hidden text-24 leading-none lg:inline" style={{ fontFamily: 'var(--font-hand)' }}>{out}</span>
          </p>
        </div>
      </nav>

      {/* 00 hero */}
      <header id="top" className="paper-grid relative flex min-h-svh flex-col overflow-hidden px-6 pb-8 pt-20 md:px-10">
        <div className="flex justify-between font-display text-16 italic text-ink-muted">
          <span>Assateague Island, MD</span>
          <span className="hidden sm:inline">38.25° N, 75.15° W · facing east</span>
          <span>{date}</span>
        </div>

        {/* margin annotations, like notation scribbled on a chessboard */}
        {[
          { t: 'ghost crab · 9:40 pm', x: 8, y: 22, r: -4 },
          { t: 'sanderling · low tide', x: 78, y: 18, r: 3 },
          { t: 'dolphin · 2.4 mi out', x: 14, y: 70, r: 2 },
          { t: 'fox tracks · first light', x: 72, y: 74, r: -3 },
          { t: 'horseshoe crab · June, full moon', x: 58, y: 88, r: 1 },
          { t: 'gull', x: 30, y: 12, r: -8 },
          { t: 'osprey · 8 am', x: 88, y: 48, r: 5 },
        ].map((a, i) => (
          <span
            key={a.t}
            className="annot pointer-events-none absolute hidden text-24 text-ink/60 md:block"
            style={{ left: `${a.x}%`, top: `${a.y}%`, ['--r' as string]: `${a.r}deg`, animationDelay: `${i * 0.9}s`, fontFamily: 'var(--font-hand)' }}
          >
            {a.t}
          </span>
        ))}

        <div className="relative flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-24 italic text-ink-muted md:text-32">A field companion for the beach <span className="text-ink">by Shreesa</span></p>
          <h1 className="mt-6 font-display text-display uppercase">
            See who<br />lives here
          </h1>
        </div>

        <ScrollHint />
      </header>

      {/* 01 problem */}
      <Chapter id="why" index="01" label="The problem" right="Field notes" tone="white-grid">
        {/* The essay sits in the middle; the field footage fills the margins, captioned, like clippings pinned around a page.
            The middle track is exactly the essay's 62ch, so the margins get all the rest of the width and the clips grow
            with the screen (about 310px on a 14-inch laptop, 390px from 1920). Clips alternate edges inside their margin.
            From xl, percentage margins (which resolve against the margin's width) make the zig-zag scale with the clips:
            each clip starts about 210px (at 1512) below the one before it, on the other side. At lg the margins are narrow
            and the essay wraps taller, so the clips keep fixed 240–260px steps to run its length. */}
        <div className="overflow-x-clip lg:grid lg:grid-cols-[minmax(190px,1fr)_minmax(0,62ch)_minmax(190px,1fr)] lg:gap-x-10 xl:gap-x-14 2xl:gap-x-20">
          <div className="hidden lg:flex lg:flex-col lg:items-start">
            <Clip src="/video/horses.mp4" poster="/img/poster-horses.jpg" label="Wild horses at first light. Everyone sees these." date="Sep 2026" className="w-[88%] self-start" />
            <Clip src="/video/sanderling.mp4" label="Sanderling, low tide" date="May 2026" className="mt-[260px] w-[88%] self-end xl:mt-[14%]" />
          </div>

          <div className="mx-auto max-w-[62ch] text-center">
            <Reveal>
              <p className="font-display text-20 text-ink md:text-24">September 2026 · Assateague Island, MD · 38.25° N, 75.15° W</p>
              <h3 className="mt-10 font-display text-40 font-light md:text-64">
                I camped here in May,<br />
                I only saw wild horses.<br />
                <em>I wondered what else I was missing.</em>
              </h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-16 font-sans text-20 font-light leading-[1.4] md:text-24">
                I thought I'd seen it all on this beach. Then I came back in September. So many creatures live here.
              </p>
              <p className="mt-8 font-sans text-20 font-light leading-[1.4] md:text-24">
                Dolphins past the break. Ghost crabs at dusk. A horseshoe crab at the tideline. <em>I wanted to know who else was out there.</em>
              </p>
            </Reveal>
          </div>

          <div className="hidden lg:flex lg:flex-col lg:items-end">
            <Clip src="/video/sunrise.mp4" label="Sunrise, east beach" date="Sep 2026" from="right" className="mt-[240px] w-[88%] self-end xl:mt-[60%]" />
            <Clip src="/video/night.mp4" label="Same beach, midnight" date="May 2026" from="right" className="mt-[260px] w-[88%] self-start xl:mt-[14%]" />
          </div>

          {/* below lg the clippings run as a strip under the essay */}
          <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:hidden [&>*:nth-child(even)]:mt-10">
            <Clip src="/video/horses.mp4" poster="/img/poster-horses.jpg" label="Wild horses, first light." date="Sep 2026" />
            <Clip src="/video/sanderling.mp4" label="Sanderling, low tide" date="May 2026" from="right" />
            <Clip src="/video/sunrise.mp4" label="Sunrise, east beach" date="Sep 2026" />
            <Clip src="/video/night.mp4" label="Same beach, midnight" date="May 2026" from="right" />
          </div>
        </div>
        {/* the three numbers sit on navy, with the page grid running on through the panel; no rules between rows */}
        <GridPanel className="mt-20 px-6 text-paper md:mt-28 md:px-10 [&>*]:border-b-0">
          {[
            ['3.2 million', 'people visit Assateague every year.'],
            ['300+', 'kinds of birds live here or stop by. So do dolphins, deer, foxes, turtles, and crabs.'],
            ['Horses & seagulls', 'are what most visitors remember seeing.'],
          ].map(([big, small], i) => (
            <IndexRow key={big} n={`0${i + 1}`} title={big} tone="navy" big>{small}</IndexRow>
          ))}
        </GridPanel>
        {/* the diagnosis, laid out like chapter 02: the claim as a headline on the left and the reasoning
            beside it from 1440px (every Mac laptop at its default size), stacked below that. The 7px drop
            puts the paragraphs' cap height on the headline's. The two studies follow the paragraphs in the
            same column as stacked index rows, without rules: on the white grid the page already has lines.
            The sources close the column as a caption. */}
        <div className="mt-20 grid gap-8 md:mt-28 min-[1440px]:grid-cols-[auto_minmax(0,1fr)] min-[1440px]:gap-x-20">
          <Reveal>
            <h3 className="max-w-[18ch] font-display text-40 font-light md:text-64">
              Ecologists call this the <em>extinction of experience</em>.
            </h3>
          </Reveal>
          <div className="min-[1440px]:pt-[7px]">
            <Reveal delay={0.1}>
              <p className="max-w-[60ch] text-20 md:text-24">
                It is not about species dying out. It is about people meeting nature less and less. When we see less nature, we care less about it. When we care less, we stop looking. Then we see even less.
              </p>
              <p className="mt-6 max-w-[60ch] text-20 md:text-24">
                Two things can be missing: opportunity and orientation. Assateague has the opportunity. The animals are there. What visitors lack is orientation. Nobody tells them where to look, or when.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 [&>*]:border-b-0">
              {[
                ['Kids can learn creatures.', "8-year-olds can name 78% of Pokémon but only 53% of local wildlife. They can learn. They just don't meet the animals. Balmford, 2002."],
                ['Noticing matters more than time.', 'People who notice nature feel more connected to it than people who just spend time outside. Two weeks of noticing also raises wellbeing. Passmore & Holder, 2017. Richardson, 2021.'],
              ].map(([t, s], i) => <IndexRow key={t} n={`0${i + 1}`} title={t} stack>{s}</IndexRow>)}
              <p className="mt-4 font-display text-16 italic text-ink-muted">Sources. Pyle, 1978. Soga & Gaston, 2016. Visitation and species counts: National Park Service.</p>
            </Reveal>
          </div>
        </div>
      </Chapter>

      {/* 02 insight */}
      <Chapter id="idea" index="02" label="The insight" right="Prior art" tone="sky">
        {/* the claim on the left, the reason beside it: Merlin reacts, Star Walk predicts from a schedule,
            and the beach has a schedule too. Side by side from 1440px, so every Mac laptop gets it at its
            default size: the column next to the 713px headline is about 500px there (45 characters of 24px
            text) and the full 60ch from 1920. Below that it is too narrow, so they stack.
            The 7px drop puts the paragraphs' cap height on the headline's. */}
        <div className="grid gap-24 min-[1440px]:grid-cols-[auto_minmax(0,1fr)] min-[1440px]:gap-x-20">
          <Reveal>
            <h3 className="font-display text-40 font-light md:text-64">
              Merlin names the bird you hear.<br />
              Star Walk shows you tonight's sky.<br />
              <em>Nothing does that for the shore.</em>
            </h3>
          </Reveal>
          <Reveal delay={0.1} className="min-[1440px]:pt-[7px]">
            <p className="max-w-[60ch] text-20 md:text-24">
              Merlin can only name a bird once it's singing. Star Walk works before you've seen anything, because the sky keeps a schedule. It knows what rises, where, and when.
            </p>
            <p className="mt-6 max-w-[60ch] text-20 md:text-24">
              The beach keeps one too. Sanderlings work the low tide. Ghost crabs come up an hour after sunset. Horseshoe crabs wait for a full moon in June. The schedule exists. It just isn't anywhere you'd look while you're standing on the sand.
            </p>
          </Reveal>
        </div>
        {/* the answer lands last */}
        <Reveal delay={0.1} className="mt-24 border-t border-navy/20 pt-10">
          <Label>Introducing Foreshore</Label>
          <p className="mt-4 max-w-[40ch] text-24 md:text-32">Point your phone at the beach and see who lives there, and when they come out.</p>
        </Reveal>
        {/* the cast, poured in as you scroll: full bleed, into the bottom padding. The stage is tall
            enough that the pile never climbs back over the text above it. */}
        <div className="relative z-10 -mx-6 mt-12 -mb-24 md:mx-0 md:-mb-32">
          <GravityCast />
        </div>
      </Chapter>

      {/* the cast, poured in as you scroll; grab and throw them */}
      {/* 03 flow: anywhere on the yellow, the pointer says the phone can be tried */}
      <PillCursor label="Try the Wireframe" ground="var(--color-sand-light)">
        <Chapter id="flow" index="03" label="The flow" right="Wireframe · clickable" tone="sand">
          <div className="grid gap-16 lg:grid-cols-[1fr_min(40vw,640px)] lg:items-start">
            <div>
              <Reveal>
                <h3 className="max-w-[14ch] font-display text-40 font-light md:text-64">Look. Notice.<br />Learn. Return.</h3>
              </Reveal>
              <div className="mt-16">
                {[
                  ['Look', 'Open the camera. The frame is divided into sky, offshore, surf line, and sand.'],
                  ['Notice', 'Creatures draw themselves into the zone where they live, filtered by time of day.'],
                  ['Learn', "Tap one. When it's here, how often, one good fact, and who it's connected to."],
                  ['Return', '"Come back an hour after sunset." The app sends you to a time, not a spot.'],
                ].map(([t, s], i) => <IndexRow key={t} n={`0${i + 1}`} title={t} onClick={() => setFlowTab(i)} active={flowTab === i}>{s}</IndexRow>)}
              </div>
            </div>
            <Reveal delay={0.1} className="lg:sticky lg:top-20"><div className="grow-xl"><Wireflow tab={flowTab} onTab={setFlowTab} /></div></Reveal>
          </div>
        </Chapter>
      </PillCursor>

      {/* 04 species index: the pointer asks you to look closer, and gets out of the way on a name or its card */}
      <PillCursor label="Look closer" ground="var(--color-paper)" size={84}>
        <Chapter id="species" index="04" label="Who lives here" right="Six species · hover to meet them" tone="grid">
          <Reveal>
            <h3 className="max-w-[14ch] font-display text-40 font-light md:text-64">The cast, by hour.</h3>
            <p className="mt-6 max-w-[48ch] text-20 text-ink-muted">Six animals that live on this beach. Each has its own place, from the sky down to the sand, and its own hours. Tap or hover over a name to meet it. The lines show how they depend on each other.</p>
          </Reveal>
          <Constellation />
        </Chapter>
      </PillCursor>

      {/* 05 branded screen */}
      <LensScroll time={time} onTimeChange={setTime} />

      {/* 06 the look: where it came from, what it borrowed, then the system and the decisions */}
      <Chapter id="look" index="06" label="The look" tone="white">
        {/* the chapter opens with where the name came from, then the strip it names drawn in cross-section */}
        <Reveal>
          <h3 className="font-display text-40 font-light md:text-64">Why it's called Foreshore</h3>
          {/* a 440px lead at 24, an 80px gutter, then body at 16 */}
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-20">
            <p className="max-w-[440px] text-20 leading-[1.5] md:text-24">
              The app is named after the foreshore: the part of a beach between the high-water mark and the low-water mark. Under water at high tide, bare at low tide.
            </p>
            <p className="max-w-[52ch] text-16 leading-[1.6] tracking-[0.02em] text-ink">
              Twice a day the tide comes in with food and carries it back out, which makes it one of the busiest places on the coast. Sanderlings chase the swash. Horseshoe crabs spawn at the high-water line. Ghost crabs come down to forage after dark. Most people walk across it on the way to the water and never notice. The app is built to show them what they're missing.
            </p>
          </div>
          <motion.svg viewBox="0 0 1000 272" initial="high" whileInView="low" viewport={{ once: true, amount: 0.6 }} className="-mx-6 mt-12 block w-[calc(100%+48px)] md:hidden" role="img" aria-label="Cross-section of a beach. The foreshore is the slope between the high-water mark and the low-water mark.">
            {/* the foreshore itself, drawn under the water so the ebb uncovers it */}
            <line x1="400" y1="100" x2="800" y2="160" stroke="var(--color-sky)" strokeWidth="8" strokeLinecap="round" />
            {/* the sea: a sheet clipped to the air above the slope (a hair below it, to cover the strip's lower half), falling from high water to low */}
            <clipPath id="tide-clip-sm"><polygon points="200,75 1000,195 1000,0 200,0" /></clipPath>
            <g clipPath="url(#tide-clip-sm)">
              <motion.rect x="0" y="100" width="1000" height="200" style={{ fill: 'var(--color-foam)' }} variants={{ high: { y: 0 }, low: { y: 60 } }} transition={tide} />
            </g>
            {/* beach profile: dune, then the slope down into the sea */}
            <path d="M0,70 C60,30 130,40 200,70 L1000,190" fill="none" stroke="var(--color-navy)" strokeWidth="2" />
            <TideCrab id="tide-crab-sm" x={720} y={148} w={160} angle={8.5} run={345} still={still} />
            {/* water marks */}
            <line x1="400" y1="100" x2="1000" y2="100" stroke="var(--color-navy)" strokeWidth="1.5" strokeDasharray="8 8" />
            <line x1="800" y1="160" x2="1000" y2="160" stroke="var(--color-navy)" strokeWidth="1.5" />
            {/* labels grow on phones, where the drawing renders at a third of its size */}
            <g style={{ fontFamily: 'var(--font-hand)', fill: 'var(--color-navy)' }} className="text-[46px]">
              <text x="990" y="88" textAnchor="end">high water</text>
              <text x="990" y="148" textAnchor="end">low water</text>
              <text x="30" y="125">dune</text>
            </g>
            {/* bracket under the strip */}
            <path d="M400,200 v12 H800 v-12" fill="none" stroke="var(--color-navy)" strokeWidth="1.5" />
            <text x="600" y="264" textAnchor="middle" className="text-[46px]" style={{ fontFamily: 'var(--font-hand)', fill: 'var(--color-navy)' }}>the foreshore</text>
          </motion.svg>
          {/* desktop: the same drawing redrawn as a long strip, edge to edge of the screen */}
          <motion.svg viewBox="0 0 2000 300" initial="high" whileInView="low" viewport={{ once: true, amount: 0.6 }} className="-mx-10 mt-16 hidden w-[calc(100%+80px)] md:block" role="img" aria-label="Cross-section of a beach. The foreshore is the slope between the high-water mark and the low-water mark.">
            <line x1="857" y1="130" x2="1543" y2="190" stroke="var(--color-sky)" strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <clipPath id="tide-clip"><polygon points="400,96 2000,236 2000,0 400,0" /></clipPath>
            <g clipPath="url(#tide-clip)">
              <motion.rect x="0" y="130" width="2000" height="200" style={{ fill: 'var(--color-foam)' }} variants={{ high: { y: 0 }, low: { y: 60 } }} transition={tide} />
            </g>
            <path d="M0,90 C120,40 260,50 400,90 L2000,230" fill="none" stroke="var(--color-navy)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <TideCrab id="tide-crab" x={1383} y={176} w={140} angle={5} run={560} still={still} />
            <line x1="857" y1="130" x2="2000" y2="130" stroke="var(--color-navy)" strokeWidth="1.5" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" />
            <line x1="1543" y1="190" x2="2000" y2="190" stroke="var(--color-navy)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M857,240 v14 H1543 v-14" fill="none" stroke="var(--color-navy)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* sized so the notes land near 24px, the hero's margin-note size */}
            <g style={{ fontFamily: 'var(--font-hand)', fill: 'var(--color-navy)' }} className="text-[44px] lg:text-[40px] xl:text-[34px]">
              <text x="1960" y="114" textAnchor="end">high water</text>
              <text x="1960" y="174" textAnchor="end">low water</text>
              <text x="80" y="150">dune</text>
              <text x="1200" y="292" textAnchor="middle">the foreshore</text>
            </g>
          </motion.svg>
        </Reveal>
        <Reveal className="mt-24 md:mt-32">
          <h3 className="max-w-[14ch] font-display text-40 font-light md:text-64">Drawn line on a real beach.</h3>
          <p className="mt-8 max-w-[52ch] text-20 md:text-24">
            The look started with a habit of doodling animals onto photos of the sky and the sea. The moodboard is full of them with a whale drawn into a cloud, a tail sketched over the surf. Foreshore does the same thing on purpose. The beach stays real. The animals are drawn on top.
          </p>
        </Reveal>

        <div className="mt-16">
          <Moodboard caption="The moodboard. Beach photos, a four-color palette pulled from them, and creatures doodled over the real thing." />
        </div>

        <div className="mt-20 grid gap-16 md:grid-cols-3">
          <div>
            <Label>Palette</Label>
            <p className="mt-2 text-16 text-ink-muted">Every color is taken from the beach itself.</p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[['Navy', '#023146', 'Water after dark'], ['Teal', '#52beb0', 'Surf at midday'], ['Sand', '#d4a373', 'Dry sand'], ['Mint', '#ddf1f1', 'Sea foam'], ['White', '#ffffff', 'The drawings']].map(([n, c, m]) => (
                <div key={n}>
                  <div className="aspect-square border border-navy/15" style={{ background: c }} />
                  <p className="mt-2 font-display text-16 italic">{n}</p>
                  <p className="text-12 leading-tight text-ink-muted">{m}</p>
                  <p className="mt-1 text-12 text-ink-muted">{c}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <p className="mt-4 font-display text-48">Instrument Serif</p>
            <p className="text-16 text-ink-muted">For names. It reads like a field guide printed once and kept. The moodboard started with Baskerville. Instrument Serif is sharper and a little older.</p>
            <p className="mt-6 text-32">Fira Sans</p>
            <p className="text-16 text-ink-muted">For notes and facts. Light and plain, so it never competes with the drawings.</p>
            <p className="mt-6 text-32" style={{ fontFamily: 'var(--font-hand)' }}>Caveat</p>
            <p className="text-16 text-ink-muted">For margin notes, the way you'd scribble on a map.</p>
          </div>
          <div>
            <Label>Decisions</Label>
            <ul className="mt-4 space-y-5 text-16">
              {[
                ['Real photo, drawn animals.', 'The beach is a real photo. The animals are hand-drawn line art on top of it, like a doodle on a postcard: white with a dark halo when the light is low, navy on bright midday sand.'],
                ['The phone is a window.', 'Its screen shows the same photo as the beach behind it, lined up exactly, so it reads as a window, not a mockup. The animals only appear inside it.'],
                ['One control: the hour.', 'Four chips in the thumb zone: Dawn, Day, Dusk, Night. Pick one and the whole scene answers. The light changes, the sky changes, and so does who is out.'],
                ['Zones, not pins.', 'Animals sit where they live, from the sky down to the sand, and each turns up only at its hour. Tilting the phone moves you through habitats, not across a map. On this page, scrolling does the tilting.'],
                ['Still when asked.', "With reduced motion on, the animals don't draw themselves in, bob, or fidget. They're simply there."],
              ].map(([t, d]) => (
                <li key={t}><span className="font-display text-20">{t}</span> <span className="text-ink-muted">{d}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Chapter>

      {/* 07 what could go wrong: the Black Mirror version, edge cases, and what's real */}
      <Chapter id="honesty" index="07" label="What could go wrong" tone="navy" full={false}>
        <Reveal>
          <h3 className="max-w-[20ch] font-display text-40 font-light md:text-64">Every good idea has a dark version.</h3>
        </Reveal>

        <div className="mt-16">
          <Label>The Black Mirror version</Label>
          <div className="mt-8 grid gap-12 md:grid-cols-3 md:gap-16">
            {[
              ['The crowd', 'If it showed exactly where the rare animals are, everyone would go there and trample the nests.', 'So it only says "commonly here," and never shows where anything nests.'],
              ['The game', 'If it gave badges for finding animals, people would chase them, dig them up, and flip them over.', 'So there is no collecting, no badges, and no streaks.'],
              ['The screen', 'If it worked too well, people would watch the beach through their phone instead of looking at it.', 'So every card ends with one button, Back to the beach, and there is no feed to keep scrolling.'],
            ].map(([t, bad, fix]) => (
              <Reveal key={t}>
                <p className="font-display text-24 italic">{t}</p>
                <p className="mt-3 text-16 text-ink-muted">{bad}</p>
                <p className="mt-3 text-16">{fix}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-24 grid gap-12 md:grid-cols-3 md:gap-16">
          <Reveal>
            <Label>Edge cases</Label>
            <ul className="mt-6 space-y-4 text-16 text-ink-muted">
              {[
                ['No signal on the beach.', 'Everything is saved on the phone.'],
                ['Location is off.', 'Pick your beach from a list.'],
                ['You look and see nothing.', 'It tells you the best time to try again.'],
                ['It\'s night.', 'The camera sees black, so the drawn beach takes over.'],
                ['Not at Assateague.', 'Other beaches come later, from public wildlife data.'],
              ].map(([a, b]) => (
                <li key={a}><span className="text-paper">{a}</span> {b}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.05}>
            <Label>Next</Label>
            <ul className="mt-6 space-y-4 text-16 text-ink-muted">
              <li><span className="text-paper">Seasons.</span> A second dial: horseshoe crabs in May, whales in November.</li>
              <li><span className="text-paper">The bay side.</span> Turn around for horses, terrapins, and blue crabs.</li>
              <li><span className="text-paper">The live camera.</span> Swap the photo for what your phone actually sees.</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <Label>What's real</Label>
            <p className="mt-6 text-16 text-ink-muted">
              The animals, their hours, and their seasons are real, from National Park Service and Maryland wildlife notes. The camera view is one beach photo, shaded by the hour. It is not a live feed, and nothing is tracked.
            </p>
          </Reveal>
        </div>

        <div className="mt-24 grid gap-12 md:mt-32 md:grid-cols-[1fr_1fr] md:gap-20">
          <Reveal>
            <p className="max-w-[22ch] font-display text-32 italic md:text-48">
              It never sends you to a spot. It sends you to a time.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="self-end">
            <p className="max-w-[40ch] text-20 md:text-24">
              I thought I'd seen it all on this beach. I'd only seen what was out when I happened to look. Now I look when the beach says to. Some mornings that's sanderlings at low tide. Some nights it's ghost crabs after dark. It's never the same beach twice.
            </p>
            <p className="mt-10 text-40 text-ink" style={{ fontFamily: 'var(--font-hand)' }}>Come back tonight. An hour after sunset.</p>
          </Reveal>
        </div>
      </Chapter>

      <footer className="border-t border-navy/20 px-6 py-8 font-display text-16 italic text-ink-muted md:px-10 lg:px-[70px]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <span>© 2026, Foreshore, Shreesa Shrestha</span>
          <span className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-6">
            <span>React · Vite · Tailwind · Motion · no API keys · nothing tracked</span>
            {/* the brief asks for the references behind the look; they open over the page instead of adding a chapter */}
            <button onClick={() => setRefs(true)} className="min-h-11 self-start text-left underline decoration-navy/30 underline-offset-4 hover:text-ink hover:decoration-navy md:min-h-0 md:self-auto">
              References
            </button>
          </span>
        </div>
      </footer>
      <References open={refs} onClose={() => setRefs(false)} />
    </>
  )
}
