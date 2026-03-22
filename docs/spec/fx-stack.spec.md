# FX Stack Spec

> SSoT: このファイル
> 対応実装: `src/plugins/fx/**` / `src/core/engine.ts`
> 担当エージェント: FX Agent
> 状態: ⬜ 未着手（v1実装予定）

---

## 1. Purpose（目的）

EffectComposerによるポストプロセッシングチェーンを管理する。
FXの順序は固定・各FXはenabledフラグでスキップできる。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: FXスタック順序を厳守（下記参照）
- MUST: ColorGradingは必ず最後
- MUST: `enabled: false` のFXは `pass.enabled = false` でスキップ（composerから削除しない）
- MUST: `destroy()` で `pass.dispose()` を呼ぶ
- MUST: `renderer: 'threejs'` を必ず設定
- MUST: FX AgentはFXスタック順序を変更してはいけない

---

## 3. FXスタック順序（変更禁止）

```
1.  AfterImagePass    (残像)
2.  FeedbackPass      (フィードバック)
3.  UnrealBloomPass   (Bloom)
4.  KaleidoscopePass  (万華鏡)
5.  MirrorPass        (ミラー)
6.  ZoomBlurPass      (ズームブラー)
7.  RGBShiftPass      (RGBシフト)
8.  CRTPass           (CRT)
9.  GlitchPass        (グリッチ)
10. ColorGradingPass  (色調整・必ず最後)
```

---

## 4. Interface（型・APIシグネチャ）

```typescript
interface FXPlugin extends PluginBase {
  create(composer: EffectComposer): void
  update(delta: number, beat: number): void
  destroy(): void
  params: Record<string, PluginParam>
}
```

---

## 5. デフォルト設定

| FX | 起動時 | 初期値 |
|---|---|---|
| Bloom | ON | strength: 0.8 / radius: 0.4 / threshold: 0.1 |
| AfterImage | ON | damp: 0.85 |
| RGBShift | ON | amount: 0.001 |
| ColorGrading | ON | saturation: 1.0 / contrast: 1.0 / brightness: 1.0 |
| その他全FX | OFF | — |

---

## 6. Test Cases（検証可能な条件）

```typescript
// TC-1: FXスタックの順序が正しい
const order = composer.passes.map(p => p.constructor.name)
expect(order.indexOf('AfterImagePass')).toBeLessThan(order.indexOf('UnrealBloomPass'))
expect(order.indexOf('UnrealBloomPass')).toBeLessThan(order.indexOf('ColorGradingPass'))
expect(order[order.length - 1]).toBe('ColorGradingPass')

// TC-2: enabled: false のFXはpass.enabled = false
fxPlugin.enabled = false
expect(pass.enabled).toBe(false)

// TC-3: destroy()後にpass.dispose()が呼ばれる
const spy = vi.spyOn(pass, 'dispose')
fxPlugin.destroy()
expect(spy).toHaveBeenCalled()
```

---

## 7. References

- 要件定義書 v1.7 §12「FX Plugin」
- `src/plugins/fx/CLAUDE.md`
- FX Agent担当範囲: `docs/spec/agent-roles.md`
