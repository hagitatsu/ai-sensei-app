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
    
    // 改良されたプロンプト（小学1年生向け算数問題認識専用）
    const prompt = `あなたは小学1年生の算数問題を正確に認識する専門家です。画像を慎重に分析して、以下の項目を日本語で詳しく答えてください。

【重要】画像内の物体を注意深く数えてください。1つ1つ正確に数えることが最も重要です。

【画像分析手順】
1. 全体を観察：
   - 画像全体を見て、どんな教育的な内容か理解する
   - 算数問題のパターンを認識する

2. 物体の詳細認識：
   - 動物や物体の種類は何ですか？（かえる、りんご、ブロック、数字など）
   - 左側エリアに何個ありますか？1つずつ数えてください
   - 右側エリアに何個ありますか？1つずつ数えてください
   - 上側や他のエリアにも物体はありますか？

3. 配置と関係性：
   - 物体はどのようにグループ化されていますか？
   - 明確に分けられたグループがありますか？
   - 問題として何を求めているように見えますか？

【正確な数値抽出】
- 左グループ：__個
- 右グループ：__個  
- その他：__個
- 合計を求める問題の場合：__ + __ = __

【回答形式（必ず この形式で）】
視覚要素：[物体の種類]が左に[正確な数]個、右に[正確な数]個
配置：[詳細な配置説明]
問題種類：[たし算/ひき算/数える/比較]
数式：[正確な数式]
問題文：[問題の内容]
答え：[計算結果]

重要：必ず物体を1つ1つ丁寧に数えて、正確な数を報告してください。推測ではなく、見えるものを正確に数えることが重要です。`

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
      
      // 改良されたテキストレスポンス解析
      let analysisResult: MathProblem
      
      try {
        console.log('Full Gemini response:', text)
        
        // レスポンステキストから構造化情報を抽出（より精密に）
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        
        // 構造化された回答形式から情報を抽出
        const visualElementsLine = lines.find(line => line.includes('視覚要素：')) || 
                                  lines.find(line => line.includes('視覚要素') || line.includes('見える')) || text
        
        // オブジェクトの種類を抽出（より多くのパターンに対応）
        const objectPatterns = [
          'かえる', 'カエル', 'frog', 'りんご', 'リンゴ', 'apple', '牛', 'うし', 'cow', 
          'ブロック', 'block', 'ボール', 'ball', '花', 'はな', 'flower', 
          '鳥', 'とり', 'bird', '魚', 'さかな', 'fish', '猫', 'ねこ', 'cat',
          '犬', 'いぬ', 'dog', '△', '○', '□', '三角', '丸', '四角', '図形'
        ]
        
        const detectedObjects = objectPatterns.filter(pattern => 
          text.toLowerCase().includes(pattern.toLowerCase())
        )
        const mainObject = detectedObjects[0] || '物'
        
        // より精密な数式抽出（構造化回答から）
        const mathLine = lines.find(line => line.includes('数式：'))
        const answerLine = lines.find(line => line.includes('答え：'))
        
        let numbers: number[] = []
        let answer: number | undefined
        let mathType: 'addition' | 'subtraction' | 'counting' = 'counting'
        let expression = ''
        
        // 構造化された数式行から直接抽出
        if (mathLine) {
          console.log('Found math line:', mathLine)
          const mathExpressions = [
            /(\d+)\s*[+＋]\s*(\d+)\s*[=＝]\s*(\d+)/,  // 3 + 2 = 5
            /(\d+)\s*[+＋]\s*(\d+)/,                   // 3 + 2
            /(\d+)\s*[-－]\s*(\d+)\s*[=＝]\s*(\d+)/,  // 5 - 2 = 3
            /(\d+)\s*[-－]\s*(\d+)/                    // 5 - 2
          ]
          
          for (const pattern of mathExpressions) {
            const match = mathLine.match(pattern)
            if (match) {
              numbers = [parseInt(match[1]), parseInt(match[2])]
              if (match[3]) answer = parseInt(match[3])
              
              if (pattern.source.includes('[+＋]')) {
                mathType = 'addition'
                expression = `${numbers[0]} + ${numbers[1]}`
                if (!answer) answer = numbers[0] + numbers[1]
              } else if (pattern.source.includes('[-－]')) {
                mathType = 'subtraction'  
                expression = `${numbers[0]} - ${numbers[1]}`
                if (!answer) answer = numbers[0] - numbers[1]
              }
              break
            }
          }
        }
        
        // 答え行から答えを抽出（数式で答えが見つからない場合）
        if (!answer && answerLine) {
          const answerMatch = answerLine.match(/(\d+)/)
          if (answerMatch) {
            answer = parseInt(answerMatch[1])
          }
        }
        
        // さらに視覚要素行から個数を抽出
        if (numbers.length === 0 && visualElementsLine) {
          console.log('Extracting numbers from visual elements:', visualElementsLine)
          // "左に3匹、右に2匹" のようなパターンから数値を抽出
          const leftMatch = visualElementsLine.match(/左[^0-9]*(\d+)/)
          const rightMatch = visualElementsLine.match(/右[^0-9]*(\d+)/)
          
          if (leftMatch && rightMatch) {
            numbers = [parseInt(leftMatch[1]), parseInt(rightMatch[1])]
            expression = `${numbers[0]} + ${numbers[1]}`
            answer = numbers[0] + numbers[1]
            mathType = 'addition'
          }
        }
        
        // 数式が見つからない場合は単純な数値を探す
        if (numbers.length === 0) {
          const simpleNumbers = text.match(/\d+/g)
          if (simpleNumbers && simpleNumbers.length >= 2) {
            numbers = simpleNumbers.slice(0, 2).map(n => parseInt(n))
            expression = `${numbers[0]} + ${numbers[1]}`
            answer = numbers[0] + numbers[1]
            mathType = 'addition'
          } else if (simpleNumbers && simpleNumbers.length === 1) {
            const num = parseInt(simpleNumbers[0])
            numbers = [num]
            expression = `${num}個`
            answer = num
            mathType = 'counting'
          }
        }
        
        // 問題文の抽出（構造化回答から）
        const problemLine = lines.find(line => line.includes('問題文：')) || 
                           lines.find(line => line.includes('問題文') || line.includes('何') || line.includes('どんな'))
        
        const problemText = problemLine 
          ? problemLine.replace(/^[^：:]*[:：]\s*/, '').trim()
          : `${mainObject}の数を数える問題だよ`
        
        // 配置情報の抽出（構造化回答から）
        const arrangementLine = lines.find(line => line.includes('配置：')) ||
                               lines.find(line => line.includes('配置') || line.includes('グループ'))
        const arrangement = arrangementLine 
          ? arrangementLine.replace(/^[^：:]*[:：]\s*/, '').trim()
          : '画像の中に配置されています'
        
        // 問題のタイプを推定
        let problemType: 'addition' | 'subtraction' | 'counting' | 'comparison' = mathType
        if (text.includes('多い') || text.includes('少ない') || text.includes('比較')) {
          problemType = 'comparison'
        }
        
        analysisResult = {
          type: problemType,
          expression: expression || `${mainObject}を数えよう`,
          problem: problemText,
          numbers: numbers,
          answer: answer,
          difficulty: 'easy',
          concepts: mathType === 'addition' ? ['数を数える', 'たし算'] : 
                   mathType === 'subtraction' ? ['数を数える', 'ひき算'] :
                   ['数を数える'],
          suggestedHints: [
            `画像をよく見てみよう`,
            `${mainObject}を1つずつ数えてみよう`,
            numbers.length >= 2 ? `左に${numbers[0]}個、右に${numbers[1]}個だね` : `全部で${numbers[0] || 0}個だね`,
            expression ? `式にすると：${expression}` : '数を数えてみよう',
            answer !== undefined ? `答えは${answer}だよ！` : 'がんばって数えてみよう！'
          ],
          visualElements: {
            objects: mainObject,
            count: numbers,
            arrangement: arrangement
          }
        }
      } catch (error) {
        console.error('Response parsing error:', error)
        
        // エラー時のより詳細なフォールバック
        console.error('Response parsing error, using enhanced fallback:', error)
        
        // 少なくとも数字を抽出する試み
        const fallbackNumbers = text.match(/\d+/g)
        const nums = fallbackNumbers ? fallbackNumbers.slice(0, 2).map(n => parseInt(n)) : [1, 1]
        
        analysisResult = {
          type: 'counting',
          expression: nums.length >= 2 ? `${nums[0]} + ${nums[1]}` : '数を数えよう',
          problem: '画像から算数の問題を読み取りました。AI先生に詳しく聞いてみましょう！',
          numbers: nums,
          answer: nums.length >= 2 ? nums[0] + nums[1] : nums[0],
          difficulty: 'easy',
          concepts: ['数を数える', 'AI先生に質問'],
          suggestedHints: [
            '画像をよく見てみよう',
            'わからないことはAI先生に聞いてみよう',
            '左と右に分けて考えてみよう',
            '一緒に数えてみよう！'
          ],
          visualElements: {
            objects: mainObject,
            count: nums,
            arrangement: '画像内に配置されています'
          }
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