import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { QuestionStat } from '../../types/quizTypes'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DifficultyChartProps {
  questionStats: QuestionStat[]
  compact?: boolean
}

export function DifficultyChart({ questionStats, compact }: DifficultyChartProps) {
  const { labels, rates } = useMemo(() => {
    const sorted = [...questionStats].sort((a, b) => {
      const rateA = a.totalAttempts > 0 ? a.incorrectCount / a.totalAttempts : 0
      const rateB = b.totalAttempts > 0 ? b.incorrectCount / b.totalAttempts : 0
      return rateB - rateA
    })
    return {
      labels: sorted.map((_, i) => `Q${i + 1}`),
      rates: sorted.map((s) =>
        s.totalAttempts > 0 ? Math.round((s.incorrectCount / s.totalAttempts) * 100) : 0
      ),
    }
  }, [questionStats])

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Incorrect %',
          data: rates,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    }),
    [labels, rates]
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: !compact,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Most difficult questions (by incorrect rate)',
          color: '#e2e8f0',
          font: { size: compact ? 12 : 16 },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: unknown }) => `${Number(ctx.raw)}% incorrect`,
          },
        },
      },
      scales: {
        x: {
          max: 100,
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: {
            color: '#94a3b8',
            callback: (value: number | string) => (typeof value === 'number' ? value + '%' : value),
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8' },
        },
      },
    }),
    [compact]
  )

  if (questionStats.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 rounded-lg bg-slate-800/50 border border-slate-700">
        No question data yet
      </div>
    )
  }

  return (
    <div className={compact ? 'h-full w-full min-h-[140px]' : 'h-64 w-full'}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
