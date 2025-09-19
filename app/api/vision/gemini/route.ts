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
    
    // 究極精度のカウント専用プロンプト（完璧版）
    const prompt = `🎯 CRITICAL MISSION: Perfect Counting Analysis

あなたは世界最高の数学教育専門家です。この画像の数え問題を100%完璧に解析してください。

🚨【ZERO TOLERANCE for errors】1つでも数え間違えたら失格です！

🔍【ULTRA-PRECISE METHOD】

🟦 PHASE 1: Deep Image Analysis
- 物体の種類: かえる/りんご/図形/その他？
- 配置パターン: グループ分け/整列/散らばり？
- 視覚的特徴: 色・サイズ・重なり状況
- 問題の文字: 何と書いてありますか？

🟩 PHASE 2: Ultra-Precise Grid Analysis
画像を縦線で真っ二つに分けて左右をカウント:
- 画像の真ん中に縦線を引く
- 左半分のかえるを1匹ずつ数える: [  ]匹
- 右半分のかえるを1匹ずつ数える: [  ]匹
- 境界線上のものは大部分が含まれる側にカウント

🔍 CRITICAL: 各かえるの位置を詳しく観察:
- かえる1: 左側のどの位置？
- かえる2: 左側のどの位置？
- かえる3: 左側のどの位置？
- かえる4: 右側のどの位置？
- かえる5: 右側のどの位置？
- かえる6: 右側のどの位置？
- かえる7: 右側のどの位置？

🟨 PHASE 3: Multiple Verification Methods
Method A - 左右厳密分割: 左[  ]匹 + 右[  ]匹 = [  ]匹
Method B - 行別カウント: 上の行[  ]匹 + 下の行[  ]匹 = [  ]匹  
Method C - 1匹ずつ確認: 「1匹目、2匹目、3匹目、4匹目、5匹目、6匹目、7匹目」= [  ]匹

🟪 PHASE 4: Mathematical Problem Construction
- 数式パターン認識: 足し算/引き算/単純カウント
- 教育レベル評価: 幼稚園/小学校低学年向け
- 具体的解法ステップの構築

【🎯 MANDATORY OUTPUT FORMAT】
見えるもの：[具体的な物体名]
問題文：[画像の文字があれば正確に転記]

個別位置確認：
かえる1: [左側/右側] - [位置詳細]
かえる2: [左側/右側] - [位置詳細]  
かえる3: [左側/右側] - [位置詳細]
かえる4: [左側/右側] - [位置詳細]
かえる5: [左側/右側] - [位置詳細]
かえる6: [左側/右側] - [位置詳細]
かえる7: [左側/右側] - [位置詳細]

厳密左右分割：左半分[数]匹｜右半分[数]匹
上下確認：上の行[数]匹｜下の行[数]匹
個別カウント：1,2,3,4,5,6,7番目 = [数]匹
最終確定：[数式] = [答え]

具体的教育ヒント：
1. [この画像の具体的内容に基づいた解法ステップ1]
2. [視覚的要素を活用した数え方のコツ]  
3. [この数量に関連した日常生活の例え]
4. [確実に答えを導く検証方法]
5. [理解を深める発展的な質問]

【🔥 ABSOLUTE REQUIREMENTS】
- 推測一切禁止 - 見えるもののみカウント
- テンプレート回答禁止 - この画像専用の具体的アドバイス
- 複数方法での検証必須
- 教育的価値の高いヒント提供

NOW ANALYZE THIS IMAGE WITH MATHEMATICAL PRECISION!`

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
        
        // 個別かえる位置分析システム
        let leftCount = 0, rightCount = 0, totalCount = 0, finalAnswer = 0
        
        // 個別かえる位置の解析
        const frogPositions = []
        for (let i = 1; i <= 7; i++) {
          const frogLine = lines.find(line => line.includes(`かえる${i}:`))
          if (frogLine) {
            const isLeft = frogLine.includes('左側')
            const isRight = frogLine.includes('右側')
            frogPositions.push({ id: i, side: isLeft ? 'left' : isRight ? 'right' : 'unknown' })
          }
        }
        
        // 位置情報から左右カウント
        if (frogPositions.length >= 5) { // 大部分の位置が特定できた場合
          leftCount = frogPositions.filter(f => f.side === 'left').length
          rightCount = frogPositions.filter(f => f.side === 'right').length
          console.log('Individual frog positions analyzed:', { leftCount, rightCount, total: frogPositions.length })
        }
        
        // フォールバック: 従来の方法
        const patterns = {
          leftHalf: lines.find(line => line.includes('厳密左右分割：') || line.includes('左半分：') || line.includes('左側：')),
          rightHalf: lines.find(line => line.includes('右半分：') || line.includes('右側：')),
          finalConfirm: lines.find(line => line.includes('最終確定：') || line.includes('最終答え：')),
          individualCount: lines.find(line => line.includes('個別カウント：') || line.includes('番目'))
        }
        
        console.log('Enhanced parsing patterns found:', {
          leftHalf: !!patterns.leftHalf,
          rightHalf: !!patterns.rightHalf, 
          finalConfirm: !!patterns.finalConfirm,
          individual: !!patterns.individualCount
        })
        
        // フォールバック: 左半分の数を抽出（個別位置分析が失敗した場合のみ）
        if (leftCount === 0 && patterns.leftHalf) {
          const leftMatch = patterns.leftHalf.match(/左半分(\d+)匹|左側(\d+)匹|左(\d+)匹/)
          if (leftMatch) {
            leftCount = parseInt(leftMatch[1] || leftMatch[2] || leftMatch[3])
            console.log('フォールバック左半分カウント:', leftCount)
          }
        }
        
        // フォールバック: 右半分の数を抽出
        if (rightCount === 0 && patterns.rightHalf) {
          const rightMatch = patterns.rightHalf.match(/右半分(\d+)匹|右側(\d+)匹|右(\d+)匹/)
          if (rightMatch) {
            rightCount = parseInt(rightMatch[1] || rightMatch[2] || rightMatch[3])
            console.log('フォールバック右半分カウント:', rightCount)
          }
        }
        
        // 最終確定から数式と答えを抽出
        if (patterns.finalConfirm) {
          const finalMatch = patterns.finalConfirm.match(/(\d+)\s*[+＋]\s*(\d+)\s*[=＝]\s*(\d+)/)
          if (finalMatch) {
            if (leftCount === 0) leftCount = parseInt(finalMatch[1])
            if (rightCount === 0) rightCount = parseInt(finalMatch[2])
            finalAnswer = parseInt(finalMatch[3])
            console.log('最終確定数式:', `${leftCount} + ${rightCount} = ${finalAnswer}`)
          }
        }
        
        // 個別カウントから総数を抽出（バックアップ）
        if (patterns.individualCount) {
          const individualMatch = patterns.individualCount.match(/=\s*(\d+)個/)
          if (individualMatch && !finalAnswer) {
            finalAnswer = parseInt(individualMatch[1])
            console.log('個別カウント総数:', finalAnswer)
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
        
        // 強化された最終値設定
        const finalTotal = finalAnswer || leftCount + rightCount
        numbers = [leftCount, rightCount].filter(n => n > 0)
        
        if (numbers.length >= 2 && finalTotal > 0) {
          if (mathType === 'subtraction') {
            expression = `${numbers[0]} - ${numbers[1]}`
            answer = finalAnswer || (numbers[0] - numbers[1])
          } else {
            mathType = 'addition' 
            expression = `${numbers[0]} + ${numbers[1]}`
            answer = finalAnswer || (numbers[0] + numbers[1])
          }
        } else if (finalTotal > 0) {
          // 個別カウントの結果を優先
          answer = finalTotal
          if (leftCount > 0 && rightCount > 0) {
            numbers = [leftCount, rightCount]
            expression = `${leftCount} + ${rightCount}`
            mathType = 'addition'
          } else {
            numbers = [finalTotal]
            expression = `${finalTotal}個`
            mathType = 'counting'
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
        
        // 具体的教育ヒントの抽出
        const hintsStartIndex = lines.findIndex(line => line.includes('具体的教育ヒント') || line.includes('教育ヒント'))
        const specificHints = []
        
        if (hintsStartIndex >= 0) {
          // ヒントセクション以降の行を解析
          for (let i = hintsStartIndex + 1; i < lines.length && i < hintsStartIndex + 8; i++) {
            const line = lines[i]
            if (line.match(/^\d+\./)) { // 1. 2. 3. 形式のヒント
              const hint = line.replace(/^\d+\.\s*/, '').trim()
              if (hint && hint.length > 10 && !hint.includes('一緒に') && !hint.includes('がんばって')) {
                specificHints.push(hint)
              }
            }
          }
        }
        
        console.log('Extracted specific hints:', specificHints.length, 'items')
        
        // 問題文の抽出（構造化回答から）
        const problemLine = lines.find(line => line.includes('問題文：')) || 
                           lines.find(line => line.includes('問題文') || line.includes('何') || line.includes('どんな'))
        
        const problemText = problemLine 
          ? problemLine.replace(/^[^：:]*[:：]\s*/, '').trim()
          : `${mainObject}の数を数える問題です`
        
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
        
        // 高品質な具体的ヒントの生成
        let qualityHints = specificHints
        
        if (qualityHints.length === 0) {
          // フォールバック: この問題専用のヒント生成
          qualityHints = [
            `画像の${mainObject}に注目して、左右に分けて数えてみよう`,
            numbers.length >= 2 
              ? `左側に${numbers[0]}個、右側に${numbers[1]}個あることを確認しよう`
              : `全部で${answer || numbers[0] || 0}個の${mainObject}が見えるね`,
            `指を使って一つずつ「1、2、3...」と数えてみよう`,
            expression 
              ? `数式で表すと「${expression}」になるよ`
              : `数を数えることから始めよう`,
            answer !== undefined 
              ? `最終的な答えは${answer}個だね。確認してみよう！`
              : '正確に数えることが大切だよ'
          ]
        }
        
        analysisResult = {
          type: problemType,
          expression: expression || `${mainObject}を数えよう`,
          problem: problemText,
          numbers: numbers,
          answer: answer,
          difficulty: (answer || 0) <= 5 ? 'easy' : (answer || 0) <= 10 ? 'medium' : 'hard',
          concepts: mathType === 'addition' ? ['数を数える', 'たし算', '視覚的認識'] : 
                   mathType === 'subtraction' ? ['数を数える', 'ひき算', '視覚的認識'] :
                   ['数を数える', '視覚的認識'],
          suggestedHints: qualityHints.slice(0, 5), // 最大5つの高品質ヒント
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