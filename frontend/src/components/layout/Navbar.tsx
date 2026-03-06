import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit, Wifi, WifiOff } from 'lucide-react'
import { useQuizStore } from '../../store/quizStore'
import { cn } from '../../utils/helpers'

interface NavbarProps {
  className?: string
}

export function Navbar({ className = '' }: NavbarProps) {
  const socketConnected = useQuizStore((s) => s.socketConnected)

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-black tracking-tight text-white hover:opacity-90 transition"
        >
          <motion.span whileHover={{ rotate: 12 }} transition={{ duration: 0.2 }}>
            <BrainCircuit className="w-8 h-8 text-cyan-400" aria-hidden />
          </motion.span>
          <span>
            AI<span className="text-cyan-400">QUIZ</span>
          </span>
        </Link>
        <div
          className="flex items-center gap-2 text-sm"
          role="status"
          aria-live="polite"
        >
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0',
              socketConnected ? 'bg-emerald-500' : 'bg-red-500'
            )}
            aria-hidden
          />
          {socketConnected ? (
            <>
              <Wifi className="w-4 h-4 text-slate-400" aria-hidden />
              <span className="text-slate-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-slate-500" aria-hidden />
              <span className="text-slate-500">Reconnecting…</span>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
