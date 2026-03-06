import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../../store/quizStore'
import { Button } from '../../components/ui/Button'
import { Leaderboard } from '../../components/ui/Leaderboard'
import { PageContainer } from '../../components/layout/PageContainer'

export function PlayerResults() {
  const navigate = useNavigate()
  const { leaderboard, playerName, roomCode, reset } = useQuizStore()
  const code = roomCode?.trim().toUpperCase() ?? ''

  const myRank = leaderboard.findIndex((e) => e.name === playerName) + 1
  const myScore = leaderboard.find((e) => e.name === playerName)?.score ?? 0
  const isTopThree = myRank >= 1 && myRank <= 3

  function handleGoHome() {
    reset()
    navigate('/', { replace: true })
  }

  return (
    <PageContainer maxWidth="lg" className="pt-8 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-white"
      >
        Quiz over!
      </motion.h1>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="rounded-xl bg-slate-800 border border-slate-700 p-8 mb-8 inline-block"
      >
        {isTopThree && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl mb-2"
          >
            {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : '🥉'}
          </motion.p>
        )}
        <p className="text-slate-400 text-sm mb-1">Your rank</p>
        <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
          #{myRank > 0 ? myRank : '—'}
        </p>
        <p className="text-slate-400 text-sm mt-2 mb-1">Marks scored in this quiz</p>
        <p className="text-2xl font-bold text-white">{myScore} pts</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8 max-w-md mx-auto"
      >
        <Leaderboard
          entries={leaderboard}
          maxItems={10}
          highlightName={playerName ?? undefined}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        {code && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/player/review/${code}`)}
          >
            Review Quiz
          </Button>
        )}
        <Button variant="secondary" size="lg" onClick={handleGoHome}>
          Go home
        </Button>
      </motion.div>
    </PageContainer>
  )
}
