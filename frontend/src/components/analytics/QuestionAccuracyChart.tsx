import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { QuestionStat } from '../../types/quizTypes'

ChartJS.register(ArcElement, Tooltip, Legend)

interface QuestionAccuracyChartProps {
  questionStats: QuestionStat[]
  selectedIndex: number
  compact?: boolean
}

export function QuestionAccuracyChart({
  questionStats,
  selectedIndex,
  compact,
}: QuestionAccuracyChartProps) {
  const stat = questionStats[selectedIndex]
  const chartData = useMemo(() => {
    if (!stat) return null
    const correct = stat.correctCount
    const incorrect = stat.incorrectCount
    const total = stat.totalAttempts
    if (total === 0) return null
    return {
      labels: ['Correct', 'Incorrect'],
      datasets: [
        {
          data: [correct, incorrect],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          borderWidth: 1,
        },
      ],
    }
  }, [stat, selectedIndex, questionStats])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: !compact,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: { color: '#94a3b8', padding: compact ? 8 : 16 },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: unknown; label?: string; dataset: { data: number[] } }) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
              const raw = Number(ctx.raw)
              const pct = total > 0 ? Math.round((raw / total) * 100) : 0
              return `${ctx.label ?? ''}: ${raw} (${pct}%)`
            },
          },
        },
      },
    }),
    [compact]
  )

  if (!stat || !chartData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 rounded-lg bg-slate-800/50 border border-slate-700">
        {questionStats.length === 0 ? 'No question data' : 'Select a question'}
      </div>
    )
  }

  const correctPct = stat.totalAttempts > 0
    ? Math.round((stat.correctCount / stat.totalAttempts) * 100)
    : 0

  return (
    <div className={compact ? 'flex flex-col h-full min-h-0' : 'space-y-2'}>
      <p className="text-slate-400 text-xs line-clamp-2 shrink-0" title={stat.question}>
        Q{selectedIndex + 1}: {stat.question}
      </p>
      <div className={compact ? 'flex-1 min-h-0 w-full' : 'h-48 w-full'}>
        <Doughnut data={chartData} options={options} />
      </div>
      <p className="text-center text-slate-300 text-xs shrink-0">
        Correct: <span className="text-emerald-400 font-medium">{correctPct}%</span>
        {' · '}
        Incorrect: <span className="text-red-400 font-medium">{100 - correctPct}%</span>
      </p>
    </div>
  )
}
