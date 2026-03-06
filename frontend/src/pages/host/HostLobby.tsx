import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Play, Copy, Check } from 'lucide-react'
import { useQuizStore } from '../../store/quizStore'
import { Button } from '../../components/ui/Button'
import { PageContainer } from '../../components/layout/PageContainer'

export function HostLobby() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { roomCode, players, startQuiz, quizState } = useQuizStore()
  const [copied, setCopied] = useState(false)

  const code = paramCode ?? roomCode ?? ''

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (quizState === 'active' && code) {
      navigate(`/host/quiz/${code}`, { replace: true })
    }
  }, [quizState, code, navigate])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <PageContainer maxWidth="lg" className="flex-1 flex flex-col min-h-0 justify-center py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-slate-800/90 border border-slate-700 p-6 sm:p-8 shadow-2xl text-center shrink-0"
        >
          <p className="text-slate-400 text-sm font-medium mb-1.5">Room code</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {code || '—'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
            <Users className="w-5 h-5" />
            <span>
              {players.length} player{players.length !== 1 ? 's' : ''} joined
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-5 min-h-[2.5rem] max-h-24 overflow-y-auto">
            {players.map((p, i) => (
              <motion.span
                key={p.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-1.5 rounded-full bg-slate-700 text-white text-sm font-medium shrink-0"
              >
                {p.name}
              </motion.span>
            ))}
          </div>
          <Button size="lg" onClick={() => startQuiz()} className="gap-2">
            <Play className="w-5 h-5" fill="currentColor" /> Start Quiz
          </Button>
        </motion.div>
      </PageContainer>
    </div>
  )
}
