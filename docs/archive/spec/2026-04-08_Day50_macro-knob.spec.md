# Macro Knob System Spec

> SSoT: このファイル
> 対応実装: `src/core/macroKnob.ts` / `engine.ts` / MacroKnobPanel UI
> 担当エージェント: Claude Code
> 状態: ✅ Day13実装済み・Day35壁打ちで大幅更新・Day37 CC Standard 統合・Day41 大幅更新（D&D アサイン・内部バス統一・永続化・CC Map・MIDI デバイス接続）・Day44 MIDI 受信設計を renderer 直接に修正

---

## 1. Purpose（目的）

**GeoGraphy の全パラメーター受け渡しを MIDI 2.0 プロトコルに統一する中枢。**

32個のマクロノブで複数のパラメーターを同時に操作する。
MIDIコントローラーのノブ・フェーダーに物理対応し、1ノブで最大3パラメーターを制御できる。

**MacroKnobManager は「MIDI 2.0 を内部バスとする値のルーター」。コア固定・Plugin 化しない。**

```
【入力層】                                【MacroKnob層・コア固定】        【出力層】
外部 MIDI Controller（1.0 / 2.0互換）
  → Web MIDI API                    →   MacroKnobManager            →  ParameterStore
  → renderer (App.tsx) で直接受信        handleMidiCC(event)               ↓
  → value を 0.0〜1.0 に正規化      →   handleMidiCC(event)          Plugin.params
Sequencer（v2）                     →   receiveModulation(knobId, v)
LFO / Modulator Driver（v2）        →   receiveModulation(knobId, v)
AI（v3）                            →   handleMidiCC(event)
```

> **外部受信 と 内部バス の分離（Day44確定）**
> - **外部コントローラー → GeoGraphy 入り口**: Web MIDI API 経由のため MIDI 1.0 プロトコルで受信。
>   rawValue（0〜127）を 0.0〜1.0 に正規化して MidiCCEvent に変換する。
> - **GeoGraphy 内部バス**: MidiCCEvent フォーマット（MIDI 2.0 準拠・0.0〜1.0 float）で統一。
>   Sequencer / LFO / AI からの入力も同じフォーマットで流れる。
> - **MIDI 2.0 ネイティブ受信**（CoreMIDI 等）は Electron から C++ addon なしでは呼び出せないため将来タスク。

### 内部バス統一ルール（Day41確立）

全ての入力源は `MidiCCEvent` フォーマットに統一して MacroKnobManager に渡す。

```
内部バス固定フォーマット：
  MidiCCEvent {
    cc: number,               // CC Standard の番号（例: CC101）
    value: number,            // 0.0〜1.0（正規化済み）
    protocol: 'midi2',        // 内部バスは常に midi2 固定
    resolution: 4294967296    // 32bit 精度の宣言（処理コストに影響しない）
  }
```

外部 MIDI Controller は renderer (App.tsx) の Web MIDI API で受信し、0.0〜1.0 に正規化して
`engine.handleMidiCC()` を直接呼ぶ。IPC 経由は不要。
Sequencer / LFO / AI は最初から 0.0〜1.0 なので `protocol: 'midi2'` 固定で流す。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: ノブ数は32個固定（8ノブ × 4行）・config.ts の `MACRO_KNOB_COUNT = 32` を参照
- MUST: 1ノブに最大3パラメーターまで割り当て可能
- MUST: value は renderer (App.tsx) の Web MIDI API 受信時に 0.0〜1.0 に正規化する（rawValue / 127）
- MUST: パラメーター変更は必ず Command 経由（直接代入禁止）
- MUST: MacroKnobManager は Plugin 化しない・コア固定・コントリビューターが触れない
- MUST: MIDI マッピングは `settings/mappings/midi/` に保存する
- MUST: MIDI 受信は renderer (App.tsx) の Web MIDI API で行う・IPC 経路は使わない
- NOTE: MIDI 2.0 ネイティブ受信は将来タスク（C++ addon が必要・現時点では MIDI 1.0 互換モードで動作）
- MUST: Sequencer / LFO からの値は `receiveModulation(knobId, value)` 経由で受け取る（疎結合）
- MUST: CC Standard の CC 番号を MacroAssign.ccNumber に対応させること
- MUST: MIDI 1.0・MIDI 2.0 どちらも renderer (App.tsx) の Web MIDI API で受信する（IPC 経路は使わない）
- MUST: MacroKnobPanel のファイルパスは `src/ui/panels/macro-knob/MacroKnobPanel.tsx`
- MUST: アサイン情報は `GeoGraphyProject.macroKnobAssigns` に含めて永続化する
- MUST: Sequencer にも同じ D&D アサイン構造を採用する（将来・疎結合を保つ）

