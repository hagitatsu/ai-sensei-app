# セキュリティ対策

## APIキーの安全な管理

### ⚠️ 重要な注意事項

1. **APIキーは絶対にGitHubにコミットしない**
   - `.env.local`ファイルは`.gitignore`に含まれているため安全
   - 誤ってコミットした場合は、即座にAPIキーを再生成

2. **Vercelでの環境変数設定**
   - Vercelダッシュボードで環境変数を設定（完了済み）
   - これはサーバー側でのみ使用され、安全

3. **Google Cloud Platformでの制限設定**
   - APIキーに以下の制限を設定することを推奨：
     - アプリケーション制限：HTTPリファラー
     - 許可するリファラー：
       - `https://ai-sensei-app-omega.vercel.app/*`
       - `http://localhost:3000/*`
     - API制限：Generative Language APIのみ

### 対応手順

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)にアクセス
2. 該当のAPIキーを選択
3. 「アプリケーションの制限」を設定
4. 「API制限」を設定
5. 必要に応じてAPIキーを再生成

### 現在のセキュリティ状態

- ✅ `.env.local`は`.gitignore`に含まれている
- ✅ Vercelの環境変数として設定済み
- ⚠️ APIキーの制限設定が必要