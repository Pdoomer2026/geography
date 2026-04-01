# Macro Knob System Spec

> SSoT: このファイル
> 対応実装: `src/core/macroKnob.ts` / `engine.ts` / MacroKnobPanel UI
> 担当エージェント: Claude Code
> 状態: ✅ Day13実装済み・Day35壁打ちで大幅更新・Day37 CC Standard 統合・MIDI 2.0 IPC 設計追加

---

## 1. Purpose（目的）

32個のマクロノブで複数のパラメーターを同時に操作する。
MIDIコントローラーのノブ・フェーダーに物理対応し、1ノブで最大3パラメーターを制御できる。

**MacroKnob は全 Plugin が依存する「値の集約点」。全入力源（MIDI / Sequencer / LFO）のルーター。コア固定・Plugin 化しない。**

```
【入力層】                        【MacroKnob層・コア固定】              【出力層】
MIDI 2.0 Controller
  → electron/main.js
  → IPC 'geo:midi-cc'        →  macroKnob.ts                       →  ParameterStore
MIDI 1.0 Controller                handleMidiCC(event)                      ↓
  → Web MIDI API（main.js内）→  handleMidiCC(event)               Plugin.params
  → IPC 'geo:midi-cc'
Sequencer Plugin               →  receiveModulation(knobId, 0〜1)
LFO（v2〜）                    →
OSC（v2〜）                    →
```

> MIDI 1.0・MIDI 2.0 どちらも `electron/main.js` で受信し、
> 統一フォーマット（`MidiCCEvent`・value は 0.0〜1.0 正規化済み）で IPC 送信する。
> `macroKnob.ts` は protocol を意識しない。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: ノブ数は32個固定（8ノブ × 4行）・config.tsの `MACRO_KNOB_COUNT = 32` を参照
- MUST: 1ノブに最大3パラメーターまで割り当て可能
- MUST: value は main.js 側で 0.0〜1.0 に正規化してから IPC 送信する
        （macroKnob.ts は 0.0〜1.0 を assign の min/max に rangeMap するだけ）
- MUST: パラメーター変更は必ず Command 経由（直接代入禁止）
- MUST: MacroKnob Panel は Plugin 化しない・コア固定・コントリビューターが触れない
- MUST: MIDIマッピングは `settings/mappings/midi/` に保存する
- MUST: MIDI 2.0 受信は `electron/main.js` 経由（IPC）・Web MIDI API（MIDI 1.0）と分離
- MUST: Sequencer Plugin からの値は macroKnobId 経由で受け取る（疎結合）
- MUST: CC Standard v0.1 の CC 番号を MacroAssign.defaultCC に対応させること
        （CC101=Primary Amount・CC300=Temporal Speed 等・詳細は cc-standard.spec.md §3 参照）
- MUST: MIDI 1.0・MIDI 2.0 どちらも IPC チャンネル `'geo:midi-cc'` で受け取る
        （main.js が protocol を判定して統一フォーマットで送信する）
- MUST: MacroKnobPanel のファイルパスは `src/ui/panels/macro-knob/MacroKnobPanel.tsx`（Phase 13 以降）

---

## 3. Interface（型・APIシグネチャ）

