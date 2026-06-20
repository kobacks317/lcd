# 🚀 GitHub へのデプロイ手順

## 前提条件

- Git がインストールされている
- GitHub アカウントがある
- `https://github.com/kobacks317/lcd` リポジトリへのアクセス権がある

## デプロイ手順

### Step 1: リポジトリをクローン

```bash
cd /path/to/your/workspace
git clone https://github.com/kobacks317/lcd.git
cd lcd
```

### Step 2: 新規ファイルをコピー

**claude コード実装で作成されたファイル:**
```
control.html              # 新規 - LCD 制御パネル
viewer.html               # 新規 - LCD ビューア
train_definition.json     # 新規 - 列車・系統定義
routes.json               # 新規 - 路線・駅定義
transfer_definition.json  # 新規 - 乗換路線定義
design_definition.json    # 新規 - デザイン設定
numbering_style.json      # 新規 - ナンバリング定義
README_PHASE1.md          # 新規 - 実装ドキュメント
```

これらのファイルをリポジトリルートにコピーしてください：

```bash
# ファイルをコピー（ダウンロード元のパスに置き換え）
cp /path/to/generated/control.html .
cp /path/to/generated/viewer.html .
cp /path/to/generated/train_definition.json .
cp /path/to/generated/routes.json .
cp /path/to/generated/transfer_definition.json .
cp /path/to/generated/design_definition.json .
cp /path/to/generated/numbering_style.json .
cp /path/to/generated/README.md README_PHASE1.md
```

### Step 3: 古いファイルの確認（不要な場合は削除）

**以下は古いプロトタイプで、不要であれば削除可能:**
```bash
rm -f home.html home1.html home2.html home3.html
rm -f home04.html  # 既に新しい control.html に置き換わったため
rm -f index.html   # 既に新しい control.html に置き換わったため（必要に応じて）
rm -f main01.html map01.html  # LCD パターンの基礎として保持するか確認
```

**保持するファイル:**
- `main01.html` - LCD メイン表示パターンの参考
- `map01.html` - LCD インフォメーション表示パターンの参考
  （Phase 4 で複数パターン統合時に参考にする予定）

### Step 4: Git に追加・コミット

```bash
# 新規ファイルを追加
git add control.html viewer.html *.json README_PHASE1.md

# 古いファイルを削除（必要な場合）
git rm home.html home1.html home2.html home3.html home04.html index.html

# ステータス確認
git status

# コミット
git commit -m "feat: Phase 1 実装完了 - LCD制御パネル・ビューア・スキーマ整備

新機能:
- control.html: LCD 制御パネル（運行制御・マスターデータ編集）
- viewer.html: LCD ビューア（postMessage 連携対応）
- JSON スキーマ: 列車・路線・乗換・デザイン定義

特徴:
- 多言語統一フォーマット（ja, en, kana, zh, ko）
- 複数路線ファイル参照対応（routes.json）
- ユーザー定義可能な言語設定・デザイン設定
- postMessage による リアルタイムデータ同期

Phase 1 実装内容:
- ✅ データスキーマの完全設計
- ✅ control.html（コントロール機能完成）
- ✅ viewer.html（基本表示機能完成）
- ✅ JSON ファイル 5 つの整備
- ✅ postMessage 連携実装

BREAKING CHANGE:
- home04.html は control.html に置き換わりました
- 古い index.html は不要になりました（Phase 1 完了のため）"
```

### Step 5: リモートにプッシュ

```bash
# 最新の変更をフェッチ（他の人が編集している場合）
git pull origin main

# リモートにプッシュ
git push origin main
```

## GitHub Pages デプロイ

リポジトリが GitHub Pages を使用している場合：

```bash
# 既に main ブランチが GitHub Pages のソースの場合
# プッシュ後、自動的に https://kobacks317.github.io/lcd で公開されます

# または、docs フォルダをソースにしている場合
mkdir -p docs
cp control.html viewer.html *.json docs/
git add docs/
git commit -m "docs: Phase 1 を docs にも配置"
git push origin main
```

## トラブルシューティング

### "fatal: not a git repository"
```bash
# リポジトリディレクトリにいることを確認
pwd
# または
git init
git remote add origin https://github.com/kobacks317/lcd.git
git branch -M main
git pull origin main
```

### "Permission denied (publickey)"
SSH キーが設定されていない場合、HTTPS を使用：
```bash
git remote set-url origin https://github.com/kobacks317/lcd.git
```

### マージコンフリクト
```bash
# コンフリクト箇所を手動で修正
git add .
git commit -m "fix: コンフリクト解決"
git push origin main
```

## ファイル構成の確認

デプロイ後、リポジトリが以下の構成になっているか確認：

```
lcd/
├── control.html                 ✅ 新規
├── viewer.html                  ✅ 新規
├── train_definition.json        ✅ 新規
├── routes.json                  ✅ 新規
├── transfer_definition.json     ✅ 新規
├── design_definition.json       ✅ 新規
├── numbering_style.json         ✅ 新規
├── README_PHASE1.md             ✅ 新規
├── main01.html                  （保持）
├── map01.html                   （保持）
├── .gitignore                   （既存）
└── README.md                    （既存：更新推奨）
```

## README.md の更新

既存の `README.md` に以下を追記（Phase 1 完了の報告）：

```markdown
## 📊 実装状況

### Phase 1 ✅ 完了 (2024年)
- control.html: LCD 制御パネル実装
- viewer.html: LCD ビューア実装
- JSON スキーマ 5 つ完成
- postMessage 連携完成

### Phase 2 ⏳ 予定
- JSON 外部読み込み
- 複数パターン対応

詳細は [README_PHASE1.md](README_PHASE1.md) を参照
```

## 次のステップ

GitHub にプッシュ後：

1. **ローカルテスト**
   ```bash
   # ローカルサーバーで動作確認
   python3 -m http.server 8000
   # ブラウザで http://localhost:8000/control.html を開く
   ```

2. **GitHub Pages で確認**
   ```
   https://kobacks317.github.io/lcd/control.html
   ```

3. **Phase 2 の計画**
   - JSON ファイルの外部読み込み機能
   - 複数 LCD パターンの統合

---

**問題が発生した場合:**
- Git ログを確認: `git log --oneline -10`
- 変更を確認: `git diff`
- ブランチを確認: `git branch -a`
