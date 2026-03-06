import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuizStore } from '../../store/quizStore'
import { Card } from '../../components/ui/Card'
import { Timer } from '../../components/ui/Timer'
import { Leaderboard } from '../../components/ui/Leaderboard'
import { PageContainer } from '../../components/layout/PageContainer'

export function HostQuiz() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const {
    roomCode,
    currentQuestion,
    questionIndex,
    totalQuestions,
    leaderboard,
    timer,
    quizState,
    requestLeaderboard,
  } = useQuizStore()

  const code = paramCode ?? roomCode ?? ''

  useEffect(() => {
    if (code) requestLeaderboard()
  }, [code, requestLeaderboard, currentQuestion?.id])

  // Poll leaderboard while quiz is active so host sees scores as players submit
  useEffect(() => {
    if (!code || quizState !== 'active') return
    const interval = setInterval(requestLeaderboard, 3000)
    return () => clearInterval(interval)
  }, [code, quizState, requestLeaderboard])

  useEffect(() => {
    if (quizState === 'finished' && code) {
      navigate(`/host/results/${code}`, { replace: true })
    }
  }, [quizState, code, navigate])

  const timeTotal = currentQuestion?.timeLimit ?? 20

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <PageContainer maxWidth="full" className="flex-1 flex flex-col min-h-0 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-slate-400 font-medium text-sm">
                Question {questionIndex + 1} of {totalQuestions}
              </span>
              <Timer timeLeft={timer} total={timeTotal} size="md" />
            </div>
            <Card variant="elevated" className="p-5 sm:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
              {currentQuestion ? (
                <div className="flex flex-col min-h-0 overflow-auto">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 leading-relaxed text-slate-100 shrink-0">
                    {currentQuestion.text}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(currentQuestion.options ?? []).map((opt, i) => (
                      <div
                        key={i}
                        className="p-3 sm:p-4 rounded-xl border-2 border-slate-600 bg-slate-700/50 text-base sm:text-lg font-medium text-slate-200"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
                  <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-500 text-sm">Loading next question...</p>
                </div>
              )}
            </Card>
            <p className="text-slate-500 text-xs text-center shrink-0">
              Players control the pace — they will advance to the next question after answering.
            </p>
          </div>
          <div className="flex flex-col min-h-0 lg:min-h-[280px] flex-1">
            <Leaderboard
              entries={leaderboard}
              maxItems={10}
              title="Live Leaderboard"
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
