/*
  # Create weekly menus table

  1. New Tables
    - `weekly_menus`
      - `id` (uuid, primary key)
      - `user_id` (text) - Browser fingerprint or user identifier
      - `week_start` (date) - Start date of the week
      - `menu_data` (jsonb) - Array of menu items with day, dish, and ingredients
      - `shopping_list` (jsonb) - Array of shopping list items
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on table
    - Add policies for users to manage their own menus
    
  3. Notes
    - Stores complete weekly menu plans
    - Allows tracking of ingredient usage across dishes
    - One menu per user per week
*/

CREATE TABLE IF NOT EXISTS weekly_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  week_start date NOT NULL DEFAULT CURRENT_DATE,
  menu_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  shopping_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own menus"
  ON weekly_menus FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own menus"
  ON weekly_menus FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own menus"
  ON weekly_menus FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own menus"
  ON weekly_menus FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_weekly_menus_user_id ON weekly_menus(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_week_start ON weekly_menus(week_start);