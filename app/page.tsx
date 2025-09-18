'use client'
import GameScreen from './components/GameScreen'
import { Star, BookOpen, Trophy } from 'lucide-react'

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [totalStars, setTotalStars] = useState(0)

  useEffect(() => {
    // Load saved progress
    const savedName = localStorage.getItem('playerName')
    const savedStars = localStorage.getItem('totalStars')
    if (savedName) setPlayerName(savedName)
    if (savedStars) setTotalStars(parseInt(savedStars))
  }, [])

  const handleStartGame = () => {
    if (playerName.trim()) {
      localStorage.setItem('playerName', playerName)
      setGameStarted(true)
    }
  }

  const handleGameEnd = (starsEarned: number) => {
    const newTotal = totalStars + starsEarned
    setTotalStars(newTotal)
    localStorage.setItem('totalStars', newTotal.toString())
    setGameStarted(false)
  }

  if (gameStarted) {
    return <GameScreen onGameEnd={handleGameEnd} playerName={playerName} />
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="w-12 h-12 text-blue-500 mr-2" />
          <h1 className="text-4xl font-bold text-gray-800">AI先生</h1>
        </div>
        <p className="text-lg text-gray-600">小学1年生のための算数（たしざん）</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-yellow-500 mr-2" />
          <span className="text-xl font-semibold">あつめたほし: {totalStars}個</span>
          <Star className="w-6 h-6 text-yellow-400 ml-2" />
        </div>

        <div className="mb-6">
          <label htmlFor="playerName" className="block text-lg font-medium text-gray-700 mb-2">
            おなまえをおしえてね！
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="おなまえ"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={10}
          />
        </div>

        <button
          onClick={handleStartGame}
          disabled={!playerName.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xl font-bold py-4 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
        >
          たしざんをはじめる！
        </button>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-2">がんばるポイント</h2>
        <ul className="text-blue-700 space-y-1">
          <li>• 1つ1つゆっくりかんがえよう</li>
          <li>• わからないときはヒントをつかおう</li>
          <li>• まちがえてもだいじょうぶだよ！</li>
        </ul>
      </div>
    </div>
  )
}
