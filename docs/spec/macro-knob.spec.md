# Macro Knob System Spec

> SSoT: このファイル
> 対応実装: `src/core/macroKnob.ts` / `src/core/midiManager.ts` / `engine.ts` / MacroKnobPanel UI
> 担当エージェント: Claude Code
> 状態: ✅ Day13実装済み・Day35壁打ちで大幅更新・Day37 CC Standard 統合・Day41 大幅更新・Day44 MIDI 受信設計修正・Day50 責務分離（MidiManager 新設）

---

## 1. Purpose（目的）

**GeoGraphy の全パラメーター受け渡しを MIDI 2.0 プロトコルに統一する中枢。**

32個のマクロノブで複数のパラメーターを同時に操作する。
MIDIコントローラーのノブ・フェーダーに物理対応し、1ノブで最大3パラメーターを制御できる。

### アーキテクチャ（Day50 確定）

```
【UI層】（全部同列・engine 経由・MIDI 2.0 で統一）

GeometrySimpleWindow  CameraSimpleWindow  FxSimpleWindow  MacroKnobPanel
        ↓                     ↓                 ↓               ↓
        ↓←────── engine.handleMidiCC(MidiCCEvent) ──────────────↓
                              ↓
                  ┌───────────────────────┐
                  │  MidiManager          │  ← コア内部・新設（Day50）
                  │  src/core/midiManager │  ← CC入力の唯一の通路
                  └───────────────────────┘
                              ↓ CC番号でルーティング
                              ↓ MacroKnobManager のアサイン設定を参照（読み取りのみ）
                              ↓ rangeMap(value, min, max)
                        ParameterStore
                              ↓
                    ModulatablePlugin.params.value

【物理MIDIコントローラー】
App.tsx（Web MIDI API 受信）→ engine.handleMidiCC() ← SimpleWindow と同じ入り口

【Sequencer / LFO / AI（将来）】
→ engine.handleMidiCC() or engine.receiveMidiModulation() ← 同じ入り口
```

### 責務の分離（Day50 確定）

| クラス | ファイル | 責務 |
|---|---|---|
| `MacroKnobManager` | `src/core/macroKnob.ts` | 32ノブのUI設定管理（名前・MIDI CC番号・アサイン・現在値キャッシュ） |
| `MidiManager` | `src/core/midiManager.ts` | CC入力の唯一の通路（handleMidiCC / receiveModulation） |

- `MacroKnobPanel` は `engine` 経由でのみ `MacroKnobManager` にアクセスする
- `macroKnobManager` への直接参照は UI 層から禁止
- `MidiManager` は `MacroKnobManager` のアサイン設定を読み取り専用で参照する

### 内部バス統一ルール（Day41確立）

全ての入力源は `MidiCCEvent` フォーマットに統一して `engine.handleMidiCC()` に渡す。

```
内部バス固定フォーマット：
  MidiCCEvent {
    cc: number,               // CC Standard の番号（例: CC101）
    value: number,            // 0.0〜1.0（正規化済み）
    protocol: 'midi2',        // 内部バスは常に midi2 固定
    resolution: 4294967296    // 32bit 精度の宣言
  }
```

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: ノブ数は32個固定（8ノブ × 4行）・config.ts の `MACRO_KNOB_COUNT = 32` を参照
- MUST: 1ノブに最大3パラメーターまで割り当て可能
- MUST: value は renderer (App.tsx) の Web MIDI API 受信時に 0.0〜1.0 に正規化する（rawValue / 127）
- MUST: MacroKnobManager / MidiManager は Plugin 化しない・コア固定・コントリビューターが触れない
- MUST: MIDI 受信は renderer (App.tsx) の Web MIDI API で行う・IPC 経路は使わない
- MUST: Sequencer / LFO からの値は `engine.receiveMidiModulation(knobId, value)` 経由で受け取る
- MUST: CC Standard の CC 番号を MacroAssign.ccNumber に対応させること
- MUST: MacroKnobPanel のファイルパスは `src/ui/panels/macro-knob/MacroKnobPanel.tsx`
- MUST: MacroKnobPanel は `engine` 経由でのみ MacroKnob 情報にアクセスすること（直接参照禁止）
- MUST: アサイン情報は `GeoGraphyProject.macroKnobAssigns` に含めて永続化する
- MUST: 全 SimpleWindow のパラメーター変更は `engine.handleMidiCC()` 経由で行うこと
- MUST: Sequencer にも同じ D&D アサイン構造を採用する（将来・疎結合を保つ）

---

## 3. Interface（型・APIシグネチャ）

