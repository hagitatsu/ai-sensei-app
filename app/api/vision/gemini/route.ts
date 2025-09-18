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

// Gemini APIクライアントの動的インポート
async function getGeminiClient() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    return GoogleGenerativeAI
  } catch (error) {
    console.error('Failed to import Google Generative AI:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.log('Gemini API endpoint called')
  
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    // Gemini APIキーの確認
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    
    console.log('API Key status:', geminiApiKey ? 'Found' : 'Not found')
    
    if (!geminiApiKey) {
      // APIキーがない場合のデモレスポンス
      console.warn('Gemini API key not configured. Returning demo response.')
      
      // 画像に基づいた仮の解析（かえるの画像を想定）
      const demoResponse: MathProblem = {
        type: 'counting',
        expression: 'かえるを数えよう',
        problem: '左に3匹、右に2匹のかえるがいます。全部で何匹？',
        numbers: [3, 2],
        answer: 5,
        difficulty: 'easy',
        concepts: ['数を数える', 'たし算の基礎'],
        suggestedHints: [
          '左側のかえるを1つずつ数えてみよう',
          '右側のかえるも数えてみよう',
          '全部で何匹になるかな？',
          '3 + 2 = ?',
          '指を使って数えてもいいよ'
        ],
        visualElements: {
          objects: 'かえる',
          count: [3, 2],
          arrangement: '左右に分かれて配置'
        }
      }
      
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'デモモード（APIキーを設定すると実際の解析が可能）',
        data: demoResponse
      })
    }

    // Gemini AIクライアントの動的インポートと初期化
    const GoogleGenerativeAI = await getGeminiClient()
    
    if (!GoogleGenerativeAI) {
      throw new Error('Failed to load Google Generative AI library')
    }
    
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // 最新の2.0 Flashモデルを使用
    })

    // Base64画像データの処理
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // プロンプトの作成
    const prompt = `あなたは小学生の算数学習を支援する専門家です。
    
画像を分析して、算数の問題や数学的要素を認識してください。

もし画像にかえる、りんご、ブロックなどのイラストが含まれている場合は、
それらの数を正確に数えて、たし算の問題として解釈してください。

以下のJSON形式で返答してください（JSONのみ、説明文なし）：
{
  "type": "counting",
  "expression": "認識した式",
  "problem": "問題の説明",
  "numbers": [数値の配列],
  "answer": 答え,
  "difficulty": "easy",
  "concepts": ["関連する概念"],
  "suggestedHints": ["ヒント1", "ヒント2", "ヒント3"],
  "visualElements": {
    "objects": "画像内のオブジェクト",
    "count": [各グループの数],
    "arrangement": "配置の説明"
  }
}`

    try {
      // Gemini APIを呼び出し
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        }
      ])

      const response = await result.response
      const text = response.text()
      
      console.log('Gemini response received:', text.substring(0, 200))
      
      // JSONを抽出
      let analysisResult: MathProblem
      try {
        // JSONブロックを抽出（```json ... ``` の形式）
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[1])
        } else {
          // 直接JSONとして解析を試みる
          const cleanText = text.trim()
          if (cleanText.startsWith('{')) {
            analysisResult = JSON.parse(cleanText)
          } else {
            throw new Error('No valid JSON found in response')
          }
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError)
        
        // パースエラー時のフォールバック
        analysisResult = {
          type: 'unknown',
          expression: '画像を解析しました',
          problem: '画像の内容を認識していますが、詳細な解析に失敗しました',
          numbers: [],
          difficulty: 'unknown',
          concepts: ['画像認識完了'],
          suggestedHints: [
            'もう一度撮影してみてください',
            '画像がはっきり見えるようにしてください',
            'AI先生に直接質問してください'
          ]
        }
      }

      return NextResponse.json({
        success: true,
        model: 'gemini-2.0-flash-exp',
        data: analysisResult
      })
      
    } catch (apiError: any) {
      console.error('Gemini API call error:', apiError)
      
      // APIエラーの詳細情報
      return NextResponse.json({
        success: false,
        error: 'Gemini API呼び出しエラー',
        details: apiError.message || 'Unknown API error',
        suggestion: 'APIキーが正しいか確認してください'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('General error in vision API:', error)
    
    return NextResponse.json({
      success: false,
      error: '画像の解析に失敗しました',
      details: error.message || '不明なエラー',
      suggestion: 'もう一度お試しください'
    }, { status: 500 })
  }
}