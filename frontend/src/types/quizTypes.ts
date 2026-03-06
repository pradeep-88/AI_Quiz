export interface Question {
  id: string
  text: string
  options: string[]
  timeLimit: number
  points: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
}

export type QuizStatus = 'idle' | 'waiting' | 'active' | 'finished'
export type Role = 'host' | 'player'

export type Difficulty = 'easy' | 'medium' | 'hard'

// Player review (after quiz)
export interface ReviewQuestion {
  question: string
  options: string[]
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

// Host analytics
export interface QuestionStat {
  questionId: string
  question: string
  correctCount: number
  incorrectCount: number
  totalAttempts: number
}