---

## 3. Interface（型・APIシグネチャ）

```typescript
type CurveType = 'linear'  // v1は linear のみ / v2で exp・log・s-curve 追加

interface MacroAssign {
  paramId: string       // アサイン先のパラメーター ID
  ccNumber: number      // CC Standard の CC 番号（例: 101）
  min: number           // 初期値 = Simple Window スライダーの可動域 min
  max: number           // 初期値 = Simple Window スライダーの可動域 max
  curve: CurveType
}

interface MacroKnobConfig {
  id: string            // 'macro-1' 〜 'macro-32'
  name: string          // 表示名（例: 'CHAOS'）
  midiCC: number        // 0〜127（MIDI 1.0）/ 0〜32767（MIDI 2.0 AC）/ -1=未割り当て
  assigns: MacroAssign[] // 最大3つ
}

/**
 * MIDI CC イベント（MIDI 1.0 / MIDI 2.0 / 内部バス 共通フォーマット）
 * electron/main.js が変換して IPC 'geo:midi-cc' で送信する
 * 内部バス（Sequencer / LFO / AI）は protocol: 'midi2' 固定で生成する
 */
interface MidiCCEvent {
  cc: number                      // CC Standard 番号
  value: number                   // 正規化済み: 0.0〜1.0
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296   // MIDI 1.0 = 7bit / MIDI 2.0 = 32bit
}

/**
 * D&D ドラッグペイロード（パラメーター側・MacroKnob側 共通）
 * 将来 Sequencer レーンへの D&D にも同フォーマットを使う
 */
interface DragPayload {
  type: 'param' | 'macroKnob'   // 将来: | 'sequencerLane'
  id: string                     // paramId or knobId
  ccNumber: number               // CC Standard の番号
  min: number                    // スライダー可動域 min
  max: number                    // スライダー可動域 max
}

interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  addAssign(knobId: string, assign: MacroAssign): void    // D&D アサイン追加
  removeAssign(knobId: string, paramId: string): void     // アサイン解除
  handleMidiCC(event: MidiCCEvent): void
  getValue(knobId: string): number                        // 0.0〜1.0
  receiveModulation(knobId: string, value: number): void  // Sequencer / LFO 経由
}
```

### GeoGraphyProject への追加（永続化）

```typescript
interface GeoGraphyProject {
  version: string
  savedAt: string
  name: string
  setup: { geometry: string[]; fx: string[] }
  sceneState: SceneState
  macroKnobAssigns: MacroKnobConfig[]  // Day41 追加
  presetRefs: Record<string, string>
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

- **CC番号**: CC Standard の番号を左端に常時表示（ユーザーが MIDI 機器設定時に参照）
- **可動域**: スライダーレール上の `|` をドラッグして min/max を設定できる
- **現在値**: 数値表示のみ（v2 でクリック → 数値直接入力 box を追加予定）
- **`[≡]`**: D&D ハンドル（ドラッグ元になる）

### 4-2. MacroKnob ビジュアル

```
      ╭━━━╮
   ╭━━┫   ┣━━╮   ← 弧全体 = パラメーターの全可動域（270°）
 🟢██     ██🔵   ← アサイン1（緑）・アサイン2（青）の min〜max 範囲が弧上で点灯
   ┃  macro  ┃
   ╰━━━━━━━━━╯
```

- 弧上の光っている範囲 = MacroKnob にアサインされた min〜max
- アサインが複数 = 弧上に色分けで並ぶ（最大3色）
- 未アサイン = 弧全体が暗い

### 4-3. D&D アサインフロー（双方向）

```
① パラメーター [≡] → MacroKnob にドロップ
   または
   MacroKnob [≡] → パラメーター [≡] にドロップ

② min/max ダイアログが開く
   ┌────────────────────────────┐
   │ radius → macro-1           │
   │ min  [━━●━━━━━━]  0.5      │ ← 初期値 = スライダー可動域
   │ max  [━━━━━━●━━]  8.0      │
   │         [Cancel] [Assign]  │
   └────────────────────────────┘

