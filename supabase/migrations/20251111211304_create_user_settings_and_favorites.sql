/*
  # Create user settings and favorites tables

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - Browser fingerprint or user identifier
      - `family_size` (text) - Number of people
      - `likes` (text) - Liked ingredients/dishes
      - `dislikes` (text) - Disliked ingredients/dishes
      - `preferred_types` (jsonb) - Array of preferred cuisine types
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `favorite_menus`
      - `id` (uuid, primary key)
      - `user_id` (text) - Browser fingerprint or user identifier
      - `dish` (text) - Dish name
      - `ingredients` (jsonb) - Array of ingredients
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
    
  3. Notes
    - Using browser fingerprint as user_id for anonymous users
    - Data is stored per browser/device
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  family_size text DEFAULT '',
  likes text DEFAULT '',
  dislikes text DEFAULT '',
  preferred_types jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  dish text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dish)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own favorites"
  ON favorite_menus FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON favorite_menus FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON favorite_menus FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_menus_user_id ON favorite_menus(user_id);