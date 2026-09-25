import type { CSSProperties, ReactNode } from 'react'

/**
 * A chapter: a labelled hairline at the top, then the content. Full viewport by default.
 *
 * Each chapter gets its own ground so a new section reads as new content:
 *   paper  the mint page          grid  mint with the field-notebook grid
 *   white  plain white            white-grid  white with the grid
 *   sand   pale warm sand
 *   sky    pale teal
 *   foam   mint a step deeper     navy  indigo, text flips to mint
 */
type Tone = 'paper' | 'grid' | 'white' | 'white-grid' | 'foam' | 'sand' | 'sky' | 'navy'

const BG: Record<Tone, string> = {
  paper: 'bg-paper',
  grid: 'paper-grid',
  white: 'bg-white',
  'white-grid': 'white-grid',
  foam: 'bg-foam',
  sand: 'bg-sand-light',
  sky: 'bg-sky-light',
  navy: 'navy-grid text-paper',
}

/** On navy, the ink tokens flip to mint so every child that says text-ink or border-navy still reads. */
const ON_NAVY = {
  '--color-ink': 'var(--color-paper)',
  '--color-ink-muted': 'rgba(221, 241, 241, 0.78)',
  '--color-navy': 'var(--color-paper)',
} as CSSProperties

export default function Chapter({
  id,
  index,
  label,
  tone = 'paper',
  full = true,
  className = '',
  children,
}: {
  id: string
  index: string
  label: string
  /** Context line; no longer rendered, kept so call sites stay valid. */
  right?: string
  tone?: Tone
  full?: boolean
  /** Extra classes on the section itself. */
  className?: string
  children: ReactNode
}) {
  const navy = tone === 'navy'
  const muted = navy ? 'text-paper/70' : 'text-ink-muted'
  return (
    <section id={id} className={`${BG[tone]} px-6 py-24 md:px-10 md:py-32 lg:px-[70px] ${full ? 'min-h-svh' : ''} ${className}`}>
      <div className="mx-auto w-full max-w-[1600px]" style={navy ? ON_NAVY : undefined}>
        <header>
          <h2 className="font-display text-32 leading-none md:text-48">
            <span className={`mr-4 tabular-nums ${muted}`}>{index}</span>{label}
          </h2>
        </header>
        <div className="pt-12 md:pt-20">{children}</div>
      </div>
    </section>
  )
}
