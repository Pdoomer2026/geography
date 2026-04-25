# src/engine/fx - CLAUDE.md

> Day79 更新：コード実態に合わせて FX デフォルト・enabled 制御方法を修正

## 役割

ポストプロセッシング FX を管理する。Three.js の EffectComposer で FX チェーンを構成する。

---

## FX Plugin Interface

```typescript
interface FXPlugin extends ModulatablePlugin {
  create(composer: EffectComposer): void
  update(delta: number, beat: number): void
  destroy(): void
}

// ModulatablePlugin → PluginBase（必須フィールド）
// renderer: 'threejs'  <- 必ず指定
// enabled: boolean     <- コードデフォルトは false（全 FX）
```

### Plugin 二分類

| 分類 | Interface | params | 外部制御 |
|---|---|---|---|
| **ModulatablePlugin** | FXPlugin / GeometryPlugin 等 | ✅ あり | ✅ 可能 |
| **PluginBase のみ** | TransitionPlugin / WindowPlugin 等 | ❌ なし | ❌ 不要 |

---

## enabled の挙動（MUST・Day66 確立・コード確認済み）

```typescript
// applySetup() の正しい実装（Day66 修正済み）
plugin.create(composer)          // 全 FX を create() → pass を compositor に追加
plugin.enabled = enabledSet.has(id)  // enabled フラグで ON/OFF を制御

// update() 内
this.pass.enabled = this.enabled  // フレームごとに pass.enabled を同期
```

**MUST: 全 FX を `create()` してから `enabled` フラグで制御する。**
`destroy()` で削除してから再 `create()` する方式は Day66 で廃止。
理由: `destroy()` 後は `pass = null` になり、後から `setEnabled(true)` しても再現できなかったバグを修正。

---

## FX デフォルト（コード実態・Day79 確認済み）

**全 12 種・`enabled = false`（起動時はすべて OFF）**

AfterImage / Feedback / Bloom / Kaleidoscope / Mirror / ZoomBlur / RGBShift / CRT / Glitch / ColorGrading / Film / FreiChen

> ⚠️ 各 FX の index.ts のコメントに `デフォルト: enabled=true` と書かれている箇所があるが、
> 実際のコードは `enabled = false`。コメントが誤り。次回修正予定。

---

## FX スタック順序（厳守）

```
Three.js レンダリング
  → AfterImagePass
  → FeedbackPass
  → UnrealBloomPass
  → KaleidoscopePass
  → MirrorPass
  → ZoomBlurPass
  → RGBShiftPass
  → CRTPass
  → GlitchPass
  → FilmPass
  → FreiChenPass
  → ColorGradingPass  <- 必ず最後
  → 出力
```

**ColorGrading は必ず最後に配置すること。**

---

## 実装方針

| FX | 実装方法 |
|---|---|
| Bloom | UnrealBloomPass（three/examples/jsm） |
| AfterImage | AfterimagePass（three/examples/jsm） |
| RGB Shift | ShaderPass + カスタム GLSL |
| Glitch | GlitchPass（three/examples/jsm） |
| Film | FilmPass（three/examples/jsm） |
| FreiChen | ShaderPass + Frei-Chen エッジ検出 GLSL |
| Feedback | RenderTarget に出力を戻すループ |
| Kaleidoscope | ShaderPass + 角度折り返し GLSL |
| CRT | ShaderPass + スキャンライン GLSL |
| ZoomBlur | ShaderPass + 放射状ブラー GLSL |
| Mirror | ShaderPass + UV 座標反転 GLSL |
| ColorGrading | ShaderPass + Saturation / Contrast / Brightness GLSL |

---

## FX ファクトリ（MUST）

```typescript
// engine.ts 専用 — レイヤーごとに独立したインスタンスを生成する
import { createFxPlugins } from '../../engine/fx'

// FX_STACK_ORDER 順で 12 本を返す
const fxPlugins = createFxPlugins()
```

シングルトン（`afterImagePlugin` 等）はテスト・外部参照用。engine では使わない。

---

## 注意事項

- `destroy()` では `pass.dispose()` を必ず呼ぶ
- `pass.enabled` で制御するため `create()` は必ず事前に呼ぶ
- ColorGrading は Geometry の Color（Hue / Alpha）とは別物
- `renderer: 'threejs'` を必ず設定すること
- `film` / `frei-chen` は Day33 で追加・Day71 で FX_STACK_ORDER に登録済み