```typescript
type CurveType = 'linear'  // v1はlinearのみ / v2でexp・log・s-curve追加

interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: CurveType
  /**
   * CC Standard v0.1 のデフォルト CC 番号（ユーザーが上書き可能）
   * 詳細: docs/spec/cc-standard.spec.md §3
   */
  defaultCC?: number
}

interface MacroKnobConfig {
  id: string          // 'macro-1' 〜 'macro-32'
  name: string        // 表示名（例: 'CHAOS'）
  midiCC: number      // 0〜127（MIDI 1.0）/ 0〜32767（MIDI 2.0 AC）/ -1=未割り当て
  assigns: MacroAssign[]  // 最大3つ
}

/**
 * MIDI CC イベント（MIDI 1.0 / MIDI 2.0 共通フォーマット）
 * electron/main.js が変換して IPC 'geo:midi-cc' で送信する
 */
interface MidiCCEvent {
  cc: number           // CC番号: MIDI 1.0 = 0〜127 / MIDI 2.0 = 0〜32767
  value: number        // 正規化済み値: 0.0〜1.0（main.js 側で正規化する）
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296  // MIDI 1.0 = 7bit / MIDI 2.0 = 32bit
}

interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  /** MidiCCEventを受け取る・value は main.js 側で 0.0〜1.0 正規化済み */
  handleMidiCC(event: MidiCCEvent): void
  getValue(knobId: string): number  // 0.0〜1.0に正規化した現在値
  /** Sequencer Plugin から値を受け取る（0.0〜1.0） */
  receiveModulation(knobId: string, value: number): void
}
```

### CC Standard 参照

CC Standard v0.1 は `docs/spec/cc-standard.spec.md` に移管済み（Day36確立）。
MacroAssign.defaultCC には CC Standard の CC番号を使用すること。

よく使う対応（クイックリファレンス）：

| CC番号 | Block | 抽象概念 | Geometry 例 | FX 例 |
|---|---|---|---|---|
| CC101 | EXISTENCE | Primary Amount | radius・size | strength・mix |
| CC201 | FORM | Density / Detail | segments・detail | grain size |
| CC300 | MOTION | Temporal Speed | speed | feedback rate |
| CC302 | MOTION | Deformation | amplitude・twist | distortion |
| CC400 | COLOR | Hue | hue | — |
| CC600 | EDGE | Edge Strength | — | edgeStrength |
| CC700 | BLEND | Blend Amount | — | dry/wet |
| CC701 | BLEND | Feedback Amount | — | amount（Feedback）|

全内容・全 Plugin 横断マッピング表: `docs/spec/cc-standard.spec.md §5`

---

## 4. Behavior（振る舞いの定義）

### MIDI値の正規化

**正規化は `electron/main.js` 側で行い、`macroKnob.ts` には 0.0〜1.0 の値が渡る。**

```typescript
// main.js 内での正規化
const normalizeForIpc = (raw: number, resolution: number): number => raw / (resolution - 1)
// MIDI 1.0: raw 0〜127  → 0.0〜1.0
// MIDI 2.0: raw 0〜4294967295 → 0.0〜1.0

// macroKnob.ts 内での range mapping（assign の min/max への変換）
const rangeMap = (v: number, min: number, max: number): number =>
  min + v * (max - min)
```

> 異記: 実装済みの `normalize(midi, min, max)` 関数は Phase 14 で `rangeMap` に統一する。
> 現在のテストはそのまま有効（値の定義は同じ、引数の意味だけが変わる）。

### handleMidiCC の処理
1. `event.cc` が一致する KnobConfig を検索
2. `event.value`（0.0〜1.0 正規化済み）を受け取る
3. 各 `assign` に対して `rangeMap(event.value, assign.min, assign.max)` で対応値を算出
4. `paramId` の値を Command 経由で更新

### receiveModulation の処理（Sequencer 経由）
1. `knobId` に対応する KnobConfig を検索
2. value（0.0〜1.0）を各 assign の min/max に `rangeMap` で変換
3. 各 `paramId` の値を Command 経由で更新

### MIDI 2.0 IPC フロー（Phase 14 実装対象）

```
electron/main.js 側：
  1. MIDI 2.0 デバイスからのメッセージを受信
  2. CC番号・value を抽出
  3. value を 0.0〜1.0 に正規化（32bit → float）
  4. MidiCCEvent { cc, value, protocol: 'midi2', resolution: 4294967296 } を構築
  5. webContents.send('geo:midi-cc', event) で renderer に送信

electron/preload.js 側：
  geoAPI.onMidiCC = (callback) => ipcRenderer.on('geo:midi-cc', (_, event) => callback(event))

App.tsx 側：
  window.geoAPI.onMidiCC((event) => macroKnobManager.handleMidiCC(event))

macroKnob.ts 側：
  handleMidiCC(event) を呼ぶだけ（value は既に 0.0〜1.0）
```

