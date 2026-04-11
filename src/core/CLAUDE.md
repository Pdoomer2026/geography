# src/core - CLAUDE.md v6

## 役割

GeoGraphy のエンジンコア。レンダーループ・Plugin Registry・Parameter Store・Command パターン・LayerManager・Program/Preview バス・MacroKnobManager・TransportManager・TransportRegistry を管理する。

**engine.ts は App.tsx に依存してはいけない・単体で動作できること。**

---

## 完了条件（CDD 原則・必須）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

---

## ファイル構成

```
src/core/
├── engine.ts               ← レンダーループ・初期化（App.tsx に依存しない）
├── layerManager.ts         ← レイヤー管理（CSS 合成）
├── clock.ts                ← BPM クロック・beat 値
├── registry.ts             ← Plugin Registry（自動登録）
├── parameterStore.ts       ← パラメーター一元管理（Command 経由）
├── commandHistory.ts       ← Command パターン・アンドゥ履歴
├── macroKnob.ts            ← MacroKnobManager（32ノブUI設定管理）
├── transportManager.ts     ← TransportManager（プロトコル非依存・Day58 昇格）
├── transportRegistry.ts    ← TransportRegistry（コアシングルトン・Day58 新設）
├── midiManager.ts          ← 旧 MidiManager（後方互換用・将来削除予定）
├── ccMapService.ts         ← CC Map Service（engine.initialize 内でのみ使用）
├── programBus.ts           ← Program バス（フルサイズ Three.js Scene）
├── previewBus.ts           ← Preview バス（SceneState + 小キャンバス）
└── config.ts               ← 定数（MAX_LAYERS / MAX_UNDO_HISTORY など）
```

---

## エンジン固定部分（Plugin が触れない）

| 固定部分 | 役割 | アクセスルール |
|---|---|---|
| Parameter Store | 全パラメーターの一元管理 | MUST: Command 経由のみ |
| Plugin Registry | Plugin の登録・切り替え・list() | 自動登録（import.meta.glob）のみ |
| Command パターン | アンドゥ・リドゥ | commandHistory.ts 経由 |
| レンダリングループ | requestAnimationFrame・delta・beat の供給 | engine.ts 内部のみ |
| BPM クロック | BPM・beat 値の管理 | Tempo Driver 経由のみ |
| MacroKnobManager | 32ノブのUI設定管理（名前・CC番号・アサイン・現在値キャッシュ） | src/core/macroKnob.ts・直接改変禁止 |
| TransportManager | 全入力の唯一の通路（プロトコル非依存・旧 MidiManager） | src/core/transportManager.ts・直接改変禁止 |
| TransportRegistry | slot→paramId 対応表・コアシングルトン（Day58 新設） | src/core/transportRegistry.ts・直接改変禁止 |
| メニューバー | GeoGraphy / File / View の定義 | Electron main.js に集約 |

---

## コア層のアーキテクチャ（Day58 確定）

```
【外側の世界】
  MidiInputWrapper（src/drivers/input/）
    → MIDI → TransportEvent { slot, value, source: 'midi' }
    → engine.handleMidiCC(event)

【UI層】（全部同列・engine 経由・TransportEvent で統一）
GeometrySimpleWindow  CameraSimpleWindow  FxSimpleWindow  MacroKnobPanel
        ↓                     ↓                 ↓               ↓
        engine.handleMidiCC(TransportEvent)  ← 全UIの唯一の入り口
                              ↓
                    TransportManager（transportManager.ts）
                              ↓ MacroKnobManager のアサイン設定を参照（読み取りのみ）
                              ↓ rangeMap(value, min, max)
                        ParameterStore（slot番号をキーとして保持）
                              ↓
                    engine.flushParameterStore()
                              ↓ transportRegistry.getAll() で slot→param を解決
                              ↓
                    ModulatablePlugin.params.value

【UI層（鏡）】
  App.tsx
    → transportRegistry.onChanged() を購読
    → engine.onParamChanged() を購読
    → setMidiRegistry({ availableParameters: [...transportRegistry.getAll()] })
```

### MacroKnobManager（macroKnob.ts）
- 32ノブのUI設定管理（名前・MIDI CC番号・アサイン・現在値キャッシュ）
- `getKnobs()` / `setKnob()` / `addAssign()` / `removeAssign()` / `getValue()` / `setValue()`

