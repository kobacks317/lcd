# 🚆 Railway LCD Display Controller

鉄道車内液晶案内ディスプレイをWebアプリで完全再現するプロジェクトです。

## 📋 プロジェクト構成

### ファイル構成

```
├── control.html                 # LCD 制御パネル（コントローラー）
├── viewer.html                  # LCD ビューア（表示画面）
├── train_definition.json        # 列車・系統定義
├── routes.json                  # 路線・駅定義（複数路線対応）
├── transfer_definition.json     # 乗換路線定義
├── design_definition.json       # デザイン・表示設定
├── numbering_style.json         # ナンバリングスタイル定義
└── README.md                    # このファイル
```

## 🎯 機能

### ✅ Phase 1 実装済み

#### **control.html - LCD 制御パネル**
1. **運行制御**
   - 運行状態切り替え（走行中/到着中/停車中/発車中）
   - 系統・駅・列車種別の選択
   - ドア状態の制御

2. **全駅臨時制御**
   - 選択系統の全駅マトリクス表示
   - 駅ごとの臨時停車/通過設定
   - 指定番線設定

3. **マスターデータ編集**
   - 列車・系統定義（5言語対応）
   - 路線・駅定義（複数路線ファイル参照）
   - 乗換路線定義
   - デザイン設定（運行状態別スライドショー）
   - ナンバリングスタイル定義

4. **多言語管理**
   - デフォルト言語：日本語、英語、ひらがな
   - ユーザーが言語を追加/削除可能
   - 言語ごとの表示順序・周期設定

5. **postMessage 連携**
   - LCD ビューアへのリアルタイムデータ送信
   - JSON エクスポート/インポート

#### **viewer.html - LCD ビューア**
1. **メインエリア（上部）**
   - 種別、行き先、現在駅情報表示
   - 言語周期表示（デフォルト 3秒）
   - 駅ナンバリング表示

2. **インフォメーションエリア（下部）**
   - 運行状態別スライドショー表示
   - 各スライド表示時間設定対応

3. **デバッグパネル**
   - リアルタイム通信状況確認
   - パケット情報表示

### ⚙️ JSON スキーマ

#### **train_definition.json**
```json
{
  "systems": [{
    "id": "sys001",
    "name": { "ja": "...", "en": "...", "kana": "...", "zh": "...", "ko": "..." },
    "routes": [
      { "lineId": "route/line1.json", "name": "宇都宮線", "color": "#ff7e00" },
      { "lineId": "route/line2.json", "name": "高崎線", "color": "#ff7e00" }
    ]
  }],
  "types": [...]
}
```

#### **routes.json**
```json
{
  "route/line1.json": {
    "stations": [
      {
        "id": "sta001",
        "name": { "ja": "大宮", "en": "Omiya", ... },
        "number": "JU-07",
        "numberingStyle": "circle",
        "typeTimes": { "typ001": 0, "typ002": null },
        "transfers": ["trf001"],
        "homeGuides": [...]
      }
    ]
  },
  "route/line2.json": { ... }
}
```

#### **transfer_definition.json**
乗換路線情報（路線名、アイコン、色）

#### **design_definition.json**
```json
{
  "mainArea": {
    "languages": ["ja", "en", "kana"],
    "interval": 3,
    "rotationOrder": ["ja", "en", "kana"]
  },
  "infoArea": {
    "states": {
      "running": [
        { "type": "wide_route_map", "duration": 5 },
        { "type": "detailed_route_map", "duration": 5 }
      ],
      ...
    }
  }
}
```

#### **numbering_style.json**
ナンバリングのスタイル、色、背景色定義

## 🔄 通信プロトコル（postMessage）

### Sync Packet 構造
```javascript
{
  operation: {
    currentState: "running|arriving|stopping|departing",
    currentSystemId: "sys001",
    currentTrainTypeId: "typ001",
    currentStationIndex: 0,
    displayLanguages: ["ja", "en", "kana"],
    displayInterval: 3,
    doorOpen: false,
    stationOverrides: {
      "sta002": { "stop": true, "pass": false, "track": "1" }
    }
  },
  masterData: {
    train: { ... },
    routes: { ... },
    transfer: { ... },
    design: { ... },
    numbering: { ... }
  }
}
```

## 🚀 使用方法

### ローカルで実行

```bash
# HTTPサーバーで提供（JSONの読み込みに必要）
python3 -m http.server 8000

# または
npx http-server

# ブラウザで開く
http://localhost:8000/control.html
```

### 基本フロー

1. **control.html** でマスターデータを編集
2. 系統・種別・駅を選択
3. 「LCD ビューアを開く」ボタンでビューア起動
4. 運行状態やパラメータを変更すると、ビューアにリアルタイム反映

## 📝 次のPhase

### Phase 2：コントロールパネル拡張
- [ ] JSON ファイル外部読み込み（fetch対応）
- [ ] 複数ビューアパターン選択機能
- [ ] 自動ID採番の可視化
- [ ] UI の詳細改善

### Phase 3：LCD ビューア拡張
- [ ] メインエリアの言語周期表示（実装予定）
- [ ] インフォメーションエリアのパターン実装
  - [ ] 詳細路線図（駅情報表示）
  - [ ] 広域路線図（全駅表示）
  - [ ] 乗換案内（接続路線表示）
  - [ ] ホーム案内（編成図 + 設備）
  - [ ] ドア案内
- [ ] スクロール・アニメーション効果

### Phase 4：高度な機能
- [ ] リアルタイムデータベース連携
- [ ] 複数言語自動翻訳
- [ ] カスタムCSS/アニメーション対応
- [ ] 複数駅同時表示対応

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **データ形式**: JSON（スキーマベース）
- **通信**: postMessage API（ウィンドウ間通信）
- **ブラウザ互換**: Chrome, Firefox, Safari, Edge (最新版)

## 📊 データ構造設計の特徴

### 多言語統一形式
すべての「名前」フィールドは辞書型で統一：
```javascript
name: {
  ja: "日本語",
  en: "English",
  kana: "ひらがな",
  zh: "中文",
  ko: "한국어"
}
```

### 複数路線参照対応
系統が複数の路線ファイルを参照可能：
```javascript
routes: [
  { lineId: "route/line1.json", name: "宇都宮線" },
  { lineId: "route/line2.json", name: "高崎線" }
]
```

### ユーザー定義可能な設定
- 表示言語の追加/削除
- 言語別表示周期
- インフォメーション表示パターン
- ナンバリングデザイン

## 📚 参考資料

- 実装参考：東京メトロ丸ノ内線、JR 東日本各線の LCD 案内
- デザイン参考：鉄道各社の標準デザイン

## 📝 ライセンス

MIT License

## 👨‍💻 開発ノート

- **初版作成**: 2024年
- **最終更新**: Phase 1 完了時
- **作成者**: Claude × Gemini 検討後、Claude Code で実装

---

**次のステップ**: Phase 2 の JSON 外部読み込みと複数パターン対応を実装予定
