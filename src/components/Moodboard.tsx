import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'

/**
 * The moodboard, assembled by scroll. Each piece is its own file in
 * public/img/moodboard/web, placed where it sits on the original board
 * (public/img/moodboard.jpg). The board pins while you scroll and the pieces
 * slide in one after another from the edge nearest to them, photos first,
 * then the crab and the dolphin on top. Scrolling back takes it apart again.
 *
 * Positions are in a 1400 × 788 frame, the original board scaled down.
 */

type From = 'left' | 'right' | 'top' | 'bottom'

interface Piece { src: string; alt: string; x: number; y: number; w: number; h: number; from: From }

const W = 1400
const H = 788

/** Back to front, which is also the order they arrive in. */
const PIECES: Piece[] = [
  { src: 'ocean.jpg', alt: 'Turquoise water from above, white foam', x: 967, y: 122, w: 419, h: 638, from: 'right' },
  { src: 'beach.jpg', alt: 'A quiet shoreline, a few people far down the beach', x: 16, y: 250, w: 484, h: 467, from: 'left' },
  { src: 'surfers.jpg', alt: 'Swimmers in blue water with white doodled clouds and a whale tail', x: 380, y: 15, w: 340, h: 236, from: 'top' },
  { src: 'dune-path.jpg', alt: 'A sandy path between fences to the sea at sunset', x: 750, y: 15, w: 271, h: 368, from: 'top' },
  { src: 'dune-grass.jpg', alt: 'Dune grass framing a grey sea', x: 663, y: 457, w: 286, h: 303, from: 'bottom' },
  { src: 'whale-cloud.jpg', alt: 'A cloud doodled into a whale and its calf', x: 355, y: 560, w: 291, h: 200, from: 'bottom' },
  { src: 'crab.png', alt: 'A ghost crab', x: 0, y: 0, w: 415, h: 350, from: 'left' },
  { src: 'dolphin.png', alt: 'A bottlenose dolphin', x: 381, y: 252, w: 483, h: 270, from: 'right' },
]

/** Each piece gets its own slice of the scroll, so they come in one after another. */
const STEP = 0.1
const SPAN = 0.2

function Piece({ piece, i, p, still }: { piece: Piece; i: number; p: MotionValue<number>; still: boolean }) {
  const a = i * STEP
  const b = a + SPAN
  // Off-stage distance, in the piece's own size, so big and small pieces travel alike.
  const far = still ? 0 : 140
  const [dx, dy] = { left: [-far, 0], right: [far, 0], top: [0, -far], bottom: [0, far] }[piece.from]
  // Ranges run the full 0–1 and repeat their ends, see the scroll-timeline note in the style guide.
  const x = useTransform(p, [0, a, b, 1], [`${dx}%`, `${dx}%`, '0%', '0%'])
  const y = useTransform(p, [0, a, b, 1], [`${dy}%`, `${dy}%`, '0%', '0%'])
  const opacity = useTransform(p, [0, a, a + SPAN * 0.6, 1], [still ? 1 : 0, still ? 1 : 0, 1, 1])
  return (
    <motion.img
      src={`/img/moodboard/web/${piece.src}`}
      alt={piece.alt}
      draggable={false}
      className="absolute block select-none"
      style={{
        left: `${(piece.x / W) * 100}%`,
        top: `${(piece.y / H) * 100}%`,
        width: `${(piece.w / W) * 100}%`,
        height: `${(piece.h / H) * 100}%`,
        x,
        y,
        opacity,
        zIndex: i + 1,
      }}
    />
  )
}

export default function Moodboard({ caption }: { caption: string }) {
  const track = useRef<HTMLDivElement>(null)
  const still = useReducedMotion() ?? false
  // Starts as the board comes up from the bottom of the screen, done a little before the pin releases.
  const { scrollYProgress: p } = useScroll({ target: track, offset: ['start 75%', 'end end'] })
  return (
    <div ref={track} className="relative overflow-x-clip" style={{ height: still ? 'auto' : '230vh' }}>
      {/* Never taller than the screen below the pin, so the whole board and its caption stay in view.
          When that makes it narrower than the column, it sits centred with its caption under it. */}
      <div className={`mx-auto ${still ? '' : 'sticky top-[12vh]'}`} style={{ width: `min(100%, calc((88vh - 72px) * ${W / H}))` }}>
        <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
          {PIECES.map((piece, i) => <Piece key={piece.src} piece={piece} i={i} p={p} still={still} />)}
        </div>
        <p className="mt-2 font-display text-16 italic text-ink-muted">{caption}</p>
      </div>
    </div>
  )
}
