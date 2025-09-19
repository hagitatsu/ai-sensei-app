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
    
    // 超厳密カウント専用プロンプト（さらに強化版）
    const prompt = `🧮 あなたは数学のプロフェッショナルです。幼稚園児にも分かるよう、画像の物を正確に数えてください。

🚨【絶対ルール】数え間違いは1つもしてはいけません！

🔬【超精密カウント手順】

📌 STEP 1: 画像の詳細観察
- 何が描かれていますか？（かえる、りんご、など）
- 色、大きさ、位置を詳しく観察
- 重なっているものはありますか？

📌 STEP 2: 左半分を数える
- 画像を縦半分に分けて、左側だけに集中
- 上から下へ、左から右へ順番に数える
- 「1匹目、2匹目、3匹目...」と声に出して数える
- 左側の合計：？個

📌 STEP 3: 右半分を数える  
- 今度は右側だけに集中
- 同じように「1匹目、2匹目、3匹目...」と数える
- 右側の合計：？個

📌 STEP 4: 全体確認
- 左側の数 ＋ 右側の数 ＝ 全体の数
- 数え忘れや重複がないか再確認

📌 STEP 5: 3回検証
1回目：左から右へ数える
2回目：上から下へ数える  
3回目：ランダムに数える
※ 3回とも同じ結果になるまで繰り返す

【🎯 必須回答形式】
見えるもの：[動物・物の名前]
左側カウント：[正確な数]個
右側カウント：[正確な数]個  
検証1回目：[数]個
検証2回目：[数]個
検証3回目：[数]個
最終答え：[左側数]＋[右側数]＝[合計数]個

【⚠️ 致命的エラー防止】
❌ 推測・適当は絶対禁止
❌ 同じものを2回数えない
❌ 見えないものを数えない  
❌ 部分的に隠れているものも1個としてカウント
✅ 見えるものを1個ずつ丁寧にカウント
✅ 左右で分けて別々に数える
✅ 必ず3回検証して確実にする

今すぐ画像を拡大して、1つ1つの物体を指差しながら数えてください！`

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
      console.log('Full Gemini response for debugging:', text)
      
      // 改良されたテキストレスポンス解析
      let analysisResult: MathProblem
      
      // オブジェクトの種類を抽出（より多くのパターンに対応） - スコープを広げる
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
      
      try {
        console.log('Full Gemini response:', text)
        
        // レスポンステキストから構造化情報を抽出（より精密に）
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        
        // 構造化された回答形式から情報を抽出
        const visualElementsLine = lines.find(line => line.includes('視覚要素：')) || 
                                  lines.find(line => line.includes('視覚要素') || line.includes('見える')) || text
        
        // 超精密な構造化レスポンス解析
        let numbers: number[] = []
        let answer: number | undefined
        let mathType: 'addition' | 'subtraction' | 'counting' = 'counting'
        let expression = ''
        
        // シンプル構造化回答から抽出
        const objectLine = lines.find(line => line.includes('見えるもの：'))
        const leftCountLine = lines.find(line => line.includes('左側の数：'))
        const rightCountLine = lines.find(line => line.includes('右側の数：'))
        const totalLine = lines.find(line => line.includes('全体の数：'))
        const answerLine = lines.find(line => line.includes('答え：'))
        
        console.log('シンプル構造化回答解析:')
        console.log('見えるもの:', objectLine)
        console.log('左側の数:', leftCountLine) 
        console.log('右側の数:', rightCountLine)
        console.log('全体の数:', totalLine)
        console.log('答え:', answerLine)
        
        // 新しい強化されたフォーマットに対応した抽出
        let leftCount = 0, rightCount = 0, totalCount = 0
        
        // 新フォーマットに対応
        const leftCountNewLine = lines.find(line => line.includes('左側カウント：'))
        const rightCountNewLine = lines.find(line => line.includes('右側カウント：'))
        const finalAnswerLine = lines.find(line => line.includes('最終答え：'))
        
        // 新フォーマット優先で抽出
        if (leftCountNewLine) {
          const leftMatch = leftCountNewLine.match(/(\d+)個/)
          if (leftMatch) {
            leftCount = parseInt(leftMatch[1])
            console.log('左側カウント（新）:', leftCount)
          }
        } else if (leftCountLine) {
          const leftMatch = leftCountLine.match(/(\d+)個/)
          if (leftMatch) {
            leftCount = parseInt(leftMatch[1])
            console.log('左側カウント（旧）:', leftCount)
          }
        }
        
        if (rightCountNewLine) {
          const rightMatch = rightCountNewLine.match(/(\d+)個/)
          if (rightMatch) {
            rightCount = parseInt(rightMatch[1])
            console.log('右側カウント（新）:', rightCount)
          }
        } else if (rightCountLine) {
          const rightMatch = rightCountLine.match(/(\d+)個/)
          if (rightMatch) {
            rightCount = parseInt(rightMatch[1])
            console.log('右側カウント（旧）:', rightCount)
          }
        }
        
        if (totalLine) {
          const totalMatch = totalLine.match(/(\d+)個/)
          if (totalMatch) {
            totalCount = parseInt(totalMatch[1])
            console.log('全体合計:', totalCount)
            
            // 全体の数が分かっている場合、それを最優先にする
            if (leftCount > 0 && rightCount === 0) {
              rightCount = totalCount - leftCount
            } else if (rightCount > 0 && leftCount === 0) {
              leftCount = totalCount - rightCount
            }
          }
        }
        
        // 答え行から数式パターンも抽出（バックアップ）
        if (answerLine) {
          const mathPatterns = [
            /(\d+)\s*[+＋]\s*(\d+)\s*[=＝]\s*(\d+)/,
            /(\d+)\s*[+＋]\s*(\d+)/,
            /(\d+)\s*[-－]\s*(\d+)\s*[=＝]\s*(\d+)/,
            /(\d+)\s*[-－]\s*(\d+)/
          ]
          
          for (const pattern of mathPatterns) {
            const match = answerLine.match(pattern)
            if (match) {
              if (leftCount === 0) leftCount = parseInt(match[1])
              if (rightCount === 0) rightCount = parseInt(match[2])
              if (match[3] && !answer) answer = parseInt(match[3])
              
              if (pattern.source.includes('[+＋]')) {
                mathType = 'addition'
              } else if (pattern.source.includes('[-－]')) {
                mathType = 'subtraction'
              }
              break
            }
          }
        }
        
        // 答え行から答えを抽出
        if (!answer && answerLine) {
          const answerMatch = answerLine.match(/(\d+)/)
          if (answerMatch) {
            answer = parseInt(answerMatch[1])
          }
        }
        
        // フォールバック：テキスト全体から「左に○個、右に○個」パターンを探す
        if (leftCount === 0 || rightCount === 0) {
          console.log('フォールバック解析開始')
          const leftPatterns = [
            /左[^0-9]*(\d+)[^0-9]*[個匹]/g,
            /左[^0-9]*(\d+)/g,
            /左側[^0-9]*(\d+)/g
          ]
          const rightPatterns = [
            /右[^0-9]*(\d+)[^0-9]*[個匹]/g,
            /右[^0-9]*(\d+)/g,
            /右側[^0-9]*(\d+)/g
          ]
          
          for (const pattern of leftPatterns) {
            const match = text.match(pattern)
            if (match && leftCount === 0) {
              leftCount = parseInt(match[1])
              console.log('左側個数検出:', leftCount)
              break
            }
          }
          
          for (const pattern of rightPatterns) {
            const match = text.match(pattern)
            if (match && rightCount === 0) {
              rightCount = parseInt(match[1])
              console.log('右側個数検出:', rightCount)
              break
            }
          }
        }
        
        // 最終的な値設定
        numbers = [leftCount, rightCount].filter(n => n > 0)
        if (numbers.length >= 2) {
          if (mathType === 'subtraction') {
            expression = `${numbers[0]} - ${numbers[1]}`
            if (!answer) answer = numbers[0] - numbers[1]
          } else {
            mathType = 'addition'
            expression = `${numbers[0]} + ${numbers[1]}`
            if (!answer) answer = numbers[0] + numbers[1]
          }
        } else if (numbers.length === 1) {
          expression = `${numbers[0]}個`
          answer = numbers[0]
          mathType = 'counting'
        }
        
        console.log('最終解析結果:', { numbers, expression, answer, mathType })
        
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
        
        // フォールバック用のオブジェクト名はすでに定義済みのmainObjectを使用
        
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
        data: analysisResult,
        debug: {
          fullResponse: text.length > 1000 ? text.substring(0, 1000) + '...[truncated]' : text,
          detectedNumbers: analysisResult.numbers || [],
          mathType: analysisResult.type,
          objectType: mainObject
        }
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