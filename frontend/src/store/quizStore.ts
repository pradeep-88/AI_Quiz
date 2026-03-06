import { create } from 'zustand'
import { getSocket } from '../socket/socket'
import type { Question, LeaderboardEntry, QuizStatus, ReviewQuestion, QuestionStat } from '../types/quizTypes'

const STORAGE_KEYS = {
  roomCode: 'quiz_room',
  role: 'quiz_role',
  playerName: 'quiz_player',
} as const

function getStored<T>(key: string, fallback: T): T {
  try {
    const v = sessionStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function setStored(key: string, value: string | null): void {
  try {
    if (value == null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export interface QuizState {
  socketConnected: boolean
  roomCode: string | null
  playerName: string | null
  players: { id: string; name: string }[]
  currentQuestion: Question | null
  questionIndex: number
  totalQuestions: number
  answers: { questionIndex: number; answer: string }[]
  leaderboard: LeaderboardEntry[]
  timer: number
  quizState: QuizStatus
  createError: string | null
  answerSubmitted: boolean
  lastAnswerCorrect: boolean | null
  playerReview: ReviewQuestion[] | null
  quizAnalytics: { leaderboard: LeaderboardEntry[]; questionStats: QuestionStat[] } | null

  setSocketConnected: (connected: boolean) => void
  fetchPlayerReview: (roomCode: string, playerId: string) => void
  fetchQuizAnalytics: (roomCode: string) => void
  setPlayerReview: (questions: ReviewQuestion[] | null) => void
  setQuizAnalytics: (data: { leaderboard: LeaderboardEntry[]; questionStats: QuestionStat[] } | null) => void
  createRoom: (topic: string, difficulty: string, count: number) => void
  joinRoom: (roomCode: string, playerName: string) => void
  startQuiz: () => void
  submitAnswer: (answer: string, timeLeft: number) => void
  nextQuestion: (roomCodeOverride?: string) => void
  requestLeaderboard: () => void
  setTimer: (n: number) => void
  setAnswerSubmitted: (v: boolean) => void
  setLastAnswerCorrect: (v: boolean | null) => void
  reset: () => void

  setPlayerJoined: (player: { id: string; name: string }) => void
  setQuizStarted: () => void
  setNewQuestion: (question: Question | null) => void
  setLeaderboard: (entries: LeaderboardEntry[]) => void
  setQuizEnded: () => void
  setCreateError: (error: string | null) => void
  setJoinSuccess: (data: {
    roomCode: string
    playerName: string
    players: { id: string; name: string }[]
    totalQuestions: number
  }) => void
  setCreateSuccess: (data: {
    roomCode: string
    totalQuestions: number
  }) => void
}

export const useQuizStore = create<QuizState>((set, get) => ({
  socketConnected: false,
  roomCode: getStored(STORAGE_KEYS.roomCode, null),
  playerName: getStored(STORAGE_KEYS.playerName, null),
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  answers: [],
  leaderboard: [],
  timer: 0,
  quizState: 'idle',
  createError: null,
  answerSubmitted: false,
  lastAnswerCorrect: null,
  playerReview: null,
  quizAnalytics: null,

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  fetchPlayerReview: (roomCode, playerId) => {
    const socket = getSocket()
    socket.emit('get_player_review', { roomCode: roomCode.trim().toUpperCase(), playerId })
  },

  fetchQuizAnalytics: (roomCode) => {
    const socket = getSocket()
    socket.emit('get_quiz_analytics', { roomCode: roomCode.trim().toUpperCase() })
  },

  setPlayerReview: (questions) => set({ playerReview: questions }),
  setQuizAnalytics: (data) => set({ quizAnalytics: data }),


  createRoom: (topic, difficulty, count) => {
    set({ createError: null })
    const socket = getSocket()
    socket.emit(
      'create_room',
      { topic, difficulty, count },
      (res: { success?: boolean; roomCode?: string; error?: string }) => {
        if (res?.success && res.roomCode) {
          set({
            roomCode: res.roomCode,
            playerName: 'Host',
            quizState: 'waiting',
            players: [],
            questionIndex: 0,
            totalQuestions: count,
            createError: null,
          })
          setStored(STORAGE_KEYS.roomCode, res.roomCode)
          setStored(STORAGE_KEYS.role, 'host')
          setStored(STORAGE_KEYS.playerName, 'Host')
        } else {
          set({ createError: res?.error ?? 'Failed to create room' })
        }
      }
    )
  },

  joinRoom: (roomCode, playerName) => {
    set({ createError: null })
    const socket = getSocket()
    const normalizedCode = roomCode.toUpperCase().trim()
    socket.emit(
      'join_room',
      { roomCode: normalizedCode, playerName: playerName.trim() },
      (res: {
        success?: boolean
        players?: { id: string; name: string }[]
        quiz?: { questions?: unknown[] }
        error?: string
      }) => {
        if (res?.success) {
          const players = res.players ?? []
          const totalQuestions = res.quiz?.questions?.length ?? 0
          set({
            roomCode: normalizedCode,
            playerName: playerName.trim(),
            quizState: 'waiting',
            players,
            totalQuestions,
            questionIndex: 0,
            createError: null,
          })
          setStored(STORAGE_KEYS.roomCode, normalizedCode)
          setStored(STORAGE_KEYS.role, 'player')
          setStored(STORAGE_KEYS.playerName, playerName.trim())
        } else {
          set({ createError: res?.error ?? 'Failed to join room' })
        }
      }
    )
  },

  startQuiz: () => {
    const { roomCode } = get()
    if (roomCode) getSocket().emit('start_quiz', { roomCode })
  },

  submitAnswer: (answer, timeLeft) => {
    const { roomCode, currentQuestion, questionIndex } = get()
    if (roomCode) {
      getSocket().emit('submit_answer', {
        roomCode,
        answer,
        timeLeft,
        questionId: currentQuestion?.id ?? undefined,
        questionIndex: currentQuestion ? questionIndex : undefined,
      })
      set({ answerSubmitted: true })
    }
  },

  nextQuestion: (roomCodeOverride?: string) => {
    const code = roomCodeOverride ?? get().roomCode
    if (code) getSocket().emit('next_question', { roomCode: code })
  },

  requestLeaderboard: () => {
    const { roomCode } = get()
    if (roomCode) getSocket().emit('get_leaderboard', { roomCode })
  },

  setTimer: (n) => set({ timer: n }),
  setAnswerSubmitted: (v) => set({ answerSubmitted: v }),
  setLastAnswerCorrect: (v) => set({ lastAnswerCorrect: v }),
  reset: () => {
    set({
      roomCode: null,
      playerName: null,
      players: [],
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      answers: [],
      leaderboard: [],
      timer: 0,
      quizState: 'idle',
      createError: null,
      answerSubmitted: false,
      lastAnswerCorrect: null,
      playerReview: null,
      quizAnalytics: null,
    })
    setStored(STORAGE_KEYS.roomCode, null)
    setStored(STORAGE_KEYS.role, null)
    setStored(STORAGE_KEYS.playerName, null)
  },

  setPlayerJoined: (player) =>
    set((s) => ({ players: [...s.players, { id: player.id, name: player.name }] })),

  setQuizStarted: () => set({ quizState: 'active' }),

  setNewQuestion: (question) => {
    const state = get()
    // Idempotent: ignore duplicate event for the same question (e.g. same id)
    if (question && state.currentQuestion?.id === question.id) return
    const nextIndex = question ? state.questionIndex + (state.currentQuestion ? 1 : 0) : state.questionIndex
    set({
      currentQuestion: question,
      questionIndex: question ? nextIndex : state.questionIndex,
      timer: question?.timeLimit ?? 20,
      answerSubmitted: false,
      lastAnswerCorrect: null,
    })
  },

  setLeaderboard: (entries) => set({ leaderboard: entries ?? [] }),
  setQuizEnded: () => set({ quizState: 'finished' }),
  setCreateError: (error) => set({ createError: error }),
  setJoinSuccess: () => {},
  setCreateSuccess: () => {},
}))
