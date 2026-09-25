import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { useReducedMotion } from 'motion/react'
import LineArt from './LineArt'
import { DRAWN } from '../data/species'

const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter

const RADIUS = 12
const WALL = 200

/**
 * The cast as a pile of cards. They drop in one by one as the section scrolls
 * into view, and can be grabbed and thrown; they bounce off the walls and each other.
 * The box clips only at the sides, so cards fall and fly over the chapter above it.
 * Physics runs in matter-js; the cards are ordinary DOM moved by transform.
 */
export default function GravityCast() {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const released = useRef(0)
  const release = useRef<(n: number) => void>(() => {})
  // Smaller cards on phones so the pile leaves open sand to scroll past.
  const [wide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches)

  useEffect(() => {
    const el = box.current
    const els = cards.current
    if (!el || reduce) return
    let raf = 0
    let running = false
    let alive = true
    const engine = Engine.create({ enableSleeping: true })
    engine.gravity.y = 1.1
    const world = engine.world
    let walls: Matter.Body[] = []
    const bodies: (Matter.Body | null)[] = DRAWN.map(() => null)
    const sizes: { w: number; h: number }[] = []

    const buildWalls = () => {
      const { width: w, height: h } = el.getBoundingClientRect()
      if (walls.length) Composite.remove(world, walls)
      const opts = { isStatic: true, restitution: 0.6, friction: 0.4 }
      walls = [
        Bodies.rectangle(w / 2, h + WALL / 2, w + WALL * 2, WALL, opts),
        // side walls run far above the box so a card thrown out the top comes back down
        Bodies.rectangle(-WALL / 2, h / 2 - h * 2, WALL, h * 5, opts),
        Bodies.rectangle(w + WALL / 2, h / 2 - h * 2, WALL, h * 5, opts),
      ]
      Composite.add(world, walls)
      for (const b of bodies) {
        if (!b) continue
        const x = Math.min(Math.max(b.position.x, 40), w - 40)
        const y = Math.min(b.position.y, h - 40)
        Body.setPosition(b, { x, y })
        Sleeping.set(b, false)
      }
    }

    const paint = () => {
      bodies.forEach((b, i) => {
        const card = cards.current[i]
        if (!b || !card) return
        const { w, h } = sizes[i]
        card.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`
      })
    }

    const tick = () => {
      Engine.update(engine, 1000 / 60)
      paint()
      raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!running && alive) { running = true; raf = requestAnimationFrame(tick) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    release.current = (n) => {
      const w = el.clientWidth
      // Drop from the top of the screen, so each card falls past the text above the box.
      const drop = Math.min(Math.max(el.getBoundingClientRect().top, 0), el.clientHeight * 3)
      for (let i = released.current; i < n; i++) {
        const card = cards.current[i]
        if (!card) continue
        const size = { w: card.offsetWidth, h: card.offsetHeight }
        sizes[i] = size
        const x = size.w / 2 + Math.random() * Math.max(0, w - size.w)
        const b = Bodies.rectangle(x, -drop - size.h - 20, size.w, size.h, {
          chamfer: { radius: Math.min(RADIUS, size.h / 2) },
          restitution: 0.55,
          friction: 0.3,
          frictionAir: 0.012,
          density: 0.0015,
          angle: (Math.random() - 0.5) * 0.5,
        })
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.06)
        bodies[i] = b
        Composite.add(world, b)
        card.style.visibility = 'visible'
      }
      released.current = Math.max(released.current, n)
      paint()
      start()
    }

    // Drag: pin the grabbed point of the card to the pointer with a springy constraint.
    // Letting go keeps the card's velocity, so a flick throws it.
    let grab: { c: Matter.Constraint; id: number; card: HTMLDivElement } | null = null
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onDown = (e: PointerEvent) => {
      const i = cards.current.findIndex((c) => c?.contains(e.target as Node))
      const b = bodies[i]
      const card = cards.current[i]
      if (!b || !card || grab) return
      const p = local(e)
      Sleeping.set(b, false)
      const c = Constraint.create({
        pointA: p,
        bodyB: b,
        pointB: { x: p.x - b.position.x, y: p.y - b.position.y },
        stiffness: 0.2,
        damping: 0.1,
        length: 0,
      })
      Composite.add(world, c)
      card.setPointerCapture(e.pointerId)
      card.style.cursor = 'grabbing'
      grab = { c, id: e.pointerId, card }
      start()
    }
    const onMove = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      grab.c.pointA = local(e)
      if (grab.c.bodyB) Sleeping.set(grab.c.bodyB, false)
    }
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return
      Composite.remove(world, grab.c)
      grab.card.style.cursor = ''
      grab = null
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    buildWalls()
    const ro = new ResizeObserver(buildWalls)
    ro.observe(el)
    // Only simulate while the pile is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && released.current) start()
      else if (!entry.isIntersecting) stop()
    })
    io.observe(el)
    // Each card lets go at its own point in the scroll, so scrolling pours them in:
    // the first when the box's top is a quarter of the way up the viewport, the last
    // once the box is centred. Cards already due (page loaded mid-scroll) drop straight away.
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = (vh - r.top) / (vh / 2 + r.height / 2)
      const n = Math.min(DRAWN.length, Math.floor(((p - 0.25) / 0.6) * DRAWN.length) + 1)
      if (n > released.current) release.current(n)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      alive = false
      stop()
      window.removeEventListener('scroll', onScroll)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      Engine.clear(engine)
      released.current = 0
      release.current = () => {}
      els.forEach((c) => { if (c) { c.style.visibility = ''; c.style.transform = '' } })
    }
  }, [reduce])

  const card = (s: (typeof DRAWN)[number], i: number, still: boolean) => (
    <div
      key={s.id}
      ref={still ? undefined : (n) => { cards.current[i] = n }}
      className={`flex w-max max-w-[calc(100vw-48px)] items-center gap-3 rounded-[12px] border-2 border-navy py-3 pr-6 pl-5 md:gap-4 md:py-4 md:pr-8 md:pl-6 text-navy select-none ${
        still ? '' : 'pointer-events-auto invisible absolute top-0 left-0 cursor-grab touch-none will-change-transform'
      }`}
    >
      <LineArt id={s.id} scale={wide ? 0.8 : 0.55} color="var(--color-navy)" animate={false} shadow={false} className="pointer-events-none shrink-0" />
      <div>
        <p className="font-display text-16 md:text-20">{s.name}</p>
        <p className="font-sans text-12 text-ink-muted md:text-16">{s.bestTime}</p>
      </div>
    </div>
  )

  if (reduce) {
    return <div className="flex flex-wrap justify-center gap-4 px-6 py-16">{DRAWN.map((s, i) => card(s, i, true))}</div>
  }

  return (
    <div ref={box} className="pointer-events-none relative h-[420px] overflow-x-clip md:h-[360px]">
      <p className="pointer-events-none absolute top-8 left-6 text-24 text-ink/70 md:left-auto md:right-0 md:text-32" style={{ fontFamily: 'var(--font-hand)' }}>
        Grab one. Throw it.
      </p>
      {DRAWN.map((s, i) => card(s, i, false))}
    </div>
  )
}
