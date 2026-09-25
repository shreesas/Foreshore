import { useMemo, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SPECIES } from '../data/species'

/**
 * A creature drawing. Finished drawings are hand-drawn, traced to SVG, and
 * live in public/art; they are painted through a CSS mask so one file works
 * in white over footage, navy on paper, or grey in the wireframes. `animate`
 * wipes the drawing in left to right, the way a pen would.
 *
 * With `idle`, the creature moves. Each trace is one fused silhouette, so a
 * limb is not a path of its own: instead the same mask is painted in layers,
 * each layer clipped to one part (a leg, a wing, the tail) and turned on its
 * joint, while the rest stays put. A cut sits on the joint, where rotation
 * moves nothing, so the seams stay hidden at the sizes the site uses. The
 * whole body travels on top of that, and a tween of scaleX through zero
 * reads as the animal turning round.
 *
 * A species with no finished drawing gets a small placeholder sketch.
 */

const PLACEHOLDER: Record<string, { paths: string[]; w: number }> = {
  horseshoe: {
    w: 72,
    paths: [
      'M8 26 A 22 16 0 0 1 56 26 L 50 32 L 14 32 Z',
      'M32 12 V 30',
      'M32 32 L 32 46',
      'M24 20 a1.5 1.5 0 1 0 0.01 0 M40 20 a1.5 1.5 0 1 0 0.01 0',
    ],
  },
}

/** A keyframe: seconds into the loop, and the value there. */
interface Key { t: number; v: number }

interface Part {
  name: string
  /** Clip polygon: percent pairs of the drawing box, in the drawn (unflipped) frame. */
  clip: string
  /** The joint it turns on, percent of the box. */
  origin: string
  rotate: Key[]
}

interface Rig {
  /** Loop length in seconds; every track repeats on it, so they stay in step. */
  loop: number
  /** Seconds before the first loop starts, to line up with another clock (the diagram's tide). */
  delay?: number
  /** Whole-body travel and sway. x and y are px at scale 1. */
  x?: Key[]
  y?: Key[]
  rotate?: Key[]
  scale?: Key[]
  origin?: string
  /** Which way it faces: 1 as drawn, -1 mirrored. Tweening between them is a turn. */
  face?: Key[]
  /** Footfall bob in px at scale 1, applied inside the facing element. */
  bob?: Key[]
  /** Everything that is not a part. One polygon: the box minus the part regions. */
  rest?: string
  parts?: Part[]
}

const at = (pairs: [number, number][]): Key[] => pairs.map(([t, v]) => ({ t, v }))

/** n strides of period p from t0: a swing to ±amp (sign s), zero at both ends. */
function strides(t0: number, n: number, p: number, amp: number, s = 1): Key[] {
  const out: Key[] = [{ t: t0, v: 0 }]
  for (let k = 0; k < n; k++) out.push({ t: t0 + (k + 0.25) * p, v: amp * s }, { t: t0 + (k + 0.75) * p, v: -amp * s })
  out.push({ t: t0 + n * p, v: 0 })
  return out
}

/** One dip of b per stride. */
function footfalls(t0: number, n: number, p: number, b: number): Key[] {
  const out: Key[] = [{ t: t0, v: 0 }]
  for (let k = 0; k < n; k++) out.push({ t: t0 + (k + 0.5) * p, v: -b }, { t: t0 + (k + 1) * p, v: 0 })
  return out
}

/** n wing beats of period p: from the glide angle down, up past it, and back. */
function beats(t0: number, n: number, p: number, glide: number, down: number, up: number): Key[] {
  const out: Key[] = [{ t: t0, v: glide }]
  for (let k = 0; k < n; k++) out.push({ t: t0 + (k + 0.4) * p, v: down }, { t: t0 + (k + 0.85) * p, v: up }, { t: t0 + (k + 1) * p, v: glide })
  return out
}

/** The body lifts by b on each downstroke and settles on the upstroke. */
function lifts(t0: number, n: number, p: number, b: number): Key[] {
  const out: Key[] = [{ t: t0, v: 0 }]
  for (let k = 0; k < n; k++) out.push({ t: t0 + (k + 0.4) * p, v: -b }, { t: t0 + (k + 0.85) * p, v: b * 0.3 }, { t: t0 + (k + 1) * p, v: 0 })
  return out
}

