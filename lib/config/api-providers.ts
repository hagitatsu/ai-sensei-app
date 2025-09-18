/**
 * AI画像解析APIプロバイダーの設定と比較
 */

export interface APIProvider {
  name: string
  displayName: string
  pricing: {
    free?: string
    paid: string
    currency: 'USD' | 'JPY'
  }
  features: string[]
  pros: string[]
  cons: string[]
  recommended: boolean
  setupUrl?: string
}

export const API_PROVIDERS: Record<string, APIProvider> = {
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini 2.0 Flash',
    pricing: {
      free: '1分間15リクエストまで無料',
      paid: '$0.00025/1K入力トークン',
      currency: 'USD'
    },
    features: [
      '超高速レスポンス',
      '日本語理解が優秀',
      '算数問題に特化した解析',
      'マルチモーダル対応'
    ],
    pros: [
      '✅ 無料枠が大きい',
      '✅ コストが最も安い',
      '✅ 日本語での教育コンテンツ理解が優秀',
      '✅ レスポンスが速い'
    ],
    cons: [
      '❌ 最新すぎて情報が少ない',
      '❌ APIの仕様変更の可能性'
    ],
    recommended: true,
    setupUrl: 'https://aistudio.google.com/apikey'
  },
  
  openai: {
    name: 'openai',
    displayName: 'OpenAI GPT-4 Vision',
    pricing: {
      paid: '$10/100万トークン',
      currency: 'USD'
    },
    features: [
      '高精度な画像認識',
      '安定したAPI',
      '豊富なドキュメント',
      'JSON出力モード対応'
    ],
    pros: [
      '✅ 安定性が高い',
      '✅ ドキュメントが充実',
      '✅ 精度が高い'
    ],
    cons: [
      '❌ コストが高い（Geminiの40倍）',
      '❌ 無料枠なし',
      '❌ レート制限あり'
    ],
    recommended: false,
    setupUrl: 'https://platform.openai.com/api-keys'
  },

  claude: {
    name: 'claude',
    displayName: 'Claude 3.5 Sonnet',
    pricing: {
      paid: '$3/100万トークン',
      currency: 'USD'
    },
    features: [
      '教育分野に強い',
      '子ども向け説明が得意',
      '日本語対応良好',
      '倫理的配慮'
    ],
    pros: [
      '✅ 教育的な説明が上手',
      '✅ 子ども向けの配慮',
      '✅ 中程度のコスト'
    ],
    cons: [
      '❌ APIアクセスに制限',
      '❌ 無料枠なし',
      '❌ 日本からのアクセス制限の可能性'
    ],
    recommended: false,
    setupUrl: 'https://console.anthropic.com/'
  },

  together: {
    name: 'together',
    displayName: 'Together AI (Llama 3.2 Vision)',
    pricing: {
      free: '$25の無料クレジット',
      paid: '$0.18/100万トークン',
      currency: 'USD'
    },
    features: [
      'オープンソースモデル',
      '超低価格',
      'カスタマイズ可能',
      '高速推論'
    ],
    pros: [
      '✅ 非常に安価',
      '✅ オープンソース',
      '✅ 初回無料クレジット'
    ],
    cons: [
      '❌ 精度が劣る可能性',
      '❌ 日本語対応が不完全',
      '❌ サポートが限定的'
    ],
    recommended: false,
    setupUrl: 'https://api.together.xyz/'
  }
}

export function getRecommendedProvider(): APIProvider {
  return API_PROVIDERS.gemini
}

export function getProviderByEnv(): string {
  // 環境変数から利用可能なAPIを判定
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    return 'gemini'
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai'
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'claude'
  }
  if (process.env.TOGETHER_API_KEY) {
    return 'together'
  }
  return 'none'
}