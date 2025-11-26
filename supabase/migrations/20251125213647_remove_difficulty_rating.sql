/*
  # 難易度評価カラムの削除

  1. 変更内容
    - `cooking_history`テーブルから`difficulty_rating`カラムを削除
    - 評価は「おいしさ」「調理時間」「また作りたい」の3項目のみに簡素化
    
  2. 影響
    - 既存の難易度評価データは削除されます
    - overall_scoreの計算式も3項目ベースに変更（アプリ側で対応）
*/

-- 難易度評価カラムを削除
ALTER TABLE cooking_history DROP COLUMN IF EXISTS difficulty_rating;
