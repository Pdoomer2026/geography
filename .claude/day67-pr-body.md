## 概要

Day53〜Day67 の全作業をまとめた大型リファクタリングPR。
3ゾーンアーキテクチャへの移行・Transport Architecture確立・Standard Window実装・各種バグ修正を含む。

---

## アーキテクチャ変更（Day67）

### Before
```
src/plugins/   geometry / fx / cameras / windows / mixers / transitions / ...
src/drivers/   input / output / ...
src/types/     型定義
```

### After
```
src/engine/       Three.jsプラグイン（疎結合）
  geometry / fx / cameras / lights / particles

src/application/  意思決定・Registry・Transport
  command/geo-transitions/   GeoGraphy独自 Transition
  adapter/input/             MidiInputWrapper（旧 drivers）
  schema/                    型定義 SSoT（旧 types）

src/ui/           表示・操作
  components/window/         Window コンポーネント群
  components/mixers/         Mixer コンポーネント

src/core/         エンジンコア（将来 application/ に統合予定）
```

---

## 主な実装内容（Day53〜67）

### Transport Architecture（Day57〜58）
- `TransportEvent { slot, value }` による プロトコル非依存の内部バス確立
- `MidiInputWrapper` → `TransportManager` → `ParameterStore` → `Plugin.params` の一方向フロー
- `TransportRegistry` によるslot→param対応表管理

### Standard Window / D&D Window（Day63〜66）
- `RangeSlider`（lo/hi 稼働幅制限）実装
- Geometry / Camera / FX の Standard Window・Standard D&D Window
- MacroKnob D&D アサイン UI

### Preferences 全面刷新（Day63）
- PRESETS → WINDOWS → SETUP → Macro/Mixer → Monitor の構成
- `windowMode` 型による Window 表示状態の一元管理

### cc-mapping.md 5桁体系（Day60）
- 万の位=ライブラリ / 千の位=種別 / 百の位=セマンティック / 下2桁=連番
- 83 mappings 自動生成

### FxStack.applySetup() バグ修正（Day66）
- APPLY後にFX Enableが効かなくなる問題を解消
- 全FXを `create()` してpassを維持し `enabled` フラグのみで制御

### Save/Load 完全対応（Day60）
- `projectManager.ts` / `presetStore.ts` 新設
- `applySceneState()` で全パラメータ完全復元

---

## テスト
- 127 tests グリーン
- tsc エラーゼロ
