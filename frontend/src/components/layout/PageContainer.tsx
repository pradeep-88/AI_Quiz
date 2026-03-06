import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'screen'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-7xl',
  /** Full viewport width with comfortable padding (host results, analytics) */
  screen: 'max-w-[min(96vw,1600px)] w-full',
}

export function PageContainer({
  children,
  className = '',
  maxWidth = 'full',
}: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'mx-auto px-4 sm:px-6 py-6',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
