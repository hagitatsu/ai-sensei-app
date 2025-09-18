'use client'

import { useState, useEffect } from 'react'
import { Star, Home, Lightbulb } from 'lucide-react'
import HintSystem from './HintSystem'
import ProgressTracker from './ProgressTracker'

interface Problem {
  id: number
  num1: number
  num2: number
  answer: number
  level: number
}

interface GameScreenProps {
  onGameEnd: (starsEarned: number) => void
  playerName: string
}

export default function GameScreen({ onGameEnd, playerName }: GameScreenProps) {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [problemsSolved, setProblemsSolved] = useState(0)
  const [starsEarned, setStarsEarned] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [level, setLevel] = useState(1)
  const [showCelebration, setShowCelebration] = useState(false)

  const generateProblem = (currentLevel: number): Problem => {
    let num1: number, num2: number

    switch (currentLevel) {
      case 1: // 1-5 + 1-5
        num1 = Math.floor(Math.random() * 5) + 1
        num2 = Math.floor(Math.random() * 5) + 1
        break
      case 2: // 1-10 + 1-5
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 5) + 1
        break
      case 3: // 1-10 + 1-10
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        break
      default:
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
    }

    return {
      id: Date.now(),
      num1,
      num2,
      answer: num1 + num2,
      level: currentLevel
    }
  }

  useEffect(() => {
    setCurrentProblem(generateProblem(level))
  }, [level])

  const handleSubmit = () => {
    if (!currentProblem || !userAnswer.trim()) return

    const answer = parseInt(userAnswer)

    if (answer === currentProblem.answer) {
      // Correct answer
      const newStars = starsEarned + 1
      setStarsEarned(newStars)
      setProblemsSolved(problemsSolved + 1)
      setFeedback('せいかい！すごいね！')
      setShowCelebration(true)

      // Level up logic
      if (problemsSolved > 0 && (problemsSolved + 1) % 5 === 0 && level < 3) {
        setLevel(level + 1)
        setFeedback(`レベルアップ！レベル${level + 1}になったよ！`)
      }

      setTimeout(() => {
        setCurrentProblem(generateProblem(level))
        setUserAnswer('')
        setShowHints(false)
        setFeedback('')
        setShowCelebration(false)
      }, 2000)
    } else {
      // Wrong answer
      setFeedback('ちがうね。もういちどかんがえてみよう！')
      setShowHints(true)
    }
  }

  const handleEndGame = () => {
    onGameEnd(starsEarned)
  }

  const aiTeacherMessages = [
    `${playerName}くん、がんばって！`,
    'ゆっくりかんがえてね。',
    'まちがえてもだいじょうぶだよ。',
    'すこしずつじょうずになってるよ！',
    'さいごまでがんばろう！'
  ]

  if (!currentProblem) {
    return <div>問題を準備中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Star className="w-6 h-6 text-yellow-400 mr-2" />
          <span className="text-xl font-bold">{starsEarned}個</span>
        </div>
        <div className="text-lg font-medium">レベル {level}</div>
        <button
          onClick={handleEndGame}
          className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          <Home className="w-4 h-4 mr-1" />
          おわる
        </button>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker 
        problemsSolved={problemsSolved}
        currentLevel={level}
        targetProblems={5}
      />

      {/* AI Teacher Message */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-blue-700">
              {aiTeacherMessages[Math.floor(Math.random() * aiTeacherMessages.length)]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Problem */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
        <div className="text-6xl font-bold text-gray-800 mb-6">
          {currentProblem.num1} + {currentProblem.num2} = ?
        </div>

        <div className="mb-6">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="こたえ"
            className="w-32 px-4 py-3 text-3xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            max="20"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xl font-bold py-3 px-8 rounded-lg"
          >
            こたえる
          </button>

          <button
            onClick={() => setShowHints(!showHints)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-3 px-8 rounded-lg flex items-center"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            ヒント
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-6 text-2xl font-bold ${
            showCelebration ? 'text-green-600' : 'text-orange-600'
          }`}>
            {feedback}
            {showCelebration && <div className="text-4xl">🌟</div>}
          </div>
        )}
      </div>

      {/* Hint System */}
      {showHints && (
        <HintSystem 
          problem={currentProblem}
          onClose={() => setShowHints(false)}
        />
      )}
    </div>
  )
}