```typescript
// ── UI設定管理（macroKnob.ts）────────────────────────────

interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  addAssign(knobId: string, assign: MacroAssign): void
  removeAssign(knobId: string, paramId: string): void
  getValue(knobId: string): number          // 0.0〜1.0（表示用キャッシュ）
  setValue(knobId: string, value: number): void  // MidiManager から書かれる
}

// ── CC入力の唯一の通路（midiManager.ts・新設 Day50）────────

interface MidiManager {
  init(store: ParameterStore, knobManager: MacroKnobManager): void
  handleMidiCC(event: MidiCCEvent): void
  receiveModulation(knobId: string, value: number): void  // Sequencer / LFO 経由
}

// ── engine の公開 API（UI層が使う）─────────────────────────

// engine.handleMidiCC(event)           ← 全UIの唯一の入り口
// engine.getMacroKnobs()               ← MacroKnobPanel の表示用
// engine.setMacroKnob(id, config)      ← MacroKnobPanel の編集用
// engine.getMacroKnobValue(knobId)     ← MacroKnobPanel の値取得用
// engine.receiveMidiModulation(knobId, value)  ← Sequencer / LFO 用

// ── 共通型 ──────────────────────────────────────────────────

type CurveType = 'linear'  // v1は linear のみ / v2で exp・log・s-curve 追加

interface MacroAssign {
  paramId: string       // アサイン先のパラメーター ID
  ccNumber: number      // CC Standard の CC 番号（例: 101）
  min: number
  max: number
  curve: CurveType
}

interface MacroKnobConfig {
  id: string            // 'macro-1' 〜 'macro-32'
  name: string          // 表示名（例: 'CHAOS'）
  midiCC: number        // 0〜127（MIDI 1.0）/ -1=未割り当て
  assigns: MacroAssign[]
}

interface MidiCCEvent {
  cc: number
  value: number                   // 正規化済み: 0.0〜1.0
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
}
```

---

## 4. UI 仕様（Day41確立）

### 4-1. Simple Window パラメーター行のレイアウト

```
CC101  radius  [|━━━●━━━|━]  2.0  [≡]
↑      ↑       ↑         ↑   ↑    ↑
CC番号 paramId  可動域min  max 現在値 D&Dハンドル
```

スライダー操作時のフロー：
```
スライダー onChange
  → normalized = (value - param.min) / (param.max - param.min)
  → engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
  → MidiManager が ParameterStore に書く
  → 200ms ポーリングで plugin.params[key].value を読んで表示を追従
```

### 4-2. MacroKnobPanel ビジュアル

32ノブ（8×4）固定パネル。ノブクリックで名前・MIDI CC 編集ダイアログを開く。

### 4-3. D&D アサインフロー（将来実装）

```
① パラメーター [≡] → MacroKnob にドロップ
② min/max ダイアログ
③ [Assign] → MacroAssign 追加
④ アサイン解除は右クリックメニュー
```

---

## 5. 永続化（Day41確立）

アサイン情報は `.geography` プロジェクトファイルに含めて保存・復元する。

```json
{
  "version": "1.0.0",
  "macroKnobAssigns": [
    {
      "id": "macro-1",
      "name": "CHAOS",
      "midiCC": 20,
      "assigns": [
        { "paramId": "radius", "ccNumber": 101, "min": 0.5, "max": 8.0, "curve": "linear" }
      ]
    }
  ]
}
```

---

## 6. CC Map（Day41確立）

詳細: `docs/spec/cc-mapping.spec.md`

---

## 7. CC Standard クイックリファレンス

| CC番号 | Block | 抽象概念 | Geometry 例 | FX 例 |
|---|---|---|---|---|
| CC101 | EXISTENCE | Primary Amount | radius・size | strength・mix |
| CC110 | EXISTENCE | Auto Rotate | cameraPlugin autoRotate | — |
| CC201 | FORM | Density / Detail | segments・detail | grain size |
| CC300 | MOTION | Temporal Speed | speed | feedback rate |
| CC302 | MOTION | Deformation | amplitude・twist | distortion |
| CC400 | COLOR | Hue | hue | — |
| CC510〜512 | SPACE | LookAt X/Y/Z | camera lookAt | — |
| CC600 | EDGE | Edge Strength | — | edgeStrength |
| CC700 | BLEND | Blend Amount | — | dry/wet |

全内容: `docs/spec/cc-standard.spec.md`

---

## 8. Test Cases

```typescript
// TC-1: getKnobs() は32個を返す
// TC-2〜4: normalize の正規化
// TC-5: assigns が3つを超えるとエラー
// TC-9: addAssign() → assigns に追加される
// TC-10: removeAssign() → assigns から削除される
// TC-11: addAssign() が MACRO_KNOB_MAX_ASSIGNS を超えるとエラー
```

---

## 9. References

- `docs/spec/cc-standard.spec.md` — CC Standard v0.2（Block 定義）
- `docs/spec/cc-mapping.spec.md` — Plugin × paramId × CC 番号の対応表
- `docs/spec/simple-window.spec.md` — Simple Window 全体方針
- `src/core/macroKnob.ts` — UI設定管理の実装
- `src/core/midiManager.ts` — CC入力通路の実装（Day50 新設）
- `src/core/engine.ts` — 公開 API（getMacroKnobs / handleMidiCC 等）
- `src/ui/panels/macro-knob/MacroKnobPanel.tsx` — UI
