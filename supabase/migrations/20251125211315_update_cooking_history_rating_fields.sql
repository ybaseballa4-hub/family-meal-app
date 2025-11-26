/*
  # 料理履歴の評価項目を更新

  1. 変更内容
    - cooking_historyテーブルの評価カラムを更新
    - 旧カラム: taste_rating（おいしさ）、ease_rating（作りやすさ）
    - 新カラム:
      - taste_rating（おいしさ）- 既存を維持
      - difficulty_rating（難易度）- 新規追加
      - cooking_time_rating（調理時間）- 新規追加
      - repeat_desire（また作りたい度）- 新規追加
    
  2. 総合評価とランクの計算
    - overall_scoreとrankは新しい評価基準で再計算される
    
  3. 注意事項
    - ease_ratingは後方互換性のため残す（非推奨）
    - 既存データは保持される
*/

-- 新しい評価カラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'difficulty_rating'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN difficulty_rating INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'cooking_time_rating'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN cooking_time_rating INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cooking_history' AND column_name = 'repeat_desire'
  ) THEN
    ALTER TABLE cooking_history ADD COLUMN repeat_desire INTEGER;
  END IF;
END $$;

-- 既存のease_ratingカラムにコメントを追加（非推奨だが後方互換性のため残す）
COMMENT ON COLUMN cooking_history.ease_rating IS 'Deprecated: Use difficulty_rating instead';
