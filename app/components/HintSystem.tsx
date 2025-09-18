'use client'

import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'

interface Problem {
  id: number
  num1: number
  num2: number
  answer: number
  level: number
}

interface HintSystemProps {
  problem: Problem
  onClose: () => void
}

export default function HintSystem({ problem, onClose }: HintSystemProps) {
  const [currentHint, setCurrentHint] = useState(1)
  const maxHints = 5

  const generateHints = (prob: Problem) => {
    const hints = [
      {
        level: 1,
        content: `${prob.num1}と${prob.num2}をたしてみよう！`,
        visual: null
      },
      {
        level: 2,
        content: `${prob.num1}から数えてみよう。`,
        visual: `${prob.num1}から：${Array.from({length: prob.num2}, (_, i) => prob.num1 + i + 1).join(', ')}`
      },
      {
        level: 3,
        content: '指で数えてみよう！',
        visual: `👆 ${'🟡'.repeat(prob.num1)} + ${'🔵'.repeat(prob.num2)}`
      },
      {
        level: 4,
        content: 'ぜんぶでいくつかな？',
        visual: `${'●'.repeat(prob.num1)} + ${'●'.repeat(prob.num2)} = ${'●'.repeat(prob.answer)}`
      },
      {
        level: 5,
        content: `こたえは${prob.answer}だよ！`,
        visual: `${prob.num1} + ${prob.num2} = ${prob.answer}`
      }
    ]

    return hints
  }

  const hints = generateHints(problem)
  const currentHintData = hints[currentHint - 1]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">ヒント {currentHint}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg text-gray-700 mb-3">{currentHintData.content}</p>

          {currentHintData.visual && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center font-mono text-lg">
                {currentHintData.visual}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {currentHint} / {maxHints}
          </div>

          <div className="space-x-2">
            {currentHint > 1 && (
              <button
                onClick={() => setCurrentHint(currentHint - 1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                まえへ
              </button>
            )}

            {currentHint < maxHints && (
              <button
                onClick={() => setCurrentHint(currentHint + 1)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                つぎへ
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            AI先生より：わからないときは、ゆっくりかんがえることがたいせつだよ！
          </p>
        </div>
      </div>
    </div>
  )
}
