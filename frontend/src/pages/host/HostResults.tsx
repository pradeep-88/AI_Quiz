import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../../store/quizStore'
import { Button } from '../../components/ui/Button'
import { Leaderboard } from '../../components/ui/Leaderboard'
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard'
import { PageContainer } from '../../components/layout/PageContainer'

export function HostResults() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const {
    leaderboard,
    roomCode: storeCode,
    quizAnalytics,
    requestLeaderboard,
    fetchQuizAnalytics,
    reset,
  } = useQuizStore()

  const code = paramCode ?? storeCode ?? ''

  useEffect(() => {
    if (code && leaderboard.length === 0) requestLeaderboard()
  }, [code, leaderboard.length, requestLeaderboard])

  useEffect(() => {
    if (code && !quizAnalytics) fetchQuizAnalytics(code)
  }, [code, quizAnalytics, fetchQuizAnalytics])

  function handleNewQuiz() {
    reset()
    navigate('/host/create', { replace: true })
  }

  function handleGoHome() {
    reset()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
      <PageContainer maxWidth="screen" className="flex-1 flex flex-col min-h-0 py-3 px-4 sm:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,380px)_1fr] grid-rows-[auto_1fr] xl:grid-rows-1 gap-4 xl:gap-6 flex-1 min-h-0 xl:items-stretch">
          <div className="flex flex-col items-center xl:items-start shrink-0">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Final standings
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md xl:max-w-sm max-h-52 overflow-hidden flex flex-col min-h-0"
            >
              <Leaderboard entries={leaderboard} maxItems={20} title="Final Leaderboard" className="min-h-0" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center xl:justify-start gap-3 mt-3"
            >
              <Button variant="primary" size="lg" onClick={handleNewQuiz}>
                Create new quiz
              </Button>
              <Button variant="secondary" size="lg" onClick={handleGoHome}>
                Go home
              </Button>
            </motion.div>
          </div>

          {quizAnalytics && (
            <div className="min-h-0 overflow-hidden xl:min-w-0 flex flex-col xl:self-stretch">
              <AnalyticsDashboard
                leaderboard={quizAnalytics.leaderboard}
                questionStats={quizAnalytics.questionStats}
                className="flex-1 min-h-0 overflow-hidden"
              />
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  )
}
