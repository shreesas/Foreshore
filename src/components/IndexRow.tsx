import type { ReactNode } from 'react'

/**
 * Numbered hairline row. Title and description sit close together, like a
 * table label and value, instead of splitting the row in half.
 * With `onClick` the row is a control and `active` marks the one that's on. From lg up, where
 * the list sits beside what it controls, the other rows step back, like the rail in chapter 05.
 * `stack` keeps the phone layout (title, then description under it) at every width, for a
 * list that sits in a text column instead of running the full page.
 */
export default function IndexRow({
  n,
  title,
  meta,
  children,
  tone = 'paper',
  onClick,
  active = false,
  big = false,
  stack = false,
}: {
  n: string
  title: ReactNode
  meta?: ReactNode
  children?: ReactNode
  tone?: 'paper' | 'navy'
  onClick?: () => void
  active?: boolean
  big?: boolean
  stack?: boolean
}) {
  const navy = tone === 'navy'
  const rule = navy ? 'border-paper/20' : 'border-navy/20'
  const muted = navy ? 'text-paper/70' : 'text-ink-muted'
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`grid w-full grid-cols-[40px_1fr] items-baseline gap-x-4 border-b ${rule} py-5 text-left md:gap-x-8 md:py-6 ${
        stack ? 'md:grid-cols-[48px_1fr]' : 'md:grid-cols-[48px_var(--title-w)_minmax(0,1fr)]'
      } ${
        onClick ? `transition-opacity duration-300 ${active ? '' : 'lg:opacity-60 lg:hover:opacity-100'}` : ''
      }`}
      style={{ ['--title-w' as string]: big ? '440px' : '300px' }}
    >
      <span className={`font-display text-16 tabular-nums ${muted}`}>{n}</span>
      <div className={`font-display ${big ? 'text-40 md:text-48' : 'text-24 md:text-32'}`}>{title}</div>
      <div className={`col-start-2 max-w-[52ch] pt-2 text-16 md:text-20 ${stack ? '' : 'md:col-start-3 md:pt-0'} ${muted}`}>
        {meta && <div className={`mb-1 font-display text-16 italic ${muted}`}>{meta}</div>}
        {children}
      </div>
    </Tag>
  )
}
