import type { ReactNode } from 'react'

interface BackgroundProps {
  children: ReactNode
  className?: string
}

export function Background({ children, className = '' }: BackgroundProps) {
  return (
    <div
      className={`min-h-screen bg-slate-900 text-white selection:bg-cyan-400 selection:text-slate-900 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(34,211,238,0.08),transparent)] pointer-events-none" />
      {children}
    </div>
  )
}
