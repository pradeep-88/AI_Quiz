import { Card } from '../ui/Card'
import { Check, X } from 'lucide-react'
import { cn } from '../../utils/helpers'

interface QuestionReviewCardProps {
  question: string
  options: string[]
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  index: number
}

export function QuestionReviewCard({
  question,
  options,
  selectedAnswer,
  correctAnswer,
  isCorrect,
  index,
}: QuestionReviewCardProps) {
  return (
    <Card variant="elevated" className="text-left">
      <h3 className="text-lg font-bold text-slate-100 mb-4">
        Question {index + 1}
      </h3>
      <p className="text-slate-200 mb-6 leading-relaxed">{question}</p>
      <ul className="space-y-2 mb-6">
        {options.map((opt, i) => {
          const isSelected = opt.trim() === selectedAnswer.trim()
          const isCorrectOpt = opt.trim() === correctAnswer.trim()
          const showAsSelected = isSelected
          const showAsCorrect = isCorrectOpt
          return (
            <li
              key={i}
              className={cn(
                'p-3 rounded-lg border-2 text-slate-200',
                showAsCorrect && 'border-emerald-500 bg-emerald-500/10',
                showAsSelected && !showAsCorrect && 'border-red-500 bg-red-500/10',
                !showAsSelected && !showAsCorrect && 'border-slate-600 bg-slate-700/50'
              )}
            >
              <span className="font-medium">{opt}</span>
              {showAsCorrect && (
                <span className="ml-2 inline-flex items-center text-emerald-400 text-sm">
                  <Check className="w-4 h-4 mr-1" /> Correct
                </span>
              )}
              {showAsSelected && !showAsCorrect && (
                <span className="ml-2 inline-flex items-center text-red-400 text-sm">
                  <X className="w-4 h-4 mr-1" /> Your answer
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-600">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium',
            isCorrect ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {isCorrect ? (
            <>
              <Check className="w-4 h-4" /> Correct
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              Selected: {selectedAnswer || '(none)'} ❌
            </>
          )}
        </span>
        {!isCorrect && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
            <Check className="w-4 h-4" /> Correct: {correctAnswer} ✅
          </span>
        )}
      </div>
    </Card>
  )
}
