import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

interface TimerProps {
  timeLeft: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  pulseWhenLow?: number
  className?: string
}

const sizeClasses = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-28 h-28 text-4xl',
}

export function Timer({
  timeLeft,
  total,
  size = 'md',
  pulseWhenLow = 5,
  className = '',
}: TimerProps) {
  const isLow = timeLeft > 0 && timeLeft <= pulseWhenLow
  const progress = total > 0 ? (timeLeft / total) * 100 : 0
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-slate-800 border-2 border-slate-600',
        sizeClasses[size],
        className
      )}
      animate={
        isLow
          ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 0.8 } }
          : {}
      }
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className="stroke-slate-700"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={isLow ? 'stroke-red-500' : 'stroke-cyan-400'}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: 0 }}
          animate={{ strokeDasharray: circumference, strokeDashoffset }}
          transition={{ duration: 0.3 }}
        />
      </svg>
      <span
        className={cn(
          'relative z-10 font-black tabular-nums',
          isLow ? 'text-red-400' : 'text-white'
        )}
      >
        {timeLeft}
      </span>
    </motion.div>
  )
}
