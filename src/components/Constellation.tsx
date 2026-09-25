import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { SPECIES, ZONES, type Species } from '../data/species'
import { RETURN, linkedSpecies } from '../data/return'

/**
 * Chapter 04 as a field of names. The six creatures sit scattered across a
 * banded stage (sky at the top, dry sand at the bottom, like the camera
 * frame), joined by faint lines where one feeds on or follows another. Names
 * near the cursor come forward a little, the way a lens passes over a page; the
 * one the cursor is on goes full size and full ink, and its card opens: the
 * drawing, then the real animal, and the facts. Tap does the same on touch screens.
 */

/** Centre of each name, percent of the stage. Rows follow the zone bands. */
const POS: Record<string, { x: number; y: number }> = {
  gull: { x: 24, y: 13 },
  dolphin: { x: 70, y: 30 },
  sanderling: { x: 36, y: 52 },
  horseshoe: { x: 76, y: 64 },
  ghostcrab: { x: 20, y: 79 },
  fox: { x: 70, y: 91 },
}
/** Stacked for narrow screens, where long names would collide. */
const POS_SM: Record<string, { x: number; y: number }> = {
  gull: { x: 38, y: 10 },
  dolphin: { x: 60, y: 27 },
  sanderling: { x: 40, y: 45 },
  horseshoe: { x: 62, y: 60 },
  ghostcrab: { x: 36, y: 77 },
  fox: { x: 62, y: 91 },
}

/** A small tilt per name, like notes scribbled at slightly different angles. */
const TILT: Record<string, number> = { gull: -6, dolphin: 3, sanderling: -3, horseshoe: 4, ghostcrab: -4, fox: 2 }
const HAND = { fontFamily: 'var(--font-hand)' } as const

const BANDS: { zone: keyof typeof ZONES; top: number }[] = [
  { zone: 'sky', top: 0 },
  { zone: 'offshore', top: 23 },
  { zone: 'surf', top: 45 },
  { zone: 'sand', top: 70 },
]

/** What each line means, keyed by the two ids in alphabetical order. Shown on the line when either end is hovered. */
const LINK_LABEL: Record<string, string> = {
  'gull>sanderling': 'gulls steal the sanderlings\u2019 catch',
  'horseshoe>sanderling': 'sanderlings eat horseshoe crab eggs',
  'fox>ghostcrab': 'foxes hunt ghost crabs at night',
}

/** Links and their labels: the palette's teal deepened with navy, dark enough to read on paper. */
const LINK = 'color-mix(in srgb, var(--color-sky) 45%, var(--color-navy))'

/**
 * The real animal: a cut-out photo toned navy to mint, so all six read as one set on the card. Each
 * photo is turned to face the way its drawing does (the gull mirrored, the horseshoe crab upside down).
 */
const photo = (id: string) => `/img/real/${id}.webp`

/**
 * The card's picture. The drawing is there when the card opens, then the real animal fades up in its
 * place: what the app shows you, then what you'll actually see. Both fill the same box the same way
 * (contain, centred on the ground line), so the drawing is as big as the photo that replaces it.
 */
function DrawnThenReal({ id, still }: { id: string; still: boolean }) {
  const art = SPECIES.find((s) => s.id === id)?.art
  const mask = art && `url(${art.src}) center bottom / contain no-repeat`
  return (
    <div className="relative h-28">
      {!still && art && (
        <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.45, duration: 0.3 }}>
          {/* painted through the drawing as a mask, in the card's mint, the same colour as the photo's highlights */}
          <div aria-hidden className="h-full w-full bg-current" style={{ WebkitMask: mask, mask, transform: art.flip ? 'scaleX(-1)' : undefined }} />
        </motion.div>
      )}
      <motion.img
        src={photo(id)}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      />
    </div>
  )
}

const REACH = 340 // px: how far the lens reaches from the cursor
/** Touch screens have no cursor: there the lens is a line across the middle of the screen, and it reaches less far, so a name or two swells at a time as they scroll through it. */
const REACH_LINE = 170
const FAR = -1e5

/**
 * Where the letters of a name actually are: one column per character, in the button's own unscaled
 * pixels from its top-left corner, measured on a canvas in the same font. The hover test asks "is the
 * pointer on a letter?" rather than "is it inside the box?": the box has blank line space above and
 * below the hand-drawn glyphs and swells toward the pointer, so it used to open the card before the
 * pointer had reached the text. A word space counts for the x-height band, so the gap between two
 * words still reads as the name.
 */
