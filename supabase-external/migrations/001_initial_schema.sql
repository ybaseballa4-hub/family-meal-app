/*
  # 料理管理システムの初期スキーマ

  ## 概要
  このマイグレーションは、料理管理システムに必要な全テーブルを作成します。
  Supabase Authを使用してユーザー認証を行い、各ユーザーが自分のデータのみ
  アクセスできるようRLSポリシーを設定します。

  ## 新しいテーブル

  ### 1. user_settings (ユーザー設定)
  ユーザーの基本設定を保存します。
  - `id` (uuid, primary key) - レコードID
  - `user_id` (uuid, foreign key) - Supabase AuthのユーザーID
  - `family_size` (text) - 家族人数
  - `likes` (text) - 好きな食材・料理
  - `dislikes` (text) - 苦手な食材・料理
  - `preferred_types` (jsonb) - 多めにしたい料理の種類（配列）
  - `created_at` (timestamptz) - 作成日時
  - `updated_at` (timestamptz) - 更新日時

  ### 2. favorite_menus (お気に入りメニュー)
  ユーザーがお気に入り登録したメニューを保存します。
  - `id` (uuid, primary key) - レコードID
  - `user_id` (uuid, foreign key) - Supabase AuthのユーザーID
  - `dish` (text) - 料理名
  - `ingredients` (jsonb) - 材料リスト
  - `created_at` (timestamptz) - 作成日時

  ### 3. weekly_menus (週間メニュー)
  生成された週間メニューを保存します。
  - `id` (uuid, primary key) - レコードID
  - `user_id` (uuid, foreign key) - Supabase AuthのユーザーID
  - `menu_data` (jsonb) - メニューデータ（menu配列とshopping_list配列）
  - `created_at` (timestamptz) - 作成日時
  - `updated_at` (timestamptz) - 更新日時

  ### 4. inventory_items (在庫アイテム)
  ユーザーの食材在庫を管理します。
  - `id` (uuid, primary key) - レコードID
  - `user_id` (uuid, foreign key) - Supabase AuthのユーザーID
  - `name` (text) - 食材名
  - `qty` (numeric) - 数量
  - `unit` (text) - 単位
  - `created_at` (timestamptz) - 作成日時
  - `updated_at` (timestamptz) - 更新日時

  ## セキュリティ
  全テーブルでRow Level Security (RLS)を有効化し、以下のポリシーを適用：
  - 認証済みユーザーは自分のデータのみ読み取り可能
  - 認証済みユーザーは自分のデータのみ挿入可能
  - 認証済みユーザーは自分のデータのみ更新可能
  - 認証済みユーザーは自分のデータのみ削除可能

  ## 注意事項
  - 外部Supabaseインスタンス (https://wcqethqlkjzri.supabase.co) に適用してください
  - Supabase Authが有効になっている必要があります
  - このSQLは冪等性があり、複数回実行しても安全です
*/

-- =====================================================
-- 1. ユーザー設定テーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_size text DEFAULT '',
  likes text DEFAULT '',
  dislikes text DEFAULT '',
  preferred_types jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 2. お気に入りメニューテーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS favorite_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dish text NOT NULL,
  ingredients jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dish)
);

ALTER TABLE favorite_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorite menus"
  ON favorite_menus FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite menus"
  ON favorite_menus FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite menus"
  ON favorite_menus FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite menus"
  ON favorite_menus FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. 週間メニューテーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS weekly_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  menu_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly menus"
  ON weekly_menus FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly menus"
  ON weekly_menus FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly menus"
  ON weekly_menus FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly menus"
  ON weekly_menus FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. 在庫アイテムテーブル
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 同じユーザー、同じ名前、同じ単位の組み合わせは1つだけ
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_user_name_unit_idx
  ON inventory_items(user_id, name, unit);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- トリガー関数: 更新日時の自動更新
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_settingsテーブル用トリガー
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- weekly_menusテーブル用トリガー
DROP TRIGGER IF EXISTS update_weekly_menus_updated_at ON weekly_menus;
CREATE TRIGGER update_weekly_menus_updated_at
  BEFORE UPDATE ON weekly_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- inventory_itemsテーブル用トリガー
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- インデックス作成（パフォーマンス最適化）
-- =====================================================

CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS favorite_menus_user_id_idx ON favorite_menus(user_id);
CREATE INDEX IF NOT EXISTS weekly_menus_user_id_idx ON weekly_menus(user_id);
CREATE INDEX IF NOT EXISTS inventory_items_user_id_idx ON inventory_items(user_id);
