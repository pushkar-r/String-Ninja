import React, { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

type AdSlotProps = {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
  style?: React.CSSProperties
}

export default function AdSlot({ slot, format = 'auto', className = '', style }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {}
  }, [])

  return (
    <div
      className={`ad-slot overflow-hidden ${className}`}
      style={style}
      aria-label="Advertisement"
      role="complementary"
    >
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-6480006571294124"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

/** Horizontal banner — use below navigation or at top of content */
export function AdBanner({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slot="auto"
      format="horizontal"
      className={`w-full min-h-[90px] ${className}`}
    />
  )
}

/** In-content rectangle — use between tool sections */
export function AdInContent({ className = '' }: { className?: string }) {
  return (
    <AdSlot
      slot="auto"
      format="rectangle"
      className={`w-full min-h-[250px] ${className}`}
    />
  )
}
