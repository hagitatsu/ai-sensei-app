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
}

interface APIResult {
  success: boolean
  model: string
  data?: MathProblem
  error?: string
  confidence?: number
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
      error: result.error,
      confidence: result.success ? 0.7 : 0
    }
  } catch (error) {
    return {
      success: false,
      model: 'gemini-2.0-flash-exp', 
      error: 'Gemini API呼び出し失敗',
      confidence: 0
    }
  }
}

async function callOpenAIAPI(image: string): Promise<APIResult> {
  try {
    const response = await fetch('http://localhost:3000/api/vision/openai', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    })
    const result = await response.json()
    return {
      success: result.success,
      model: 'gpt-4o-vision',
      data: result.data,
      error: result.error,
      confidence: result.success ? 0.9 : 0 // GPT-4Vの方が高精度
    }
  } catch (error) {
    return {
      success: false,
      model: 'gpt-4o-vision',
      error: 'OpenAI API呼び出し失敗', 
      confidence: 0
    }
  }
}

function validateResult(result: MathProblem): number {
  let confidence = 0.5 // ベース信頼度
  
  // 数値の一貫性チェック
  if (result.numbers && result.numbers.length >= 2) {
    const sum = result.numbers.reduce((a, b) => a + b, 0)
    if (result.answer === sum) {
      confidence += 0.3 // 数学的整合性
    }
  }
  
  // 問題形式の妥当性
  if (result.expression && result.expression.includes('+') && result.type === 'addition') {
    confidence += 0.2 // 式と問題種別の一致
  }
  
  // 具体的なヒントがある
  if (result.suggestedHints && result.suggestedHints.length > 0) {
    const hasSpecificHints = result.suggestedHints.some(hint => 
      !hint.includes('一緒に') && !hint.includes('がんばって') // テンプレート的でない
    )
    if (hasSpecificHints) {
      confidence += 0.1 // 具体的なヒント
    }
  }
  
  return Math.min(confidence, 1.0)
}

export async function POST(request: NextRequest) {
  console.log('Multi-API vision endpoint called')
  
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    console.log('🔄 Calling multiple vision APIs for cross-validation...')
    
    // 並行してMultiple APIを呼び出し
    const [geminiResult, openaiResult] = await Promise.all([
      callGeminiAPI(image),
      callOpenAIAPI(image)
    ])
    
    console.log('Gemini result:', geminiResult.success, geminiResult.data?.answer)
    console.log('OpenAI result:', openaiResult.success, openaiResult.data?.answer)
    
    // 成功した結果を取得
    const successfulResults = [geminiResult, openaiResult].filter(r => r.success && r.data)
    
    if (successfulResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'すべてのAIが画像解析に失敗しました',
        details: 'Gemini・OpenAI両方のAPIでエラーが発生',
        results: [geminiResult, openaiResult]
      }, { status: 500 })
    }
    
    // 結果の信頼度を計算
    const validatedResults = successfulResults.map(result => ({
      ...result,
      validationScore: validateResult(result.data!)
    }))
    
    // 最高信頼度の結果を選択
    const bestResult = validatedResults.reduce((best, current) => {
      const bestScore = (best.confidence || 0) * (best.validationScore || 0)
      const currentScore = (current.confidence || 0) * (current.validationScore || 0)
      return currentScore > bestScore ? current : best
    })
    
    // 複数の結果で答えが一致している場合はさらに信頼度アップ
    const answers = validatedResults.map(r => r.data?.answer).filter(Boolean)
    const consensus = answers.length > 1 && answers.every(a => a === answers[0])
    
    console.log('🎯 Best result selected:', {
      model: bestResult.model,
      answer: bestResult.data?.answer,
      confidence: bestResult.confidence,
      validation: bestResult.validationScore,
      consensus
    })

    return NextResponse.json({
      success: true,
      primary: bestResult.model,
      data: bestResult.data,
      meta: {
        consensus: consensus,
        totalAPIs: 2,
        successfulAPIs: successfulResults.length,
        confidence: consensus ? 0.95 : (bestResult.confidence || 0.5),
        allResults: validatedResults.map(r => ({
          model: r.model,
          answer: r.data?.answer,
          confidence: r.confidence,
          validation: r.validationScore
        }))
      }
    })
    
  } catch (error: any) {
    console.error('Multi-API vision error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'マルチAPI画像解析に失敗しました',
      details: error.message || '不明なエラー'
    }, { status: 500 })
  }
}