import type { ReactNode } from 'react'

/**
 * Phone-shaped frame. `wire` renders the grey wireframe variant.
 * `bezel` sets the frame color; the default is navy. The branded chapter
 * passes mint at night so the phone still reads against a dark scene.
 */
export default function Phone({ children, wire = false, fluid = false, bezel = '#023146' }: { children: ReactNode; wire?: boolean; fluid?: boolean; bezel?: string }) {
  return (
    <div
      className={`relative mx-auto ${fluid ? 'w-full' : 'w-[320px]'} max-w-full rounded-phone p-[10px] transition-colors duration-700 ${
        wire ? 'border border-dashed border-wire bg-[color-mix(in_srgb,var(--color-navy)_5%,#ffffff)]' : 'shadow-[0_32px_64px_-24px_rgba(2,49,70,0.5)]'
      }`}
      style={{ aspectRatio: '9 / 19.5', ...(wire ? {} : { background: bezel }) }}
    >
      <div data-screen className={`relative h-full w-full overflow-hidden rounded-[34px] ${wire ? 'bg-wire-bg' : 'bg-paper'}`}>
        {children}
      </div>
      <div
        aria-hidden
        className={`absolute left-1/2 top-[18px] h-[24px] w-[96px] -translate-x-1/2 rounded-full transition-colors duration-700 ${wire ? 'border border-dashed border-wire' : ''}`}
        style={wire ? undefined : { background: bezel }}
      />
    </div>
  )
}
