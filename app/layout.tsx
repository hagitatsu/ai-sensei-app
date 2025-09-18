import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI先生 - 小1算数たしざん',
  description: '小学1年生のための算数（たしざん）個別指導アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 text-gray-800">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  )
}
