import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, LogIn, Zap, Users, Trophy } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PageContainer } from '../components/layout/PageContainer'

const features = [
  {
    icon: Zap,
    title: 'AI-generated questions',
    description: 'Custom quizzes on any topic in seconds.',
  },
  {
    icon: Users,
    title: 'Real-time multiplayer',
    description: 'Everyone plays together, live leaderboards.',
  },
  {
    icon: Trophy,
    title: 'Instant results',
    description: 'See rankings and scores as you go.',
  },
]

export function Home() {
  return (
    <PageContainer maxWidth="2xl" className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-12 sm:pt-20 pb-8"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
          Real-time AI Quiz
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Create or join live quizzes. Compete with friends and see leaderboards
          update in real time.
        </p>
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/host/create">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <PlusCircle className="w-5 h-5" />
              Create Quiz
            </Button>
          </Link>
          <Link to="/join">
            <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
              <LogIn className="w-5 h-5" />
              Join Quiz
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left"
      >
        {features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-xl bg-slate-800/50 border border-slate-700 p-6"
          >
            <item.icon className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="font-bold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </PageContainer>
  )
}
