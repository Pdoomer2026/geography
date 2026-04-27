# Layer Window Spec

> SSoT: このファイル
> 対応実装: `src/ui/components/window/layer-window/` / `src/application/orchestrator/layerManager.ts` / `src/application/schema/index.ts`
> フェーズ: Phase 18（Day81〜）
> 状態: 🟡 設計確定・実装待ち

---

## 0. 背景・目的

### 問題（旧設計）

従来の GeoGraphy UI は機能単位でウインドウが分割されていた：

- Macro Window
- Camera Window
- Geometry Window
- FX Window
- Mixer Window

各 Window は独立しており、それぞれが内部に L1/L2/L3 タブを持つ構造だった。
この結果 Window が乱立し、VJ 本番中の操作が煩雑になっていた。
また、レイヤー単位での状態管理・差し替えが困難だった。

### 解決（新設計）

**Layer = 最小の完全状態単位** として再定義する。

- 1 つの Layer Window に Macro / Camera / Geometry / FX を統合
- L1/L2/L3 はタブで切り替え（Window は 1 枚）
- 各セクションはアコーディオンで開閉（デフォルト: Macro 開・他閉）
- 内部の各 Panel は既存コンポーネントの中身を流用（新規実装しない）

---

## 1. 設計原則

| 原則 | 内容 |
|---|---|
| Layer = 完全状態単位 | Macro + Camera + Geometry + FX で一つの意味を持つユニット |
| 状態遷移モデル | 「差し替え」ではなく「状態遷移」。常に動いている状態をリアルタイムで切り替える |
| ダブルバッファ | active + next で seamless な切り替えを実現。フレーム途切れを防ぐ |
| 部分差し替え禁止（UI ポリシー） | UI は Preset 単位の操作のみ見せる。エンジンは技術的に部分差し替え可能なままにする |
| UI は View に徹する | UI は状態を持たず、Store から取得して表示するのみ |

---

## 2. データ型定義（Phase 1）

> 追加先: `src/application/schema/index.ts`

### 2.1 LayerPreset

```typescript
/**
 * Layer の完全な定義。再現可能な構成の保存・共有単位。
 * Preset 単体では動かない（Instance を生成して初めて動く）。
 * spec: docs/spec/layer-window.spec.md §2.1
 */
export interface LayerPreset {
  id: string
  name: string
  /** Geometry Plugin の ID */
  geometryPluginId: string
  /** Camera Plugin の ID */
  cameraPluginId: string
  /** 有効化する FX Plugin の ID 一覧（順序は FX_STACK_ORDER に従う） */
  fxPluginIds: string[]
  /** Camera Plugin パラメーターの初期値（省略時は Plugin デフォルト値） */
  cameraParams?: Record<string, number>
  /** Geometry Plugin パラメーターの初期値（省略時は Plugin デフォルト値） */
  geometryParams?: Record<string, number>
  /** 作成日時（ISO 8601） */
  createdAt: string
}
```

### 2.2 LayerInstance

```typescript
/**
 * LayerPreset から生成される実行中の実体。
 * 実際の Three.js リソースは layerManager が管理する。
 * spec: docs/spec/layer-window.spec.md §2.2
 */
export interface LayerInstance {
  /** 一意な実行 ID（`instance-${Date.now()}` 等） */
  id: string
  /** 元になった Preset の ID */
  presetId: string
  /** アサインされているレイヤー ID（'layer-1' | 'layer-2' | 'layer-3'） */
  layerId: string
}
```

### 2.3 LayerRuntime

```typescript
/**
 * ダブルバッファ構造。active が現在描画中・next が切り替え待ち。
 * フレームループ内で next が存在するとき active と swap し、旧 active を dispose する。
 * spec: docs/spec/layer-window.spec.md §2.3
 */
export interface LayerRuntime {
  layerId: string
  active: LayerInstance
  /** 裏で準備中の次の Instance。null = 切り替え待ちなし */
  next: LayerInstance | null
}
```

---

## 3. layerManager 拡張（Phase 2）

> 対象ファイル: `src/application/orchestrator/layerManager.ts`

### 3.1 追加 API

