# src/plugins/fx - CLAUDE.md

## 役割

ポストプロセッシング FX を管理する。Three.js の EffectComposer で FX チェーンを構成する。

---

## FX Plugin Interface

```typescript
interface FXPlugin extends PluginBase {
  create(composer: EffectComposer): void
  update(delta: number, beat: number): void
  destroy(): void
  params: Record<string, PluginParam>
}

// PluginBase（必須フィールド）
// renderer: 'threejs'  ← 必ず指定
// enabled: boolean     ← false のとき pass.enabled = false でスキップ
```

---

## FX スタック順序（厳守）

```
Three.js レンダリング
→ AfterImagePass    （残像）
→ FeedbackPass      （フィードバック）
→ UnrealBloomPass   （Bloom）
→ KaleidoscopePass  （万華鏡）
→ MirrorPass        （ミラー）
→ ZoomBlurPass      （ズームブラー）
→ RGBShiftPass      （RGB シフト）
→ CRTPass           （CRT）
→ GlitchPass        （グリッチ）
→ ColorGradingPass  （色調整・必ず最後）
→ 出力
```

**ColorGrading は必ず最後に配置すること。**

---

## FX デフォルト（起動時）

| FX | 起動時 | 初期値 |
|---|---|---|
| Bloom | ON | strength 0.8 / radius 0.4 / threshold 0.1 |
| After Image | ON | damp 0.85 |
| RGB Shift | ON | amount 0.001 |
| Glitch | OFF | — |
| Feedback | OFF | — |
| Kaleidoscope | OFF | — |
| CRT | OFF | — |
| Zoom Blur | OFF | — |
| Mirror | OFF | — |
| ColorGrading | ON | saturation 1.0 / contrast 1.0 / brightness 1.0 |

---

## 実装方針

| FX | 実装方法 |
|---|---|
| Bloom | UnrealBloomPass（three/examples/jsm） |
| RGB Shift | ShaderPass + カスタム GLSL |
| Glitch | GlitchPass（three/examples/jsm） |
| Feedback | RenderTarget に出力を戻すループ |
| Kaleidoscope | ShaderPass + 角度折り返し GLSL |
| CRT | ShaderPass + スキャンライン GLSL |
| After Image | AfterImagePass（three/examples/jsm） |
| Zoom Blur | ShaderPass + 放射状ブラー GLSL |
| Mirror | ShaderPass + UV 座標反転 GLSL |
| ColorGrading | ShaderPass + Saturation / Contrast / Brightness GLSL |

---

## 注意事項

- `destroy()` では `pass.dispose()` を必ず呼ぶ
- `enabled = false` の FX は `pass.enabled = false` でスキップ（composer から削除しない）
- ColorGrading は Geometry の Color（Hue / Alpha）とは別物
- `renderer: 'threejs'` を必ず設定すること
