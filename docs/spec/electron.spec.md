# Electron Spec

> SSoT: このファイル
> 担当エージェント: Claude Code
> 状態: ✅ Day24〜27 実装済み
> 更新: Day29（View メニュー追加・Day28壁打ち反映）

---

## 1. 採用理由

GeoGraphy は Electron アプリとして配布する。

| 比較 | Web ホスティング | Electron |
|---|---|---|
| サーバー | 必要 | **不要** |
| 配布方法 | URL | **.dmg / .exe をダウンロード** |
| ファイル操作 | ブラウザ制限あり | **Node.js fs で自由** |
| プラグイン追加 | 困難 | **外部フォルダをスキャン可能** |
| メニューバー | なし | **ネイティブメニューバー** |

---

## 2. 技術構成

既存の Vite + React + Three.js はそのまま使う。Electron は外側に被せるだけ。

```
geography/
  electron/
    main.js       ← メインプロセス（ウィンドウ生成・ファイルアクセス・メニュー）
    preload.js    ← レンダラーと main の橋渡し（IPC・contextBridge）
  src/            ← 既存 Vite + React コードそのまま
  dist/           ← pnpm build の出力先
```

セキュリティ設定（必須）：
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`

---

## 3. メニューバー設計（Day29 更新）

```
GeoGraphy  |  File  |  View
```

### GeoGraphy メニュー

| 項目 | ショートカット |
|---|---|
| About GeoGraphy | - |
| Preferences... | ⌘, |
| Services | - |
| Hide GeoGraphy | ⌘H |
| Quit GeoGraphy | ⌘Q |

### File メニュー

| 項目 | ショートカット |
|---|---|
| New | ⌘N |
| Open... | ⌘O |
| Open Recent > | - |
| Save | ⌘S |
| Save As... | ⌘⇧S |
| Close Window | ⌘W |

### View メニュー（Day29 新設）

| 項目 | ショートカット | IPC イベント |
|---|---|---|
| Mixer Simple Window | ⌘3 | `toggle-mixer-window` |
| FX Simple Window | ⌘2 | `toggle-fx-window` |
| Macro Knob Simple Window | ⌘1 | `toggle-macro-knob-window` |
| ─（セパレーター）| - | - |
| Hide All Windows | H | `hide-all-windows` |
| Show All Windows | S | `show-all-windows` |

---

## 4. main.js に集約すべき処理（MUST）

| 処理 | 理由 |
|---|---|
| メニューバーの定義（GeoGraphy / File / View） | Electron `Menu` API |
| ファイルの Save / Load / Save As... | Node.js fs 操作 |
| ネイティブダイアログ（open/save） | Electron `dialog` API |
| Recent ファイルの管理・永続化 | ファイルシステム管理 |
| 外部プロセス連携・ファイル書き出し | Node.js 領域 |

---

## 5. レンダラー（React）に残すべき処理

| 処理 | 理由 |
|---|---|
| engine への操作（restoreProject / buildProject） | Three.js と密結合 |
| UI 状態管理（Window の表示/非表示など） | React の責務 |
| Web MIDI API | ブラウザ API |
| autosave の送受信ロジック（useAutosave.ts） | engine と密結合 |

---

## 6. IPC 設計

### preload.js の geoAPI

```typescript
// 現状（Day25実装済み）
window.geoAPI.saveProject(data)
window.geoAPI.loadProject(path)
window.geoAPI.showSaveDialog()
window.geoAPI.showOpenDialog()
window.geoAPI.onMenuEvents(callback)   // メニューイベントを受け取る

// Day29追加：View メニューイベント
// onMenuEvents の callback で以下のイベント名を受け取る：
//   'toggle-mixer-window'
//   'toggle-fx-window'
//   'toggle-macro-knob-window'
//   'hide-all-windows'
//   'show-all-windows'
```

### geoAPI.d.ts の型定義

```typescript
interface GeoAPI {
  // ... 既存 ...
  onMenuEvents(callback: (event: MenuEvent) => void): () => void
}

type MenuEvent =
  | 'new-project'
  | 'open-project'
  | 'save-project'
  | 'save-as-project'
  | 'open-preferences'
  | 'toggle-mixer-window'      // Day29追加
  | 'toggle-fx-window'         // Day29追加
  | 'toggle-macro-knob-window' // Day29追加
  | 'hide-all-windows'         // Day29追加
  | 'show-all-windows'         // Day29追加
```

---

## 7. isDev 判定（MUST）

```javascript
// ✅ 正しい判定
const isDev = !app.isPackaged

// ❌ 使用禁止（Electron ビルドで信頼できない）
// const isDev = process.env.NODE_ENV !== 'production'
```

---

## 8. electron/ ディレクトリは CommonJS

`electron/package.json` に `{ "type": "commonjs" }` を置く。
ルートの `"type": "module"` と共存するための必須対応。

---

## 9. プラグインの外部化（段階的導入）

| バージョン | プラグインの扱い |
|---|---|
| v1 | `src/plugins/` 内の固定プラグインのみ |
| v2 | `~/Documents/GeoGraphy/plugins/` をスキャン・ユーザーが手動追加 |
| v3 | Preferences > Plugins タブ → プラグインストア（1クリックインストール） |

---

## 10. 将来実装時の注意（Output タブ）

Output タブで外部出力（録画・NDI・Syphon など）を実装する際は、
最初から main.js 経由（IPC）で設計すること。
レンダラーに Node.js 操作を直書きしない。

---

## 11. References

- 要件定義書 v1.9 §3「Electron アーキテクチャ」
- `electron/main.js`
- `electron/preload.js`
- `src/types/geoAPI.d.ts`
- `docs/spec/preferences-panel.spec.md`
- `docs/spec/project-file.spec.md`
- `docs/spec/simple-window.spec.md`
