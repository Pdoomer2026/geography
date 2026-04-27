# Inspector UI Spec

> SSoT: このファイル
> 対応実装: `src/ui/components/inspector/` / `src/application/orchestrator/layerManager.ts` / `src/application/schema/`
> フェーズ: Phase 18（Day81〜）
> ブランチ: `feature/inspector-ui`
> 状態: 🟡 設計確定・実装待ち

---

## 0. 背景・目的

### 問題（旧設計）

従来の GeoGraphy UI は機能単位でフローティング Window が分割されていた：
Macro / Camera / Geometry / FX / Mixer Window が乱立し、VJ 本番中の操作が煩雑だった。

### 解決（新設計）

**Inspector パネル**（画面右側固定・開閉式）に全操作を統合する。

- **Mixer タブ**（初期表示）: Preset 差し替え + Opacity + BlendMode
- **Layer タブ**: Plugin パラメーター操作（Macro / Camera / Geometry / FX）
- 閉じると Canvas が全画面表示になる

---

## 1. 設計原則

| 原則 | 内容 |
|---|---|
| Layer = 完全状態単位 | Macro + Camera + Geometry + FX で一つの意味を持つユニット |
| 状態遷移モデル | 「差し替え」ではなく「状態遷移」。常に動いている状態をリアルタイムで切り替える |
| ダブルバッファ | active + next で seamless な切り替えを実現。フレーム途切れを防ぐ |
| 部分差し替え禁止（UI ポリシー） | UI は Preset 単位の操作のみ見せる。エンジンは技術的に部分差し替え可能なままにする |
| UI は View に徹する | UI は状態を持たず、Store から取得して表示するのみ |
| 右利き優先 | Inspector は画面右側固定（右手でマウス操作しながら操作できる） |

---

## 2. Inspector パネル UI

### 2.1 全体レイアウト

```
┌────────────────────────────┬─────────────────┐
│                            │   Inspector      │
│                            │  ─────────────  │
│       Canvas               │ [Mixer] [Layer]  │
│    （Three.js 描画エリア）   │                 │
│                            │  （選択タブの     │
│                            │    コンテンツ）   │
│                            │                 │
│                            │    [閉じる ▶]   │
└────────────────────────────┴─────────────────┘

閉じた状態:
┌──────────────────────────────────────────┬──┐
│           Canvas 全画面                  │◀ │
└──────────────────────────────────────────┴──┘
```

### 2.2 Inspector の仕様

| 項目 | 内容 |
|---|---|
| 形態 | フローティングではなく**右側固定パネル** |
| 幅 | 約 280px |
| 開閉 | トグルボタンで開閉。閉じると Canvas が全画面になる |
| タブ | **Mixer**（初期表示）/ **Layer** |
| キーバインド | `I` キーで Inspector 開閉トグル |

---

## 3. Mixer タブ

### 3.1 レイアウト

```
        [ L1 ]      [ L2 ]      [ L3 ]
        ────────    ────────    ────────
Row 1   [Clip 1-1]  [Clip 2-1]  [Clip 3-1]  [▶]
Row 2   [Clip 1-2]  [Clip 2-2]  [Clip 3-2]  [▶]
Row 3   [Clip 1-3]  [Clip 2-3]  [Clip 3-3]  [▶]
Row 4   [Clip 1-4]  [Clip 2-4]  [Clip 3-4]  [▶]
Row 5   [Clip 1-5]  [Clip 2-5]  [Clip 3-5]  [▶]
        ────────    ────────    ────────
        [fader]     [fader]     [fader]
        [blend]     [blend]     [blend]
```

### 3.2 Clip セルの状態

| 状態 | 表示 |
|---|---|
| 空セル | `[ + ]` クリックで LayerPreset を割り当て |
| 未再生 | `[ Preset 名 ]` 通常表示 |
| 再生中 | `[ Preset 名 ]` 枠ハイライト + LED 点灯 |

### 3.3 Scene 行 [▶] の動作

| モード | 動作 |
|---|---|
| Default（即時） | 全 Layer を同時に `replaceLayerPreset` で切り替え |
| フェードモード | Opacity を自動フェードアウト → 差し替え → フェードイン |

- フェード/即時の切り替えは**トグルスイッチ**で選択
- フェード秒数は設定可能

### 3.4 APC40 mk2 との対応

```
APC40 Track 1〜3   →  L1 / L2 / L3 列
APC40 Clip（5行）  →  Row 1〜5（3×5 = 15 Clip セル）
APC40 Scene Launch →  [▶]（全 Layer 同時起動）
APC40 Track Fader  →  Opacity フェーダー
```

