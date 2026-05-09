# LCD メニューアプリ：メッセージ仕様書

## メッセージの流れ概図

```
メニュー画面 (index.html, main.js)
    ↓ (postMessage)
ポップアップラッパー (openPopupWindow 内の embedded script)
    ↓ (forwardToFrames)
メインページ iframe (config/pages/main01/index.html, main01.js)
```

---

## メッセージタイプ一覧

### 1. `stationUpdate` - 駅情報・設定更新
**方向**: メニュー → popup → iframe  
**タイミング**: 駅選択・種別選択時、ポップアップ開始時

**書式**:
```javascript
{
    type: 'stationUpdate',
    stationState: {
        origin: { /* 始発駅オブジェクト */ },
        terminal: { /* 終着駅オブジェクト */ },
        current: { /* 現在駅オブジェクト */ }
    },
    config: { /* 全 config JSON */ },
    selectedType: { /* 選択された列車種別オブジェクト */ }
}
```

**駅オブジェクト構造** (CSV から parse):
```javascript
{
    stanumber: "21",
    jp: "葛西臨海公園",
    en: "Kasai-Rinkai-Park",
    kana: "かさいりんかいこうえん",
    linecode: "JN"
}
```

**selectedType 構造** (config.types から取得):
```javascript
{
    id: "rapid",
    name: "快速",
    name_en: "Rapid",
    color: "#0066cc",
    background: "#ffffff"
}
```

**実装箇所**:
- **送信側** ([main.js](main.js#L330-L340)):
  ```javascript
  function sendStationDataToFrames() {
      popupWindow.postMessage({
          type: 'stationUpdate',
          stationState,
          config: configState,
          selectedType
      }, window.location.origin);
  }
  ```

- **wrapper 転送** (openPopupWindow 内 script):
  ```javascript
  window.addEventListener('message', function(event) {
      if (message.type === 'stationUpdate') {
          lastStationUpdate = message;
      }
      forwardToFrames(message);
  });
  ```

- **受信側** ([main01.js](config/pages/main01/main01.js#L236)):
  ```javascript
  if (message.type === 'stationUpdate') {
      updateStationInfo(message);
      lastStationMessage = message;
  }
  ```

---

### 2. `pauseUpdate` - 表示更新一時停止
**方向**: メニュー → popup → iframe  
**タイミング**: メニューの「更新停止」ボタン押下

**書式**:
```javascript
{
    type: 'pauseUpdate'
}
```

**実装箇所**:
- **送信側** ([main.js](main.js#L283-L290)):
  ```javascript
  function sendPauseCommand(paused) {
      const messageType = paused ? 'pauseUpdate' : 'resumeUpdate';
      popupWindow.postMessage({ type: messageType }, window.location.origin);
  }
  ```

- **wrapper 転送** (openPopupWindow 内 script):
  ```javascript
  if (!['stationUpdate', 'pauseUpdate', 'resumeUpdate'].includes(message.type)) return;
  if (message.type !== 'stationUpdate') {
      lastControlMessage = message;
  }
  forwardToFrames(message);
  ```

- **受信側** ([main01.js](config/pages/main01/main01.js#L238-L239)):
  ```javascript
  } else if (message.type === 'pauseUpdate') {
      setPauseState(true);
  ```

---

### 3. `resumeUpdate` - 表示更新再開
**方向**: メニュー → popup → iframe  
**タイミング**: メニューの「更新再開」ボタン押下 (pauseUpdate から toggle)

**書式**:
```javascript
{
    type: 'resumeUpdate'
}
```

**実装箇所**:
- **送信側** ([main.js](main.js#L283-L290)): pauseUpdate と同じ sendPauseCommand 内で条件分岐
- **受信側** ([main01.js](config/pages/main01/main01.js#L240-L241)):
  ```javascript
  } else if (message.type === 'resumeUpdate') {
      setPauseState(false);
  ```

---

### 4. `popupLoaded` - ポップアップ読み込み完了
**方向**: popup → メニュー  
**タイミング**: popup の DOMContentLoaded 実行時

**書式**:
```javascript
{
    type: 'popupLoaded'
}
```

**実装箇所**:
- **送信側** (openPopupWindow 内 script):
  ```javascript
  window.addEventListener('DOMContentLoaded', function() {
      if (window.opener) {
          window.opener.postMessage({ type: 'popupLoaded' }, window.location.origin);
      }
  });
  ```

- **受信側** ([main.js](main.js#L44-L51)):
  ```javascript
  window.addEventListener('message', (event) => {
      const message = event.data;
      if (!message || message.type !== 'popupLoaded') {
          return;
      }
      popupReady = true;
      sendStationDataToFrames();
  });
  ```

---

## メッセージ状態管理

| 状態名 | 変数 | 初期値 | 更新タイミング |
|--------|------|--------|-----------------|
| popup 準備状態 | `popupReady` | `false` | popupLoaded 受信で `true` |
| 一時停止状態 | `isPaused` | `false` | pauseUpdate/resumeUpdate で toggle |
| 駅状態 | `stationState` | `{ origin, terminal, current }` | 駅選択時に updateStationInfo で更新 |
| 最新 message キャッシュ | `lastStationMessage` | `null` | stationUpdate 受信で保存 |

---

## メッセージフロー：ユースケース別

### ケース 1: ポップアップ開始時
```
1. メニュー「開始」ボタン押下
2. openPopupWindow() で popup ウィンドウ作成・HTML 出力
3. popup DOMContentLoaded → popupLoaded メッセージ送信
4. メニュー側 popupReady = true に設定
5. sendStationDataToFrames() で stationUpdate を popup に送信
6. popup 内 iframe へ forwardToFrames で転送
7. main01.js updateStationInfo() で画面更新・interval 開始
```

### ケース 2: 駅選択変更
```
1. メニュー「現在駅」select change
2. handleStationSelectionChange() → stationState 更新
3. sendStationDataToFrames() で stationUpdate を送信
4. popup wrapper 経由で iframe へ転送
5. main01.js updateStationInfo() で表示更新
```

### ケース 3: 表示更新一時停止
```
1. メニュー「更新停止」ボタン押下
2. handlePauseButtonClick() → isPaused = true
3. sendPauseCommand(true) で pauseUpdate メッセージ送信
4. popup wrapper 経由で iframe へ転送
5. main01.js setPauseState(true) で interval 停止
```

### ケース 4: iframe 読み込み後の状態復元
```
1. iframe load 完了
2. popup wrapper の frame.load event で:
   - lastStationUpdate あれば送信
   - lastControlMessage あれば送信
3. 新しい iframe でも状態を復元
```

---

## 実装ポイント

### セキュリティ
- すべての `postMessage` で `event.origin !== window.location.origin` チェック
- 信頼できるオリジン内でのみ通信

### 信頼性
- wrapper が message タイプで分岐し、最新状態をキャッシュ
- iframe 再読み込み時に lastMessage を再送信

### パフォーマンス
- 駅選択変更時は `sendStationDataToFrames()` を呼ぶだけ
- interval 状態は pause/resume フラグで管理（メモリ効率）

---

## 今後の拡張ポイント

- **新 message タイプ追加時**: 
  1. wrapper の `['type1', 'type2', ...].includes(message.type)` に追加
  2. main01.js の `addEventListener('message')` に分岐処理追加
  3. 必要に応じて状態キャッシュ変数を追加

- **複数 iframe への対応**:
  - 現在は main01 のみだが、info_page が複数あれば wrapper の forwardToFrames が自動対応

- **popup 複数化**:
  - 現在は 1 popup のみ。複数化時は `popupWindow` の配列化が必要
