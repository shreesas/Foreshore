import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Space between the dot and the loop, along the diagonal the badge hangs on. */
const GAP = 12
/** How close the badge may get to the window edge before it swings to the other side of the pointer. */
const EDGE = 8
/**
 * A quick pen loop in a 100-unit box: round-ish, a little lopsided, and the end runs on past the
 * start, just off the first stroke, the way a circle drawn by hand does.
 */
const LOOP = 'M62 7 C34 3 8 18 5 45 C2 72 24 94 52 94 C80 94 98 74 96 48 C94 22 76 6 50 5 C40 5 30 8 24 12'

/**
 * While a mouse is anywhere over `children`, the pointer becomes a small dot with a badge hanging off
 * it: `label` in the margin-note hand, circled in pen like the notes and arrows beside the wireframe.
 * The loop is filled with the section's own `ground`, so on the page it reads as a bare outline while
 * still hiding the text it passes over. Nothing it points at looks like this: the buttons are navy pills.
 * The dot keeps the exact point you're clicking and the badge hangs below and to the right of it,
 * swinging to the other side near the window's right or bottom edge.
 * Over anything marked `data-cursor="dot"` (the wireframe in chapter 03, the names and their card in
 * chapter 04) the badge folds into the dot, so only the dot is left on the thing you're using.
 * Touch and pen are left alone.
 * The cursor is portalled to <body> so no transformed or zoomed parent can break position: fixed.
 */
export default function PillCursor({ label, ground, size = 104, className = '', children }: {
  label: string
  /** The section's background colour; the loop is filled with it. */
  ground: string
  /** The loop's width in px. A short label gets a smaller one, so it stays light. */
  size?: number
  className?: string
  children: ReactNode
}) {
  const area = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const badge = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const [dot, setDot] = useState(false)

  useEffect(() => {
    // The mouse's last spot anywhere on the page. Wheel events carry it too, so someone who scrolls
    // without moving the mouse gets the badge the moment the section slides under the pointer, and
    // loses it the moment the section slides away.
    let at: { x: number; y: number } | null = null
    const show = (under: EventTarget | null) => {
      const inside = under instanceof Node && !!area.current?.contains(under)
      if (inside && at && cursor.current && badge.current) {
        const { clientWidth: vw, clientHeight: vh } = document.documentElement
        const r = badge.current.offsetWidth / 2
        // the loop's centre, on the diagonal, far enough out to leave GAP between it and the dot
        const c = (r + GAP) / Math.SQRT2
        const x = at.x + c + r > vw - EDGE ? -c : c
        const y = at.y + c + r > vh - EDGE ? -c : c
        cursor.current.style.transform = `translate(${at.x}px, ${at.y}px)`
        badge.current.style.transform = `translate(${x - r}px, ${y - r}px)`
      }
      setOn(inside)
      setDot(inside && under instanceof Element && !!under.closest('[data-cursor="dot"]'))
    }
    const move = (e: PointerEvent | WheelEvent) => {
      if (e instanceof PointerEvent && e.pointerType !== 'mouse') return
      at = { x: e.clientX, y: e.clientY }
      show(e.target)
    }
    const scroll = () => { if (at) show(document.elementFromPoint(at.x, at.y)) }
    const leave = () => setOn(false)
    const root = document.documentElement
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('wheel', move, { passive: true })
    window.addEventListener('scroll', scroll, { passive: true })
    root.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('wheel', move)
      window.removeEventListener('scroll', scroll)
      root.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <>
      <div ref={area} className={`${className} ${on ? 'cursor-none [&_*]:cursor-none' : ''}`}>
        {children}
      </div>
      {createPortal(
        <div ref={cursor} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60]">
          {/* zero-size, so it scales in and out around the pointer itself */}
          <div className={`transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none ${on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            {/* scales about the pointer (its top-left corner, before the offset), so it folds straight into the dot */}
            <div
              ref={badge}
              style={{ fontFamily: 'var(--font-hand)', width: size, height: size }}
              className={`absolute left-0 top-0 flex origin-top-left items-center justify-center px-3 text-center text-20 leading-none text-ink transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none ${dot ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
                <path d={LOOP} style={{ fill: ground }} className="stroke-current" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="relative">{label}</span>
            </div>
            <span className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-navy ring-2 ring-white" />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
