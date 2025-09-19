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
  confidence?: number
}

export async function POST(request: NextRequest) {
  console.log('Claude Vision API endpoint called')
  
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json(
        { error: '画像が提供されていません' },
        { status: 400 }
      )
    }

    // Claude APIキーの確認
    const claudeApiKey = process.env.ANTHROPIC_API_KEY
    
    console.log('Claude API Key status:', claudeApiKey ? 'Found' : 'Not found')
    
    if (!claudeApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Claude APIキーが設定されていません',
        suggestion: 'ANTHROPIC_API_KEYを環境変数に設定してください'
      }, { status: 500 })
    }

    // Base64画像データの処理
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // 超精密カウント専用プロンプト（Claude最適化版）
    const prompt = `🎯 あなたは数学教育のエキスパートです。この画像の物を正確に数えて、幼稚園児向けの算数問題を作成してください。

📊【CRITICAL COUNTING MISSION】
この画像には動物や物が配置されています。絶対に正確に数えてください。

🔍【STEP-BY-STEP ANALYSIS】
1️⃣ 画像の詳細観察
- 何が描かれていますか？（かえる、りんご、ボールなど）
- 色、大きさ、配置を詳しく観察

2️⃣ 左側エリアの精密カウント
- 画像を縦に半分に分けて、左側を集中的に見る
- 左側にある物を「1個、2個、3個...」と数える
- 左側合計：？個

3️⃣ 右側エリアの精密カウント
- 右側を集中的に見る
- 右側にある物を「1個、2個、3個...」と数える  
- 右側合計：？個

4️⃣ 全体確認と数式作成
- 左側 + 右側 = 全体
- 算数問題として適切な式を作成

5️⃣ 幼稚園児向け教材作成
- 認識した内容に基づいて、具体的で分かりやすいヒントを生成
- 「○○が△個ずつある」「左に□個、右に◇個」など具体的な表現

【OUTPUT FORMAT】
{
  "objectType": "カエル/りんご/ボールなど",
  "leftCount": [左側の数],
  "rightCount": [右側の数],
  "totalCount": [合計数],
  "mathExpression": "[左の数]+[右の数]",
  "answer": [計算結果],
  "problemDescription": "具体的な問題文",
  "specificHints": [
    "実際の画像内容に基づく具体的なヒント1",
    "実際の画像内容に基づく具体的なヒント2", 
    "実際の画像内容に基づく具体的なヒント3"
  ],
  "confidence": [0-100の信頼度],
  "arrangement": "配置の詳細説明"
}

🚨 CRITICAL REQUIREMENTS:
- 推測禁止：見えるものだけ正確に数える
- 同じものを2回数えない
- 見落とし禁止：全ての物を数える
- 具体的なヒント：テンプレートではなく、実際の画像内容に基づく
- 高い信頼度：uncertain の場合は confidence を低く設定

今すぐ画像を詳細に分析して、正確にカウントしてください！`

    try {
      // Claude API呼び出し
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Claude API error:', response.status, errorText)
        throw new Error(`Claude API error: ${response.status}`)
      }

      const result = await response.json()
      const text = result.content[0].text
      
      console.log('Claude response received:', text.substring(0, 200))
      console.log('Full Claude response:', text)
      
      // Claude のレスポンスを解析
      let analysisResult: MathProblem
      
      try {
        // JSON形式での回答を試行
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedJson = JSON.parse(jsonMatch[0])
          
          // 動的ヒント生成
          const dynamicHints = parsedJson.specificHints || [
            `${parsedJson.objectType}を左右に分けて数えてみよう`,
            `左に${parsedJson.leftCount}個、右に${parsedJson.rightCount}個あるね`,
            `${parsedJson.leftCount} + ${parsedJson.rightCount} = ${parsedJson.answer}だよ！`,
            '指を使って数えてもいいよ',
            '一つずつゆっくり数えてみよう'
          ]
          
          analysisResult = {
            type: 'addition',
            expression: parsedJson.mathExpression || `${parsedJson.leftCount} + ${parsedJson.rightCount}`,
            problem: parsedJson.problemDescription || `${parsedJson.objectType}は全部で何個でしょう？`,
            numbers: [parsedJson.leftCount, parsedJson.rightCount],
            answer: parsedJson.answer,
            difficulty: 'easy',
            concepts: ['数を数える', 'たし算'],
            suggestedHints: dynamicHints,
            visualElements: {
              objects: parsedJson.objectType,
              count: [parsedJson.leftCount, parsedJson.rightCount],
              arrangement: parsedJson.arrangement || '左右に分かれて配置'
            },
            confidence: parsedJson.confidence || 85
          }
        } else {
          // フォールバック解析
          throw new Error('JSON format not found, using fallback parsing')
        }
        
      } catch (parseError) {
        console.error('Claude response parsing error:', parseError)
        
        // テキスト解析フォールバック
        const numbers = text.match(/\d+/g)?.map(n => parseInt(n)) || [1, 1]
        const objectMatch = text.match(/(カエル|かえる|りんご|リンゴ|ボール|図形|物)/i)
        const mainObject = objectMatch ? objectMatch[0] : '物'
        
        analysisResult = {
          type: 'counting',
          expression: numbers.length >= 2 ? `${numbers[0]} + ${numbers[1]}` : '数を数えよう',
          problem: `${mainObject}の数を数える問題です`,
          numbers: numbers.slice(0, 2),
          answer: numbers.length >= 2 ? numbers[0] + numbers[1] : numbers[0],
          difficulty: 'easy',
          concepts: ['数を数える'],
          suggestedHints: [
            `${mainObject}を1つずつ数えてみよう`,
            '左と右に分けて考えてみよう',
            '指を使って数えてもいいよ',
            '落ち着いてゆっくり数えよう'
          ],
          visualElements: {
            objects: mainObject,
            count: numbers.slice(0, 2),
            arrangement: '画像内に配置されています'
          },
          confidence: 60
        }
      }

      return NextResponse.json({
        success: true,
        model: 'claude-3-5-sonnet-20241022',
        data: analysisResult,
        debug: {
          fullResponse: text.length > 500 ? text.substring(0, 500) + '...[truncated]' : text,
          confidence: analysisResult.confidence
        }
      })
      
    } catch (apiError: any) {
      console.error('Claude API call error:', apiError)
      
      return NextResponse.json({
        success: false,
        error: 'Claude API呼び出しエラー',
        details: apiError.message || '不明なエラー',
        suggestion: 'もう一度お試しください'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('General error in Claude vision API:', error)
    
    return NextResponse.json({
      success: false,
      error: '画像の解析に失敗しました',
      details: error.message || '不明なエラー'
    }, { status: 500 })
  }
}