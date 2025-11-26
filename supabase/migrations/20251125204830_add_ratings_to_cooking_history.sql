/*
  # 料理履歴に評価機能を追加

  1. 変更内容
    - `cooking_history`テーブルに以下のカラムを追加:
      - `taste_rating` (integer): おいしさ評価 (1-5)
      - `ease_rating` (integer): 作りやすさ評価 (1-5)
      - `overall_score` (numeric): 総合スコア (1.0-5.0)
      - `rank` (text): ランク評価 (A/B/C/D)
      - `notes` (text): メモ（任意）
  
  2. 計算ロジック
    - overall_score = (taste_rating × 0.6) + (ease_rating × 0.4)
    - A: 4.5-5.0 (大成功)
    - B: 3.5-4.4 (良い)
    - C: 2.5-3.4 (まあまあ)
    - D: 1.0-2.4 (改善が必要)
  
  3. セキュリティ
    - 既存のRLSポリシーが適用される
*/

-- 評価カラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'taste_rating'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN taste_rating integer CHECK (taste_rating >= 1 AND taste_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'ease_rating'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN ease_rating integer CHECK (ease_rating >= 1 AND ease_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN overall_score numeric(3,2) CHECK (overall_score >= 1.0 AND overall_score <= 5.0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'rank'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN rank text CHECK (rank IN ('A', 'B', 'C', 'D'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'notes'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN notes text;
  END IF;
END $$;