③ [Assign] → アサイン追加（最大3つ）
   → 弧上に min〜max 範囲が点灯

④ アサイン解除
   パラメーター [≡] を右クリック：
   ● macro-1 (CC101)  min:0.5 max:8.0
   ● macro-3 (CC101)  min:0.2 max:4.0
   ──────────────────────────
   Remove assign: macro-1
   Remove assign: macro-3
   Remove all assigns
```

### 4-4. D&D ペイロードの拡張計画

```
Phase 1（現在）: param ↔ macroKnob
Phase 2（Sequencer 実装時）: param / macroKnob ↔ sequencerLane
  → DragPayload の type に 'sequencerLane' を追加するだけ
```

---

## 5. 永続化・Preset（Day41確立）

### 5-1. GeoGraphyProject への統合

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
        { "paramId": "radius", "ccNumber": 101, "min": 0.5, "max": 8.0, "curve": "linear" },
        { "paramId": "speed",  "ccNumber": 300, "min": 0.1, "max": 2.0, "curve": "linear" }
      ]
    }
  ]
}
```

### 5-2. Preset Save/Load（未実装・要追加）

- MacroKnob アサインのみを Preset として保存・読み込みできる仕組みが必要
- File メニュー または 専用 Preset Panel から操作
- 保存先: `settings/mappings/midi/[preset-name].json`

---

## 6. CC Map（Day41確立・自然言語対応の準備）

GeoGraphy 最大の特徴である自然言語対応のために、CC 番号とセマンティック情報の対応表を3層構造で管理する。

```
Layer 1: docs/spec/cc-standard.spec.md
  → 開発者・Claude Desktop が参照（既存・SSoT）

Layer 2: settings/cc-map.json
  → ランタイムで AI が参照できる機械可読フォーマット（未実装）
  → cc-standard.spec.md から生成・同期する

Layer 3: Preferences > CC Map タブ（UI）
  → ユーザーがアプリ内で確認できる（未実装）
  → cc-map.json を読んで表示するだけ
```

### settings/cc-map.json のスキーマ

```json
{
  "version": "0.2",
  "blocks": {
    "1xx": {
      "name": "EXISTENCE",
      "description": "存在・量・透明度",
      "ai_vocabulary": ["消えていく", "圧倒的な存在感", "浮かび上がる"],
      "entries": {
        "101": {
          "name": "Primary Amount",
          "type": "float",
          "range": [0.0, 1.0],
          "description": "主要な大きさ・強さの主軸",
          "plugin_mappings": {
            "icosphere": "radius",
            "bloom": "strength",
            "starfield": "size"
          }
        }
      }
    }
  }
}
```

### AI 参照フロー（v3 実装対象）

```
ユーザー「ネオン廃墟の夜にして」
  ↓
AI が settings/cc-map.json を読む
  ↓
Block 9xx → Block 1xx〜7xx の値を決定
  ↓
MidiCCEvent として MacroKnobManager に流す（内部バス経由）
  ↓
ParameterStore 更新 → 映像が変わる
```

---

## 7. MIDI デバイス接続（Day41確立・未実装）

Preferences > MIDI タブ（現在 Coming Soon）に実装する。

```
┌─────────────────────────────────────┐
│  MIDI                               │
│                                     │
│  MIDI IN                            │
│  デバイス: [ BCR2000          ▼ ]   │
│  チャンネル: [ All            ▼ ]   │
│                                     │
│  MIDI OUT                           │
│  デバイス: [ BCR2000          ▼ ]   │
│                                     │
│  [接続テスト]  [MIDI Learn]          │
└─────────────────────────────────────┘
```

- MIDI IN/OUT デバイス選択 → `electron/main.js` の Web MIDI API と連携
- MIDI Learn: UI 上のパラメーターを右クリック → Learn モード → 物理ノブを動かす → CC番号を自動アサイン

---

## 8. 欠けている実装（Day41時点）

