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

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      // APIキーがない場合の警告
      console.warn('OpenAI API key not configured. Using demo mode.')
      return NextResponse.json({
        success: false,
        demo: true,
        message: 'OpenAI APIキーが設定されていません。実際の画像解析を行うにはAPIキーが必要です。',
        data: {
          problemType: 'demo',
          expression: 'デモモード',
          problem: '実際の画像解析にはOpenAI APIキーが必要です',
          numbers: [],
          difficulty: 'unknown',
          concepts: ['APIキー設定が必要'],
          suggestedHints: ['.env.localファイルにOPENAI_API_KEYを設定してください']
        }
      })
    }

    // OpenAI Vision APIを呼び出し
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `あなたは小学1年生の算数問題を解析する専門家です。
画像から算数の問題を認識し、以下のJSON形式で返してください：
{
  "type": "addition|subtraction|counting|comparison|unknown",
  "expression": "認識した式や問題",
  "problem": "問題文の説明",
  "numbers": [問題に含まれる数値の配列],
  "answer": 答え（計算可能な場合）,
  "difficulty": "easy|medium|hard",
  "concepts": ["関連する数学概念のリスト"],
  "suggestedHints": ["段階的なヒントのリスト"],
  "visualElements": {
    "objects": "画像に含まれるオブジェクト（かえる、りんごなど）",
    "count": [オブジェクトの数],
    "arrangement": "配置の説明"
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '画像に含まれる算数の問題を解析してください。イラストや図形がある場合は、それらの数や配置も含めて詳しく説明してください。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error('OpenAI API request failed')
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // JSONをパース
    let analysisResult: MathProblem
    try {
      analysisResult = JSON.parse(content)
    } catch (parseError) {
      // パースエラーの場合はテキストから情報を抽出
      console.warn('Failed to parse JSON response, using fallback')
      analysisResult = {
        type: 'unknown',
        expression: '解析結果',
        problem: content,
        numbers: [],
        difficulty: 'unknown',
        concepts: ['画像解析済み'],
        suggestedHints: ['AI先生に質問してください']
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisResult
    })

  } catch (error) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { 
        error: '問題の解析に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}