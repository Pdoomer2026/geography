# Day13 マクロノブシステム 進捗ログ

> spec: `docs/spec/macro-knob.spec.md`
> 担当: Claude Code
> 開始: 2026-03-23

---

## ステップ完了記録

### [DONE] Step 0: プラン提示
- 作成・変更ファイル一覧を提示
- spec §2 Constraints との対応表を提示
- 型設計・テストケース方針を提示

### [DONE] Step 2: config.ts に定数追加
- `MACRO_KNOB_COUNT = 32`
- `MACRO_KNOB_MAX_ASSIGNS = 3`

### [DONE] Step 3: src/types/index.ts に型追加
- `CurveType` type alias（'linear'）
- `MacroAssign` interface
- `MacroKnobConfig` interface
- `MacroKnobManager` interface

### [DONE] Step 4: src/core/macroKnob.ts 新規作成
- `normalize()` ヘルパー関数（spec §4 の式に準拠）
- `MacroKnobManagerImpl` class（MacroKnobManager interface 実装）
  - `init(store)`: ParameterStore 注入
  - `getKnobs()`: 32ノブ全件返す
  - `setKnob(id, config)`: assigns > 3 でエラー throw
  - `handleMidiCC(cc, value)`: CC一致ノブを検索 → Command経由でパラメーター更新
  - `getValue(knobId)`: 0.0〜1.0 正規化値を返す
- `macroKnobManager` シングルトン export

### [DONE] Step 5: engine.ts に MacroKnobManager 接続
- `import { macroKnobManager }` 追加
- `initialize()` 内で `macroKnobManager.init(this.parameterStore)` 呼び出し
- `getMacroKnobs()` メソッド追加
- `handleMidiCC(cc, value)` メソッド追加（MIDI Driver エントリーポイント）

### [DONE] Step 6: tests/core/macroKnob.test.ts 新規作成
- TC-1: getKnobs() が 32 個を返す ✅
- TC-2: normalize(64, 0, 2) ≈ 1.0 ✅
- TC-3: normalize(0, 0.5, 1.5) === 0.5 ✅
- TC-4: normalize(127, 0.5, 1.5) === 1.5 ✅
- TC-5: assigns 4個で setKnob() がエラー throw ✅
- 追加: assigns 3個以下で setKnob() 成功 ✅
- 追加: getValue は操作前 0 を返す ✅

---

## 次のステップ

- [ ] Step 7: `pnpm tsc --noEmit && pnpm test --run` で両方通過確認
- [ ] Step 8: ブラウザ目視確認
- [ ] Step 9: git commit

---

## 設計メモ

- `MacroKnobManagerImpl.init()` は `macroKnob.ts` 内部クラスのメソッドとして実装
  → `engine.ts` から `macroKnobManager.init(this.parameterStore)` を呼ぶ
  → テストでは ParameterStore 不要な TC（normalize・getKnobs・setKnob）のみ検証
- `normalize` はピュア関数として export → テストで直接検証可能
- `any` 一切不使用・型は MacroKnobManager interface で完全型付け