/** Two quick scrapes at the sand from t0: lift forward, drag back, lift, set down. */
const paw = (t0: number): Key[] => at([[t0, 0], [t0 + 0.25, 20], [t0 + 0.6, 4], [t0 + 0.85, 18], [t0 + 1.3, 0]])

/** a and b alternating every half period, for the whole loop. */
function wobble(loop: number, p: number, a: number, b: number): Key[] {
  const out: Key[] = []
  for (let t = 0; t < loop - 1e-6; t += p) out.push({ t, v: a }, { t: t + p / 2, v: b })
  out.push({ t: loop, v: a })
  return out
}

/** The ghost crab's cuts, shared by its rigs. */
const CRAB = {
  rest: '0 0,43 0,43 21,59.5 21,59.5 0,100 0,100 34,94 34,94 17,78 17,78 6,60 6,60 34,70 34,70 47,63 50,63 68,79 68,79 82,100 82,100 100,49 100,49 92,48 52,44 44,40 37,30 38,25 43,25 92,40 92,40 100,0 100,0 90,12 90,11 70,24 42,24 34,8 34,0 48',
  legsL: '8 34,24 34,24 42,11 70,12 90,0 90,0 48',
  legsLAt: '20% 38%',
  legsR: '70 34,100 34,100 82,79 82,79 68,63 68,63 50,70 47',
  legsRAt: '74% 40%',
  clawL: '25 43,30 38,40 37,44 44,48 52,49 92,49 100,40 100,40 92,25 92',
  clawLAt: '44% 46%',
  clawR: '60 6,78 6,78 17,94 17,94 34,60 34',
  clawRAt: '62% 22%',
  eyes: '43 0,59.5 0,59.5 21,43 21',
  eyesAt: '51% 21%',
}

/**
 * The rigs. Polygons were placed on the traced outlines (see docs/style-guide.md);
 * a part's cut runs through its joint. Timelines are written in seconds so the
 * whole-body travel, the turns and the limbs can share one clock.
 */
