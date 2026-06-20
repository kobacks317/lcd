# LCD Controller — postMessage データ仕様

`control.html` から LCD ビューア (`viewer.html`) へ送信される `postMessage` のデータ構造を定義します。

## 送信タイミング

- 運行制御パネルの各セレクトボックス・ボタン操作時
- ビューアウィンドウを開いた直後（約600ms後）
- `syncViewers()` 関数が呼ばれるすべての操作

---

## トップレベル構造

```json
{
  "operation": { ... },
  "masterData": { ... }
}
```

---

## `operation` オブジェクト

現在の運行状態を表します。

```json
{
  "currentState": "running",
  "currentSystemId": "sys001",
  "currentTrainTypeId": "rapid",
  "originStationIndex": 0,
  "currentStationIndex": 3,
  "destStationIndex": 8,
  "displayLanguages": ["ja", "en", "kana"],
  "displayInterval": 3,
  "lcdPosition": "right",
  "stationOverrides": {
    "sta_abc123": {
      "stop": true,
      "pass": false,
      "track": "pf_1234567890"
    }
  }
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `currentState` | `string` | 運行状態。`"running"` / `"arriving"` / `"stopping"` / `"departing"` |
| `currentSystemId` | `string` | 選択中の系統ID |
| `currentTrainTypeId` | `string` | 選択中の列車種別ID |
| `originStationIndex` | `number` | 始発駅のインデックス（系統内全駅の通し番号） |
| `currentStationIndex` | `number` | 現在駅のインデックス |
| `destStationIndex` | `number` | 終着駅のインデックス |
| `displayLanguages` | `string[]` | ビューアが循環表示する言語コードの配列。例: `["ja", "en", "kana", "zh", "ko"]` |
| `displayInterval` | `number` | 言語切替間隔（秒） |
| `lcdPosition` | `string` | LCD設置場所。`"right"` / `"left"` / `"front"` |
| `stationOverrides` | `object` | 臨時制御。キーは駅ID。値は下表参照 |

### `stationOverrides[staId]`

| フィールド | 型 | 説明 |
|---|---|---|
| `stop` | `boolean` | 臨時停車フラグ |
| `pass` | `boolean` | 通過フラグ |
| `track` | `string` | 指定番線のホームID（`platforms[].id` に対応） |

---

## `masterData` オブジェクト

路線・系統・デザインの定義データすべてを含みます。

```json
{
  "train": { ... },
  "routes": { ... },
  "transfer": { ... },
  "design": { ... },
  "numbering": { ... },
  "filenames": { ... }
}
```

---

### `masterData.train`

```json
{
  "systems": [ ... ],
  "types": [ ... ]
}
```

#### `train.systems[]`

```json
{
  "id": "sys001",
  "name": {
    "ja": "○○線",
    "en": "XX Line",
    "kana": "○○せん",
    "zh": "",
    "ko": ""
  },
  "routes": [
    {
      "lineId": "route/line1.json",
      "name": "○○線",
      "color": "#ff7e00",
      "textColor": "white"
    }
  ],
  "defaultTrainType": "rapid"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 系統ID |
| `name` | `MultiLang` | 系統名（多言語） |
| `routes[]` | `array` | 系統に含まれる路線の一覧 |
| `routes[].lineId` | `string` | 路線キー（`masterData.routes` のキーと一致） |
| `routes[].name` | `string` | 路線表示名 |
| `routes[].color` | `string` | 路線カラー（CSS色） |
| `routes[].textColor` | `string` | 路線テキスト色（CSS色または `"white"`） |
| `defaultTrainType` | `string\|null` | デフォルト列車種別ID |

#### `train.types[]`

```json
{
  "id": "rapid",
  "name": {
    "ja": "快速",
    "en": "Rapid",
    "kana": "かいそく",
    "zh": "快速",
    "ko": "쾌속"
  },
  "bg": "#e53935",
  "fg": "#ffffff",
  "stroke": "#ffffff"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 種別ID |
| `name` | `MultiLang` | 種別名（多言語） |
| `bg` | `string` | 背景色（CSS色） |
| `fg` | `string` | 文字色（CSS色） |
| `stroke` | `string` | ストローク色（通常 `fg` と同値） |

---

### `masterData.routes`

キーは路線ファイルパス（例: `"route/line1.json"`）。

```json
{
  "route/line1.json": {
    "stations": [ ... ]
  }
}
```

#### `routes[key].stations[]`

```json
{
  "id": "sta_1234567890",
  "name": {
    "ja": "中央駅",
    "en": "Central Station",
    "kana": "ちゅうおうえき",
    "zh": "中央站",
    "ko": "중앙역"
  },
  "number": "C05",
  "numberingStyle": "circle",
  "typeTimes": {
    "rapid": 3,
    "local": 5
  },
  "transfers": ["trf001", "trf002"],
  "platforms": [ ... ]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 駅ID（`sta_` + タイムスタンプ） |
| `name` | `MultiLang` | 駅名（多言語） |
| `number` | `string` | 駅番号（例: `"C05"`） |
| `numberingStyle` | `string` | ナンバリング形状。`"circle"` / `"square"` / `"diamond"` 等 |
| `typeTimes` | `object` | 種別IDをキーとした前駅からの所要時間（分）。`null` は時間未設定 |
| `transfers` | `string[]` | 乗換路線IDの配列（`transfer.lines[].id` に対応） |
| `platforms` | `array` | ホーム定義の配列 |

#### `stations[].platforms[]`

```json
{
  "id": "pf_1234567890",
  "name": "1番線",
  "platformCars": 12,
  "side": "left",
  "formations": [
    {
      "cars": 10,
      "frontCar": 2
    }
  ],
  "elements": [ ... ]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | ホームID |
| `name` | `string` | 番線名（例: `"1番線"`） |
| `platformCars` | `number` | ホームの収容可能両数 |
| `side` | `string` | ホームの位置。`"left"` / `"right"` / `"both"`（進行方向右が1号車） |
| `formations[]` | `array` | 編成停止位置の定義 |
| `formations[].cars` | `number` | 編成両数 |
| `formations[].frontCar` | `number` | 1号車が停まるホーム上の車両位置（1 = 最前/最右） |
| `elements[]` | `array` | ホーム上に配置された案内要素 |

**ホーム座標系：** ビジュアルエディタ上で右側が進行方向（1号車側）。  
`side: "left"` のとき、ホームはビジュアル上で編成の上側に表示されます。

#### `platforms[].elements[]`

要素の種別（`type`）により追加フィールドが異なります。

**共通フィールド：**

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 要素ID |
| `type` | `string` | 種別。下表参照 |
| `carPos` | `number` | 配置位置（車両番号単位。1 = 最前/最右、N = 最後/最左。0.5刻み可） |
| `row` | `number` | 縦方向の行（1〜4） |
| `side` | `string` | 配置面。`"right"` / `"left"` |

**`type` の値と追加フィールド：**

| `type` | 説明 | 追加フィールド |
|---|---|---|
| `escalator_up` | エスカレーター（上り） | — |
| `escalator_down` | エスカレーター（下り） | — |
| `elevator` | エレベーター | — |
| `stairs` | 階段 | — |
| `toilet` | トイレ | — |
| `ticket` | きっぷ売場 | — |
| `shop` | 売店 | — |
| `exit` | 出口サイン（テキスト） | `label`: 日本語テキスト（例: `"出口"`）、`en`: 英語テキスト（例: `"Exit"`） |
| `text` | テキストラベル | `ja1`, `ja2`: 日本語1〜2行目、`en1`, `en2`: 英語1〜2行目、`width`: 横幅（車両数単位） |

**アイコン要素の例：**
```json
{
  "id": "el_001",
  "type": "escalator_up",
  "carPos": 3,
  "row": 2,
  "side": "left"
}
```

**出口サインの例：**
```json
{
  "id": "el_002",
  "type": "exit",
  "carPos": 5.5,
  "row": 1,
  "side": "left",
  "label": "出口",
  "en": "Exit"
}
```

**テキストラベルの例：**
```json
{
  "id": "el_003",
  "type": "text",
  "carPos": 2,
  "row": 3,
  "side": "right",
  "ja1": "改札口",
  "ja2": "（東口）",
  "en1": "Ticket Gate",
  "en2": "(East Exit)",
  "width": 2
}
```

---

### `masterData.transfer`

```json
{
  "lines": [
    {
      "id": "trf001",
      "name": {
        "ja": "○○線",
        "en": "XX Line",
        "kana": "○○せん",
        "zh": "",
        "ko": ""
      },
      "icon": "",
      "color": "#0066cc"
    }
  ]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | `string` | 乗換路線ID |
| `name` | `MultiLang` | 路線名（多言語） |
| `icon` | `string` | アイコン文字・絵文字（任意） |
| `color` | `string` | 路線カラー（CSS色） |

---

### `masterData.design`

```json
{
  "mainPage": {
    "html": "<div>...</div>",
    "height": 400
  },
  "infoArea": {
    "states": {
      "running":   [ ... ],
      "arriving":  [ ... ],
      "stopping":  [ ... ],
      "departing": [ ... ]
    }
  }
}
```

#### `design.infoArea.states[state][]`

```json
{
  "html": "<div class=\"slide\">...</div>",
  "label": "通常案内",
  "duration": 5
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `html` | `string` | スライドのHTML |
| `label` | `string` | スライドの管理ラベル（ビューアには非表示） |
| `duration` | `number` | 表示時間（秒） |

`state` は `"running"` / `"arriving"` / `"stopping"` / `"departing"` の4種類。

---

### `masterData.numbering`

```json
{
  "style": "circle",
  "color": "#ffffff",
  "bgColor": "#ff7e00"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `style` | `string` | 駅番号の形状。`"circle"` / `"square"` / `"diamond"` 等 |
| `color` | `string` | 文字色（CSS色） |
| `bgColor` | `string` | 背景色（CSS色） |

---

### `masterData.filenames`

JSONファイルのエクスポート時に使用するファイル名マップ。ビューアは参照不要。

```json
{
  "train": "train_definition.json",
  "transfer": "transfer_definition.json",
  "design": "design_definition.json",
  "numbering": "numbering_style.json"
}
```

---

## 共通型定義

### `MultiLang`

```json
{
  "ja": "日本語テキスト",
  "en": "English text",
  "kana": "ひらがな",
  "zh": "中文",
  "ko": "한국어"
}
```

未設定の言語は空文字列 `""` になります。

---

## 受信コード例（viewer.html 側）

```javascript
window.addEventListener('message', (event) => {
  const { operation, masterData } = event.data;

  // 現在の系統を取得
  const system = masterData.train.systems
    .find(s => s.id === operation.currentSystemId);

  // 系統内の全駅を構築
  const stations = [];
  system.routes.forEach(route => {
    const rd = masterData.routes[route.lineId];
    if (rd?.stations) stations.push(...rd.stations);
  });

  // 現在駅
  const currentStation = stations[operation.currentStationIndex];

  // 指定番線のホーム情報
  const override = operation.stationOverrides[currentStation.id];
  const platform = currentStation.platforms?.find(p => p.id === override?.track)
    ?? currentStation.platforms?.[0];

  // 運行状態に応じたデザインスライドを取得
  const slides = masterData.design.infoArea.states[operation.currentState] ?? [];
});
```

---

*このドキュメントは `control.html` の `createSyncPacket()` 関数をもとに生成しました。*