```typescript
/**
 * Preset を元に新しい LayerInstance を裏で生成し、next にセットする。
 * フレームループ内で swap + dispose が自動実行される。
 * UI が直接 setPlugin / setCameraPlugin を呼ぶことは禁止（Phase 3 以降）。
 *
 * spec: docs/spec/layer-window.spec.md §3
 */
replaceLayerPreset(layerId: string, preset: LayerPreset): void
```

### 3.2 内部処理（replaceLayerPreset）

```
1. LayerPreset から必要な Plugin を解決する
   - getGeometryPlugin(preset.geometryPluginId)
   - getCameraPlugin(preset.cameraPluginId)
   - FX: preset.fxPluginIds の順で有効化

2. 新しい LayerInstance を生成する
   const next: LayerInstance = {
     id: `instance-${Date.now()}`,
     presetId: preset.id,
     layerId,
   }

3. runtime[layerId].next = next
   （フレームループに委ねる）
```

### 3.3 フレームループ内での swap（update() に追加）

```typescript
// update() の先頭に追加
for (const runtime of this.runtimes) {
  if (runtime.next) {
    // 旧 active の Three.js リソースを解放
    this._applyPresetToLayer(runtime.layerId, runtime.next)
    runtime.active = runtime.next
    runtime.next = null
  }
}
```

### 3.4 _applyPresetToLayer（内部ヘルパー）

```
以下を順番に実行する：
1. 既存の Geometry Plugin を destroy（layer.plugin?.destroy(scene)）
2. 新しい Geometry Plugin を create（plugin.create(scene)）
3. geometryParams を plugin.params に適用
4. Camera Plugin を setCameraPlugin 経由でセット
5. cameraParams を camera plugin に適用
6. FX を applyFxSetup 経由でセット
```

### 3.5 MUST ルール（Phase 2 以降）

- MUST: `replaceLayerPreset` は engine 経由でのみ呼ぶ（React から直接呼ばない）
- MUST: `setPlugin` / `setCameraPlugin` の直接呼び出しは Phase 4 以降は UI から禁止（engine 内部のみ使用可）
- MUST: Three.js リソースの dispose 漏れを防ぐため、必ず `_applyPresetToLayer` 経由で差し替える

---

## 4. Layer Window UI（Phase 3）

> 新設ファイル: `src/ui/components/window/layer-window/LayerWindow.tsx`

### 4.1 UI 構造

```
[ Layer Window ]         ← 画面に 1 枚・ドラッグ可能（useDraggable）
  タブ: [ L1 | L2 | L3 ]
  ─────────────────────────────────────
  ▼ Macro                ← デフォルト open
      <Macro8MidiPanel />  ← Macro8MidiWindow の中身を流用
  ▶ Camera               ← デフォルト closed
      <CameraPanel />      ← CameraSimpleWindow の中身を流用
  ▶ Geometry             ← デフォルト closed
      <GeometryPanel />    ← GeometrySimpleWindow の中身を流用
  ▶ FX                   ← デフォルト closed
      <FxPanel />          ← FxSimpleWindow の中身を流用
```

### 4.2 コンポーネント設計

```
layer-window/
  LayerWindow.tsx          ← タブ + アコーディオン全体
  LayerWindowAccordion.tsx ← アコーディオン 1 セクション（open/close + タイトル）
  panels/
    MacroPanel.tsx         ← Macro8MidiWindow の中身をそのまま移植
    CameraPanel.tsx        ← CameraSimpleWindow の中身をそのまま移植
    GeometryPanel.tsx      ← GeometrySimpleWindow の中身をそのまま移植
    FxPanel.tsx            ← FxSimpleWindow の中身をそのまま移植
```

### 4.3 Layer タブの状態管理

- タブの選択状態は `LayerWindow` 内の `useState` で管理（`'layer-1' | 'layer-2' | 'layer-3'`）
- タブ切り替えは UI のみの変更（engine には通知しない）
- 各 Panel は `layerId` を props で受け取り、その Layer の状態を参照する

### 4.4 アコーディオンの状態管理

- 開閉状態は `LayerWindow` 内の `useState` で管理
- デフォルト: `{ macro: true, camera: false, geometry: false, fx: false }`
- 状態は Layer タブをまたいで保持する（L1 で Camera を開いたら L2 でも開いたまま）

### 4.5 キーバインド

