# AI先生アプリ デプロイガイド

このガイドでは、AI先生アプリをVercel（フロントエンド）とRailway（バックエンド）にデプロイする手順を詳しく説明します。

## 🚀 デプロイの全体フロー

1. **Vercel**: フロントエンド（Next.js）をデプロイ
2. **Railway**: バックエンド（FastAPI）とPostgreSQLをデプロイ
3. **設定**: 両者を連携させる環境変数を設定

## 📋 事前準備

### 必要なアカウント
- GitHubアカウント
- Vercelアカウント（GitHubと連携）
- Railwayアカウント（GitHubと連携）

### 必要な情報
- プロジェクトのGitHubリポジトリURL
- アプリケーションの設定情報

---

## 🎯 Step 1: Vercelフロントエンドデプロイ

### 1.1 Vercelアカウント設定
1. [Vercel](https://vercel.com)にアクセス
2. 「Sign up with GitHub」でログイン
3. GitHubとの連携を許可

### 1.2 プロジェクトデプロイ
1. Vercelダッシュボードで「Add New Project」
2. GitHubから`ai-sensei-app`リポジトリを選択
3. 設定確認：
   - **Framework Preset**: Other
   - **Root Directory**: `.`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 1.3 環境変数設定
**後でバックエンドURL設定が必要**
```
NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
```

### 1.4 デプロイ実行
1. 「Deploy」ボタンをクリック
2. ビルド完了まで待機（約2-3分）
3. デプロイ成功URL：`https://ai-sensei-app-xxx.vercel.app`

---

## 🚂 Step 2: Railwayバックエンドデプロイ

### 2.1 Railwayアカウント設定
1. [Railway](https://railway.app)にアクセス
2. 「Login with GitHub」でログイン
3. GitHubとの連携を許可

### 2.2 新プロジェクト作成
1. 「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. `ai-sensei-app`リポジトリを選択

### 2.3 PostgreSQLデータベース追加
1. プロジェクトダッシュボードで「Add Service」
2. 「Database」→「PostgreSQL」を選択
3. 自動的にデータベースがプロビジョン

### 2.4 バックエンドサービス設定
1. プロジェクトダッシュボードで「Add Service」
2. 「GitHub Repo」を選択
3. 設定：
   - **Root Directory**: `backend`
   - **Build Command**: （空白）
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.5 環境変数設定
以下の環境変数を設定：
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
PORT = ${{PORT}}
```

### 2.6 デプロイ実行
1. 設定保存後、自動デプロイ開始
2. ログを確認してエラーがないことを確認
3. デプロイ成功URL：`https://your-app-name.railway.app`

---

## 🔗 Step 3: フロントエンドとバックエンドの連携

### 3.1 Vercel環境変数更新
1. Vercelプロジェクト設定を開く
2. 「Environment Variables」タブ
3. 新しい環境変数を追加：
```
Name: NEXT_PUBLIC_API_URL
Value: https://your-app-name.railway.app
```

### 3.2 フロントエンド再デプロイ
1. Vercelダッシュボードで「Redeploy」
2. 最新の環境変数で再ビルド

---

## ✅ Step 4: 動作確認

### 4.1 バックエンドAPI確認
```bash
# Health Check
curl https://your-app-name.railway.app/health

# API動作確認
curl https://your-app-name.railway.app/api/v1/problems/generate?level=1
```

### 4.2 フロントエンド確認
1. Vercel URLにアクセス
2. 名前を入力してゲーム開始
3. 問題が正常に表示されることを確認
4. 解答・ヒント機能の動作確認

---

## 🛠 トラブルシューティング

### よくある問題と解決方法

#### 1. VercelでBuild Error
**症状**: デプロイ時にビルドエラー
**解決**: 
- `package.json`の依存関係を確認
- Node.jsバージョンを18以上に設定

#### 2. Railway Database Connection Error
**症状**: データベース接続エラー
**解決**:
- `DATABASE_URL`環境変数が正しく設定されているか確認
- PostgreSQLサービスが起動しているか確認

#### 3. CORS Error
**症状**: フロントエンドからAPIへのアクセスが失敗
**解決**:
- バックエンドのCORS設定を確認
- `NEXT_PUBLIC_API_URL`が正しく設定されているか確認

#### 4. 404 Error on Frontend
**症状**: Vercel URLにアクセスすると404エラー
**解決**:
- ファイルがGitHubリポジトリに正しくプッシュされているか確認
- Vercelのビルドログを確認

---

## 📊 デプロイ後の運用

### 監視とメンテナンス
- **Vercel Analytics**: アクセス状況の監視
- **Railway Metrics**: サーバー稼働状況の監視
- **定期バックアップ**: データベースのバックアップ設定

### アップデート手順
1. GitHubリポジトリにコード変更をプッシュ
2. Vercel・Railwayが自動的に検知して再デプロイ
3. 動作確認を実施

---

## 💰 コスト予想

### Vercel (フロントエンド)
- **Hobbyプラン**: 無料
- 制限: 月100GB帯域幅、商用利用不可

### Railway (バックエンド)
- **開発版**: 月$5（$5クレジット付属）
- **本格運用**: 月$20-50（使用量により変動）

### 合計予想コスト
- **開発・テスト段階**: 月0円
- **本格運用**: 月$20-50（約3,000-7,000円）

---

## 🔐 セキュリティ設定

### 推奨設定
1. **環境変数**: 機密情報は環境変数で管理
2. **HTTPS**: 必ず HTTPS を使用
3. **CORS**: 適切なオリジン制限
4. **データベース**: アクセス権限の最小化

---

## 📞 サポート

デプロイで問題が発生した場合：
1. まずトラブルシューティングセクションを確認
2. GitHubのIssueで質問投稿
3. VercelやRailwayの公式ドキュメント参照

**重要**: 本ガイドの手順に従えば、約30分でフルスタックアプリケーションがデプロイ完了します！