const RIG: Record<string, Rig> = {
  // Flap-glide: three beats, a long glide, three more. The body lifts on each downstroke
  // under the slow drift and bank it already had. The drawn pose is the bottom of the
  // beat: the trailing edge rests on the back there, so the wings only rise from it.
  gull: {
    loop: 9,
    x: at([[0, 0], [2.25, 12], [4.5, 0], [6.75, -12], [9, 0]]),
    y: at([[0, 0], [2.25, -7], [4.5, 0], [6.75, 5], [9, 0]]),
    rotate: at([[0, -2.5], [2.25, 1.5], [4.5, 3], [6.75, 0], [9, -2.5]]),
    bob: [...lifts(0.3, 3, 0.75, 3), ...lifts(5, 3, 0.75, 3)],
    rest: '30 0,83 0,81 4,79.5 8,77.5 12,76.5 16,75.5 20,73.5 22,69 24,66 26,64.5 28,61.5 32,59 36,58.3 42,58.5 47,61 46,61.5 48,63.5 50.5,65 53,77.7 53,77.7 57,82.5 57,83 50,86 45,100 40,100 100,0 100,0 40,28 52,52 57,58 50,56 36',
    parts: [
      { name: 'near wing', clip: '58.5 47,58.3 42,59 36,61.5 32,64.5 28,66 26,69 24,73.5 22,75.5 20,76.5 16,77.5 12,79.5 8,81 4,83 0,100 0,100 40,86 45,83 50,82.5 57,77.7 57,77.7 53,65 53,63.5 50.5,61.5 48,61 46', origin: '61% 46%', rotate: [...beats(0.3, 3, 0.75, -3, 1, -19), ...beats(5, 3, 0.75, -3, 1, -19)] },
      { name: 'far wing', clip: '0 0,30 0,56 36,58 50,52 57,28 52,0 40', origin: '57% 48%', rotate: [...beats(0.3, 3, 0.75, 3, -1, 19), ...beats(5, 3, 0.75, 3, -1, 19)] },
    ],
  },
  // Breaks the surface in an arc, noses up, then dips back under.
  dolphin: {
    loop: 4.6,
    y: at([[0, 4], [2.3, -12], [4.6, 4]]),
    rotate: at([[0, -5], [2.3, 6], [4.6, -5]]),
  },
  // Darts after a wave, stops, darts back: legs go only while it runs. No turn: the
  // mirror flip jarred at this size, and a running-leg blur has no direction anyway.
  sanderling: {
    loop: 6,
    x: at([[0, 0], [1.12, -12], [2.8, -12], [3.92, 0]]),
    bob: [...footfalls(0, 4, 0.28, 1.2), ...footfalls(2.8, 4, 0.28, 1.2)],
    rest: '0 0,100 0,100 100,84 100,76 49,62 51,60 100,44 100,44 64,42 57,35 57,30 64,0 72',
    parts: [
      { name: 'back leg', clip: '30 64,35 57,42 57,44 64,44 100,0 100,0 72', origin: '38% 61%', rotate: [...strides(0, 4, 0.28, 26), ...strides(2.8, 4, 0.28, 26)] },
      { name: 'front leg', clip: '62 51,76 49,84 100,60 100', origin: '69% 53%', rotate: [...strides(0, 4, 0.28, 26, -1), ...strides(2.8, 4, 0.28, 26, -1)] },
    ],
  },
  // Sidestep, freeze, sidestep back. The legs scuttle while it moves; between moves a claw
  // comes up and the eyes flick.
  ghostcrab: {
    loop: 7,
    x: at([[0, 0], [1.05, -16], [2.8, -16], [3.85, 10], [5.95, 10], [7, 0]]),
    rotate: wobble(7, 0.7, -1.5, 1.5),
    rest: CRAB.rest,
    parts: [
      { name: 'left legs', clip: CRAB.legsL, origin: CRAB.legsLAt, rotate: [...strides(0, 6, 0.175, 8), ...strides(2.8, 6, 0.175, 8), ...strides(5.95, 6, 0.175, 8)] },
      { name: 'right legs', clip: CRAB.legsR, origin: CRAB.legsRAt, rotate: [...strides(0, 6, 0.175, 8, -1), ...strides(2.8, 6, 0.175, 8, -1), ...strides(5.95, 6, 0.175, 8, -1)] },
      { name: 'big claw', clip: CRAB.clawL, origin: CRAB.clawLAt, rotate: at([[1.5, 0], [1.9, -6], [2.5, -6], [2.8, 0], [4.5, 0], [4.9, -6], [5.5, -6], [5.9, 0]]) },
      { name: 'small claw', clip: CRAB.clawR, origin: CRAB.clawRAt, rotate: at([[4.2, 0], [4.6, -5], [5.2, -5], [5.6, 0]]) },
      { name: 'eyes', clip: CRAB.eyes, origin: CRAB.eyesAt, rotate: at([[1.3, 0], [1.42, -6], [1.7, 0], [2.2, 0], [2.32, 6], [2.6, 0], [4.4, 0], [4.52, -6], [4.8, 0], [6.4, 0], [6.52, 6], [6.8, 0]]) },
    ],
  },
  // The same crab on the foreshore diagram's tide clock (12 s: 0–5 ebb, 5–6 slack low, 6–11
  // flood, 11–12 slack high, after a 0.4 s delay). It is out from 3.6 to 11 s: the legs go
  // the whole time, it forages at slack low, and the diagram carries it up the beach ahead of
  // the flood from 6 s. The diagram mounts it when the tide starts, so the two clocks agree.
  tidecrab: {
    loop: 12,
    delay: 0.4,
    x: at([[4.4, 0], [4.9, -6], [5.3, -6], [5.6, 3], [6, 0]]),
    rotate: wobble(12, 0.7, -1.5, 1.5),
    rest: CRAB.rest,
    parts: [
      { name: 'left legs', clip: CRAB.legsL, origin: CRAB.legsLAt, rotate: strides(3.6, 40, 0.185, 8) },
      { name: 'right legs', clip: CRAB.legsR, origin: CRAB.legsRAt, rotate: strides(3.6, 40, 0.185, 8, -1) },
      { name: 'big claw', clip: CRAB.clawL, origin: CRAB.clawLAt, rotate: at([[4.6, 0], [5, -6], [5.6, -6], [5.9, 0]]) },
      { name: 'small claw', clip: CRAB.clawR, origin: CRAB.clawRAt, rotate: at([[5.2, 0], [5.5, -5], [5.9, 0]]) },
      { name: 'eyes', clip: CRAB.eyes, origin: CRAB.eyesAt, rotate: at([[4.3, 0], [4.42, -6], [4.7, 0], [5.4, 0], [5.52, 6], [5.8, 0], [7.5, 0], [7.62, -6], [7.9, 0], [9.5, 0], [9.62, 6], [9.9, 0]]) },
    ],
  },
  // Works the wrack line where it stands: paws at the sand with the near front leg,
  // rocks back on the hind leg as it does, swishes its tail between digs, and breathes.
  // No walk and no turn: a mirrored line drawing reads as a glitch, and a walk needs a
  // turn to come back.
  fox: {
    loop: 10,
    origin: '50% 100%',
    scale: at([[0, 1], [1.67, 1.02], [3.33, 1], [5, 1.02], [6.67, 1], [8.33, 1.02], [10, 1]]),
    bob: at([[2, 0], [2.3, 1], [3.3, 0], [7, 0], [7.3, 1], [8.3, 0]]),
    rest: '0 0,100 0,100 5,64 22,67 32,76 42,80.8 57,80.8 72,100 72,100 100,76 100,74 70,74 52,62.7 54,62.7 88,55 88,55 100,32 100,38 72,38 52,21 52,15 74,10 100,0 100',
    parts: [
      { name: 'front leg', clip: '21 52,38 52,38 72,32 100,10 100,15 74', origin: '30% 54%', rotate: [...paw(2), ...paw(7)] },
      { name: 'hind leg', clip: '62.7 54,74 52,74 70,76 100,55 100,55 88,62.7 88', origin: '68% 55%', rotate: at([[2, 0], [2.4, -3], [3.3, 0], [7, 0], [7.4, -3], [8.3, 0]]) },
      { name: 'tail', clip: '64 22,100 5,100 72,80.8 72,80.8 57,76 42,67 32', origin: '66% 26%', rotate: at([[4, 0], [4.6, -3], [5.6, 3], [6.2, 0], [8.8, 0], [9.2, -3], [9.7, 3], [10, 0]]) },
    ],
  },
  // Settles in the wash: the tail sweeps and the shell rocks against it.
  horseshoe: {
    loop: 3.4,
    rotate: at([[0, 1], [1.7, -1], [3.4, 1]]),
    rest: '17 0,100 0,100 100,0 100,0 13,27 42,27 50,36 50,37 38,33 23',
    parts: [{ name: 'tail', clip: '0 0,17 0,33 23,37 38,36 50,27 50,27 42,0 13', origin: '33% 46%', rotate: at([[0, -8], [1.7, 8], [3.4, -8]]) }],
  },
}

