import { useEffect } from 'react'
import { getSocket } from '../socket/socket'
import { useQuizStore } from '../store/quizStore'
import type { Question, LeaderboardEntry, ReviewQuestion, QuestionStat } from '../types/quizTypes'

export function useSocketEvents(): void {
  const {
    setSocketConnected,
    setPlayerJoined,
    setQuizStarted,
    setNewQuestion,
    setLeaderboard,
    setQuizEnded,
    setPlayerReview,
    setQuizAnalytics,
  } = useQuizStore()

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)
    const onPlayerJoined = (player: { id: string; name: string }) => setPlayerJoined(player)
    const onQuizStarted = () => setQuizStarted()
    const onNewQuestion = (payload: { question?: Question }) => {
      setNewQuestion(payload?.question ?? null)
    }
    const onLeaderboardUpdate = (entries: LeaderboardEntry[]) => setLeaderboard(entries)
    const onFinalLeaderboard = (entries: LeaderboardEntry[]) => {
      setLeaderboard(entries ?? [])
      setQuizEnded()
    }
    const onQuizEnded = () => setQuizEnded() // leaderboard already set by final_leaderboard (sent first)
    const onPlayerReviewData = (payload: { questions: ReviewQuestion[] }) => {
      setPlayerReview(payload?.questions ?? null)
    }
    const onQuizAnalytics = (payload: { leaderboard: LeaderboardEntry[]; questionStats: QuestionStat[] }) => {
      setQuizAnalytics({
        leaderboard: payload?.leaderboard ?? [],
        questionStats: payload?.questionStats ?? [],
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('player_joined', onPlayerJoined)
    socket.on('quiz_started', onQuizStarted)
    socket.on('new_question', onNewQuestion)
    socket.on('leaderboard_update', onLeaderboardUpdate)
    socket.on('final_leaderboard', onFinalLeaderboard)
    socket.on('quiz_ended', onQuizEnded)
    socket.on('player_review_data', onPlayerReviewData)
    socket.on('quiz_analytics', onQuizAnalytics)

    if (socket.connected) setSocketConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('player_joined', onPlayerJoined)
      socket.off('quiz_started', onQuizStarted)
      socket.off('new_question', onNewQuestion)
      socket.off('leaderboard_update', onLeaderboardUpdate)
      socket.off('final_leaderboard', onFinalLeaderboard)
      socket.off('quiz_ended', onQuizEnded)
      socket.off('player_review_data', onPlayerReviewData)
      socket.off('quiz_analytics', onQuizAnalytics)
    }
  }, [
    setSocketConnected,
    setPlayerJoined,
    setQuizStarted,
    setNewQuestion,
    setLeaderboard,
    setQuizEnded,
    setPlayerReview,
    setQuizAnalytics,
  ])
}
