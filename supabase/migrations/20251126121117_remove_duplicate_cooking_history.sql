/*
  # Remove duplicate cooking history entries

  1. Changes
    - Remove duplicate cooking history entries keeping only the latest one per user/dish/date combination
    - Add unique constraint to prevent future duplicates

  2. Security
    - No changes to RLS policies
*/

-- Remove duplicates, keeping only the most recent entry for each user/dish/date combination
DELETE FROM cooking_history
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, dish_name, cooked_date
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) as rn
    FROM cooking_history
  ) t
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE cooking_history
ADD CONSTRAINT cooking_history_user_dish_date_unique
UNIQUE (user_id, dish_name, cooked_date);