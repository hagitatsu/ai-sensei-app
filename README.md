# AI先生 - 小学1年生算数（たしざん）個別指導アプリ

## 概要

「AI先生」は小学1年生を対象とした算数の足し算に特化した個別指導アプリです。マイクロセッション（1-2分）で子どもが集中して学習できる設計となっており、5段階のヒントシステムと「だよ」口調のAI先生が優しく指導します。

## 主な機能

### 🎯 学習機能
- **レベル別問題生成**: 3段階の難易度（1-5+1-5、1-10+1-5、1-10+1-10）
- **5段階ヒントシステム**: 段階的に理解を深める支援
- **自動レベルアップ**: 5問正解で次のレベルに進級
- **進捗追跡**: 星集めシステムで学習のモチベーション維持

### 🤖 AI先生機能
- **だよ口調**: 子どもに親しみやすい話し方
- **個別アドバイス**: 学習状況に応じたパーソナライズされた指導
- **励ましメッセージ**: 間違いを恐れずチャレンジできる環境

### 📊 進捗管理
- **学習記録**: 問題解答履歴とパフォーマンス分析
- **統計情報**: 正答率、ヒント使用率、レベル別成績
- **学習アドバイス**: AIによる個別の学習提案

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
# .env.localファイルを編集してAPIのURLを設定
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
