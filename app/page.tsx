'use client'
import { useState } from 'react'
import ImageUploader from './components/ImageUploader'
import AITutor from './components/AITutor'
import { Camera, Upload, Mic, Volume2 } from 'lucide-react'

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [problemData, setProblemData] = useState<any>(null)
  const [sessionStarted, setSessionStarted] = useState(false)

  const handleImageUpload = async (imageData: string) => {
    setUploadedImage(imageData)
    setIsProcessing(true)
    
    try {
      // Gemini Vision APIを呼び出して実際の画像を解析
      const response = await fetch('/api/vision/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProblemData(result.data)
      } else {
        // エラー時は画像から判断できなかったことを表示
        setProblemData({
          type: 'unknown',
          problem: '画像を読み取れませんでした',
          difficulty: 'unknown',
          concepts: ['画像が不鮮明か、問題が認識できません']
        })
      }
    } catch (error) {
      console.error('画像解析エラー:', error)
      setProblemData({
        type: 'error',
        problem: 'エラーが発生しました',
        difficulty: 'unknown',
        concepts: ['もう一度お試しください']
      })
    } finally {
      setIsProcessing(false)
      setSessionStarted(true)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setProblemData(null)
    setSessionStarted(false)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🤖 AI先生
          </h1>
          <p className="text-lg text-gray-600">
            わからない問題を写真に撮って、AI先生に聞いてみよう！
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左側：画像アップロードエリア */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Camera className="mr-2 text-blue-500" />
              問題をアップロード
            </h2>
            
            {!sessionStarted ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : (
              <div className="space-y-4">
                {uploadedImage && (
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="アップロードされた問題" 
                      className="w-full rounded-lg border-2 border-gray-200"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                          <p>問題を読み取っています...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {problemData && (
                  <div className={`p-4 rounded-lg ${
                    problemData.type === 'error' || problemData.type === 'unknown' 
                      ? 'bg-red-50' 
                      : 'bg-blue-50'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      problemData.type === 'error' || problemData.type === 'unknown'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}>
                      {problemData.type === 'error' || problemData.type === 'unknown' 
                        ? '⚠️ 認識エラー' 
                        : '✅ 認識された問題：'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      problemData.type === 'error' || problemData.type === 'unknown'
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}>
                      {problemData.expression || problemData.problem}
                    </p>
                    {problemData.visualElements && (
                      <p className="text-sm text-blue-700 mt-2">
                        🖼️ {problemData.visualElements.objects} 
                        {problemData.visualElements.count && 
                          ` (${problemData.visualElements.count.join(', ')})`
                        }
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      タイプ: {problemData.concepts.join(', ')}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  新しい問題をアップロード
                </button>
              </div>
            )}
          </div>

          {/* 右側：AI先生エリア */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Volume2 className="mr-2 text-green-500" />
              AI先生とお話ししよう
            </h2>
            
            {!sessionStarted ? (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">👨‍🏫</div>
                  <p className="text-lg">問題をアップロードすると</p>
                  <p className="text-lg">AI先生が教えてくれるよ！</p>
                </div>
              </div>
            ) : (
              <AITutor 
                problemData={problemData}
                uploadedImage={uploadedImage}
              />
            )}
          </div>
        </div>

        {/* 使い方の説明 */}
        {!sessionStarted && (
          <div className="mt-8 bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-200">
            <h3 className="text-xl font-bold text-yellow-800 mb-3">📖 つかいかた</h3>
            <div className="grid md:grid-cols-3 gap-4 text-yellow-700">
              <div className="flex items-start">
                <span className="text-2xl mr-2">1️⃣</span>
                <div>
                  <p className="font-semibold">問題を撮る</p>
                  <p className="text-sm">わからない問題の写真を撮ろう</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-2">2️⃣</span>
                <div>
                  <p className="font-semibold">AI先生に聞く</p>
                  <p className="text-sm">どこがわからないか話してみよう</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-2">3️⃣</span>
                <div>
                  <p className="font-semibold">一緒に解く</p>
                  <p className="text-sm">ヒントをもらいながら解いてみよう</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}