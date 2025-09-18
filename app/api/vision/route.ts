import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    // OpenAI Vision API呼び出し（実装予定）
    // const openaiApiKey = process.env.OPENAI_API_KEY
    
    // 今はモックデータを返す
    const mockAnalysis = {
      success: true,
      data: {
        problemType: 'addition',
        expression: '8 + 5',
        numbers: [8, 5],
        answer: 13,
        difficulty: 'medium',
        concepts: ['繰り上がりのある足し算', '10の補数'],
        suggestedHints: [
          '8に2を足すと10になることを理解する',
          '5を2と3に分けて考える',
          '10 + 3 = 13という計算に変換する'
        ]
      }
    }

    return NextResponse.json(mockAnalysis)
  } catch (error) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: '問題の解析に失敗しました' },
      { status: 500 }
    )
  }
}