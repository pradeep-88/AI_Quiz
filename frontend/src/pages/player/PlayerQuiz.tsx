import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SkipForward } from 'lucide-react'
import { useQuizStore } from '../../store/quizStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Timer } from '../../components/ui/Timer'
import { PageContainer } from '../../components/layout/PageContainer'

export function PlayerQuiz() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const {
    roomCode,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timer,
    setTimer,
    answerSubmitted,
    submitAnswer,
    quizState,
    nextQuestion,
  } = useQuizStore()

  const code = paramCode ?? roomCode ?? ''

  useEffect(() => {
    if (currentQuestion) {
      setTimer(currentQuestion.timeLimit ?? 20)
    }
  }, [currentQuestion?.id, setTimer])

  useEffect(() => {
    if (!currentQuestion || answerSubmitted) return
    const interval = setInterval(() => {
      const state = useQuizStore.getState()
      if (state.timer <= 0) {
        state.submitAnswer('', 0)
        return
      }
      state.setTimer(state.timer - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [currentQuestion?.id, answerSubmitted])

  useEffect(() => {
    if (quizState === 'finished' && code) {
      navigate(`/player/results/${code}`, { replace: true })
    }
  }, [quizState, code, navigate])

  const handleOptionClick = useCallback(
    (option: string) => {
      if (answerSubmitted) return
      submitAnswer(option, useQuizStore.getState().timer)
    },
    [answerSubmitted, submitAnswer]
  )

  if (!currentQuestion) {
    return (
      <PageContainer maxWidth="2xl" className="pt-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Get ready for the next question...</p>
        </div>
      </PageContainer>
    )
  }

  const timeTotal = currentQuestion.timeLimit ?? 20

  return (
    <PageContainer maxWidth="2xl" className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-slate-400 font-medium">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <Timer
          timeLeft={timer}
          total={timeTotal}
          size="lg"
          pulseWhenLow={5}
        />
      </div>
      <Card variant="elevated" className="mb-8">
        <div className="min-h-[200px]">
          <h2 className="text-2xl font-bold mb-8 leading-relaxed text-slate-100">
            {currentQuestion.text}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(currentQuestion.options ?? []).map((option, i) => (
              <motion.button
                key={i}
                type="button"
                whileHover={answerSubmitted ? undefined : { scale: 1.02 }}
                whileTap={answerSubmitted ? undefined : { scale: 0.98 }}
                onClick={() => handleOptionClick(option)}
                disabled={answerSubmitted}
                className={`
                  p-6 rounded-xl text-left font-bold text-lg transition
                  ${answerSubmitted ? 'opacity-70 cursor-default' : 'cursor-pointer'}
                  bg-slate-700 hover:bg-slate-600 border-2 border-slate-600
                  focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
                `}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>
      {answerSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-slate-400 text-center">
            Answer submitted. When you&apos;re ready, advance to the next question.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => nextQuestion(code)}
            className="gap-2"
          >
            <SkipForward className="w-5 h-5" /> Next Question
          </Button>
        </motion.div>
      )}
    </PageContainer>
  )
}
