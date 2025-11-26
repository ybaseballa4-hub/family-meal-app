# アーキテクチャドキュメント - 魔法のキッチン

このドキュメントでは、アプリケーションの技術的なアーキテクチャと設計判断について説明します。

---

## 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [フロントエンド構成](#フロントエンド構成)
4. [バックエンド構成](#バックエンド構成)
5. [状態管理](#状態管理)
6. [データフロー](#データフロー)
7. [セキュリティ](#セキュリティ)
8. [パフォーマンス最適化](#パフォーマンス最適化)

---

## システム概要

魔法のキッチンは、React + Supabase による SPA (Single Page Application) です。

### アーキテクチャパターン

- **フロントエンド**: コンポーネントベースアーキテクチャ
- **バックエンド**: BaaS (Backend as a Service) - Supabase
- **認証**: Supabase Auth
- **データベース**: PostgreSQL (Supabase が管理)

### システム構成図

```
┌─────────────────────────────────────────┐
│         ユーザー (ブラウザ)              │
└───────────────┬─────────────────────────┘
                │
                │ HTTPS
                │
┌───────────────▼─────────────────────────┐
│      React Application (Vite)           │
│  ┌─────────────────────────────────┐   │
│  │  Components                      │   │
│  │  - CalendarView                  │   │
│  │  - WeeklyMenuView                │   │
│  │  - FavoritesView                 │   │
│  │  - ShoppingList                  │   │
│  │  - FamilySettings                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Context                         │   │
│  │  - AuthContext                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Libraries                       │   │
│  │  - menuGenerator                 │   │
│  │  - storage                       │   │
│  │  - supabase client               │   │
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │
                │ REST API / WebSocket
                │
┌───────────────▼─────────────────────────┐
│         Supabase Platform               │
│  ┌─────────────────────────────────┐   │
│  │  Authentication                  │   │
│  │  - Email/Password                │   │
│  │  - Session Management            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  PostgreSQL Database             │   │
│  │  - user_settings                 │   │
│  │  - family_members                │   │
│  │  - favorites                     │   │
│  │  - weekly_menus                  │   │
│  │  - cooking_history               │   │
│  │  - shopping_list_checks          │   │
│  │  - inventory                     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Row Level Security              │   │
│  │  - User-based access control     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.3.1 | UIライブラリ |
| TypeScript | 5.5.3 | 型安全性 |
| Vite | 5.4.2 | ビルドツール |
| Tailwind CSS | 3.4.1 | スタイリング |
| Lucide React | 0.344.0 | アイコン |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Supabase | Latest | BaaS プラットフォーム |
| PostgreSQL | 15+ | データベース |
| Supabase JS | 2.57.4 | クライアントSDK |

### 開発ツール

- ESLint - コード品質
- PostCSS - CSS処理
- Autoprefixer - ベンダープレフィックス

---

## フロントエンド構成

### ディレクトリ構造

```
src/
├── components/          # Reactコンポーネント
│   ├── CalendarView.tsx
│   ├── WeeklyMenuView.tsx
│   ├── FavoritesView.tsx
│   ├── ShoppingList.tsx
│   ├── ShoppingMode.tsx
│   ├── FamilySettings.tsx
│   ├── RatingDialog.tsx
│   ├── LoginForm.tsx
│   └── SignUpForm.tsx
├── contexts/            # React Context
│   └── AuthContext.tsx
├── lib/                 # ユーティリティ
│   ├── supabase.ts
│   ├── storage.ts
│   └── menuGenerator.ts
├── App.tsx              # メインアプリ
├── main.tsx             # エントリーポイント
└── index.css            # グローバルスタイル
```

### コンポーネント設計

#### コンポーネント階層

```
App
├── AuthContext.Provider
│   ├── LoginForm / SignUpForm (未認証時)
│   └── MainApp (認証時)
│       ├── Header
│       ├── TabContent
│       │   ├── WeeklyMenuView
│       │   ├── FamilySettings
│       │   ├── CalendarView
│       │   │   └── RatingDialog
│       │   ├── FavoritesView
│       │   ├── ShoppingList
│       │   │   └── ShoppingMode
│       │   └── InventoryView
│       └── Navigation
```

#### コンポーネントの責務

**CalendarView**
- 月次カレンダーの表示
- 日付選択
- 献立の追加・削除
- 評価ダイアログの表示
- 調理履歴の管理

**WeeklyMenuView**
- 週次献立の表示
- 献立の自動生成
- 個別料理の差し替え

**FavoritesView**
- 評価済み料理の一覧
- ランク別フィルタリング
- お気に入り管理

**ShoppingList**
- 買い物リストの生成
- チェック機能
- ショッピングモード切り替え

**FamilySettings**
- ユーザー設定
- 家族モード管理
- メンバー設定

**RatingDialog**
- 料理評価入力
- 総合スコア計算
- ランク判定

### 状態管理パターン

#### ローカル状態 (useState)

各コンポーネントで使用：
- UI状態（モーダルの開閉、選択状態など）
- フォーム入力値
- 一時的なデータ

#### グローバル状態 (Context API)

**AuthContext**
- 認証状態
- ユーザー情報
- セッション管理

#### サーバー状態 (Supabase)

- データベースデータ
- リアルタイム同期（将来実装可能）

---

## バックエンド構成

### Supabase アーキテクチャ

#### 認証フロー

```
1. ユーザー登録/ログイン
   ↓
2. Supabase Auth が JWT を発行
   ↓
3. JWT をローカルストレージに保存
   ↓
4. 以降のリクエストに JWT を含める
   ↓
5. Supabase が JWT を検証
   ↓
6. RLS ポリシーに基づきアクセス制御
```

#### データベーススキーマ

```sql
-- ユーザー設定
user_settings
  - id (PK)
  - user_id (FK → auth.users)
  - favorite_dishes (text[])
  - excluded_ingredients (text[])
  - family_mode_enabled (boolean)

-- 家族メンバー
family_members
  - id (PK)
  - user_id (FK)
  - name (text)
  - favorite_dishes (text[])
  - excluded_ingredients (text[])

-- お気に入り
favorites
  - id (PK)
  - user_id (FK)
  - dish_name (text)

-- 週次献立
weekly_menus
  - id (PK)
  - user_id (FK)
  - week_start (date)
  - week_end (date)
  - menu_data (jsonb)

-- 調理履歴
cooking_history
  - id (PK)
  - user_id (FK)
  - dish_name (text)
  - cooked_date (date)
  - taste_rating (int)
  - cooking_time_rating (int)
  - repeat_desire (int)
  - overall_score (numeric)
  - rank (text)
  - notes (text)
  - UNIQUE (user_id, dish_name)

-- 買い物リスト
shopping_list_checks
  - id (PK)
  - user_id (FK)
  - item (text)
  - checked (boolean)

-- 在庫
inventory
  - id (PK)
  - user_id (FK)
  - item_name (text)
  - quantity (numeric)
  - unit (text)
  - category (text)
```

---

## データフロー

### 献立生成フロー

```
1. ユーザーが「生成」ボタンをクリック
   ↓
2. generateWeeklyMenu() 実行
   ↓
3. user_settings から好み・除外食材を取得
   ↓
4. family_mode_enabled ? family_members も取得
   ↓
5. cooking_history から過去の評価を取得
   ↓
6. メニュー生成ロジック実行
   - 高評価の料理を優先
   - 除外食材を含む料理を除外
   - バラエティを確保
   ↓
7. weekly_menus に保存
   ↓
8. UI を更新
```

### 評価保存フロー

```
1. カレンダーから料理をクリック
   ↓
2. RatingDialog を表示
   ↓
3. 評価項目を入力
   - おいしさ (1-5)
   - 調理時間 (1-5)
   - また作りたい (1-5)
   - メモ
   ↓
4. 総合スコア計算
   スコア = (おいしさ + 調理時間 + また作りたい) / 3
   ↓
5. ランク判定
   A: 4.5-5.0
   B: 3.5-4.4
   C: 2.5-3.4
   D: 0-2.4
   ↓
6. cooking_history に upsert
   - 既存: UPDATE (日付も更新)
   - 新規: INSERT
   ↓
7. UI を更新
```

### 買い物リスト生成フロー

```
1. 「買い物リストを生成」をクリック
   ↓
2. generateShoppingList() 実行
   ↓
3. weekly_menus から今週の献立を取得
   ↓
4. 各料理から必要な食材を抽出
   ↓
5. カテゴリ別に分類
   - 野菜
   - 肉類
   - 魚介類
   - 乳製品
   - 調味料
   - その他
   ↓
6. shopping_list_checks から既存のチェック状態を取得
   ↓
7. 状態を復元してリスト表示
```

---

## セキュリティ

### Row Level Security (RLS)

すべてのテーブルで RLS が有効：

```sql
-- 例: user_settings のポリシー
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### 認証

- JWT ベースの認証
- セッション自動更新
- ログアウト時のトークン削除

### データ検証

- TypeScript による型チェック
- Supabase の制約による検証
- フロントエンドでの入力検証

---

## パフォーマンス最適化

### データベース最適化

1. **インデックス**
   - user_id カラムにインデックス
   - 検索頻度の高いカラムにインデックス

2. **クエリ最適化**
   - 必要なカラムのみ SELECT
   - `maybeSingle()` の使用
   - 適切な WHERE 句

3. **データ型最適化**
   - JSONB による柔軟なデータ構造
   - 適切なデータ型選択

### フロントエンド最適化

1. **コード分割**
   - React.lazy (将来実装可能)
   - 動的インポート

2. **メモ化**
   - React.memo (必要に応じて)
   - useMemo / useCallback

3. **バンドル最適化**
   - Vite による自動最適化
   - Tree shaking
   - 圧縮

---

## 拡張性

### スケーラビリティ

- Supabase が自動スケーリング
- コンポーネントの独立性により拡張容易
- 新機能の追加が容易

### 保守性

- TypeScript による型安全性
- コンポーネントの単一責任原則
- 明確なディレクトリ構造
- ドキュメント完備

### テスタビリティ

- コンポーネントの疎結合
- ビジネスロジックの分離
- モック可能な設計

---

## 技術的判断の理由

### なぜ React?

- 豊富なエコシステム
- コンポーネントベースの再利用性
- 大規模なコミュニティ
- TypeScript との相性

### なぜ Supabase?

- フルマネージド BaaS
- RLS による強力なセキュリティ
- リアルタイム機能（将来拡張可能）
- 開発スピードの向上
- PostgreSQL の信頼性

### なぜ Vite?

- 高速な開発サーバー
- 最適化されたビルド
- モダンな開発体験
- ESM ネイティブ

### なぜ Tailwind CSS?

- ユーティリティファースト
- カスタマイズ性
- 一貫性のあるデザイン
- パージによる最小バンドルサイズ

---

## 今後の技術的課題

### 短期

- ユニットテストの導入
- エラーハンドリングの強化
- ローディング状態の改善

### 中期

- リアルタイム同期の実装
- PWA 対応
- オフライン対応

### 長期

- マイクロフロントエンド化
- GraphQL の検討
- AI 統合

---

**このアーキテクチャは、スケーラビリティ、保守性、セキュリティを重視して設計されています。**
