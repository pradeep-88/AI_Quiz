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
import type { LeaderboardEntry } from '../../types/quizTypes'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ScoreChartProps {
  leaderboard: LeaderboardEntry[]
  compact?: boolean
}

export function ScoreChart({ leaderboard, compact }: ScoreChartProps) {
  const chartData = useMemo(() => {
    const labels = leaderboard.map((e) => e.name)
    const scores = leaderboard.map((e) => e.score)
    return {
      labels,
      datasets: [
        {
          label: 'Score',
          data: scores,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    }
  }, [leaderboard])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: !compact,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Score distribution',
          color: '#e2e8f0',
          font: { size: compact ? 14 : 16 },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8' },
        },
      },
    }),
    [compact]
  )

  if (leaderboard.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 rounded-lg bg-slate-800/50 border border-slate-700">
        No score data yet
      </div>
    )
  }

  return (
    <div className={compact ? 'h-full w-full min-h-[120px]' : 'h-64 w-full'}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
