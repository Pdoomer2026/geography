# Day15 - FX Stack 実装ログ

> 対応 spec: `docs/spec/fx-stack.spec.md`
> ブランチ: `main`

---

## Step 1: FxStack コア（src/core/fxStack.ts）✅

- `FxStack` クラス作成
- `FX_STACK_ORDER` 定数（10 FX の固定順）
- `register()` / `getOrdered()` / `buildComposer()` / `update()` / `dispose()` / `setEnabled()` / `getPlugin()`
- `buildComposer()` は FX_STACK_ORDER 順で各 Plugin の `create()` を呼ぶ
- `update()` は `enabled=false` の Plugin をスキップ

---

## Step 2: 個別 FX Plugin 実装（10個）✅

| Plugin | ファイル | 方式 | デフォルト |
|---|---|---|---|
| AfterImage | `after-image/index.ts` | `AfterimagePass`（jsm） | ON / damp=0.85 |
| Feedback | `feedback/index.ts` | ShaderPass + RenderTarget | OFF / amount=0.7 |
| Bloom | `bloom/index.ts` | `UnrealBloomPass`（jsm） | ON / str=0.8 |
| Kaleidoscope | `kaleidoscope/index.ts` | ShaderPass + 極座標GLSL | OFF / seg=6 |
| Mirror | `mirror/index.ts` | ShaderPass + UV反転GLSL | OFF |
| ZoomBlur | `zoom-blur/index.ts` | ShaderPass + 放射状GLSL | OFF |
| RGBShift | `rgb-shift/index.ts` | ShaderPass + チャンネルGLSL | ON / amount=0.001 |
| CRT | `crt/index.ts` | ShaderPass + スキャンラインGLSL | OFF |
| Glitch | `glitch/index.ts` | `GlitchPass`（jsm） | OFF |
| ColorGrading | `color-grading/index.ts` | ShaderPass + 色調整GLSL | ON / 各1.0 |

**修正メモ**: `AfterImagePass` → `AfterimagePass`（three 0.170 の正しいクラス名）

---

## Step 3: バレルエクスポート（src/plugins/fx/index.ts）✅

- 全 10 FX Plugin をエクスポート
- `getAllFxPlugins()` 関数（FX_STACK_ORDER 順で配列を返す）

---

## Step 4: テスト追加（tests/core/fxStack.test.ts）✅

- TC-1: `FX_STACK_ORDER` 順序検証・`getOrdered()` 逆順登録テスト・`buildComposer()` 順序テスト
- TC-2: `setEnabled(false)` / update スキップ / update 呼び出し確認
- TC-3: `dispose()` → `destroy()` 全件呼び出し確認・dispose後の空確認
- 追加: 不明 id 警告 / `getPlugin()` 正常・異常系

---

## 完了条件 ✅

```
pnpm tsc --noEmit   → エラーゼロ
pnpm test --run     → 61 tests グリーン（50 → +11）
```

---

## engine.ts 統合は Day16 候補

- 各レイヤーに `EffectComposer` を紐付ける
- `layerManager.update()` で `fxStack.update()` を呼ぶ
- FX コントロール UI
