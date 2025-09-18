import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

    // Gemini APIキーの確認
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    
    if (!geminiApiKey) {
      console.warn('Gemini API key not configured. Using fallback analysis.')
      return NextResponse.json({
        success: false,
        demo: true,
        message: 'Gemini APIキーが設定されていません。',
        instruction: `
          📝 設定方法：
          1. https://aistudio.google.com/apikey にアクセス
          2. "Create API Key"をクリック（無料）
          3. .env.localに追加: GEMINI_API_KEY=your_key_here
          4. アプリを再起動
        `,
        data: {
          type: 'demo',
          expression: 'APIキー設定待ち',
          problem: 'Gemini APIキーを設定すると、無料で画像解析ができます',
          numbers: [],
          difficulty: 'unknown',
          concepts: ['無料枠: 1分間15リクエストまで'],
          suggestedHints: [
            'Google AI Studioで無料APIキーを取得',
            '.env.localファイルに設定',
            'アプリを再起動'
          ]
        }
      })
    }

    // Gemini AIクライアントの初期化
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // 最新の高速モデル
    })

    // Base64画像データの処理
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // プロンプトの作成
    const prompt = `あなたは小学生の算数学習を支援する専門家です。
    
画像を分析して、以下の情報をJSON形式で返してください：

1. 画像に含まれる算数問題や数学的要素を認識
2. イラストや図形がある場合は、その数や配置を詳細に分析
3. 問題の種類（足し算、引き算、数を数える、比較など）を判定
4. 段階的な学習ヒントを生成

以下のJSON形式で返答してください：
\`\`\`json
{
  "type": "addition|subtraction|counting|comparison|unknown",
  "expression": "認識した式（例: 5 + 3）",
  "problem": "問題の説明（例: かえるが左に5匹、右に3匹います）",
  "numbers": [問題に含まれる数値],
  "answer": 答え（計算可能な場合）,
  "difficulty": "easy|medium|hard",
  "concepts": ["たし算", "くり上がり"など],
  "suggestedHints": [
    "ヒント1: まず左側を数えてみよう",
    "ヒント2: 次に右側も数えてみよう",
    "ヒント3: 全部で何個になるかな？"
  ],
  "visualElements": {
    "objects": "かえる、りんごなどのオブジェクト",
    "count": [左側の数, 右側の数],
    "arrangement": "配置の説明"
  }
}
\`\`\`

画像に算数問題が含まれない場合は、type を "unknown" として、画像の内容を説明してください。`

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
    
    // JSONを抽出（```json ... ``` の形式から）
    let analysisResult: MathProblem
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1])
      } else {
        // JSONブロックがない場合は全体をパース試行
        analysisResult = JSON.parse(text)
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini response as JSON:', parseError)
      
      // パース失敗時のフォールバック
      analysisResult = {
        type: 'unknown',
        expression: '解析完了',
        problem: text.substring(0, 200),
        numbers: [],
        difficulty: 'unknown',
        concepts: ['画像を解析しました'],
        suggestedHints: [
          'AI先生に詳しく聞いてみよう',
          'どこが分からないか説明してみよう'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      model: 'gemini-2.0-flash',
      data: analysisResult
    })

  } catch (error) {
    console.error('Gemini Vision API error:', error)
    
    // エラーの詳細を返す
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    
    return NextResponse.json({
      success: false,
      error: '画像の解析に失敗しました',
      details: errorMessage,
      suggestion: 'もう一度お試しいただくか、別の画像をアップロードしてください'
    }, { status: 500 })
  }
}