| 優先度 | 内容 | 場所 |
|---|---|---|
| ★★★ | MIDI IPC 経路（main.js → App.tsx → engine） | `electron/main.js` / `App.tsx` |
| ★★★ | アサイン永続化（GeoGraphyProject 拡張） | `src/types/index.ts` / `src/core/engine.ts` |
| ★★★ | Preset Save/Load メニュー | `electron/main.js` / `settings/mappings/midi/` |
| ★★ | D&D アサイン UI | `src/ui/panels/macro-knob/` / 各 Simple Window |
| ★★ | MIDI デバイス接続 Panel | `electron/main.js` / Preferences > MIDI タブ |
| ★★ | `settings/cc-map.json` 新設 | `settings/` |
| ★★ | Simple Window の CC番号表示・可動域設定 | 各 Simple Window |
| ★ | Command 経由への修正（現在直接代入） | `src/core/macroKnob.ts` |
| ★ | Preferences > CC Map タブ | `src/ui/panels/preferences/` |

---

## 9. Behavior（振る舞いの定義）

### MIDI 値の正規化

```typescript
// main.js 内での正規化
const normalizeForIpc = (raw: number, resolution: number): number =>
  raw / (resolution - 1)
// MIDI 1.0: raw 0〜127  → 0.0〜1.0
// MIDI 2.0: raw 0〜4294967295 → 0.0〜1.0

// macroKnob.ts 内での range mapping
const rangeMap = (v: number, min: number, max: number): number =>
  min + v * (max - min)
```

### handleMidiCC の処理
1. `event.cc` が一致する KnobConfig を検索
2. `event.value`（0.0〜1.0 正規化済み）を受け取る
3. 各 `assign` に対して `rangeMap(event.value, assign.min, assign.max)` で対応値を算出
4. `paramId` の値を Command 経由で更新

### MIDI 1.0 / MIDI 2.0 共存ルール
- `macroKnob.ts` は protocol を意識しない（どちらも同じ `handleMidiCC` を呼ぶ）
- 同一 CC 番号への同時受信: last-write-wins
- MIDI 1.0 CC 0〜127 と MIDI 2.0 AC 0〜32767 は空間が異なる → 衝突なし
- MIDI 1.0 互換ブリッジ（CC1→CC302 等）は MacroKnob が変換テーブルを持つ

---

## 10. Test Cases（検証可能な条件）

```typescript
// TC-1: getKnobs() は32個を返す
expect(manager.getKnobs()).toHaveLength(32)

// TC-2: normalize が正しい
const val = normalize(64, 0, 2)
expect(val).toBeCloseTo(1.0, 1)

// TC-3: CC=0 → min値
expect(normalize(0, 0.5, 1.5)).toBe(0.5)

// TC-4: CC=127 → max値
expect(normalize(127, 0.5, 1.5)).toBe(1.5)

// TC-5: assigns が3つを超えるとエラー
expect(() => manager.setKnob('macro-1', { assigns: [{},{},{},{}] })).toThrow()

// TC-6: receiveModulation() → rangeMap される
expect(store.get('size')).toBeCloseTo(1.25)

// TC-7: handleMidiCC(event) → rangeMap される
expect(store.get('radius')).toBeCloseTo(1.25)

// TC-8: last-write-wins
expect(manager.getValue('macro-1')).toBeGreaterThan(0.5)

// TC-9: addAssign() → assigns に追加される
manager.addAssign('macro-1', { paramId: 'hue', ccNumber: 400, min: 0, max: 1, curve: 'linear' })
expect(manager.getKnobs().find(k => k.id === 'macro-1')?.assigns).toHaveLength(1)

// TC-10: removeAssign() → assigns から削除される
manager.removeAssign('macro-1', 'hue')
expect(manager.getKnobs().find(k => k.id === 'macro-1')?.assigns).toHaveLength(0)
```

---

## 11. CC Standard クイックリファレンス

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

全内容: `docs/spec/cc-standard.spec.md`
機械可読: `settings/cc-map.json`（未実装）

---

## 12. References

- `docs/spec/cc-standard.spec.md` — CC Standard v0.2（SSoT）
- `docs/spec/project-file.spec.md` — GeoGraphyProject 拡張
- `docs/spec/sequencer.spec.md` — Sequencer → D&D 接続（将来）
- `src/core/macroKnob.ts` — 実装
- `src/core/engine.ts` — handleMidiCC / getMacroKnobs 公開 API
- `src/ui/panels/macro-knob/MacroKnobPanel.tsx` — UI
- `electron/main.js` — MIDI 受信・IPC 送信（不要になった・Day44確定）
- `settings/cc-map.json` — AI 参照用 CC Map（未実装）
- `settings/mappings/midi/` — MIDI マッピング Preset 保存先
