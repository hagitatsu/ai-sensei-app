'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  onImageUpload: (imageData: string) => void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // ドラッグ&ドロップハンドラー
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // ファイル処理
  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewImage(result)
      }
      reader.readAsDataURL(file)
    } else {
      alert('画像ファイルを選択してください')
    }
  }

  // ファイル選択
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // カメラ起動
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraActive(true)
    } catch (err) {
      console.error('カメラの起動に失敗しました:', err)
      alert('カメラを使用できません。画像をアップロードしてください。')
    }
  }

  // カメラ停止
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  // 写真撮影
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setPreviewImage(imageData)
        stopCamera()
      }
    }
  }

  // 画像確定
  const confirmImage = () => {
    if (previewImage) {
      onImageUpload(previewImage)
    }
  }

  // リセット
  const resetImage = () => {
    setPreviewImage(null)
    stopCamera()
  }

  return (
    <div className="space-y-4">
      {!previewImage && !cameraActive && (
        <>
          {/* ドラッグ&ドロップエリア */}
          <div
            className={`relative border-3 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              画像をドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-500 mb-4">または</p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center transition duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                ファイルを選択
              </button>
              
              <button
                onClick={startCamera}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center transition duration-200"
              >
                <Camera className="w-5 h-5 mr-2" />
                カメラで撮影
              </button>
            </div>
          </div>

          {/* サンプル画像の説明 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 ヒント: ノートやドリルの問題を撮影してね！
            </p>
          </div>
        </>
      )}

      {/* カメラビュー */}
      {cameraActive && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center"
            >
              <Camera className="w-5 h-5 mr-2" />
              撮影
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg flex items-center"
            >
              <X className="w-5 h-5 mr-2" />
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* プレビュー */}
      {previewImage && (
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={previewImage} 
              alt="プレビュー" 
              className="w-full rounded-lg border-2 border-gray-200"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={confirmImage}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition duration-200"
            >
              この画像を使う
            </button>
            <button
              onClick={resetImage}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition duration-200"
            >
              やり直す
            </button>
          </div>
        </div>
      )}
    </div>
  )
}