import { NextRequest, NextResponse } from 'next/server'

interface MathProblem {
  type: 'addition' | 'subtraction' | 'counting' | 'comparison' | 'unknown'
  expression: string
  problem: string
  numbers: number[]
  answer?: number
  difficulty: 'easy' | 'medium' | 'hard' | 'unknown'
  concepts: string[]
  suggestedHints: string[]
  visualElements?: {
    objects?: string
    count?: number[]
    arrangement?: string
  }
  confidence?: number
}

interface APIResult {
  success: boolean
  model: string
  data?: MathProblem
  confidence?: number
  error?: string
}

async function callGeminiAPI(image: string): Promise<APIResult> {
  try {
    const response = await fetch('http://localhost:3000/api/vision/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    })
    
    const result = await response.json()
    return {
      success: result.success,
      model: 'gemini-2.0-flash-exp',
      data: result.data,
      confidence: result.data?.confidence || 70,
      error: result.error
    }
  } catch (error) {
    console.error('Gemini API call failed:', error)
    return {
      success: false,
      model: 'gemini-2.0-flash-exp',
      error: 'Gemini API呼び出し失敗',
      confidence: 0
    }
  }
}

async function callClaudeAPI(image: string): Promise<APIResult> {
  try {
    const response = await fetch('http://localhost:3000/api/vision/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    })
    
    const result = await response.json()
    return {
      success: result.success,
      model: 'claude-3-5-sonnet-20241022',
      data: result.data,
      confidence: result.data?.confidence || 80,
      error: result.error
    }
  } catch (error) {
    console.error('Claude API call failed:', error)
    return {
      success: false,
      model: 'claude-3-5-sonnet-20241022', 
      error: 'Claude API呼び出し失敗',
      confidence: 0
    }
  }
}

function generateDynamicHints(problem: MathProblem): string[] {
  const { visualElements, numbers, answer, expression } = problem
  const objectName = visualElements?.objects || '物'
  const leftCount = numbers[0] || 0
  const rightCount = numbers[1] || 0
  
  return [
    `画像をよく見て、${objectName}を探してみよう！`,
    leftCount && rightCount 
      ? `左に${leftCount}個、右に${rightCount}個の${objectName}があるね`
      : `${objectName}を1つずつ数えてみよう`,
    expression ? `式にすると「${expression}」だよ` : '数式を作ってみよう',
    answer ? `答えは${answer}個だね！正解できるかな？` : 'がんばって数えてみよう',
    '指を使って一緒に数えてもいいよ！'
  ]
}

function selectBestResult(results: APIResult[]): APIResult {
  // 成功した結果のみフィルタリング
  const successfulResults = results.filter(r => r.success && r.data)
  
  if (successfulResults.length === 0) {
    return {
      success: false,
      model: 'hybrid',
      error: '全てのAPIが失敗しました'
    }
  }
  
  // 信頼度の高い結果を選択
  const bestResult = successfulResults.reduce((best, current) => {
    const bestConfidence = best.confidence || 0
    const currentConfidence = current.confidence || 0
    return currentConfidence > bestConfidence ? current : best
  })
  
  // 動的ヒントを生成
  if (bestResult.data) {
    bestResult.data.suggestedHints = generateDynamicHints(bestResult.data)
  }
  
  return bestResult
}

export async function POST(request: NextRequest) {
  console.log('Hybrid Vision API endpoint called')
  
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    console.log('🔄 複数のAI APIで画像を解析中...')
    
    // 並行して複数のAPIを呼び出し
    const [geminiResult, claudeResult] = await Promise.allSettled([
      callGeminiAPI(image),
      callClaudeAPI(image)
    ])
    
    const results: APIResult[] = []
    
    if (geminiResult.status === 'fulfilled') {
      results.push(geminiResult.value)
      console.log('Gemini result:', geminiResult.value.success ? '成功' : '失敗', 
                  'Confidence:', geminiResult.value.confidence)
    }
    
    if (claudeResult.status === 'fulfilled') {
      results.push(claudeResult.value)
      console.log('Claude result:', claudeResult.value.success ? '成功' : '失敗',
                  'Confidence:', claudeResult.value.confidence)
    }
    
    // 最適な結果を選択
    const bestResult = selectBestResult(results)
    
    if (!bestResult.success) {
      return NextResponse.json({
        success: false,
        error: bestResult.error,
        details: 'すべてのAI APIが失敗しました',
        suggestion: '画像を変更するか、少し時間をおいて再試行してください'
      }, { status: 500 })
    }
    
    console.log(`🏆 最適な結果を選択: ${bestResult.model} (信頼度: ${bestResult.confidence}%)`)
    
    return NextResponse.json({
      success: true,
      model: bestResult.model,
      data: bestResult.data,
      hybrid: {
        selectedModel: bestResult.model,
        confidence: bestResult.confidence,
        testedModels: results.map(r => r.model),
        allResults: results.map(r => ({
          model: r.model,
          success: r.success,
          confidence: r.confidence,
          answer: r.data?.answer
        }))
      }
    })
    
  } catch (error: any) {
    console.error('Hybrid API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'ハイブリッド解析に失敗しました',
      details: error.message
    }, { status: 500 })
  }
}