type InkCol = { x0: number; x1: number; top: number; bottom: number }
let inkCtx: CanvasRenderingContext2D | null | undefined
function measureInk(el: HTMLElement): { w: number; cols: InkCol[] } | null {
  if (inkCtx === undefined) inkCtx = document.createElement('canvas').getContext('2d')
  const ctx = inkCtx
  if (!ctx) return null
  const cs = getComputedStyle(el)
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const text = el.textContent ?? ''
  const all = ctx.measureText(text)
  if (!all.width || typeof all.fontBoundingBoxAscent !== 'number') return null
  const w = el.offsetWidth, h = el.offsetHeight
  // the line box is one em (leading-none) with the font's content area centred in it, which puts the baseline here
  const base = (h - (all.fontBoundingBoxAscent + all.fontBoundingBoxDescent)) / 2 + all.fontBoundingBoxAscent
  const xh = ctx.measureText('x').actualBoundingBoxAscent
  const k = w / all.width // the page lays the string out a hair differently from the canvas; spread the difference
  const cols: InkCol[] = []
  let x = 0
  for (const ch of text) {
    const m = ctx.measureText(ch)
    const blank = ch.trim() === ''
    const adv = m.width * k
    cols.push({ x0: x, x1: x + adv, top: base - (blank ? xh : m.actualBoundingBoxAscent), bottom: base + (blank ? 0 : m.actualBoundingBoxDescent) })
    x += adv
  }
  return { w, cols }
}