### TransportManager（transportManager.ts・Day58 昇格）
- 旧 MidiManager。プロトコル非依存に昇格。
- `init(store, knobManager)` / `handle(event)` / `receiveModulation(knobId, value)`
- MacroKnobManager のアサイン設定を読み取り専用で参照する

### TransportRegistry（transportRegistry.ts・Day58 新設）
- slot → pluginId:paramId の対応表をコア層で保持
- `register()` / `clear()` / `resolve()` / `getAll()` / `onChanged()` / `syncValue()`
- App.tsx は `onChanged` で購読するだけ（鏡）

### engine の公開 API（UI層が使う）
```typescript
engine.handleMidiCC(event)                          // 全UIの唯一の入り口
engine.getMacroKnobs()                              // MacroKnobPanel 表示用
engine.setMacroKnob(id, config)                     // MacroKnobPanel 編集用
engine.getMacroKnobValue(knobId)                    // MacroKnobPanel 値取得用
engine.receiveMidiModulation(knobId, value)         // Sequencer / LFO 用（将来）
engine.registerPluginToTransportRegistry(layerId, pluginId)  // Plugin 切り替え時
engine.onParamChanged(cb)                           // UI 逆流購読
```

詳細仕様: `docs/spec/transport-architecture.spec.md` / `docs/spec/macro-knob.spec.md`

---

## Clock の2系統（MUST・混同禁止）

```typescript
engine.threeClock  // THREE.Clock → getDelta() でフレーム間の経過時間を取得
engine.clock       // Clock（独自）→ BPM・beat 値の管理・readonly で外部公開
```

- `threeClock` と `clock` は絶対に混同しない
- テンポ変更時は `startTime = performance.now()` でリセット（beat 急ジャンプ防止）

---

## Output view / Edit view（Day30確定・Phase 11）

```
Large screen（Electronメインウィンドウ）
Small screen（MixerSimpleWindow内）
  ↑ それぞれ Output view または Edit view をアサインして表示

Output view = 出力映像（観客に見せる映像）
Edit view   = 編集映像（次に出す映像を仕込む場所）
```

各レイヤーの canvas は1つだけ存在する。
Output/Edit それぞれへの Opacity をルーティングで制御する（CSS制御・GPU負荷変化なし）。

```typescript
interface LayerRouting {
  layerId: string
  outputOpacity: number   // 0.0〜1.0
  editOpacity: number     // 0.0〜1.0
}

type ScreenAssign = 'output' | 'edit'

interface ScreenAssignState {
  large: ScreenAssign   // デフォルト: 'output'
  small: ScreenAssign   // デフォルト: 'edit'
}
```

詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## Program / Preview バス（Phase 7 実装済み）

```
Program バス
  └── フルサイズ Three.js Scene（実際に出力・GPU 使用）

Preview バス
  ├── SceneState JSON（パラメーターのメモのみ・GPU 不使用）
  └── 小キャンバス（320×180・Mixer サムネイル確認用）

切り替え時
  → Preview の SceneState を Program のフルサイズ Scene に適用
  → 旧 Program Scene を dispose()
```

- IMPORTANT: Preview バスは Three.js Scene を持たない・SceneState のみ

詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## LayerManager

```typescript
// CSS mixBlendMode で合成（WebGL RenderTarget 不要）
export const layerManager = new LayerManager()
```

- `initialize(container)` は engine.initialize() 内で呼ぶ（DOM 存在後）
- `position: absolute` + `alpha: true` + `setClearColor(0x000000, 0)` で透明背景
- `pointerEvents: 'none'` でマウスイベントを吸収しない
- MAX_LAYERS = 3（config.ts から参照）

詳細仕様: `docs/spec/layer-system.spec.md`

---

## Command パターン（最重要）

```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}
```

**Parameter Store は必ず Command 経由で変更すること。直接代入は禁止。**

詳細仕様: `docs/spec/command-pattern.spec.md`

---

## config.ts の定数

```typescript
export const MAX_LAYERS = 3
export const MAX_UNDO_HISTORY = 50
export const DEFAULT_BPM = 128
export const LERP_FACTOR = 0.05
```
