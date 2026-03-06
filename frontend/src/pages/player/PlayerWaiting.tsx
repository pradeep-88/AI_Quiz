import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuizStore } from '../../store/quizStore'
import { PageContainer } from '../../components/layout/PageContainer'

export function PlayerWaiting() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { roomCode, players, playerName, quizState } = useQuizStore()
  const code = paramCode ?? roomCode ?? ''

  useEffect(() => {
    if (quizState === 'active' && code) {
      navigate(`/player/quiz/${code}`, { replace: true })
    }
  }, [quizState, code, navigate])

  return (
    <PageContainer maxWidth="md" className="pt-24 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-7xl"
        >
          🎮
        </motion.div>
        <h2 className="text-2xl font-bold text-white">You're in!</h2>
        <p className="text-slate-400 text-lg">
          Waiting for host to start the quiz...
        </p>
        <p className="text-slate-500 text-sm">
          Room code: <span className="text-cyan-400 font-mono font-bold">{code || '—'}</span>
        </p>
        <p className="text-slate-500 text-sm">
          Playing as{' '}
          <span className="text-white font-semibold">{playerName || '—'}</span>
        </p>
        <p className="text-slate-500 text-sm">
          {players.length} player{players.length !== 1 ? 's' : ''} in the room
        </p>
      </motion.div>
    </PageContainer>
  )
}
