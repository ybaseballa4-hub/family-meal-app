/*
  # 買い物リストのチェック状態テーブルの作成

  1. 新しいテーブル
    - `shopping_list_checks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `week_identifier` (text) - 週の識別子（例: 2025-W46）
      - `item_name` (text) - 商品名
      - `is_checked` (boolean) - チェック状態
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - RLSを有効化
    - 認証済みユーザーは自分のデータのみアクセス可能

  3. インデックス
    - ユーザーIDと週識別子の複合インデックス
*/

CREATE TABLE IF NOT EXISTS shopping_list_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_identifier text NOT NULL,
  item_name text NOT NULL,
  is_checked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, week_identifier, item_name)
);

ALTER TABLE shopping_list_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping list checks"
  ON shopping_list_checks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping list checks"
  ON shopping_list_checks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping list checks"
  ON shopping_list_checks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping list checks"
  ON shopping_list_checks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_checks_user_week
  ON shopping_list_checks(user_id, week_identifier);
