import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useToastStore, type ToastType } from '../../store/toastStore'
import { cn } from '../../utils/helpers'

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500/90 text-white border-emerald-400',
  error: 'bg-red-500/90 text-white border-red-400',
  info: 'bg-slate-700/95 text-slate-100 border-slate-600',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg',
              typeStyles[toast.type]
            )}
          >
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
