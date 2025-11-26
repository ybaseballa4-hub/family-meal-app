/*
  # 家族構成テーブルの作成

  1. 新しいテーブル
    - `family_members`
      - `id` (uuid, 主キー)
      - `user_id` (uuid, ユーザーID)
      - `name` (text, 名前)
      - `birth_date` (date, 生年月日)
      - `gender` (text, 性別: 'male' または 'female')
      - `appetite_level` (integer, 食べる量: 1-5の範囲)
      - `created_at` (timestamptz, 作成日時)
      - `updated_at` (timestamptz, 更新日時)
  
  2. セキュリティ
    - RLSを有効化
    - 認証ユーザーが自分のデータのみアクセス可能
*/

CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  appetite_level integer NOT NULL CHECK (appetite_level >= 1 AND appetite_level <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family members"
  ON family_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own family members"
  ON family_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);