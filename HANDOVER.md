# GeoGraphy Day87 引き継ぎ｜2026-04-29

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/layer-macro-preset`（Day87 で新設）
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day87`（終業時に打つこと）

---

## 始業時に必読

```
docs/architecture/ui-event-flow.md
docs/spec/layer-macro-preset.spec.md
```

---

## Day87 で完了したこと

### 1. LayerMacroPreset 設計（spec 作成）

`docs/spec/layer-macro-preset.spec.md` を新規作成。
Global Macro（既存・横断制御用）と Layer Macro（新設・per-layer Preset 管理用）の共存設計を確定した。

### 2. Phase 1〜7 フル実装・ブラウザ確認済み

| Phase | 内容 |
|---|---|
| 1 | `LayerPresetSchema` に `macroKnobs?: MacroKnobConfigSchema[]` を optional 追加 |
| 1 | `macroKnob.schema.ts` 新規作成（MacroAssignSchema / MacroKnobConfigSchema の Zod SSoT） |
| 1 | `config.ts` に `LAYER_MACRO_KNOB_COUNT = 8` 追加 |
| 2 | `layerAssignRegistry.ts` 新規作成（per-layer 8ノブ管理・Global と完全独立） |
| 3 | `engine.ts` に Layer Macro API 追加（getLayerMacroKnobs / addLayerMacroAssign / receiveMidiLayerModulation / startLayerMacroMidiLearn 等） |
| 4 | `engine.dispatchToLearned` に Global/Layer Macro 分岐追加（ID形式 `layer-N:macro-M` で判別） |
| 5 | `geoStore.ts` に `macroKnobsByLayer` / `macroValuesByLayer` / `syncLayerMacroKnobs` / `removeLayerAssign` 追加 |
| 6+7 | `MacroPanel` に `layerId` prop 追加（undefined=Global / 指定=Layer）・`LayerTab` 再構成 |
| 統合 | `captureLayerPreset` / `replaceLayerPreset` に Layer Macro を統合（Global は含まない） |

### 3. UI レイアウト（ブラウザ確認済み）

```
Inspector LAYER タブ
  ▼ MACRO (Global)   ← L1/L2/L3 共通・全レイヤー横断アサイン可
  [L1] [L2] [L3]     ← タブ切替
  ▼ MACRO (Layer)    ← activeLayer に追従・Layer Macro 専用
  ▼ GEOMETRY
  ▼ CAMERA
  ▼ FX
```

### 4. Clip システムへの統合（ブラウザ確認済み）

```
Clip = Geometry + Camera + FX + Layer Macro アサイン（macroKnobs）
Global Macro = Clip に含まない・常にグローバル
Sequencer → replaceLayerPreset(layerId, clip) で全状態を一括切替
```

- `[ + ]` クリックで Layer Macro アサインを含む Clip を保存
- Clip クリックでロードすると Layer Macro アサインが復元されることをブラウザで確認

### 5. localStorage クリア

旧 Clip（macroKnobs なし版）を Claude Desktop から Chrome MCP 経由で削除：
- `geography:clip-grid-v1` ✅
- `geography:layer-presets-v2` ✅

---

## 現在の状態（重要）

- **テスト**: 129 passed（15 files）✅
- **tsc**: エラーゼロ ✅
- **ブランチ**: `feature/layer-macro-preset`
- **ブラウザ確認**:
  - MACRO (Global) / MACRO (Layer) が正しく表示 ✅
  - L1/L2/L3 タブ切替で MACRO (Layer) が切り替わる ✅
  - Layer Macro アサイン込みの Clip Save/Load 動作確認済み ✅

---

## 既知の技術負債（保留）

### MacroPanel の engine 直接読み問題

`MacroPanel` の `syncLiveVisual`（100ms polling）が engine を直接読んでいる。
Global Macro（既存）も同じ問題。`geoStore` 側に移すべき既存負債。

```
// 問題のある箇所（Global・Layer 両方）
engine.getMacroKnobs()         // → geoStore.syncMacroKnobs() 経由にすべき
engine.getLayerMacroKnobs()    // → geoStore.syncLayerMacroKnobs() 経由にすべき
engine.getParametersLive()     // → geoStore 側で計算・保持すべき
engine.getMidiLearnTarget()    // 同上
engine.getLearnedCC()          // 同上
```

別 Day で MacroPanel 全体をリファクタリングする。

---

## 次回やること（Day88）

1. **技術負債解消**: `MacroPanel` の `syncLiveVisual` を geoStore に移す（engine 直接読みをなくす）
2. **L1/L2/L3 タブ右クリック** → Save/Load コンテキストメニュー（`captureLayerPreset` / `replaceLayerPreset` は完成済み）
3. **Sequencer Plugin 設計**（`docs/spec/sequencer.spec.md` 作成）
4. **git commit / tag day87 / push** → Obsidian dev-log 記録（Day87 終業時に実施）

---

## アーキテクチャ概念（確定・重要）

### Global Macro vs Layer Macro

| 項目 | Global Macro | Layer Macro |
|---|---|---|
| ID 形式 | `macro-1` 〜 `macro-8` | `layer-1:macro-1` 等 |
| Registry | `assignRegistry`（既存） | `layerAssignRegistry`（新設） |
| Clip に含む | ❌ 含まない | ✅ 含む |
| APC40 推奨 | Track Knobs（CC48〜55） | Device Banks（CC16〜23, ch0/1/2） |
| 用途 | 複数レイヤーを横断して同時制御 | Preset 単位で保存・Sequencer で切替 |

### Sequencer との接続（将来）

```
Sequencer Bar 1 → engine.replaceLayerPreset('layer-1', PresetA)
  → Geometry + Camera + FX + Layer Macro アサインが一括で入れ替わる
  → APC40 Device Bank が即座にそのレイヤーのノブセットとして機能
```

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| LayerMacroPreset spec | `docs/spec/layer-macro-preset.spec.md` |
| UIイベントフロー設計図 | `docs/architecture/ui-event-flow.md` |
| layerAssignRegistry | `src/application/registry/layerAssignRegistry.ts` |
| macroKnob schema | `src/application/schema/zod/macroKnob.schema.ts` |
| layerPreset schema | `src/application/schema/zod/layerPreset.schema.ts` |
| engine | `src/application/orchestrator/engine.ts` |
| geoStore | `src/ui/store/geoStore.ts` |
| MacroPanel | `src/ui/components/inspector/layer/panels/MacroPanel.tsx` |
| LayerTab | `src/ui/components/inspector/tabs/LayerTab.tsx` |
| ClipGrid | `src/ui/components/inspector/mixer/ClipGrid.tsx` |
| ClipCell | `src/ui/components/inspector/mixer/ClipCell.tsx` |
| layerPresetStore | `src/application/adapter/storage/layerPresetStore.ts` |

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（HMR / hard reload 不可・必ず新規で立ち上げ）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル書き込み後に必須）
- git commit の日本語本文: `-m` で直接書いてよい（zsh の `!` 問題に注意）
- Chrome MCP: Claude Desktop から Chrome の localStorage を直接操作可能
- ブランチ: `feature/layer-macro-preset`（main へのマージは Sequencer 完成後）

---

## 次回スタートプロンプト

```
Day88開始
```
