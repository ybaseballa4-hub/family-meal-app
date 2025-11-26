/*
  # メニュー項目に日付フィールドを追加

  1. 変更点
    - `weekly_menus`テーブルの構造を変更
    - `menu_data`内の各メニュー項目に`date`フィールドを追加する想定
    - 実際には、個別の料理に日付を持たせるため、新しいテーブル`daily_menus`を作成
  
  2. 新しいテーブル
    - `daily_menus`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `menu_date` (date) - 料理の予定日
      - `dish` (text) - 料理名
      - `ingredients` (jsonb) - 材料リスト
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. セキュリティ
    - RLSを有効化
    - ユーザーは自分のメニューのみ操作可能
  
  4. インデックス
    - user_idとmenu_dateの複合インデックスを作成してクエリを高速化
*/

CREATE TABLE IF NOT EXISTS daily_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  menu_date date NOT NULL,
  dish text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, menu_date)
);

ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily menus"
  ON daily_menus FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily menus"
  ON daily_menus FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily menus"
  ON daily_menus FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily menus"
  ON daily_menus FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_menus_user_date 
  ON daily_menus(user_id, menu_date);
