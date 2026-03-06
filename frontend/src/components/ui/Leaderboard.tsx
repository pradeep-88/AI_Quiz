import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '../../types/quizTypes'
import { cn } from '../../utils/helpers'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  maxItems?: number
  highlightName?: string
  title?: string
  className?: string
}

const medals = ['🥇', '🥈', '🥉']

export function Leaderboard({
  entries,
  maxItems = 10,
  highlightName,
  title = 'Leaderboard',
  className = '',
}: LeaderboardProps) {
  const list = entries.slice(0, maxItems)

  return (
    <div
      className={cn(
        'rounded-xl bg-slate-800/90 border border-slate-700 overflow-hidden flex flex-col min-h-0',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="font-bold text-slate-200">{title}</h3>
      </div>
      <ul className="divide-y divide-slate-700 flex-1 min-h-0 overflow-y-auto">
        {list.length === 0 ? (
          <li className="px-4 py-6 text-center text-slate-500 text-sm">
            No scores yet
          </li>
        ) : (
          list.map((entry, i) => (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3',
                entry.name === highlightName &&
                  'bg-indigo-500/20 border-l-4 border-indigo-400'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl w-8 shrink-0">
                  {i < 3 ? (
                    medals[i]
                  ) : (
                    <span className="text-slate-500 font-bold">#{i + 1}</span>
                  )}
                </span>
                <span className="font-medium truncate text-white">{entry.name}</span>
              </div>
              <span className="font-bold text-cyan-400 shrink-0">{entry.score}</span>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  )
}