- 既存: `1` キー → Layer Window トグル（`windowMode.layerWindow`）
- 旧 `4`（Camera）・`5`（Geometry）キーは Phase 4 で削除

---

## 5. windowMode 簡素化（Phase 4）

> 対象ファイル: `src/application/schema/windowMode.ts` / `src/ui/App.tsx`

### 5.1 新しい windowMode

```typescript
// 旧: geometry / camera / fx / macro それぞれに 'simple' | 'standard' | 'none' 等
// 新: layerWindow に一本化

export interface WindowMode {
  layerWindow: boolean    // Layer Window（旧 Macro / Camera / Geometry / FX Window を統合）
  mixer: boolean          // Mixer Window（変更なし）
  monitor: boolean        // GeoMonitor（変更なし）
  midiMonitor: boolean    // MIDI Monitor（変更なし）
}

export const DEFAULT_WINDOW_MODE: WindowMode = {
  layerWindow: true,
  mixer: true,
  monitor: false,
  midiMonitor: false,
}

export const HIDE_ALL: WindowMode = {
  layerWindow: false,
  mixer: false,
  monitor: false,
  midiMonitor: false,
}
```

### 5.2 廃止するコンポーネント（アーカイブ先: `docs/archive/Day81/`）

| コンポーネント | 理由 |
|---|---|
| `Macro8Window.tsx` | LayerWindow の MacroPanel に統合 |
| `Macro8MidiWindow.tsx` | LayerWindow の MacroPanel に統合 |
| `GeometrySimpleWindow.tsx` | LayerWindow の GeometryPanel に流用後廃止 |
| `CameraSimpleWindow.tsx` | LayerWindow の CameraPanel に流用後廃止 |
| `FxSimpleWindow.tsx` | LayerWindow の FxPanel に流用後廃止 |
| `GeometryStandardWindow.tsx` 等 | 同上 |

### 5.3 残存するコンポーネント

| コンポーネント | 理由 |
|---|---|
| `MixerSimpleWindow.tsx` | Mixer は Layer Window とは別サーフェス |
| `GeoMonitorWindow.tsx` | デバッグ用・独立維持 |
| `MidiMonitorWindow.tsx` | デバッグ用・独立維持 |

---

## 6. 実装フェーズ

| Phase | 内容 | 担当 | 完了条件 |
|---|---|---|---|
| 1 | `LayerPreset` / `LayerInstance` / `LayerRuntime` 型を `schema/index.ts` に追加 | Claude Code | tsc エラーゼロ |
| 2 | `layerManager` に `replaceLayerPreset` + ダブルバッファ追加 | Claude Code | tsc エラーゼロ + 既存 129 テスト全グリーン |
| 3 | `LayerWindow.tsx` 新設（既存コンポーネント流用） | Claude Code | ブラウザで Layer Window が表示・タブ切り替え・アコーディオン動作確認 |
| 4 | 旧 Window 廃止・`windowMode` 簡素化 | Claude Code | tsc エラーゼロ + 全テストグリーン |

---

## 7. MUST ルール（実装者へ）

- MUST: このファイルを読んでから実装を開始すること
- MUST: Phase 1 完了後に tsc を通してから Phase 2 に進むこと
- MUST: Phase 2 完了後に既存テストが全グリーンであることを確認すること
- MUST: Phase 3 の Panel は既存コンポーネントの中身をそのまま流用する（新規実装しない）
- MUST: `replaceLayerPreset` は `engine.ts` 経由でのみ呼ぶ（React から直接 `layerManager` を呼ばない）
- MUST: Three.js リソースの dispose 漏れを防ぐこと（geometry / material / texture）
- MUST: `any` による型解決は禁止

---

## 8. 参照ドキュメント

- `docs/spec/layer-system.spec.md` — Layer の基本構造（Phase 8 実装済み）
- `docs/spec/geometry-plugin.spec.md` — Geometry Plugin lifecycle
- `docs/spec/camera-system.spec.md` — Camera Plugin
- `docs/spec/fx-stack.spec.md` — FX スタック
- `docs/spec/macro-knob.spec.md` — Macro Knob
- `src/application/orchestrator/layerManager.ts` — 現行実装
- `src/ui/App.tsx` — 現行 Window 管理
