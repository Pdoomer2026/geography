# GeoGraphy UI イベントフロー設計図（Day84 確定版）

作成日: 2026-04-28（Day84）

---

## 1. アーキテクチャ原則

```
Application 層（engine / layerManager / registry）
        ↕ 薄い鏡（Zustand / コールバック）
UI 層（React コンポーネント / Hooks）
```

- UI は engine を直接 polling しない
- 変化は必ずイベント経由で伝播する
- `setInterval` による構造データの polling は禁止
- polling が許容されるのは「毎フレーム変化するライブ視覚データ」のみ（コメント明記必須）

---

## 2. イベントパターン一覧

### Pattern A：Zustand（geoStore）— 構造データのミラー

mutation 後に呼び出し元が `sync○○()` を呼ぶことで更新される。  
UI は `useGeoStore()` を購読するだけで engine に触れない。

| geoStore の状態 | sync 関数 | 呼び出し元 | 購読コンポーネント |
|---|---|---|---|
| `macroKnobs` / `macroValues` | `syncMacroKnobs()` | MacroWindow / MacroPanel / Macro8Window | MacroWindow / MacroPanel / Macro8Window |
| `layers` / `routings` | `syncLayers()` | MixerTab | MixerTab |

**重要**: mutation 操作（`addMacroAssign` / `removeMacroAssign` / `setMacroKnob` / `setLayerRouting` / `setLayerBlendMode`）の直後に必ず `sync○○()` を呼ぶこと。

---

### Pattern B：engine 単一コールバック — 初期化・plugin 変化

`on○○Changed` は**最後に登録されたコールバックのみ保持**する。  
Inspector は LayerTab に対して各 Panel が 1 つしか存在しないため、この設計が成立する。

| コールバック | `initialize()` 完了 | plugin 切替 | preset 適用 | 固有操作 |
|---|---|---|---|---|
| `onFxChanged` | ✅ | — | ✅ | `setFxEnabled()` ON/OFF |
| `onGeometryChanged` | ✅ | `setLayerPlugin()` | ✅ | — |
| `onCameraChanged` | ✅ | `setCameraPlugin()` | ✅ | — |

**設計経緯**:  
`onFxChanged` は Day84 以前から存在し FxPanel が手本。  
Day84 で `onGeometryChanged` / `onCameraChanged` を engine.ts に新設し、GeometryPanel / CameraPanel を同じ構成に統一した。

---

### Pattern C：engine 複数コールバック（Set）— 汎用購読

複数コンポーネントが同時購読できる。cleanup 関数を return して登録解除する。

| コールバック | 発火タイミング | 主な購読コンポーネント |
|---|---|---|
| `onRegistryChanged` | `transportRegistry.register()` / `clear()` 時 | FxPanel / GeometryPanel / CameraPanel（補助） |
| `onParamChanged` | render loop で param 値が変化した時 | GeometryPanel（値のリアルタイム更新） |
| `onStyleChanged` | opacity / blendMode / mute 変化時 | （layerManager 内部） |

---

### Pattern D：意図的 100ms polling — ライブ視覚データのみ

毎フレーム変化するアニメーション値に限定。構造データには使わない。

| コンポーネント | polling 対象データ | 理由 |
|---|---|---|
| `MacroPanel` | `assignValuesList` / `learnTarget` / `learnedCCs` | ノブリングのリアルタイム描画・MIDI Learn 状態 |
| `Macro8Window` | `assignValuesList` | ノブリングのリアルタイム描画 |
| `useAllParams` hook | 全 param 値 | GeoMonitor 用、意図的設計（コメント記載済み） |

---

## 3. Clip プリセット適用フロー（Day84 新設）

Clip の差し替えは `layerManager._applyPresetToLayer()` が render loop 内で実行されるため、engine を直接呼べない。`onPresetApplied` コールバックで疎結合を維持する。

```
ClipGrid D&D / クリック
  ↓
engine.replaceLayerPreset(layerId, preset)
  ↓
layerManager.replaceLayerPreset()
pendingPresets に積む
  ↓ 次の render frame（layerManager.update() 内）
layerManager._applyPresetToLayer(layerId, preset)
  setPlugin() / setCameraPlugin() / fxStack.applySetup()
  ↓ 完了後
onPresetApplied(layerId) 発火
  ↓
engine が受け取り：
  registerPluginToTransportRegistry(layerId)
  registerCameraToTransportRegistry(layerId)
  fxChangedCallback?.()
  geometryChangedCallback?.()
  cameraChangedCallback?.()
  ↓
GeometryPanel / CameraPanel / FxPanel が layerId の新状態を取得して再描画
```

---

## 4. アプリ初期化フロー

```
App.tsx useEffect
  ↓
engine.initialize(container)
  ↓ async 完了後
initTransportRegistry()      ← 全 params を registry に登録
fxChangedCallback?.()        ← FxPanel 更新（L1 callback）
geometryChangedCallback?.()  ← GeometryPanel 更新（L1 callback）
cameraChangedCallback?.()    ← CameraPanel 更新（L1 callback）
layerManager.onPresetApplied 購読登録
```

**L2 / L3 の初期化**:  
タブ切り替え時に `layerId` prop が変化 → 各 Panel の初期同期 `useEffect` が再実行。  
engine 初期化済みのため `getParametersLive()` が正常に params を返す。

---

## 5. Panel 別イベント購読構成

### GeometryPanel / CameraPanel / FxPanel（共通構成）

```
useEffect([layerId]) → 初期同期（mount時 + tab切替時）
useEffect([layerId]) → onRegistryChanged 購読（registry 変化に追従）
useEffect([layerId]) → onGeometryChanged / onCameraChanged / onFxChanged 購読
useEffect([layerId]) → onParamChanged 購読（値のリアルタイム更新・Geometry/FXのみ）
```

### MacroPanel

```
useGeoStore.macroKnobs / macroValues  ← 構造データ（Zustand）
setInterval(100ms)                     ← assignValuesList / learnTarget（ライブ視覚データ）
```

---

## 6. 設計上の制約と注意点

1. **単一コールバックの前提**: `onGeometryChanged` / `onCameraChanged` / `onFxChanged` は Inspector に Panel が 1 つしか存在しない設計が前提。将来 Panel が複数になる場合は Set ベースへの変更が必要。

2. **render loop 内から setState 禁止**: `layerManager.update()` 内から React の state を直接変更しない。`onPresetApplied` などのコールバックを経由すること。

3. **syncMacroKnobs() の呼び忘れ注意**: MacroKnob の mutation を行う箇所（MacroWindow / MacroPanel / Macro8Window）は全て `syncMacroKnobs()` を呼ぶこと。

4. **FX の ON/OFF は `setFxEnabled()` 経由**: FX の enabled 状態変更は必ず `engine.setFxEnabled()` を通すこと（`fxChangedCallback` の発火が保証される）。

---

## 7. 変更履歴

| Day | 変更内容 |
|---|---|
| Day84 | `onGeometryChanged` / `onCameraChanged` を engine.ts に新設 |
| Day84 | `onPresetApplied` を layerManager に新設（Clip 差し替え後の同期） |
| Day84 | MacroPanel / Macro8Window / MixerTab を Zustand 薄い鏡に移行 |
| Day84 | CameraPanel / FxPanel の `setInterval` polling を排除 |
| Day84 | geoStore に `layers` / `routings` / `syncLayers()` を追加 |
