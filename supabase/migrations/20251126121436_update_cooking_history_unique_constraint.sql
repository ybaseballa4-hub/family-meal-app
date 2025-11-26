/*
  # Update cooking history unique constraint

  1. Changes
    - Remove old unique constraint (user_id, dish_name, cooked_date)
    - Add new unique constraint (user_id, dish_name) only
    - This allows only one history entry per user per dish regardless of date
    - When the same dish is cooked again, it will update the existing entry

  2. Security
    - No changes to RLS policies
*/

-- Remove old unique constraint
ALTER TABLE cooking_history
DROP CONSTRAINT IF EXISTS cooking_history_user_dish_date_unique;

-- Remove duplicates based on dish name only, keeping the most recent one
DELETE FROM cooking_history
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, dish_name
             ORDER BY cooked_date DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
           ) as rn
    FROM cooking_history
  ) t
  WHERE rn > 1
);

-- Add new unique constraint on user_id and dish_name only
ALTER TABLE cooking_history
ADD CONSTRAINT cooking_history_user_dish_unique
UNIQUE (user_id, dish_name);