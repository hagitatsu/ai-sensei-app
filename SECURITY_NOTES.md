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

   ⚠️ **サーバーサイドAPIの重要な設定**
   
   Next.jsのAPI Routesはサーバーサイドで実行されるため、HTTPリファラー制限は機能しません。
   サーバーサイドのリクエストにはリファラーヘッダーが含まれないため、以下の設定を推奨：

   **推奨設定：**
   - アプリケーション制限：**なし**（サーバーサイド用）
   - API制限：**Generative Language API**のみに制限

   **セキュリティ対策：**
   - APIキーは環境変数として安全に管理（Vercel環境変数）
   - クライアントサイドには絶対に露出しない
   - 必要に応じてレート制限を実装
   - 本番環境では、Firebase Functions等のバックエンドサービスの利用を検討

### 対応手順

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)にアクセス
2. 該当のAPIキーを選択
3. 「アプリケーションの制限」を「なし」に設定（サーバーサイド用）
4. 「API制限」を「Generative Language API」に設定
5. 保存して変更を適用

### HTTPリファラー制限について

HTTPリファラー制限は、ブラウザから直接APIを呼び出す場合にのみ有効です。
Next.jsのAPI Routesのようなサーバーサイドの実装では：

- ❌ HTTPリファラー制限は機能しない（リファラーヘッダーがない）
- ✅ 環境変数でAPIキーを安全に管理
- ✅ API制限でアクセス可能なAPIを制限
- ✅ 必要に応じてIPアドレス制限を検討（Vercelの固定IPが必要）

### 現在のセキュリティ状態

- ✅ `.env.local`は`.gitignore`に含まれている
- ✅ Vercelの環境変数として設定済み
- ⚠️ Google Cloud ConsoleでAPIキーの「アプリケーション制限」を「なし」に変更必要
- ⚠️ API制限をGenerative Language APIのみに設定推奨