# Macro Knob System Spec

> SSoT: このファイル
> 対応実装: `src/core/macroKnob.ts` / `engine.ts` / MacroKnobPanel UI
> 担当エージェント: Claude Code
> 状態: ✅ Day13実装済み・Day35壁打ちで大幅更新

---

## 1. Purpose（目的）

32個のマクロノブで複数のパラメーターを同時に操作する。
MIDIコントローラーのノブ・フェーダーに物理対応し、1ノブで最大3パラメーターを制御できる。

**MacroKnob は全 Plugin が依存する「値の集約点」。全入力源（MIDI / Sequencer / LFO）のルーター。コア固定・Plugin 化しない。**

```
【入力層】                    【MacroKnob層・コア固定】     【出力層】
MIDI 2.0 Controller  →
Sequencer Plugin     →  MacroKnobPanel（32個）  →  ParameterStore
LFO（v2〜）          →       core/macroKnob.ts         ↓
OSC（v2〜）          →                           Plugin.params
```

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: ノブ数は32個固定（8ノブ × 4行）・config.tsの `MACRO_KNOB_COUNT = 32` を参照
- MUST: 1ノブに最大3パラメーターまで割り当て可能
- MUST: MIDI CC値（0〜127）を min/max に正規化して返す
- MUST: パラメーター変更は必ず Command 経由（直接代入禁止）
- MUST: MacroKnob Panel は Plugin 化しない・コア固定・コントリビューターが触れない
- MUST: MIDIマッピングは `settings/mappings/midi/` に保存する
- MUST: MIDI 2.0 受信は `electron/main.js` 経由（IPC）・Web MIDI API（MIDI 1.0）と分離
- MUST: Sequencer Plugin からの値は macroKnobId 経由で受け取る（疎結合）

---

## 3. Interface（型・APIシグネチャ）

```typescript
type CurveType = 'linear'  // v1はlinearのみ / v2でexp・log・s-curve追加

interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: CurveType
  /** CC Rosetta Stone のデフォルト CC 番号（ユーザーが上書き可能） */
  defaultCC?: number
}

interface MacroKnobConfig {
  id: string          // 'macro-1' 〜 'macro-32'
  name: string        // 表示名（例: 'CHAOS'）
  midiCC: number      // 0〜127（MIDI 1.0）/ 0〜32767（MIDI 2.0）
  assigns: MacroAssign[]  // 最大3つ
}

interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  handleMidiCC(cc: number, value: number): void  // value: 0〜127
  getValue(knobId: string): number  // 0.0〜1.0に正規化した現在値
  /** Sequencer Plugin から値を受け取る（0.0〜1.0） */
  receiveModulation(knobId: string, value: number): void
}
```

### CC番号 Rosetta Stone（初期定義・確定後 docs/spec/cc-standard.spec.md に移管）

全 Plugin がデフォルトで準拠する共通 CC 定義。

| CC番号 | 抽象概念 | Geometry 例 | FX 例 |
|---|---|---|---|
| CC 20 | Primary Amount | Size / Radius | Mix (Dry/Wet) |
| CC 21 | Density / Detail | Segments | Grain Size |
| CC 22 | Deformation | Twist / Noise | Glitch |
| CC 23 | Sharpness / Width | Stroke / InnerRadius | Contrast |
| CC 24 | Temporal Speed | Rotation Speed | Feedback Rate |

---

## 4. Behavior（振る舞いの定義）

### MIDI値の正規化
```typescript
const normalize = (midi: number, min: number, max: number): number =>
  min + (midi / 127) * (max - min)
```

### handleMidiCC の処理
1. `midiCC` が一致するKnobConfigを検索
2. value（0〜127）を正規化
3. 各 `assign` に対して `paramId` の値を Command 経由で更新

### receiveModulation の処理（Sequencer 経由）
1. `knobId` に対応する KnobConfig を検索
2. value（0.0〜1.0）を各 assign の min/max に Range mapping
3. 各 `paramId` の値を Command 経由で更新

### MIDI Learn（Phase 14 実装対象）
1. UI 上のパラメーターを右クリック → Learn モード
2. MIDI コンのノブを動かす → CC番号を自動アサイン
3. 既存アサインがある場合は上書き確認

### デフォルト状態
- 全32ノブは名前なし・assigns空・midiCC未割り当て
- CC 20〜24 は Rosetta Stone に従いデフォルトアサイン（Phase 14 実装対象）

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
```

---

## 6. References

- 要件定義書 v2.0 §11「MacroKnob / MIDI システム」
- 実装計画書 v3.2 §6「Phase 14：MacroKnob Panel 完成」
- `src/core/config.ts` — MACRO_KNOB_COUNT 定数
- `docs/spec/cc-standard.spec.md` — CC Rosetta Stone（新設予定）
- `docs/spec/sequencer.spec.md` — Sequencer → MacroKnob 接続（新設予定）
- Claude Code担当範囲: `docs/spec/agent-roles.md`