### 3.5 Fader / BlendMode

- 現行 `MixerSimpleWindow` の中身をそのまま流用
- Opacity フェーダー（0.0〜1.0）
- BlendMode ドロップダウン（normal / add / multiply / screen / overlay）

---

## 4. Layer タブ

### 4.1 レイアウト

```
  タブ: [ L1 | L2 | L3 ]
  ─────────────────────────────────────
  ▼ Macro                ← デフォルト open
      <MacroPanel />       ← Macro8MidiWindow の中身を流用
  ▶ Camera               ← デフォルト closed
      <CameraPanel />      ← CameraSimpleWindow の中身を流用
  ▶ Geometry             ← デフォルト closed
      <GeometryPanel />    ← GeometrySimpleWindow の中身を流用
  ▶ FX                   ← デフォルト closed
      <FxPanel />          ← FxSimpleWindow の中身を流用
```

### 4.2 Layer タブの状態管理

- タブ選択状態: `useState<'layer-1' | 'layer-2' | 'layer-3'>`
- タブ切り替えは UI のみの変更（engine には通知しない）
- 各 Panel は `layerId` を props で受け取る

### 4.3 アコーディオンの状態管理

- 開閉状態: `useState<{ macro: boolean, camera: boolean, geometry: boolean, fx: boolean }>`
- デフォルト: `{ macro: true, camera: false, geometry: false, fx: false }`
- Layer タブをまたいで開閉状態を保持する（L1 で Camera を開いたら L2 でも開いたまま）

---

## 5. データ型定義（実装済み）

### 5.1 LayerPreset（Zod スキーマ）

> SSoT: `src/application/schema/zod/layerPreset.schema.ts`

```typescript
// Plugin 構成の定義（何を使うか）
// params は含まない（replaceLayerPreset 時は現在のエンジン値を維持）
LayerPreset = {
  id, name,
  geometryPluginId, cameraPluginId, fxPluginIds,
  geometryParams?,  // 省略時はエンジン現在値を維持
  cameraParams?,    // 省略時はエンジン現在値を維持
  createdAt,
}
```

**将来の拡張ルート（Zod で確保済み）**:
```typescript
// AutoLauncher（小節単位の切り替え）
ClipV1 = LayerPresetSchema.extend({ duration: z.number() })

// Sequencer（パラメーター変化の記録）
ClipV2 = ClipV1.extend({ timeline: z.array(...) })
```

### 5.2 ScenePreset（Zod スキーマ）

> SSoT: `src/application/schema/zod/scenePreset.schema.ts`

```typescript
// 3レイヤー分の LayerPreset をまとめたシーン全体の定義
ScenePreset = {
  id, name,
  layerPresets: [LayerPreset, LayerPreset, LayerPreset],  // tuple で固定長保証
  createdAt,
}
```

### 5.3 保存先

| データ | 保存先 | キー |
|---|---|---|
| LayerPreset | localStorage | `geography:layer-presets-v2` |
| ScenePreset | localStorage | `geography:scene-presets-v2` |
| GeoGraphyProject | `.geography` ファイル | 別管理（Preset とは独立） |

旧 `geography:presets-v1` は廃棄（マイグレーションなし）。

### 5.4 Preset と Project の分離原則

```
Preset  = Plugin 構成のライブラリ（プロジェクトをまたいで再利用可能）
Project = ある瞬間の完全スナップショット（構成 + パラメーター値）

Preset ロード → Plugin 構成のみ変わる・params は維持
Project ロード → 構成 + params 両方変わる
```

### 5.5 LayerInstance / LayerRuntime（実行時専用・保存しない）

> SSoT: `src/application/schema/index.ts`

```typescript
LayerInstance = { id, presetId, layerId }   // 実行中の実体
LayerRuntime  = { layerId, active, next }    // ダブルバッファ
```

---

## 6. layerManager 拡張（実装済み・Phase 2）

> 対象ファイル: `src/application/orchestrator/layerManager.ts`

### 6.1 実装済み API

```typescript
// Preset を元に次の Instance を裏で準備し next にセット
replaceLayerPreset(layerId: string, preset: LayerPreset): void

// フレームループ内で next → active swap（update() 先頭）
// Geometry / Camera / FX を一括差し替え・params は維持
private _applyPresetToLayer(layerId: string, preset: LayerPreset): void
```

### 6.2 MUST ルール

