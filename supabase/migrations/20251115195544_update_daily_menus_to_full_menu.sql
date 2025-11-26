/*
  # 献立構造の拡張

  ## 変更内容
  1. daily_menusテーブルのingredients構造を拡張
    - 既存: 材料リストのみ
    - 新規: 主食・主菜・副菜・汁物の完全な献立構造
  
  ## 新しいingredients構造
  ```json
  {
    "dishes": [
      {
        "category": "主食",
        "name": "ご飯",
        "ingredients": [{"name": "米", "qty": 150, "unit": "g"}]
      },
      {
        "category": "主菜",
        "name": "ハンバーグ",
        "ingredients": [...]
      },
      {
        "category": "副菜",
        "name": "サラダ",
        "ingredients": [...]
      },
      {
        "category": "汁物",
        "name": "味噌汁",
        "ingredients": [...]
      }
    ]
  }
  ```

  ## データ移行
  - 既存のdishとingredientsを主菜として保存
  - 主菜に応じて適切な主食・副菜・汁物を自動追加
*/

-- 既存データを新しい構造に変換する関数
CREATE OR REPLACE FUNCTION migrate_menu_structure()
RETURNS void AS $$
DECLARE
  menu_record RECORD;
  new_ingredients jsonb;
  main_dish_name text;
  is_rice_dish boolean;
  is_western_dish boolean;
BEGIN
  FOR menu_record IN SELECT id, dish, ingredients FROM daily_menus
  LOOP
    main_dish_name := menu_record.dish;
    
    -- 料理のタイプを判定
    is_rice_dish := main_dish_name IN ('オムライス', 'チャーハン', 'カレー', 'ドリア', '親子丼', '牛丼', '天丼');
    is_western_dish := main_dish_name IN ('ハンバーグ', 'グラタン', 'ステーキ', 'パスタ', 'ピザ', 'オムライス');
    
    -- 新しい構造を作成
    new_ingredients := jsonb_build_object(
      'dishes', jsonb_build_array(
        -- 主食
        CASE 
          WHEN is_rice_dish THEN NULL -- 米料理の場合は主食を別に追加しない
          WHEN is_western_dish THEN jsonb_build_object(
            'category', '主食',
            'name', 'パン',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', 'パン', 'qty', 1, 'unit', '個')
            )
          )
          ELSE jsonb_build_object(
            'category', '主食',
            'name', 'ご飯',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', '米', 'qty', 150, 'unit', 'g')
            )
          )
        END,
        -- 主菜（既存のdishとingredients）
        jsonb_build_object(
          'category', '主菜',
          'name', main_dish_name,
          'ingredients', menu_record.ingredients
        ),
        -- 副菜
        CASE 
          WHEN is_western_dish THEN jsonb_build_object(
            'category', '副菜',
            'name', 'グリーンサラダ',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', 'レタス', 'qty', 50, 'unit', 'g'),
              jsonb_build_object('name', 'トマト', 'qty', 1, 'unit', '個'),
              jsonb_build_object('name', 'きゅうり', 'qty', 1, 'unit', '本')
            )
          )
          ELSE jsonb_build_object(
            'category', '副菜',
            'name', 'ほうれん草のおひたし',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', 'ほうれん草', 'qty', 100, 'unit', 'g'),
              jsonb_build_object('name', 'かつお節', 'qty', 2, 'unit', 'g'),
              jsonb_build_object('name', '醤油', 'qty', 5, 'unit', 'ml')
            )
          )
        END,
        -- 汁物
        CASE 
          WHEN is_western_dish THEN jsonb_build_object(
            'category', '汁物',
            'name', 'コンソメスープ',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', 'コンソメ', 'qty', 1, 'unit', '個'),
              jsonb_build_object('name', '玉ねぎ', 'qty', 0.5, 'unit', '個'),
              jsonb_build_object('name', 'にんじん', 'qty', 0.5, 'unit', '本')
            )
          )
          ELSE jsonb_build_object(
            'category', '汁物',
            'name', '味噌汁',
            'ingredients', jsonb_build_array(
              jsonb_build_object('name', '味噌', 'qty', 15, 'unit', 'g'),
              jsonb_build_object('name', '豆腐', 'qty', 100, 'unit', 'g'),
              jsonb_build_object('name', 'わかめ', 'qty', 5, 'unit', 'g')
            )
          )
        END
      ) - NULL -- NULL要素を削除
    );
    
    -- データを更新
    UPDATE daily_menus 
    SET ingredients = new_ingredients 
    WHERE id = menu_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- マイグレーション実行
SELECT migrate_menu_structure();

-- 関数を削除（一度だけの実行）
DROP FUNCTION migrate_menu_structure();