/** Motion keyframes for one track: sorted, held from 0, and closed at the loop. */
function track(loop: number, keys: Key[], mul = 1): { values: number[]; times: number[] } {
  const ks = keys.map((k) => ({ t: Math.min(k.t, loop), v: k.v })).sort((a, b) => a.t - b.t)
  if (ks[0].t > 0) ks.unshift({ t: 0, v: ks[0].v })
  if (ks[ks.length - 1].t < loop - 1e-6) ks.push({ t: loop, v: ks[ks.length - 1].v })
  const out = ks.filter((k, i) => i === 0 || k.t - ks[i - 1].t > 1e-6)
  return { values: out.map((k) => k.v * mul), times: out.map((k, i) => (i === out.length - 1 ? 1 : k.t / loop)) }
}

const poly = (s: string) => `polygon(${s.split(',').map((p) => p.trim().split(/\s+/).map((n) => `${n}%`).join(' ')).join(', ')})`

const LOOP = { repeat: Infinity, ease: 'easeInOut' } as const

/** A navy halo so white lines hold up over bright foam and sand. */
const HALO = 'drop-shadow(0 0 1px rgba(2,49,70,0.95)) drop-shadow(0 0 2px rgba(2,49,70,0.8)) drop-shadow(0 2px 6px rgba(2,49,70,0.6))'

