import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuizStore } from '../../store/quizStore'
import { useToastStore } from '../../store/toastStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/layout/PageContainer'
import type { Difficulty } from '../../types/quizTypes'

const createSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(100, 'Topic too long'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(5).max(20),
})

type CreateFormData = z.infer<typeof createSchema>

export function HostCreate() {
  const navigate = useNavigate()
  const { createRoom, socketConnected, roomCode, quizState, createError } = useQuizStore()
  const addToast = useToastStore((s) => s.add)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { topic: '', difficulty: 'medium', count: 10 },
  })

  const count = watch('count') as number

  useEffect(() => {
    if (roomCode && quizState === 'waiting') {
      navigate(`/host/lobby/${roomCode}`, { replace: true })
    }
  }, [roomCode, quizState, navigate])

  useEffect(() => {
    if (createError) addToast(createError, 'error')
  }, [createError, addToast])

  function onSubmit(data: CreateFormData) {
    if (!socketConnected) {
      addToast('Not connected. Please wait.', 'error')
      return
    }
    createRoom(data.topic, data.difficulty as Difficulty, data.count)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <PageContainer maxWidth="md" className="flex-1 flex flex-col min-h-0 justify-center py-4">
        <Card variant="elevated" className="shadow-2xl shrink-0">
          <h1 className="text-2xl font-bold text-center mb-5 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Create Quiz
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Topic"
              placeholder="e.g. World History, JavaScript, Biology"
              {...register('topic')}
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Difficulty
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <label key={d} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value={d}
                      className="sr-only peer"
                      {...register('difficulty')}
                    />
                    <span className="block py-2 px-2 rounded-xl text-center text-sm font-medium bg-slate-700 border border-slate-600 text-slate-300 peer-checked:border-cyan-400 peer-checked:bg-indigo-500/20 peer-checked:text-white transition">
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Number of questions:{' '}
                <span className="text-cyan-400 font-bold">{count}</span>
              </label>
              <input
                type="range"
                min={5}
                max={20}
                className="w-full h-2 rounded-lg appearance-none bg-slate-700 accent-cyan-400"
                {...register('count', { valueAsNumber: true })}
              />
            </div>
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={!socketConnected}
            >
              Create Room
            </Button>
          </form>
        </Card>
      </PageContainer>
    </div>
  )
}
