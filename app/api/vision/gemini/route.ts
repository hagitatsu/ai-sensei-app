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
      model: 'gemini-2.0-flash-exp', // Gemini 2.0 Flash実験版を使用
    })

    // Base64画像データの処理
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // プロンプトの作成（シンプル化）
    const prompt = `画像の算数問題を分析してください。
    
画像に含まれる動物や物の数を数えて、問題を理解してください。

以下の形式で日本語で答えてください：
- 何が見えるか（例：牛が左に2頭、右に4頭）
- 問題は何か（例：全部で何頭？）
- 式と答え（例：2 + 4 = 6）`

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
      
      // テキストレスポンスから情報を抽出
      let analysisResult: MathProblem
      
      try {
        // 数値を抽出（例: "2 + 4 = 6" から [2, 4] を取得）
        const numberMatches = text.match(/\d+/g)
        const numbers = numberMatches ? numberMatches.map(n => parseInt(n)).slice(0, 2) : [0, 0]
        const answer = numbers[0] + numbers[1]
        
        // 動物や物体を検出
        const objectMatch = text.match(/(牛|かえる|りんご|ブロック|動物|物)/g)
        const objects = objectMatch ? objectMatch[0] : '物'
        
        analysisResult = {
          type: 'counting',
          expression: `${numbers[0]} + ${numbers[1]}`,
          problem: text.split('\n')[0] || `${objects}が全部で何個？`,
          numbers: numbers,
          answer: answer,
          difficulty: 'easy',
          concepts: ['数を数える', 'たし算'],
          suggestedHints: [
            `左側の${objects}を数えてみよう：${numbers[0]}`,
            `右側の${objects}も数えてみよう：${numbers[1]}`,
            `全部で何個になるかな？`,
            `${numbers[0]} + ${numbers[1]} = ?`,
            `答えは ${answer} だよ！`
          ],
          visualElements: {
            objects: objects,
            count: numbers,
            arrangement: '左右に分かれて配置'
          }
        }
      } catch (error) {
        console.error('Response parsing error:', error)
        
        // エラー時のデフォルト
        analysisResult = {
          type: 'counting',
          expression: '? + ?',
          problem: '画像の問題を認識しています',
          numbers: [2, 4],
          answer: 6,
          difficulty: 'easy',
          concepts: ['数を数える'],
          suggestedHints: [
            '画像をよく見てみよう',
            '左と右に分けて数えてみよう',
            '全部でいくつになるかな？'
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
      console.error('Error details:', apiError.response?.data || apiError.stack)
      
      // APIエラーの詳細情報
      const errorMessage = apiError.message || 'Unknown API error'
      const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('limit')
      const isReferrerError = errorMessage.includes('referer') || errorMessage.includes('403') || errorMessage.includes('Forbidden')
      
      // エラータイプに応じた適切なメッセージ
      let userError = 'Gemini API呼び出しエラー'
      let userSuggestion = 'もう一度お試しください。問題が続く場合は画像を変えてみてください'
      
      if (isQuotaError) {
        userError = 'API利用制限に達しました'
        userSuggestion = '少し時間をおいて再度お試しください（無料枠: 1分15リクエスト）'
      } else if (isReferrerError) {
        userError = 'APIキーの制限設定エラー'
        userSuggestion = 'Google Cloud ConsoleでAPIキーのHTTPリファラー制限を「なし」に設定してください。サーバーサイドの呼び出しではリファラーヘッダーが送信されないため、この制限は機能しません。'
      }
      
      return NextResponse.json({
        success: false,
        error: userError,
        details: errorMessage,
        suggestion: userSuggestion,
        isReferrerError: isReferrerError
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