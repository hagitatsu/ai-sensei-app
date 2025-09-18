# AI先生 - 問題解決支援型 個別指導アプリ

## 概要

「AI先生」は小学生が自分で解いている問題でつまずいた時に、問題の写真をアップロードすることで、AIがリアルタイムで解説やヒントを提供する個別指導アプリです。5段階のヒントシステムと「だよ」口調のAI先生が、子どものペースに合わせて優しく指導します。

## 主な機能

### 📸 問題認識機能
- **画像アップロード**: ドラッグ&ドロップ、カメラ撮影、ファイル選択に対応
- **問題自動認識**: OpenAI Vision APIで算数問題を自動解析
- **手書き対応**: ノートやドリルの手書き問題も認識可能

### 🎯 学習支援機能
- **5段階ヒントシステム**: 段階的に理解を深める支援
- **視覚的説明**: ブロックや図形を使った分かりやすい解説
- **複数の解法提示**: 異なるアプローチで問題を理解

### 🤖 AI先生機能
- **リアルタイム対話**: チャットと音声で質問可能
- **だよ口調**: 子どもに親しみやすい話し方
- **個別対応**: 子どものつまずきポイントに応じた説明
- **音声合成**: AI先生が音声で説明（Web Speech API使用）

### 📊 インタラクティブ機能
- **音声入力**: マイクで質問（実装予定）
- **アバター表示**: 話している時にアニメーション表示
- **図解生成**: 問題に応じた視覚的な補助教材

## 技術仕様

### フロントエンド
- **フレームワーク**: Next.js 14 + TypeScript
- **スタイリング**: Tailwind CSS
- **アニメーション**: Framer Motion
- **アイコン**: Lucide React
- **状態管理**: React Hooks + LocalStorage

### バックエンド
- **フレームワーク**: FastAPI
- **データベース**: PostgreSQL (本番) / SQLite (開発)
- **ORM**: SQLAlchemy
- **認証**: 今後実装予定

### デプロイメント
- **フロントエンド**: Vercel
- **バックエンド**: Railway
- **データベース**: Railway PostgreSQL

## セットアップ方法

### 前提条件
- Node.js 18以上
- Python 3.11以上
- Git

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/ai-sensei-app.git
cd ai-sensei-app
```

### 2. フロントエンドのセットアップ
```bash
npm install
cp .env.example .env.local
# .env.localファイルを編集して以下を設定：
# - OPENAI_API_KEY: OpenAI APIキー（Vision API使用に必須）
# - MATHPIX_APP_ID, MATHPIX_APP_KEY: Mathpix APIキー（オプション）
npm run dev
```

### 3. バックエンドのセットアップ
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .envファイルを編集してデータベースURLを設定
python main.py
```

## デプロイ方法

### Vercel (フロントエンド)
1. GitHubリポジトリをVercelに接続
2. 環境変数 `NEXT_PUBLIC_API_URL` を設定
3. 自動デプロイが開始されます

### Railway (バックエンド)
1. Railwayプロジェクトを作成
2. PostgreSQLアドオンを追加
3. GitHubリポジトリを接続
4. 自動デプロイが開始されます

詳細なデプロイ手順は `docs/DEPLOYMENT_GUIDE.md` を参照してください。

## ファイル構成

```
ai-sensei-app/
├── app/                    # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── backend/               # FastAPIバックエンド
│   ├── routers/           # APIルーター
│   ├── main.py            # FastAPIアプリ
│   ├── models.py          # データベースモデル
│   ├── database.py        # データベース設定
│   └── requirements.txt   # Python依存関係
├── docs/                  # ドキュメント
├── package.json           # Node.js依存関係
├── vercel.json           # Vercelデプロイ設定
└── README.md             # このファイル
```

## API仕様

### 問題生成 API
```
GET /api/v1/problems/generate?level=1
```

### 解答提出 API
```
POST /api/v1/problems/submit
```

### 進捗取得 API
```
GET /api/v1/progress/{student_name}
```

詳細なAPI仕様は `/docs` エンドポイントでSwagger UIを確認できます。

## 教育上の配慮

### 文科省ガイドライン準拠
- 生成AIガイドラインVer.2.0に準拠した設計
- 個人情報保護法への対応
- 教育効果を重視した学習フロー

### 子ども向けUI/UX
- 大きなボタンとわかりやすいアイコン
- カラフルで親しみやすいデザイン
- 直感的な操作方法

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題や質問がある場合は、GitHubのIssueを作成してください。

---

**開発者**: たっちゃん  
**バージョン**: 1.0.0  
**更新日**: 2024年
