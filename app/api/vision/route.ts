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

    // 画像の形式を確認（base64形式のデータURLから実際のbase64部分を抽出）
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // ここで本来はOpenAI Vision APIを呼び出す
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      // APIキーがない場合はデモモードで動作
      console.log('OpenAI APIキーが設定されていません。デモモードで動作します。')
      
      // デモ用：画像の内容を仮定（本来はここでVision APIが画像を解析）
      // 実際にはカエルの絵が表示されているはずなので、それに基づいたレスポンス
      const demoAnalysis = {
        success: true,
        data: {
          problemType: 'counting',
          expression: 'かえるが何匹？',
          problem: '左に5匹、右に4匹のかえるがいます',
          numbers: [5, 4],
          answer: 9,
          difficulty: 'easy',
          concepts: ['数を数える', 'たし算の基礎'],
          suggestedHints: [
            '左側のかえるを数えてみよう',
            '右側のかえるも数えてみよう', 
            '全部で何匹になるか考えてみよう'
          ]
        }
      }
      return NextResponse.json(demoAnalysis)
    }
    
    // TODO: OpenAI Vision APIの実装
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${openaiApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4-vision-preview',
    //     messages: [
    //       {
    //         role: 'user',
    //         content: [
    //           {
    //             type: 'text',
    //             text: '画像に書かれている算数の問題を解析して、問題文、数値、答えを教えてください。'
    //           },
    //           {
    //             type: 'image_url',
    //             image_url: {
    //               url: image
    //             }
    //           }
    //         ]
    //       }
    //     ]
    //   })
    // })

    return NextResponse.json(mockAnalysis)
  } catch (error) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: '問題の解析に失敗しました' },
      { status: 500 }
    )
  }
}