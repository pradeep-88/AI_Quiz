import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuizStore } from '../store/quizStore'
import { useToastStore } from '../store/toastStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageContainer } from '../components/layout/PageContainer'
import { formatRoomCode } from '../utils/helpers'

const joinSchema = z.object({
  roomCode: z
    .string()
    .min(1, 'Room code is required')
    .max(6, 'Room code is 6 characters')
    .transform((s) => formatRoomCode(s)),
  playerName: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be 30 characters or less'),
})

type JoinFormData = z.infer<typeof joinSchema>

export function JoinQuiz() {
  const navigate = useNavigate()
  const { joinRoom, socketConnected, roomCode, quizState, createError } = useQuizStore()
  const addToast = useToastStore((s) => s.add)

  useEffect(() => {
    if (createError) addToast(createError, 'error')
  }, [createError, addToast])


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    defaultValues: { roomCode: '', playerName: '' },
  })

  useEffect(() => {
    if (roomCode && quizState === 'waiting') {
      navigate(`/player/waiting/${roomCode}`, { replace: true })
    }
  }, [roomCode, quizState, navigate])

  function onSubmit(data: JoinFormData) {
    if (!socketConnected) {
      addToast('Not connected. Please wait.', 'error')
      return
    }
    joinRoom(data.roomCode, data.playerName)
  }

  return (
    <PageContainer maxWidth="md" className="pt-8">
      <Card variant="elevated" className="shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Join Quiz
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Room code"
            placeholder="e.g. ABC123"
            maxLength={6}
            className="text-center text-2xl tracking-[0.3em] uppercase"
            error={errors.roomCode?.message}
            {...register('roomCode')}
          />
          <Input
            label="Your name"
            placeholder="Enter your name"
            error={errors.playerName?.message}
            {...register('playerName')}
          />
          {createError && (
            <p className="text-red-400 text-sm text-center" role="alert">
              {createError}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={!socketConnected}
          >
            Join Quiz
          </Button>
        </form>
      </Card>
    </PageContainer>
  )
}
