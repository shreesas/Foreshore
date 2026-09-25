/** Hand-drawn mouse with the word "scroll" arced over it, in the margin-note hand. */
export default function ScrollHint() {
  const letters = ['s', 'c', 'r', 'o', 'l', 'l']
  return (
    <div className="relative mx-auto h-24 w-40" aria-hidden>
      {letters.map((ch, i) => {
        const a = -70 + i * 28
        const rad = (a * Math.PI) / 180
        const x = 80 + Math.sin(rad) * 58
        const y = 58 - Math.cos(rad) * 46
        return (
          <span
            key={i}
            className="absolute text-24 text-ink"
            style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${a * 0.6}deg)`, fontFamily: 'var(--font-hand)' }}
          >
            {ch}
          </span>
        )
      })}
      <svg viewBox="0 0 40 60" width="36" height="54" className="absolute left-1/2 top-9 -translate-x-1/2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 22 C 6 8, 34 8, 34 22 L 34 42 C 34 56, 6 56, 6 42 Z" />
        <path d="M20 12 v10" />
        <path d="M18 16 l2 -4 l2 4" />
      </svg>
    </div>
  )
}
