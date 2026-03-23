# Macro Knob System Spec

> SSoT: このファイル
> 対応実装: `src/core/macroKnob.ts` / `engine.ts` / MacroKnobPanel UI
> 担当エージェント: Claude Code
> 状態: 🔴 Day13実装対象

---

## 1. Purpose（目的）

32個のマクロノブで複数のパラメーターを同時に操作する。
MIDIコントローラーのノブ・フェーダーに物理対応し、1ノブで最大3パラメーターを制御できる。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: ノブ数は32個固定（8ノブ × 4行）・config.tsの `MACRO_KNOB_COUNT = 32` を参照
- MUST: 1ノブに最大3パラメーターまで割り当て可能
- MUST: MIDI CC値（0〜127）を min/max に正規化して返す
- MUST: パラメーター変更は必ず Command 経由（直接代入禁止）
- MUST: マクロノブパネルは閉じることができない（エンジン固定部分）
- MUST: MIDIマッピングは `settings/mappings/midi/` に保存する

---

## 3. Interface（型・APIシグネチャ）

```typescript
type CurveType = 'linear'  // v1はlinearのみ / v2でexp・log・s-curve追加

interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: CurveType
}

interface MacroKnobConfig {
  id: string          // 'macro-1' 〜 'macro-32'
  name: string        // 表示名（例: 'CHAOS'）
  midiCC: number      // 0〜127
  assigns: MacroAssign[]  // 最大3つ
}

interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  handleMidiCC(cc: number, value: number): void  // value: 0〜127
  getValue(knobId: string): number  // 0.0〜1.0に正規化した現在値
}
```

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

### デフォルト状態
- 全32ノブは名前なし・assigns空・midiCC未割り当て
- GUIのノブ値はGuiModulatorとして機能（フォールバック）

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

- 要件定義書 v1.7 §15「マクロノブ」
- 実装計画書 v2.5 §10.1「マクロノブ」
- `src/core/config.ts` — MACRO_KNOB_COUNT定数（追加が必要）
- Claude Code担当範囲: `docs/spec/agent-roles.md`
