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
  console.log('OpenAI GPT-4V API endpoint called')
  
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    // OpenAI APIキーの確認
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    console.log('OpenAI API Key status:', openaiApiKey ? 'Found' : 'Not found')
    
    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'OpenAI APIキーが設定されていません',
        details: 'OPENAI_API_KEYを環境変数に設定してください'
      }, { status: 500 })
    }

    // 超厳密なカウント専用プロンプト
    const prompt = `🧮 あなたは画像認識の専門家です。この画像の数学問題を完璧に解析してください。

🎯 【CRITICAL TASK】画像に映っている物体（かえる、りんご、図形など）を正確に数えてください。1つでも数え間違いは許されません。

📋 【ANALYSIS STEPS】

STEP 1: 物体識別
- 画像に何が描かれていますか？
- 色、形、サイズを詳しく観察してください

STEP 2: 系統的カウント
- 左半分と右半分に分けて数える
- 上段と下段に分けて数える  
- 重複や見落としがないか確認

STEP 3: 数学的分析
- 合計数を計算
- 数式を作成（例: 3 + 4 = 7）
- 問題の種類を特定

STEP 4: 教育的アドバイス
- 問題の内容に基づいた具体的なヒント
- 段階的な解法ステップ
- 理解を深めるための説明

【REQUIRED JSON FORMAT】
\`\`\`json
{
  "見えるもの": "物体の名前",
  "左側の数": 数値,
  "右側の数": 数値, 
  "合計": 数値,
  "数式": "式の文字列",
  "問題の種類": "addition|subtraction|counting|comparison",
  "具体的なヒント": [
    "この問題に特化した具体的なヒント1",
    "段階的な解法ステップ2", 
    "理解を深める説明3"
  ]
}
\`\`\`

⚠️ 重要: テンプレート的なヒントは絶対に避け、この画像の具体的な内容に基づいた有用なアドバイスのみを提供してください。`

    try {
      // OpenAI GPT-4V API呼び出し
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o", // GPT-4 with vision
          messages: [
            {
              role: "user", 
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                    detail: "high" // 高解像度で分析
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.1 // 一貫した結果のため低温度
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`)
      }

      const content = result.choices[0]?.message?.content || ''
      console.log('GPT-4V response:', content)
      
      // JSON部分を抽出
      let jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/)
      }
      
      let analysisResult: MathProblem
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
          
          const leftCount = parsed['左側の数'] || 0
          const rightCount = parsed['右側の数'] || 0
          const total = parsed['合計'] || leftCount + rightCount
          const objectType = parsed['見えるもの'] || '物'
          const expression = parsed['数式'] || `${leftCount} + ${rightCount}`
          const problemType = parsed['問題の種類'] || 'addition'
          const specificHints = parsed['具体的なヒント'] || []
          
          analysisResult = {
            type: problemType as any,
            expression: expression,
            problem: `画像の${objectType}の数を数える問題です`,
            numbers: [leftCount, rightCount].filter(n => n > 0),
            answer: total,
            difficulty: total <= 5 ? 'easy' : total <= 10 ? 'medium' : 'hard',
            concepts: problemType === 'addition' ? ['数を数える', 'たし算'] : 
                     problemType === 'subtraction' ? ['数を数える', 'ひき算'] :
                     ['数を数える'],
            suggestedHints: specificHints.length > 0 ? specificHints : [
              `画像の${objectType}をよく見てみよう`,
              `左側と右側に分けて数えてみよう`,
              `全部で${total}個あるね！`
            ],
            visualElements: {
              objects: objectType,
              count: [leftCount, rightCount].filter(n => n > 0),
              arrangement: '画像内に配置されています'
            }
          }
          
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError)
          throw new Error('Failed to parse GPT-4V response')
        }
      } else {
        throw new Error('No valid JSON found in GPT-4V response')
      }

      return NextResponse.json({
        success: true,
        model: 'gpt-4o-vision',
        data: analysisResult,
        debug: {
          fullResponse: content,
          usedFallback: false
        }
      })
      
    } catch (apiError: any) {
      console.error('OpenAI API call error:', apiError)
      
      return NextResponse.json({
        success: false,
        error: 'GPT-4V API呼び出しエラー',
        details: apiError.message || 'Unknown API error',
        suggestion: 'APIキーを確認するか、しばらく待ってから再試行してください'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('General error in OpenAI vision API:', error)
    
    return NextResponse.json({
      success: false,
      error: '画像の解析に失敗しました',
      details: error.message || '不明なエラー',
      suggestion: 'もう一度お試しください'
    }, { status: 500 })
  }
}