export default function LineArt({
  id,
  scale = 1,
  animate = true,
  color = '#ffffff',
  className = '',
  shadow = true,
  idle = false,
  rig: rigKey,
}: {
  id: string
  scale?: number
  animate?: boolean
  color?: string
  className?: string
  shadow?: boolean
  /** Loop the creature's motion: travel and moving parts. */
  idle?: boolean
  /** Which rig to run; defaults to the species' own. The diagram crab uses `tidecrab`. */
  rig?: string
}) {
  const reduce = useReducedMotion()
  const art = SPECIES.find((s) => s.id === id)?.art
  const rig = idle && !reduce ? RIG[rigKey ?? id] : undefined
  const tracks = useMemo(() => {
    if (!rig) return undefined
    const t = (keys: Key[] | undefined, mul = 1) => (keys ? track(rig.loop, keys, mul) : undefined)
    return {
      x: t(rig.x, scale),
      y: t(rig.y, scale),
      rotate: t(rig.rotate),
      scale: t(rig.scale),
      face: t(rig.face),
      bob: t(rig.bob, scale),
      parts: (rig.parts ?? []).map((p) => track(rig.loop, p.rotate)),
    }
  }, [rig, scale])

  if (art) {
    const w = art.w * scale
    const h = w / art.ratio
    const mask = `url(${art.src}) center / contain no-repeat`
    const paint: CSSProperties = {
      background: color,
      WebkitMaskImage: `url(${art.src})`,
      maskImage: `url(${art.src})`,
      WebkitMask: mask,
      mask,
    }
    const wipe = `${animate ? 'wipe' : ''} ${className}`

    if (!rig || !tracks) {
      return <div aria-hidden className={wipe} style={{ ...paint, width: w, height: h, transform: art.flip ? 'scaleX(-1)' : undefined, filter: shadow ? HALO : undefined }} />
    }

    const loop = rig.loop
    const spin = (times: number[]) => ({ duration: loop, times, delay: rig.delay, ...LOOP })
    // The drawing: one layer for the body, one per moving part, all the same mask.
    const drawing = rig.parts ? (
      <div aria-hidden className={wipe} style={{ position: 'relative', width: w, height: h, filter: shadow ? HALO : undefined }}>
        <div data-part="rest" style={{ ...paint, position: 'absolute', inset: 0, clipPath: rig.rest ? poly(rig.rest) : undefined }} />
        {rig.parts.map((p, i) => (
          <motion.div
            key={p.name}
            data-part={p.name}
            style={{ ...paint, position: 'absolute', inset: 0, clipPath: poly(p.clip), transformOrigin: p.origin }}
            animate={{ rotate: tracks.parts[i].values }}
            transition={{ rotate: spin(tracks.parts[i].times) }}
          />
        ))}
      </div>
    ) : (
      <div aria-hidden className={wipe} style={{ ...paint, width: w, height: h, transform: art.flip ? 'scaleX(-1)' : undefined, filter: shadow ? HALO : undefined }} />
    )
    // Facing and footfalls sit between the travel and the drawing, so a turn mirrors the
    // parts too and a bob rides along with the walk.
    const facing =
      tracks.face || tracks.bob ? (
        <motion.div
          style={{ width: w, height: h }}
          animate={{ scaleX: tracks.face?.values ?? (art.flip ? -1 : 1), y: tracks.bob?.values ?? 0 }}
          transition={{ scaleX: tracks.face ? spin(tracks.face.times) : undefined, y: tracks.bob ? spin(tracks.bob.times) : undefined }}
        >
          {drawing}
        </motion.div>
      ) : (
        drawing
      )
    const body: Record<string, number[]> = {}
    const transition: Record<string, ReturnType<typeof spin>> = {}
    for (const k of ['x', 'y', 'rotate', 'scale'] as const) {
      const tr = tracks[k]
      if (!tr) continue
      body[k] = tr.values
      transition[k] = spin(tr.times)
    }
    return (
      <motion.div aria-hidden animate={body} transition={transition} style={{ width: w, height: h, transformOrigin: rig.origin }}>
        {facing}
      </motion.div>
    )
  }

  const ph = PLACEHOLDER[id]
  if (!ph) return null
  return (
    <svg
      viewBox="0 0 64 48"
      width={ph.w * scale}
      height={ph.w * scale * 0.75}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ filter: shadow ? 'drop-shadow(0 1px 2px rgba(2,49,70,0.45))' : undefined, overflow: 'visible' }}
      aria-hidden
    >
      {ph.paths.map((d, i) => (
        <path key={i} d={d} pathLength={1} className={animate ? 'draw' : undefined} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </svg>
  )
}
