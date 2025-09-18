'use client'

import { Star, Trophy } from 'lucide-react'

interface ProgressTrackerProps {
  problemsSolved: number
  currentLevel: number
  targetProblems: number
}

export default function ProgressTracker({ 
  problemsSolved, 
  currentLevel, 
  targetProblems 
}: ProgressTrackerProps) {
  const progress = (problemsSolved % targetProblems) / targetProblems * 100
  const problemsInCurrentLevel = problemsSolved % targetProblems
  const remainingProblems = targetProblems - problemsInCurrentLevel

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="font-medium">レベル {currentLevel} の進捗</span>
        </div>
        <div className="text-sm text-gray-600">
          {problemsInCurrentLevel} / {targetProblems}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>がんばってるね！</span>
        {remainingProblems > 0 ? (
          <span>あと{remainingProblems}もんでレベルアップ！</span>
        ) : (
          <span className="text-green-600 font-medium">レベルクリア！</span>
        )}
      </div>

      {/* Visual star progress */}
      <div className="flex justify-center mt-3 space-x-1">
        {Array.from({ length: targetProblems }, (_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 ${
              i < problemsInCurrentLevel
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
