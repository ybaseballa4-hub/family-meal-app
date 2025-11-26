# Supabaseマイグレーション

このディレクトリには、Supabaseインスタンス用のマイグレーションファイルが含まれています。

## 接続情報

- **Supabase URL**: https://wcqethqlkjzri.supabase.co
- **Anon Key**: 環境変数 `VITE_SUPABASE_ANON_KEY` に設定済み

## ⚠️ 重要: マイグレーションの適用が必要です

アプリケーションを使用する前に、以下の手順でマイグレーションを適用してください。

## マイグレーションの適用方法（手順）

### ステップ1: Supabase Dashboardにログイン

1. ブラウザで [https://app.supabase.com](https://app.supabase.com) を開く
2. アカウントにログイン

### ステップ2: プロジェクトを選択

1. ダッシュボードから対象のプロジェクトをクリック
   - プロジェクトURL: `https://wcqethqlkjzri.supabase.co`

### ステップ3: SQL Editorを開く

1. 左側のメニューから「SQL Editor」をクリック
2. 「New query」ボタンをクリック

### ステップ4: マイグレーションSQLをコピー＆実行

1. このプロジェクトの `supabase-external/migrations/001_initial_schema.sql` を開く
2. ファイル全体の内容をコピー
3. Supabase DashboardのSQL Editorにペースト
4. 右下の「Run」ボタンをクリック
5. 「Success. No rows returned」というメッセージが表示されればOK

### ステップ5: テーブルが作成されたか確認

1. 左側のメニューから「Table Editor」をクリック
2. 以下のテーブルが表示されていることを確認:
   - user_settings
   - favorite_menus
   - weekly_menus
   - inventory_items

## 作成されるテーブル

### 1. user_settings (ユーザー設定)
- 家族人数
- 好きな食材・料理
- 苦手な食材・料理
- 多めにしたい料理の種類

### 2. favorite_menus (お気に入りメニュー)
- 料理名
- 材料リスト

### 3. weekly_menus (週間メニュー)
- メニューデータ（7日分）
- 買い物リスト

### 4. inventory_items (在庫管理)
- 食材名
- 数量
- 単位

## セキュリティ

- 全テーブルでRow Level Security (RLS)が有効
- 認証済みユーザーは自分のデータのみアクセス可能
- Supabase Authと統合

## 注意事項

- マイグレーションは冪等性があり、複数回実行しても安全です
- Supabase Authが有効になっている必要があります
- アプリケーションは `.env` ファイルの `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を使用して接続します
