import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'
import { Card } from '../ui/Card'
import { ScoreChart } from './ScoreChart'
import { QuestionAccuracyChart } from './QuestionAccuracyChart'
import { DifficultyChart } from './DifficultyChart'
import { DifficultyChart3D } from './DifficultyChart3D'
import type { LeaderboardEntry } from '../../types/quizTypes'
import type { QuestionStat } from '../../types/quizTypes'

interface AnalyticsDashboardProps {
  leaderboard: LeaderboardEntry[]
  questionStats: QuestionStat[]
  className?: string
}

export function AnalyticsDashboard({
  leaderboard,
  questionStats,
  className = '',
}: AnalyticsDashboardProps) {
  const [accuracyQuestionIndex, setAccuracyQuestionIndex] = useState(0)

  return (
    <section className={cn('flex flex-col min-h-0', className)}>
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-white mb-2 shrink-0"
      >
        Quiz Analytics
      </motion.h2>
      <div className="grid grid-cols-2 grid-rows-[1fr_1fr_1fr] gap-3 flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-h-0 flex flex-col overflow-hidden"
        >
          <Card variant="elevated" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
            <div className="h-[180px] min-h-0 shrink-0">
              <ScoreChart leaderboard={leaderboard} compact />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="min-h-0 flex flex-col overflow-hidden"
        >
          <Card variant="elevated" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
            <h3 className="text-slate-200 font-semibold mb-1.5 text-sm shrink-0">Question accuracy</h3>
            {questionStats.length > 0 && (
              <div className="flex flex-wrap gap-1 shrink-0 mb-2">
                {questionStats.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAccuracyQuestionIndex(i)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                      accuracyQuestionIndex === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Q{i + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <QuestionAccuracyChart
                questionStats={questionStats}
                selectedIndex={accuracyQuestionIndex}
                compact
              />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="min-h-0 flex flex-col overflow-hidden col-span-2"
        >
          <Card variant="elevated" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
            <div className="h-[200px] min-h-0 shrink-0">
              <DifficultyChart questionStats={questionStats} compact />
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="min-h-0 flex flex-col overflow-hidden col-span-2"
        >
          <Card variant="elevated" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
            <h3 className="text-slate-200 font-semibold mb-0.5 text-sm shrink-0">3D — Question difficulty</h3>
            <p className="text-slate-500 text-xs mb-2 shrink-0">
              Bar height = incorrect rate. Drag to rotate, scroll to zoom.
            </p>
            <div className="flex-1 min-h-[180px] overflow-hidden">
              <DifficultyChart3D questionStats={questionStats} />
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
