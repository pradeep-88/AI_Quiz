import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline'
}

const variantClasses = {
  default: 'bg-slate-800/80 border border-slate-700',
  elevated: 'bg-slate-800 shadow-xl shadow-black/20 border border-slate-700',
  outline: 'bg-transparent border-2 border-slate-600',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-xl p-6', variantClasses[variant], className)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  )
)
Card.displayName = 'Card'
