# Project File Spec

> SSoT: このファイル
> 担当エージェント: Claude Code
> 状態: ⬜ Day22 壁打ち完了・実装は今後

---

## 1. 概要

GeoGraphy のプロジェクトファイルは `.geography` 拡張子の JSON ファイル。
「どの Plugin を使うか」と「各 Plugin のパラメーター値」を丸ごと保存する。

---

## 2. 保存の種類

| 種類 | トリガー | 保存先 |
|---|---|---|
| **プロジェクト保存** | Save / Save As ボタン | ユーザーが指定したパス |
| **自動保存** | アプリ終了時・手動 Save 時 | `~/Documents/GeoGraphy/autosave.geography` |
| **プラグインプリセット** | 各プラグインウィンドウの Save ボタン | `~/Documents/GeoGraphy/presets/[plugin-id]/[name].json` |

---

## 3. プロジェクトファイルのデータ構造

```typescript
interface GeoGraphyProject {
  version: string                    // "1.0.0"
  savedAt: string                    // ISO 8601 日時
  name: string                       // プロジェクト名

  // Setup: 使う Plugin の選択状態
  setup: {
    geometry: string[]               // ['grid-wave', 'contour']
    fx: string[]                     // ['bloom', 'after-image', 'rgb-shift', 'color-grading']
  }

  // SceneState: 現在の描画状態（SceneState 型と同一）
  sceneState: SceneState

  // 各プラグインのパラメーターファイル参照（任意）
  presetRefs: {
    [pluginId: string]: string       // 'bloom': 'my-bloom.json'
  }
}
```

---

## 4. プラグインプリセットのデータ構造

```typescript
interface PluginPreset {
  version: string                    // "1.0.0"
  savedAt: string                    // ISO 8601 日時
  pluginId: string                   // 'bloom'
  name: string                       // 'My Bloom Setting'
  params: Record<string, number>     // { strength: 0.8, radius: 0.4 }
}
```

---

## 5. 保存・読み込みの優先順位

```
プロジェクト Load 時:
  1. setup を読んで Geometry・FX をインスタンス化
  2. sceneState を SceneState として programBus に load
  3. presetRefs があれば各プリセットファイルを読んでパラメーターを上書き
  4. presetRefs がなければ sceneState のパラメーターをそのまま使う
```

---

## 6. ファイル保存先の規則

```
~/Documents/GeoGraphy/
  autosave.geography          ← 自動保存
  projects/
    my-scene.geography        ← ユーザーが Save As で保存
  presets/
    bloom/
      my-bloom.json
      live-bloom.json
    grid-wave/
      my-wave.json
  plugins/                    ← 外部プラグイン（v2 以降）
```

---

## 7. Electron IPC との関係

ファイルの読み書きは Electron の `geoAPI` 経由で行う。
詳細: `docs/spec/electron.spec.md`

```typescript
// 保存
await window.geoAPI.saveFile(filePath, JSON.stringify(project))

// 読み込み
const raw = await window.geoAPI.loadFile(filePath)
const project: GeoGraphyProject = JSON.parse(raw)
```

---

## 8. v1 の制約

- Electron 化前（v1）は LocalStorage に自動保存のみ対応
- Save As / Load はファイルダウンロード / アップロード方式でもよい
- Electron 化後に fs 経由の正式実装に切り替える

---

## 9. References

- `docs/spec/electron.spec.md`
- `docs/spec/preferences-panel.spec.md`
- `src/types/index.ts`（SceneState 型）