- MUST: `replaceLayerPreset` は engine 経由でのみ呼ぶ（React から直接 layerManager を呼ばない）
- MUST: Three.js リソースの dispose 漏れを防ぐこと

---

## 7. Preferences Panel の変化

| タブ | 変化 |
|---|---|
| Setup | **廃止** → Inspector の Layer タブに統合 |
| Project | **維持**（Save / Load） |
| Presets（新設） | LayerPreset / ScenePreset の管理 UI |
| Plugins / Audio / MIDI / Output | 変化なし（Coming Soon） |

---

## 8. 実装フェーズ

| Phase | 内容 | 完了条件 |
|---|---|---|
| 1 ✅ | 型定義（LayerPreset / LayerInstance / LayerRuntime / Zod スキーマ） | tsc エラーゼロ |
| 2 ✅ | layerManager ダブルバッファ（replaceLayerPreset） | tsc + 129 tests グリーン |
| 3 | Inspector コンポーネント新設（Mixer タブ + Layer タブ） | ブラウザで動作確認 |
| 4 | 旧 Window 廃止・windowMode 簡素化 | tsc + 全テストグリーン |
| 5 | Preset Save/Load UI（Preferences の Presets タブ） | 保存・復元動作確認 |

---

## 9. windowMode 簡素化（Phase 4）

```typescript
// 旧: geometry / camera / fx / macro それぞれに多数のバリアント
// 新: Inspector の開閉だけ

export interface WindowMode {
  inspector: boolean   // Inspector パネル開閉
  monitor: boolean     // GeoMonitor
  midiMonitor: boolean // MIDI Monitor
}

export const DEFAULT_WINDOW_MODE: WindowMode = {
  inspector: true,
  monitor: false,
  midiMonitor: false,
}
```

---

## 10. 廃止するコンポーネント（Phase 4・アーカイブ先: `docs/archive/Day81/`）

| コンポーネント | 理由 |
|---|---|
| `Macro8Window.tsx` | Inspector Layer タブの MacroPanel に統合 |
| `Macro8MidiWindow.tsx` | Inspector Layer タブの MacroPanel に統合 |
| `GeometrySimpleWindow.tsx` 等 | Inspector Layer タブの GeometryPanel に流用後廃止 |
| `CameraSimpleWindow.tsx` 等 | Inspector Layer タブの CameraPanel に流用後廃止 |
| `FxSimpleWindow.tsx` 等 | Inspector Layer タブの FxPanel に流用後廃止 |
| `MixerSimpleWindow.tsx` | Inspector Mixer タブに統合（中身は流用） |

---

## 11. コンポーネント構成（Phase 3）

```
src/ui/components/inspector/
  Inspector.tsx                ← 開閉・タブ切り替え全体
  tabs/
    MixerTab.tsx               ← Clip グリッド + Fader + BlendMode
    LayerTab.tsx               ← L1/L2/L3 タブ + アコーディオン
  mixer/
    ClipGrid.tsx               ← 3×5 Clip セルグリッド
    ClipCell.tsx               ← 個別セル（空/未再生/再生中）
    SceneLaunchButton.tsx      ← [▶] ボタン
    FadeToggle.tsx             ← 即時/フェードトグルスイッチ
  layer/
    LayerAccordion.tsx         ← アコーディオン1セクション
    panels/
      MacroPanel.tsx           ← Macro8MidiWindow の中身を流用
      CameraPanel.tsx          ← CameraSimpleWindow の中身を流用
      GeometryPanel.tsx        ← GeometrySimpleWindow の中身を流用
      FxPanel.tsx              ← FxSimpleWindow の中身を流用
```

---

## 12. MUST ルール（実装者へ）

- MUST: このファイルを読んでから実装を開始すること
- MUST: Phase 3 の Panel は既存コンポーネントの中身をそのまま流用する（新規実装しない）
- MUST: `replaceLayerPreset` は engine 経由でのみ呼ぶ
- MUST: `any` による型解決は禁止
- MUST: tsc + test 両通過を各 Phase の完了条件とする

---

## 13. 参照ドキュメント

- `docs/spec/layer-system.spec.md` — Layer の基本構造
- `docs/spec/geometry-plugin.spec.md` — Geometry Plugin lifecycle
- `docs/spec/camera-system.spec.md` — Camera Plugin
- `docs/spec/fx-stack.spec.md` — FX スタック
- `docs/spec/macro-knob.spec.md` — Macro Knob
- `src/application/orchestrator/layerManager.ts` — 現行実装
- `src/ui/App.tsx` — 現行 Window 管理
