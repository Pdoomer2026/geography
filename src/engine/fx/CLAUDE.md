# src/plugins/fx - CLAUDE.md

## 役割

ポストプロセッシング FX を管理する。Three.js の EffectComposer で FX チェーンを構成する。

---

## FX Plugin Interface

```typescript
/**
 * FXPlugin は ModulatablePlugin を継承する。
 * params は ModulatablePlugin が持つため FXPlugin 側に定義不要。
 * MidiManager → CC Standard 経由で外部制御される（Day50確定）。
 */
interface FXPlugin extends ModulatablePlugin {
  create(composer: EffectComposer): void
  update(delta: number, beat: number): void
  destroy(): void
  // params: Record<string, PluginParam> ← ModulatablePlugin から継承
}

// ModulatablePlugin → PluginBase（必須フィールド）
// renderer: 'threejs'  ← 必ず指定
// enabled: boolean     ← ON/OFF は create()/destroy() で制御（下記参照）
```

### Plugin 二分類（重要）

| 分類 | Interface | params | MidiManager 制御 |
|---|---|---|---|
| **ModulatablePlugin** | FXPlugin / GeometryPlugin 等 | ✅ あり | ✅ 可能 |
| **PluginBase のみ** | TransitionPlugin / WindowPlugin 等 | ❌ なし | ❌ 不要 |

FXPlugin は MidiManager → CC Standard 経由で外部制御される。
制御経路: `engine.handleMidiCC()` → `MidiManager` → `ParameterStore` → `plugin.params.value`

### enabled の挙動（MUST・plugin-lifecycle.spec.md 準拠）

```
FX ON  → create()   で pass を composer に追加
FX OFF → destroy()  で pass を composer から削除・dispose()
```

`pass.enabled = false` だけでスキップするのは禁止。
ON/OFF は必ず instantiate / destroy で行うこと。

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
- `enabled = false` の FX は ON/OFF を create()/destroy() で制御すること（`pass.enabled = false` 禁止）
- ColorGrading は Geometry の Color（Hue / Alpha）とは別物
- `renderer: 'threejs'` を必ず設定すること
