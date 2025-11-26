/*
  # 家族メンバーテーブルに好み情報を追加

  1. 変更内容
    - `family_members`テーブルに以下のカラムを追加:
      - `likes` (text, 好きな食材・料理)
      - `dislikes` (text, 苦手な食材・料理)
  
  2. 既存データ
    - 既存のレコードには空文字列がデフォルト値として設定されます
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'likes'
  ) THEN
    ALTER TABLE family_members ADD COLUMN likes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'dislikes'
  ) THEN
    ALTER TABLE family_members ADD COLUMN dislikes text DEFAULT '';
  END IF;
END $$;