### MIDI 1.0 / MIDI 2.0 共存ルール

- MIDI 1.0 も main.js → IPC 経由に統一（Web MIDI API は main.js 内で使う）
- `macroKnob.ts` は protocol を意識しない（どちらも同じ `handleMidiCC` を呼ぶ）
- 同一 CC 番号への同時受信: last-write-wins（後から来た値が勝つ）
- MIDI 1.0 CC 0〜127 と MIDI 2.0 AC 0〜32767 は空間が異なる → 衝突なし
- MIDI 1.0 互换ブリッジ（CC1→CC302 等）は MacroKnob が変換テーブルを持つ
  （cc-standard.spec.md §4 参照）

### MIDI Learn（Phase 14 実装対象）
1. UI 上のパラメーターを右クリック → Learn モード
2. MIDI コンのノブを動かす → CC番号を自動アサイン
3. 既存アサインがある場合は上書き確認

### デフォルト状態
- 全32ノブは名前なし・assigns空・midiCC未割り当て
- CC Standard の defaultCC は Phase 14 でデフォルトアサインする（CC101・CC300 等）

---

## 5. Test Cases（検証可能な条件）

```typescript
// TC-1: getKnobs() は32個を返す
expect(manager.getKnobs()).toHaveLength(32)

// TC-2: MIDI値の正規化が正しい
// CC=64（中間）→ min=0, max=2 → 約1.0
const val = normalize(64, 0, 2)
expect(val).toBeCloseTo(1.0, 1)

// TC-3: CC=0 → min値
expect(normalize(0, 0.5, 1.5)).toBe(0.5)

// TC-4: CC=127 → max値
expect(normalize(127, 0.5, 1.5)).toBe(1.5)

// TC-5: assigns が3つを超えるとエラー
expect(() => manager.setKnob('macro-1', { assigns: [{},{},{},{}] })).toThrow()

// TC-6: receiveModulation() → assigns の min/max に rangeMap される
// knob に assign { paramId: 'size', min: 0.5, max: 2.0 } がある状態で
// receiveModulation('macro-1', 0.5) → size = 0.5 + 0.5*(2.0-0.5) = 1.25
expect(store.get('size')).toBeCloseTo(1.25)

// TC-7: handleMidiCC(event) — event.value は 0.0〜1.0 の範囲で渡る（main.js 正規化済み）
// { cc: 20, value: 0.5, protocol: 'midi1', resolution: 128 }
// assign { paramId: 'radius', min: 0.5, max: 2.0 } の場合
// radius = 0.5 + 0.5*(2.0-0.5) = 1.25
expect(store.get('radius')).toBeCloseTo(1.25)

// TC-8: MIDI 2.0 と MIDI 1.0 が同じ knob に届いた場合は後勝ち（last-write-wins）
// 先に midi1 event (value=0.2)、次に midi2 event (value=0.8) → 最終値は 0.8 系
expect(manager.getValue('macro-1')).toBeGreaterThan(0.5)
```

---

## 6. References

- 要件定義書 v2.0 §11「MacroKnob / MIDI システム」
- 実装計画書 v3.2 §6「Phase 14：MacroKnob Panel 完成」
- `src/core/config.ts` — MACRO_KNOB_COUNT 定数
- `docs/spec/cc-standard.spec.md` — CC Standard v0.1（Day36確立・SSoT）
- `docs/spec/sequencer.spec.md` — Sequencer → MacroKnob 接続（Day37〜新設予定）
- `src/ui/panels/macro-knob/CLAUDE.md` — MacroKnobPanel 実装ルール（Phase 13〜）
- `electron/main.js` — MIDI 2.0 受信・IPC 送信（Phase 14 実装対象）
- Claude Code担当範囲: `docs/spec/agent-roles.md`
