'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, RotateCcw, Lightbulb, BookOpen } from 'lucide-react'

interface AITutorProps {
  problemData: any
  uploadedImage: string | null
}

interface Message {
  id: string
  role: 'user' | 'tutor'
  content: string
  timestamp: Date
  hintLevel?: number
}

export default function AITutor({ problemData, uploadedImage }: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentHintLevel, setCurrentHintLevel] = useState(0)
  const [showVisualAid, setShowVisualAid] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初回メッセージ
  useEffect(() => {
    if (problemData) {
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: 'tutor',
        content: `こんにちは！「${problemData.problem}」の問題だね。どこがわからないか教えてくれる？一緒に考えていこうね！`,
        timestamp: new Date()
      }
      setMessages([initialMessage])
      speakMessage(initialMessage.content)
    }
  }, [problemData])

  // メッセージスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 音声合成
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ja-JP'
      utterance.rate = 0.9
      utterance.pitch = 1.1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      
      speechSynthesis.speak(utterance)
    }
  }

  // 音声認識の開始/停止
  const toggleListening = () => {
    if (isListening) {
      // 停止処理
      setIsListening(false)
    } else {
      // 開始処理（実際の音声認識APIは後で実装）
      setIsListening(true)
      setTimeout(() => {
        setIsListening(false)
        // デモ用：仮の音声入力
        handleUserMessage("たし算のやり方がわからない")
      }, 3000)
    }
  }

  // メッセージ送信
  const handleSendMessage = () => {
    if (inputText.trim()) {
      handleUserMessage(inputText)
      setInputText('')
    }
  }

  // ユーザーメッセージ処理
  const handleUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // AI応答を生成（デモ用の仮実装）
    setTimeout(() => {
      const tutorResponse = generateTutorResponse(text, currentHintLevel)
      setMessages(prev => [...prev, tutorResponse])
      speakMessage(tutorResponse.content)
    }, 1000)
  }

  // チューター応答生成（デモ用）
  const generateTutorResponse = (userInput: string, hintLevel: number): Message => {
    const responses = [
      {
        level: 0,
        content: "そうだね、たし算は数を合わせることだよ。8個と5個を合わせると何個になるか考えてみよう！"
      },
      {
        level: 1,
        content: "まず8個あるよね。そこに5個を足すんだよ。指を使ってもいいから数えてみよう！"
      },
      {
        level: 2,
        content: "8から始めて、9、10、11、12、13...5個数えてみると、13になるね！"
      },
      {
        level: 3,
        content: "別の方法もあるよ。8に2を足すと10になるね。5から2を引くと3。10と3で13だよ！"
      },
      {
        level: 4,
        content: "図で見てみよう！●を8個と5個書いて、全部で何個か数えてみると13個になるよ！"
      }
    ]

    const nextLevel = Math.min(hintLevel + 1, 4)
    setCurrentHintLevel(nextLevel)

    return {
      id: Date.now().toString(),
      role: 'tutor',
      content: responses[nextLevel].content,
      timestamp: new Date(),
      hintLevel: nextLevel
    }
  }

  // ヒントボタン
  const requestHint = () => {
    const hintMessage = generateTutorResponse("もっとヒントがほしい", currentHintLevel)
    setMessages(prev => [...prev, hintMessage])
    speakMessage(hintMessage.content)
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* AIアバター */}
      <div className="text-center mb-4">
        <div className={`inline-block p-4 rounded-full ${isSpeaking ? 'bg-green-100 animate-pulse' : 'bg-gray-100'}`}>
          <div className="text-6xl">👨‍🏫</div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {isSpeaking ? '話しています...' : isListening ? '聞いています...' : 'AI先生'}
        </p>
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.hintLevel !== undefined && (
                <p className="text-xs mt-1 opacity-70">
                  ヒントレベル: {message.hintLevel + 1}/5
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ヒントボタン */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={requestHint}
          className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg flex items-center justify-center transition duration-200"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          ヒントをもらう
        </button>
        <button
          onClick={() => setShowVisualAid(!showVisualAid)}
          className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg flex items-center justify-center transition duration-200"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          図で見る
        </button>
      </div>

      {/* ビジュアルエイド */}
      {showVisualAid && (
        <div className="mb-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <p className="text-sm font-bold text-purple-800 mb-2">視覚的な説明：</p>
          <div className="text-center">
            <p className="text-2xl mb-2">
              🟦🟦🟦🟦🟦🟦🟦🟦 = 8
            </p>
            <p className="text-2xl mb-2">
              🟥🟥🟥🟥🟥 = 5
            </p>
            <p className="text-2xl font-bold">
              🟦🟦🟦🟦🟦🟦🟦🟦🟥🟥🟥🟥🟥 = 13
            </p>
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="質問を入力..."
          className="flex-1 px-4 py-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <button
          onClick={toggleListening}
          className={`px-4 py-3 ${
            isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white font-bold rounded-lg transition duration-200`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition duration-200"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}