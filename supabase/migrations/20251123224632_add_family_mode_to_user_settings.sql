/*
  # 家族モード設定の追加

  1. 変更内容
    - `user_settings`テーブルに`family_mode`カラムを追加
    - デフォルト値: 'normal'（通常モード）
    - 選択肢: 'normal'（通常）, 'diet'（ダイエット）, 'muscle'（筋トレ）

  2. 目的
    - 家族全体の栄養目標モードを設定可能にする
    - メニュー生成時にモードに応じた食事内容を提案

  3. セキュリティ
    - 既存のRLSポリシーが適用される
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'family_mode'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN family_mode text DEFAULT 'normal' CHECK (family_mode IN ('normal', 'diet', 'muscle'));
  END IF;
END $$;