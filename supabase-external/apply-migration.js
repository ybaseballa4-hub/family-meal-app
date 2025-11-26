import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://wcqethqlkjzri.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2Y3FlaHlqaHByaWZvc3Ztb2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzMyMDQsImV4cCI6MjA3ODUwOTIwNH0.O6UKrUF3pJaLf4-tes99Z5x_wM805PyBlt4rAnpWvWU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  try {
    console.log('外部Supabaseに接続中...');
    console.log('URL:', SUPABASE_URL);

    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('\nマイグレーションを実行中...');

    // Supabase JS ClientのrpcでSQLを実行できないため、
    // REST APIを直接使用します
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.log('\n注意: Supabase JS Clientからは直接SQLを実行できません。');
      console.log('\n以下の方法でマイグレーションを適用してください:\n');
      console.log('1. Supabase Dashboardにログイン');
      console.log('   https://app.supabase.com\n');
      console.log('2. プロジェクトを選択\n');
      console.log('3. 左メニューから「SQL Editor」を選択\n');
      console.log('4. 以下のファイルの内容をコピー&ペースト:');
      console.log('   supabase-external/migrations/001_initial_schema.sql\n');
      console.log('5. 「Run」ボタンをクリック\n');
      return;
    }

    console.log('✓ マイグレーションが正常に適用されました！');

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    console.log('\n手動でマイグレーションを適用してください:');
    console.log('1. https://app.supabase.com にアクセス');
    console.log('2. SQL Editorで以下のファイルを実行:');
    console.log('   supabase-external/migrations/001_initial_schema.sql');
  }
}

applyMigration();
