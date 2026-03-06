import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../../store/quizStore'
import { getSocket } from '../../socket/socket'
import { Button } from '../../components/ui/Button'
import { QuestionReviewCard } from '../../components/quiz/QuestionReviewCard'
import { PageContainer } from '../../components/layout/PageContainer'

export function PlayerReview() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const [loadTimeout, setLoadTimeout] = useState(false)
  const {
    roomCode: storeCode,
    playerReview,
    fetchPlayerReview,
    setPlayerReview,
  } = useQuizStore()

  const code = (paramCode ?? storeCode ?? '').trim().toUpperCase()

  useEffect(() => {
    if (!code) {
      navigate('/join', { replace: true })
      return
    }
    setPlayerReview(null)
    setLoadTimeout(false)
    const socket = getSocket()
    const playerId = socket.id
    if (playerId) {
      fetchPlayerReview(code, playerId)
    }
    const t = setTimeout(() => setLoadTimeout(true), 5000)
    return () => clearTimeout(t)
  }, [code, fetchPlayerReview, setPlayerReview, navigate])

  function handleBackToResults() {
    navigate(`/player/results/${code}`, { replace: true })
  }

  function handleGoHome() {
    useQuizStore.getState().reset()
    navigate('/', { replace: true })
  }

  if (!code) {
    return null
  }

  const loading = playerReview === null && !loadTimeout
  const questions = playerReview ?? []
  const showEmpty = !loading && questions.length === 0
  const showTimeout = loadTimeout && playerReview === null

  return (
    <PageContainer maxWidth="2xl" className="pt-8 pb-12">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Quiz Review</h1>
        <p className="text-slate-400">Review your answers and see the correct solutions.</p>
      </motion.header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500">Loading your review...</p>
        </div>
      )}

      {(showEmpty || showTimeout) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 rounded-xl bg-slate-800/80 border border-slate-700"
        >
          <p className="text-slate-400 mb-6">
            {showTimeout
              ? 'Review took too long to load. Check your connection and try again from the results page.'
              : 'No review data available for this quiz.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" onClick={handleBackToResults}>
              Back to results
            </Button>
            <Button variant="primary" onClick={handleGoHome}>
              Go home
            </Button>
          </div>
        </motion.div>
      )}

      {!loading && questions.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {questions.map((q, i) => (
              <QuestionReviewCard
                key={i}
                question={q.question}
                options={q.options}
                selectedAnswer={q.selectedAnswer}
                correctAnswer={q.correctAnswer}
                isCorrect={q.isCorrect}
                index={i}
              />
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            <Button variant="secondary" onClick={handleBackToResults}>
              Back to results
            </Button>
            <Button variant="primary" onClick={handleGoHome}>
              Go home
            </Button>
          </motion.div>
        </>
      )}
    </PageContainer>
  )
}
