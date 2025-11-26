/*
  # 料理履歴テーブルの作成

  1. 新しいテーブル
    - `cooking_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `dish_name` (text) - 料理名
      - `cooked_date` (date) - 調理日
      - `notes` (text, optional) - メモ
      - `rating` (integer, optional) - 評価 (1-5)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. セキュリティ
    - RLSを有効化
    - 認証済みユーザーは自分のデータのみアクセス可能
*/

CREATE TABLE IF NOT EXISTS cooking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dish_name text NOT NULL,
  cooked_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE cooking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cooking history"
  ON cooking_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cooking history"
  ON cooking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cooking history"
  ON cooking_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cooking history"
  ON cooking_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cooking_history_user_id ON cooking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_history_cooked_date ON cooking_history(cooked_date);
CREATE INDEX IF NOT EXISTS idx_cooking_history_user_date ON cooking_history(user_id, cooked_date);
