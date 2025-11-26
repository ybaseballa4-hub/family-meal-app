# セットアップガイド - 魔法のキッチン

このガイドでは、開発環境のセットアップ方法を説明します。

---

## 必要な環境

- Node.js 18.x 以上
- npm 9.x 以上
- Supabase アカウント

---

## 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd project
```

---

## 2. 依存関係のインストール

```bash
npm install
```

### インストールされるパッケージ

**本番依存関係:**
- `react` (^18.3.1) - UIライブラリ
- `react-dom` (^18.3.1) - React DOM操作
- `@supabase/supabase-js` (^2.57.4) - Supabaseクライアント
- `lucide-react` (^0.344.0) - アイコンライブラリ

**開発依存関係:**
- `vite` (^5.4.2) - ビルドツール
- `typescript` (^5.5.3) - 型システム
- `tailwindcss` (^3.4.1) - CSSフレームワーク
- `eslint` - コード品質チェック
- その他の開発ツール

---

## 3. Supabase プロジェクトのセットアップ

### 3.1 Supabase プロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワードを設定
4. リージョンを選択（日本の場合は Tokyo を推奨）
5. プロジェクトが作成されるまで待機（約2分）

### 3.2 プロジェクト情報の取得

1. プロジェクトの「Settings」→「API」を開く
2. 以下の情報をコピー：
   - Project URL
   - anon public key

---

## 4. 環境変数の設定

`.env` ファイルを作成し、Supabase の情報を設定します。

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**例:**
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5. データベースマイグレーション

### 5.1 マイグレーションの適用

プロジェクトには既にマイグレーションファイルが含まれています。

Supabase Dashboard から適用する方法：

1. Supabase Dashboard を開く
2. 「SQL Editor」を選択
3. 「New Query」をクリック
4. `supabase/migrations/` 内のSQLファイルを順番に実行

#### 実行順序

1. `20251111211304_create_user_settings_and_favorites.sql`
2. `20251111212125_create_weekly_menus_table.sql`
3. `20251113212417_20251113000001_create_cooking_history.sql`
4. `20251113212422_20251113000002_create_shopping_list_checks.sql`
5. `20251115182912_add_date_to_menu_items.sql`
6. `20251115195544_update_daily_menus_to_full_menu.sql`
7. `20251115211811_create_inventory_table.sql`
8. `20251123212038_create_family_members_table.sql`
9. `20251123213302_add_preferences_to_family_members.sql`
10. `20251123224632_add_family_mode_to_user_settings.sql`
11. `20251125204830_add_ratings_to_cooking_history.sql`
12. `20251125211315_update_cooking_history_rating_fields.sql`
13. `20251125213647_remove_difficulty_rating.sql`
14. `20251126121117_remove_duplicate_cooking_history.sql`
15. `20251126121436_update_cooking_history_unique_constraint.sql`

### 5.2 マイグレーション内容の確認

各マイグレーションファイルの先頭には、変更内容の詳細が記載されています。

---

## 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスします。

---

## 7. ビルド

本番用ビルドを作成：

```bash
npm run build
```

ビルドされたファイルは `dist/` フォルダに出力されます。

---

## 8. プレビュー

本番用ビルドをローカルでプレビュー：

```bash
npm run preview
```

---

## データベース構造

### テーブル一覧

#### user_settings
ユーザーの基本設定を保存

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID（外部キー） |
| favorite_dishes | text[] | 好きな料理リスト |
| excluded_ingredients | text[] | 苦手な食材リスト |
| family_mode_enabled | boolean | 家族モード有効フラグ |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

#### family_members
家族メンバー情報

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| name | text | メンバー名 |
| favorite_dishes | text[] | 好きな料理リスト |
| excluded_ingredients | text[] | 苦手な食材リスト |
| created_at | timestamptz | 作成日時 |

#### favorites
お気に入り料理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| dish_name | text | 料理名 |
| created_at | timestamptz | 作成日時 |

#### weekly_menus
週次献立データ

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| week_start | date | 週の開始日 |
| week_end | date | 週の終了日 |
| menu_data | jsonb | 献立データ（JSON形式） |
| created_at | timestamptz | 作成日時 |

#### cooking_history
調理履歴と評価

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| dish_name | text | 料理名 |
| cooked_date | date | 調理日 |
| notes | text | メモ |
| taste_rating | integer | おいしさ評価 (1-5) |
| cooking_time_rating | integer | 調理時間評価 (1-5) |
| repeat_desire | integer | リピート希望度 (1-5) |
| overall_score | numeric | 総合スコア |
| rank | text | ランク (A-D) |
| created_at | timestamptz | 作成日時 |

ユニーク制約: (user_id, dish_name)

#### shopping_list_checks
買い物リストのチェック状態

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| item | text | 食材名 |
| checked | boolean | チェック状態 |
| created_at | timestamptz | 作成日時 |

#### inventory
在庫管理

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | プライマリーキー |
| user_id | uuid | ユーザーID |
| item_name | text | 食材名 |
| quantity | numeric | 数量 |
| unit | text | 単位 |
| category | text | カテゴリ |
| created_at | timestamptz | 作成日時 |

---

## セキュリティ設定

すべてのテーブルで Row Level Security (RLS) が有効になっています。

### RLS ポリシー

各テーブルには以下のポリシーが設定されています：

- **SELECT**: 認証済みユーザーが自分のデータのみ閲覧可能
- **INSERT**: 認証済みユーザーが自分のデータのみ作成可能
- **UPDATE**: 認証済みユーザーが自分のデータのみ更新可能
- **DELETE**: 認証済みユーザーが自分のデータのみ削除可能

---

## トラブルシューティング

### 環境変数が読み込まれない

Vite では環境変数は `VITE_` プレフィックスが必要です。
`.env` ファイルを確認し、開発サーバーを再起動してください。

### データベース接続エラー

1. `.env` ファイルの値が正しいか確認
2. Supabase プロジェクトが正常に動作しているか確認
3. ネットワーク接続を確認

### マイグレーションエラー

1. SQL ファイルを順番に実行しているか確認
2. Supabase Dashboard のエラーメッセージを確認
3. 既存のテーブルがある場合は削除してから再実行

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf node_modules
rm package-lock.json
npm install

# 再ビルド
npm run build
```

---

## 開発コマンド一覧

```bash
# 開発サーバー起動
npm run dev

# 本番用ビルド
npm run build

# ビルドのプレビュー
npm run preview

# Lintチェック
npm run lint

# 型チェック
npm run typecheck
```

---

## サポート

問題が解決しない場合は、以下を確認してください：

1. Node.js と npm のバージョン
2. Supabase プロジェクトのステータス
3. ブラウザのコンソールエラー
4. ネットワーク接続

---

**セットアップが完了したら、魔法のキッチンをお楽しみください！**
