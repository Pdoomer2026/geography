# src/plugins/fx - CLAUDE.md

## 役割

ポストプロセッシング FX を管理する。Three.js の EffectComposer で FX チェーンを構成する。

---

## FX Plugin Interface

```typescript
interface FXPlugin extends ModulatablePlugin {
  create(composer: EffectComposer): void
  update(delta: number, beat: number): void
  destroy(): void
  // params: Record<string, PluginParam> ← ModulatablePlugin から継承
  // MidiManager から CC Standard 経由で制御される
}
```

### Plugin 二分類

| 分類 | Interface | params | MidiManager 制御 |
|---|---|---|---|
| **ModulatablePlugin** | FXPlugin / GeometryPlugin 等 | ✅ あり | ✅ 可能 |
| **PluginBase のみ** | TransitionPlugin / WindowPlugin 等 | ❌ なし | ❌ 不要 |

FXPlugin は MidiManager → CC Standard 経由で外部制御される。
制御経路: `engine.handleMidiCC()` → `MidiManager` → `ParameterStore` → `plugin.params.value`

### enabled の挙動（MUST）

```
FX ON  → create()  で pass を composer に追加
FX OFF → destroy() で pass を composer から削除・dispose()
```

`pass.enabled = false` だけでスキップするのは禁止。

---

## FX スタック順序（厳守）

```
Three.js レンダリング
→ AfterImagePass → FeedbackPass → UnrealBloomPass → KaleidoscopePass
→ MirrorPass → ZoomBlurPass → RGBShiftPass → CRTPass → GlitchPass
→ ColorGradingPass  ← 必ず最後
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
| ColorGrading | ON | saturation 1.0 / contrast 1.0 / brightness 1.0 |
| Glitch / Feedback / Kaleidoscope / CRT / Zoom Blur / Mirror | OFF | — |

---

## 注意事項

- `destroy()` では `pass.dispose()` を必ず呼ぶ
- ColorGrading は Geometry の Color（Hue / Alpha）とは別物
- `renderer: 'threejs'` を必ず設定すること
