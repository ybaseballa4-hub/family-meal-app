# 魔法のキッチン

家族の献立計画を自動化し、買い物から調理まで一貫してサポートする献立管理アプリです。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

---

## 特徴

- **自動献立生成**: 好みや除外食材を考慮した1週間分の献立を自動生成
- **評価システム**: 料理を3つの観点から評価し、自動でランク付け
- **お気に入り管理**: 評価済み料理をランク別に整理
- **買い物リスト**: 献立から必要な食材を自動抽出
- **家族モード**: 家族メンバーそれぞれの好みを管理
- **カレンダー**: 月次カレンダーで献立を視覚的に管理
- **在庫管理**: 冷蔵庫の食材を管理

---

## スクリーンショット

（実際のスクリーンショットを追加してください）

---

## 技術スタック

### フロントエンド
- React 18.3
- TypeScript 5.5
- Vite 5.4
- Tailwind CSS 3.4
- Lucide React（アイコン）

### バックエンド
- Supabase（BaaS）
- PostgreSQL
- Row Level Security（RLS）

---

## クイックスタート

### 必要な環境

- Node.js 18.x 以上
- npm 9.x 以上
- Supabase アカウント

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd project

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env ファイルに Supabase の情報を記入

# 開発サーバーの起動
npm run dev
```

詳細なセットアップ手順は [SETUP.md](./SETUP.md) を参照してください。

---

## ドキュメント

- [ユーザーガイド](./USER_GUIDE.md) - アプリの使い方
- [機能一覧](./FEATURES.md) - 全機能の詳細
- [セットアップガイド](./SETUP.md) - 開発環境の構築方法
- [アーキテクチャ](./ARCHITECTURE.md) - 技術的な設計

---

## 主な機能

### 献立自動生成

```typescript
// 1週間分の献立を自動生成
// - ユーザーの好みを優先
// - 苦手な食材を除外
// - 家族全員の好みを考慮（家族モード時）
```

### 評価システム

3つの観点から料理を評価：

1. **おいしさ** - 味の満足度
2. **調理時間** - 実際にかかった時間の妥当性
3. **また作りたい** - リピート希望度

総合スコアに基づき、A〜Dランクを自動判定します。

### 買い物リスト

献立から必要な食材を自動抽出し、カテゴリ別に整理します。

- 野菜
- 肉類
- 魚介類
- 乳製品
- 調味料
- その他

チェック機能で買い物の進捗を管理できます。

---

## プロジェクト構造

```
project/
├── src/
│   ├── components/      # Reactコンポーネント
│   ├── contexts/        # React Context
│   ├── lib/            # ユーティリティ
│   ├── App.tsx         # メインアプリ
│   └── main.tsx        # エントリーポイント
├── supabase/
│   └── migrations/     # データベースマイグレーション
├── public/             # 静的ファイル
├── docs/              # ドキュメント
└── package.json
```

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番用ビルド
npm run build

# ビルドのプレビュー
npm run preview

# Lintチェック
npm run lint

# 型チェック
npm run typecheck
```

---

## データベース構造

### テーブル

- `user_settings` - ユーザー設定
- `family_members` - 家族メンバー
- `favorites` - お気に入り料理
- `weekly_menus` - 週次献立
- `cooking_history` - 調理履歴と評価
- `shopping_list_checks` - 買い物リストのチェック状態
- `inventory` - 在庫管理

詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

---

## セキュリティ

- Row Level Security（RLS）による行レベルアクセス制御
- JWT ベースの認証
- ユーザーごとのデータ分離
- Supabase のセキュリティベストプラクティスに準拠

---

## パフォーマンス

- Vite による高速ビルド
- コード分割とTree shaking
- 最適化されたデータベースクエリ
- インデックスによる高速検索

---

## ブラウザサポート

- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

---

## ライセンス

このプロジェクトは私的利用を目的としています。

---

## 貢献

このプロジェクトは現在、個人プロジェクトとして開発されています。

---

## サポート

問題が発生した場合は、以下を確認してください：

1. [ユーザーガイド](./USER_GUIDE.md)
2. [セットアップガイド](./SETUP.md)
3. GitHub Issues

---

## 今後の予定

### 短期
- [ ] レシピ詳細の表示
- [ ] 栄養情報の追加
- [ ] 写真アップロード機能

### 中期
- [ ] レシピのシェア機能
- [ ] コミュニティ機能
- [ ] 季節の食材提案

### 長期
- [ ] AI による献立最適化
- [ ] スマートデバイス連携
- [ ] 音声入力対応

---

## 更新履歴

### v1.0.0 (2025-11-26)
- 初回リリース
- 基本機能の実装
  - 献立自動生成
  - 評価システム
  - 買い物リスト
  - 家族モード
  - 在庫管理

---

## 謝辞

このプロジェクトは以下の技術を使用して構築されています：

- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide](https://lucide.dev/)

---

**魔法のキッチンで、毎日の献立をもっと楽しく、もっと簡単に！**