function Name({
  s, cx, cy, mx, my, line, grow, active, still, onEnter, onToggle, register, registerHit,
}: {
  s: Species; cx: number; cy: number; mx: MotionValue<number>; my: MotionValue<number>
  line: boolean
  /** The largest this name may swell to; less than 1.45 where a long name would run off a narrow page. */
  grow: number
  active: boolean; still: boolean; onEnter: () => void; onToggle: () => void
  register: (el: HTMLButtonElement | null) => void
  /** Hands the field this name's "is that point on my letters?" test, see measureInk. */
  registerHit: (id: string, hit: ((x: number, y: number) => boolean) | null) => void
}) {
  // 1 under the cursor (or on the line), 0 beyond the reach, eased so the swell is soft at the edges.
  const near = useTransform([mx, my], ([x, y]: number[]) => {
    const d = line ? Math.abs(y - cy) : Math.hypot(x - cx, y - cy)
    const f = Math.max(0, 1 - d / (line ? REACH_LINE : REACH))
    return f * f * (3 - 2 * f)
  })
  // The lens only brings a name near the pointer a little forward. Full size and full ink are for the
  // name whose letters the pointer is on (or, on touch screens, the one on the line), so a name never
  // looks chosen before it has been. `on` mirrors `active` as a motion value so the springs carry the change.
  const on = useMotionValue(active ? 1 : 0)
  useEffect(() => { on.set(active ? 1 : 0) }, [active, on])
  const lift = line ? 1 : 0.3
  const scaleRaw = useTransform([near, on], ([f, a]: number[]) => (still ? 1 : a ? grow : 1 + (grow - 1) * lift * f))
  const opacityRaw = useTransform([near, on], ([f, a]: number[]) => (a ? 1 : 0.45 + (line ? 0.55 : 0.3) * f))
  const scale = useSpring(scaleRaw, { stiffness: 260, damping: 28, mass: 0.6 })
  const opacity = useSpring(opacityRaw, { stiffness: 260, damping: 30 })
  // The mouse opens a name by touching its letters, not its box; the field asks this on every move.
  const self = useRef<HTMLButtonElement | null>(null)
  const ink = useRef<ReturnType<typeof measureInk>>(null)
  useEffect(() => {
    const hit = (x: number, y: number) => {
      const el = self.current
      if (!el) return false
      if (!ink.current || ink.current.w !== el.offsetWidth) ink.current = measureInk(el)
      // into the button's own frame: undo the tilt and the swell, then measure from its top-left corner
      const k = scale.get()
      const t = ((TILT[s.id] ?? 0) * Math.PI) / 180
      const dx = x - cx, dy = y - cy
      const ux = (dx * Math.cos(t) + dy * Math.sin(t)) / k + el.offsetWidth / 2
      const uy = (-dx * Math.sin(t) + dy * Math.cos(t)) / k + el.offsetHeight / 2
      const pad = 3
      const m = ink.current
      if (!m) return ux >= -pad && ux <= el.offsetWidth + pad && uy >= -pad && uy <= el.offsetHeight + pad
      const col = m.cols.find((c) => ux >= c.x0 - pad && ux <= c.x1 + pad)
      return !!col && uy >= col.top - pad && uy <= col.bottom + pad
    }
    registerHit(s.id, hit)
    return () => registerHit(s.id, null)
  }, [registerHit, scale, s.id, cx, cy])
  return (
    <motion.button
      ref={(el) => { self.current = el; register(el) }}
      type="button"
      aria-expanded={active}
      data-cursor="dot"
      onFocus={onEnter}
      onClick={onToggle}
      className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-24 leading-none text-ink md:text-32 ${active ? 'z-20' : ''}`}
      style={{ ...HAND, left: cx, top: cy, scale, rotate: TILT[s.id] ?? 0, opacity, transformOrigin: 'center' }}
    >
      {s.name.toLowerCase()} · {RETURN[s.id].time.toLowerCase()}
    </motion.button>
  )
}

export default function Constellation() {
  const stage = useRef<HTMLDivElement>(null)
  // Lined paper: the zone rules sit on the page grid's own lines and every name is written in the
  // middle of a grid row, so a rule never runs through a name. The grid is painted from the
  // section's corner, one --grid square at a time, each line 1px above the square's edge.
  const [grid, setGrid] = useState<{ bands: number[]; rows: Record<string, number> } | null>(null)
  useLayoutEffect(() => {
    const el = stage.current
    const section = el?.closest('section')
    if (!el || !section) return
    const measure = () => {
      const g = parseFloat(getComputedStyle(section).getPropertyValue('--grid')) || 80
      const off = el.getBoundingClientRect().top - section.getBoundingClientRect().top
      const h = el.clientHeight
      const set = el.clientWidth < 768 ? POS_SM : POS
      const line = (k: number) => k * g - 1 - off
      const first = Math.ceil((off + 1 - 1) / g) // first line inside the stage
      const last = Math.floor((off + 1 + h) / g) - 1 // last row whose bottom line is inside
      // each name goes in the row its percentage falls in
      const row: Record<string, number> = {}
      for (const sp of SPECIES) {
        const k = Math.floor((off + 1 + (set[sp.id].y / 100) * h) / g)
        row[sp.id] = Math.max(first, Math.min(last, k))
      }
      // zones keep their order: a zone's names start at least one row below the zone above
      const zoneRows = BANDS.map((b) => SPECIES.filter((sp) => sp.zone === b.zone).map((sp) => sp.id))
      let floor = first
      for (const ids of zoneRows) {
        const lo = Math.min(...ids.map((id) => row[id]))
        const shift = Math.max(0, floor - lo)
        for (const id of ids) row[id] = Math.min(last, row[id] + shift)
        floor = Math.max(...ids.map((id) => row[id])) + 1
      }
      // each rule takes the grid line closest to its percentage that still sits between the zones
      const bands = BANDS.map((b, i) => {
        const lo = i === 0 ? first : Math.max(...zoneRows[i - 1].map((id) => row[id])) + 1
        const hi = Math.min(...zoneRows[i].map((id) => row[id]))
        const want = Math.round((off + 1 + (b.top / 100) * h) / g)
        return line(Math.max(lo, Math.min(hi, want)))
      })
      const rows: Record<string, number> = {}
      for (const id in row) rows[id] = line(row[id]) + g / 2
      setGrid({ bands, rows })
    }
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(section)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [active, setActive] = useState<string | null>(null)
  // Each name's own "is the pointer on my letters?" test, asked on every mouse move over the field.
  const hitFns = useRef<Record<string, ((x: number, y: number) => boolean) | null>>({})
  const registerHit = useCallback((id: string, hit: ((x: number, y: number) => boolean) | null) => { hitFns.current[id] = hit }, [])
  // Once the card is dragged it is pinned: hovering other names or leaving the field no longer closes it.
  const [pinned, setPinned] = useState(false)
  const close = () => { setActive(null); setPinned(false) }
  const reduce = useReducedMotion()
  const mx = useMotionValue(FAR)
  const my = useMotionValue(FAR)
  const narrow = size.w > 0 && size.w < 768
  // The six photos are 8–15 KB each: fetch them up front so no card waits on its animal.
  useEffect(() => { for (const s of SPECIES) new Image().src = photo(s.id) }, [])
  const pos = narrow ? POS_SM : POS

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // With no cursor, the middle of the screen is the lens: names swell as they scroll through it.
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const on = () => setTouch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    const el = stage.current
    if (!touch || !el) return
    const follow = () => {
      const r = el.getBoundingClientRect()
      mx.set(r.width / 2)
      my.set(window.innerHeight / 2 - r.top)
    }
    follow()
    window.addEventListener('scroll', follow, { passive: true })
    window.addEventListener('resize', follow)
    return () => {
      window.removeEventListener('scroll', follow)
      window.removeEventListener('resize', follow)
      mx.set(FAR)
      my.set(FAR)
    }
  }, [touch, mx, my])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setActive(null); setPinned(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Pairs of creatures whose stories mention each other: gull → sanderling, fox → ghost crab, and so on.
  const links = useMemo(() => {
    const seen = new Set<string>()
    const out: [string, string][] = []
    for (const s of SPECIES) for (const line of s.connections) {
      const o = linkedSpecies(line)
      if (!o || o === s.id) continue
      const key = [s.id, o].sort().join('>')
      if (seen.has(key)) continue
      seen.add(key)
      out.push([s.id, o])
    }
    return out
  }, [])

  const at = (id: string) => ({ x: (pos[id].x / 100) * size.w, y: grid?.rows[id] ?? (pos[id].y / 100) * size.h })
  const sp = active ? SPECIES.find((s) => s.id === active) : undefined

  // Each link is a gentle arc, drawn left to right and bowed upward, so its label can sit on the
  // crest, clear of the two names at its ends.
  const arcs = links.map(([a, b]) => {
    let p = at(a), q = at(b)
    if (p.x > q.x) [p, q] = [q, p]
    const dx = q.x - p.x, dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const nx = dy / len, ny = -dx / len // unit normal, pointing up for a left-to-right line
    const bow = Math.min(90, len * 0.24)
    const c = { x: (p.x + q.x) / 2 + nx * bow, y: (p.y + q.y) / 2 + ny * bow }
    const pt = (t: number) => ({
      x: (1 - t) ** 2 * p.x + 2 * (1 - t) * t * c.x + t ** 2 * q.x,
      y: (1 - t) ** 2 * p.y + 2 * (1 - t) * t * c.y + t ** 2 * q.y,
    })
    const steep = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI) > 40
    return {
      a, b, pt, steep, nx,
      id: `arc-${a}-${b}`,
      d: `M ${p.x} ${p.y} Q ${c.x} ${c.y} ${q.x} ${q.y}`,
      apex: pt(0.5),
      label: LINK_LABEL[[a, b].sort().join('>')],
      lit: active === a || active === b,
    }
  })

  // Card placement: beside the name on whichever side has room, centred on it vertically and kept inside the stage.
  const nameEls = useRef<Record<string, HTMLButtonElement | null>>({})
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(200)
  useLayoutEffect(() => { if (cardRef.current) setCardH(cardRef.current.offsetHeight) }, [active, size.w])
  /** A name's box at a given scale, for keeping cards and labels off it. */
  const box = (id: string, k: number) => {
    const el = nameEls.current[id]
    const c = at(id)
    const bw = (el?.offsetWidth ?? 160) * k, bh = (el?.offsetHeight ?? 32) * k
    return { l: c.x - bw / 2, r: c.x + bw / 2, t: c.y - bh / 2, b: c.y + bh / 2 }
  }
  type Box = { l: number; r: number; t: number; b: number }
  const hits = (a: Box, b: Box) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t

  const card = (() => {
    if (!sp || !size.w) return null
    const { x, y } = at(sp.id)
    const w = Math.min(200, size.w - 16)
    const h = cardH
    const grow = reduce ? 1 : 1.45
    const me = box(sp.id, grow)
    const gap = 14
    const midY = y - h / 2
    const candidates = [
      { left: me.r + gap, top: midY },
      { left: me.l - gap - w, top: midY },
      { left: x - w / 2, top: me.t - gap - h },
      { left: x - w / 2, top: me.b + gap },
      { left: me.r - w * 0.3, top: me.t - gap - h },
      { left: me.l - w * 0.7, top: me.t - gap - h },
      { left: me.r - w * 0.3, top: me.b + gap },
      { left: me.l - w * 0.7, top: me.b + gap },
      // the field's corners, when everything near the name is taken
      { left: 8, top: 8 },
      { left: size.w - w - 8, top: 8 },
      { left: 8, top: size.h - h - 8 },
      { left: size.w - w - 8, top: size.h - h - 8 },
    ]
    const overlap = (r: { l: number; r: number; t: number; b: number }, c: { left: number; top: number }) =>
      r.l < c.left + w && r.r > c.left && r.t < c.top + h && r.b > c.top
    const inside = (p: { x: number; y: number }, c: { left: number; top: number }, pad = 10) =>
      p.x > c.left - pad && p.x < c.left + w + pad && p.y > c.top - pad && p.y < c.top + h + pad
    const score = (c: { left: number; top: number }) => {
      let n = 0
      if (overlap(me, c)) n += 100
      for (const o of SPECIES) if (o.id !== sp.id && overlap(box(o.id, 1.15), c)) n += 30
      for (const arc of arcs) {
        const weight = arc.lit ? 4 : 0.5
        for (const t of [0.2, 0.35, 0.5, 0.65, 0.8]) if (inside(arc.pt(t), c, arc.lit ? 24 : 6)) n += weight
      }
      return n
    }
    const clamp = (c: { left: number; top: number }) => ({
      left: Math.max(8, Math.min(size.w - w - 8, c.left)),
      top: Math.max(8, Math.min(size.h - h - 8, c.top)),
    })
    let best = clamp(candidates[0])
    let bestScore = Infinity
    for (const c of candidates) {
      const k = clamp(c)
      const moved = Math.abs(k.left - c.left) + Math.abs(k.top - c.top)
      const far = Math.hypot(k.left + w / 2 - x, k.top + h / 2 - y) / 300
      const sc = score(k) + (moved > 40 ? 3 : 0) + far
      if (sc < bestScore) { best = k; bestScore = sc }
    }
    return { w, ...best }
  })()

  return (
    <div
      ref={stage}
      className="relative mt-12 h-[78svh] min-h-[600px] max-h-[880px] select-none"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - r.left, y = e.clientY - r.top
        mx.set(x)
        my.set(y)
        // a name opens once the pointer is on its letters; its box, which swells out to meet the pointer,
        // no longer counts. Moving about on the card never switches names.
        if (pinned || (e.target as Element).closest('[role="dialog"]')) return
        for (const id in hitFns.current) {
          if (hitFns.current[id]?.(x, y)) { if (active !== id) setActive(id); break }
        }
      }}
      onPointerLeave={(e) => {
        // a finger lifting off also "leaves"; on touch screens the lens belongs to the scroll, so keep it
        if (e.pointerType === 'mouse') { mx.set(FAR); my.set(FAR) }
        if (!pinned) setActive(null)
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      {/* the zone bands, like the camera frame turned into a page: each label sits under one of the page grid's
          own lines, which does the ruling; the bands draw no line of their own */}
      {BANDS.map((b, i) => (
        <div key={b.zone} className="pointer-events-none absolute inset-x-0" style={{ top: grid ? grid.bands[i] : `${b.top}%` }}>
          <span className="absolute left-0 top-2 font-display text-16 italic text-ink-muted">{ZONES[b.zone].label}</span>
        </div>
      ))}

      {/* who feeds on whom: arcs, with the relationship written along the crest when either end is lit */}
      {size.w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${size.w} ${size.h}`}>
          {arcs.map((arc) => (
            <g key={arc.id}>
              <path id={arc.id} d={arc.d} fill="none" strokeOpacity={arc.lit ? 0.7 : 0.22} strokeWidth={1} strokeDasharray={arc.lit ? undefined : '3 5'} style={{ stroke: LINK, transition: 'stroke-opacity 0.25s' }} />
              {arc.label && !arc.steep && (
                <text className="font-sans text-16" style={{ fill: LINK, opacity: arc.lit ? 1 : 0, transition: 'opacity 0.25s' }} dy={-8}>
                  <textPath href={`#${arc.id}`} startOffset="50%" textAnchor="middle">{arc.label}</textPath>
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
      {/* steep arcs (the stacked phone layout, and gull to sanderling) keep their label level, in the clearest spot beside the arc */}
      {size.w > 0 && arcs.map((arc) => {
        if (!arc.label || !arc.steep) return null
        // On phones the label wraps into a short column so it stays on screen.
        const full = arc.label.length * 7.6 + 8
        const W = narrow ? Math.min(full, 130) : full
        const H = narrow ? Math.ceil(full / 130) * 20 + 4 : 24
        const cardBox = card ? { l: card.left, r: card.left + card.w, t: card.top, b: card.top + cardH } : null
        const spots: { x: number; y: number; right: boolean }[] = []
        for (const t of [0.5, 0.35, 0.65, 0.25, 0.75]) {
          const pnt = arc.pt(t)
          spots.push({ x: pnt.x + 12, y: pnt.y, right: true }, { x: pnt.x - 12, y: pnt.y, right: false })
        }
        const cost = (sp2: { x: number; y: number; right: boolean }) => {
          const r: Box = sp2.right ? { l: sp2.x, r: sp2.x + W, t: sp2.y - H / 2, b: sp2.y + H / 2 } : { l: sp2.x - W, r: sp2.x, t: sp2.y - H / 2, b: sp2.y + H / 2 }
          let n = 0
          for (const o of SPECIES) if (hits(r, box(o.id, o.id === active ? (reduce ? 1 : 1.45) : 1.15))) n += 10
          if (cardBox && hits(r, cardBox)) n += 10
          if (r.l < 0 || r.r > size.w) n += 6
          return n
        }
        const spot = spots.reduce((best, c) => (cost(c) < cost(best) - 0.01 ? c : best), spots[0])
        return (
          <span
            key={'l' + arc.id}
            aria-hidden
            className={`pointer-events-none absolute z-10 font-sans text-16 leading-[1.25] ${narrow ? '' : 'whitespace-nowrap'}`}
            style={{
              color: LINK,
              width: narrow ? W : undefined,
              textAlign: spot.right ? 'left' : 'right',
              left: spot.x,
              top: spot.y,
              transform: `translate(${spot.right ? '0' : '-100%'}, -50%)`,
              opacity: arc.lit ? 1 : 0,
              transition: 'opacity 0.25s',
            }}
          >
            {arc.label}
          </span>
        )
      })}

      {size.w > 0 && SPECIES.map((s) => {
        const { x, y } = at(s.id)
        // swell only as far as the page has room for, reaching 16px into its side margin at most
        const w = nameEls.current[s.id]?.offsetWidth ?? 0
        const grow = w ? Math.min(1.45, Math.max(1, (2 * (Math.min(x, size.w - x) + 16)) / w)) : 1.45
        return (
          <Name
            key={s.id}
            s={s}
            cx={x}
            cy={y}
            mx={mx}
            my={my}
            line={touch}
            grow={grow}
            still={!!reduce}
            active={active === s.id}
            onEnter={() => { if (!pinned) setActive(s.id) }}
            onToggle={() => { if (active === s.id) close(); else { setPinned(false); setActive(s.id) } }}
            register={(el) => { nameEls.current[s.id] = el }}
            registerHit={registerHit}
          />
        )
      })}

      <AnimatePresence>
        {sp && card && (
          <motion.div
            key={sp.id}
            role="dialog"
            aria-label={sp.name}
            data-cursor="dot"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            drag
            dragConstraints={stage}
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => setPinned(true)}
            whileDrag={{ scale: 1.03 }}
            title="Drag to move"
            className="absolute z-30 cursor-grab touch-none bg-night text-paper shadow-[0_32px_64px_-24px_rgba(2,49,70,0.6)] active:cursor-grabbing"
            ref={cardRef}
            style={{ width: card.w, left: card.left, top: card.top }}
          >
            <div className="px-4 pt-4"><DrawnThenReal id={sp.id} still={!!reduce} /></div>
            <p className="mt-4 px-4 font-display text-24 leading-none">{sp.name}</p>
            <p className="mb-4 mt-2 px-4 text-12 leading-[1.4] text-paper/85">{sp.fact}</p>
            <button type="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={close} className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-20 text-paper/60 hover:text-paper ${pinned ? '' : 'md:hidden'}`}>×</button>
            {/* grip: a hint that the card can be moved */}
            <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-paper/25" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
