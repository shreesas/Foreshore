import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/**
 * The references, behind a button in the footer. A flat paper panel over the page: a display-serif
 * heading, then hairline rows grouped by what each source was used for, the way chapter 01 lists its
 * numbers. Only public things: papers, agencies, fonts, image sources, tools. Escape, the Close button
 * and the dimmed page all close it. While it is open the page under it doesn't scroll: the overlay
 * carries data-lenis-prevent so the wheel scrolls the list, and the document's overflow is held.
 */

interface Item { text: string; href?: string; note?: string }
interface Group { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Research',
    items: [
      { text: 'Pyle, R. M. (1978). The extinction of experience.', note: 'Horticulture.' },
      { text: 'Soga, M. and Gaston, K. J. (2016). Extinction of experience: the loss of human–nature interactions.', note: 'Frontiers in Ecology and the Environment.', href: 'https://doi.org/10.1002/fee.1225' },
      { text: 'Balmford, A. et al. (2002). Why conservationists should heed Pokémon.', note: 'Science.', href: 'https://doi.org/10.1126/science.295.5564.2367b' },
      { text: 'Passmore, H.-A. and Holder, M. D. (2017). Noticing nature: individual and social benefits of a two-week intervention.', note: 'Journal of Positive Psychology.', href: 'https://doi.org/10.1080/17439760.2016.1221126' },
      { text: 'Richardson, M. et al. (2021). Actively noticing nature (not just time in nature) helps promote nature connectedness.', note: 'Ecopsychology.', href: 'https://doi.org/10.1089/eco.2020.0023' },
      { text: 'National Park Service, Assateague Island National Seashore.', note: 'Visitation figures and species lists.', href: 'https://www.nps.gov/asis/index.htm' },
      { text: 'Maryland Department of Natural Resources.', note: 'Horseshoe crab spawning.' },
    ],
  },
  {
    title: 'Images and drawings',
    items: [
      { text: 'Line drawings', note: 'Drawn by hand by the author and traced with VTracer.' },
      { text: 'Field footage', note: 'Taken by the author on Assateague Island, May and September 2026.' },
      { text: 'Moodboard photographs', note: 'Reference images found online, used for the moodboard only.' },
      { text: 'Animal photographs in chapter 04', note: 'Unsplash.', href: 'https://unsplash.com/' },
    ],
  },
  {
    title: 'Type',
    items: [
      { text: 'Instrument Serif', note: 'Display face.', href: 'https://fonts.google.com/specimen/Instrument+Serif' },
      { text: 'Fira Sans', note: 'Body and interface.', href: 'https://fonts.google.com/specimen/Fira+Sans' },
      { text: 'Caveat', note: 'Margin notes.', href: 'https://fonts.google.com/specimen/Caveat' },
    ],
  },
  {
    title: 'Data',
    items: [
      { text: 'A curated dataset.', note: 'Species hours, seasons and facts follow NPS Assateague notes and Maryland DNR. Nothing is tracked live.' },
      { text: 'For a real version, keyless sources:', note: 'iNaturalist, GBIF, OBIS, NOAA CO-OPS tides, Open-Meteo.' },
    ],
  },
  {
    title: 'Built with',
    items: [
      { text: 'React, Vite, TypeScript, Tailwind CSS, Motion, Lenis, matter-js.', note: 'A static site with no API keys.' },
      { text: 'Made with Claude Code.', href: 'https://claude.com/product/claude-code' },
    ],
  },
]

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function References({ open, onClose }: { open: boolean; onClose: () => void }) {
  const still = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  // The latest onClose, so the lock effect below only runs when `open` changes.
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])

  // Hold the page still, keep focus inside, close on Escape, hand focus back to the button on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const html = document.documentElement
    const prev = { html: html.style.overflow, body: document.body.style.overflow }
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return }
      if (e.key !== 'Tab' || !panel.current) return
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prev.html
      document.body.style.overflow = prev.body
      opener?.focus()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="references"
          data-lenis-prevent
          className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* the dimmed page: a click on it closes */}
          <div aria-hidden onClick={onClose} className="absolute inset-0 touch-none bg-navy/40 backdrop-blur-[2px]" />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="references-title"
            className="soft-scroll relative flex max-h-[88svh] w-full max-w-[760px] flex-col overflow-y-auto overscroll-contain border border-navy/20 bg-paper px-6 pb-8 pt-6 text-ink md:px-10 md:pb-10 md:pt-8"
            initial={still ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: still ? 0 : 24, transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, opacity: { duration: 0.2 } }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 id="references-title" className="font-display text-40 leading-none md:text-48">References</h2>
                <p className="mt-3 font-display text-16 italic text-ink-muted">The research, images, type, data and tools behind this site.</p>
              </div>
              <button ref={closeBtn} onClick={onClose} className="-mr-3 -mt-2 min-h-11 shrink-0 px-3 font-display text-16 italic text-ink-muted hover:text-ink">
                Close
              </button>
            </div>
            {GROUPS.map((g) => (
              <section key={g.title} className="mt-8">
                <h3 className="font-display text-24">{g.title}</h3>
                <ul className="mt-2">
                  {g.items.map((it) => (
                    <li key={it.text} className="border-b border-navy/20 py-3 text-16 leading-[1.5]">
                      {it.href ? (
                        <a href={it.href} target="_blank" rel="noreferrer" className="underline decoration-navy/30 underline-offset-4 hover:decoration-navy">{it.text}</a>
                      ) : (
                        <span>{it.text}</span>
                      )}
                      {it.note && <span className="text-ink-muted"> {it.note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
