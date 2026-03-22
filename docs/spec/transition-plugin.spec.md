# Transition Plugin Spec

> SSoT: このファイル  
> 対応実装: `src/plugins/transitions/`  
> フェーズ: Phase 7  
> 状態: ✅ 実装済み・仕様化（Beat Cut / CrossFade）

---

## 1. Purpose（目的）

SceneStateを受け取り変形するだけの純粋な処理エンジン。
UIを持たず、Mixer Pluginのプルダウンから選択される。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: `execute()` は純粋関数（副作用禁止・戻り値はSceneState）
- MUST: UIを持たない（React componentを実装してはいけない）
- MUST: `PluginBase` を継承する（renderer・enabledフィールド必須）
- MUST: `engine.ts` のみが `execute()` を呼ぶ

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface TransitionPlugin extends PluginBase {
  duration: number                    // ミリ秒
  category: 'pixel' | 'parameter' | 'bpm'
  execute(
    from: SceneState,
    to: SceneState,
    progress: number                  // 0.0 → 1.0
  ): SceneState                       // voidではなくSceneStateを返す
  preview: string                     // サムネイル用の説明文
}
```

---

## 4. Behavior（振る舞いの定義）

### Beat Cut（category: 'bpm'）
- `progress` に関わらず、`execute()` は即座に `to` を返す
- ラップアラウンド検出: `prevBeat > 0.8 && beat < 0.2` で発火

### CrossFade（category: 'pixel'）
- `progress` に応じて `from` と `to` の `opacity` を線形補間する
- `progress=0.0` → fromのみ / `progress=1.0` → toのみ

---

## 5. Test Cases（検証可能な条件）

```typescript
// TC-1: execute()はSceneStateを返す（voidではない）
const result = beatCut.execute(fromState, toState, 0.5)
expect(result).toBeDefined()
expect(result.layers).toBeDefined()

// TC-2: Beat CutはprogressによらずtoStateを返す
expect(beatCut.execute(from, to, 0.0)).toEqual(to)
expect(beatCut.execute(from, to, 0.5)).toEqual(to)
expect(beatCut.execute(from, to, 1.0)).toEqual(to)

// TC-3: CrossFadeはprogress=0でfromのopacityを返す
const result = crossFade.execute(from, to, 0.0)
expect(result.layers[0].opacity).toBe(from.layers[0].opacity)

// TC-4: execute()は引数のSceneStateを変更しない（純粋関数）
const fromCopy = JSON.parse(JSON.stringify(from))
crossFade.execute(from, to, 0.5)
expect(from).toEqual(fromCopy)
```

---

## 6. References

- 要件定義書 v1.7 §10「Transition Plugin」
- `src/plugins/transitions/CLAUDE.md`
- `src/plugins/transitions/beat-cut/index.ts`
- `src/plugins/transitions/crossfade/index.ts`
