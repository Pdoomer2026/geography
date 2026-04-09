# Plugin Manager Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day55 設計確定・実装は次フェーズ

---

## 1. 概要

Plugin Manager は「どの Plugin × どの WindowPlugin をどのレイヤーに Apply するか」を管理する Orchestrator。
ユーザーの Plugin Apply 操作を受けて、MIDIRegistry の更新と WindowPlugin の起動を順序立てて行う。

---

## 2. Plugin エコシステムにおける位置づけ

```
Plugin エコシステム
├── GeometryPlugin  → IcosphereGeometryPlugin, WaveGeometryPlugin ...
├── FXPlugin        → BloomFXPlugin, GlitchFXPlugin ...
├── CameraPlugin    → OrbitCameraPlugin ...
├── LightPlugin     → ...
└── WindowPlugin    → SimpleWindowPlugin, FxWindowPlugin, (将来の上位 WindowPlugin ...)
```

WindowPlugin は Geometry / FX と並列の Plugin の一種。
Plugin Manager がこれらのペアを管理する。

---

## 3. Plugin Apply の2段階フロー（確定）

Geometry と WindowPlugin は常にペアで選ぶ。
ユーザーが Geometry を選んだだけでは操作できない（Window がないため）。

```
Plugin Apply（ユーザー操作）
  ↓
Phase A: Geometry 選択
  → engine.setLayerPlugin(layerId, pluginId)
  → plugin.getParameters() → ParameterSchema[]
  → App.tsx が layerId / pluginId を付与
  → registerParams() → MIDIRegistry.availableParameters に登録
  ここまでが MIDIRegistry の責務

  ↓
Phase B: WindowPlugin 選択（SimpleWindowPlugin / FxWindowPlugin）
  → ccMapService.getCcNumber(pluginId, paramId) を paramId ごとに呼ぶ
  → RegisteredParameter に ccNumber を追加
  → WindowPlugin が MIDIRegistry を読んで ParamRow を動的生成
  → ユーザーが初めてパラメータを操作できる状態になる
```

---

## 4. WindowPlugin 定義

### 4-1. SimpleWindowPlugin

Geometry / Camera / Light Plugin 共通の汎用 UI。

**責務（v1 最小実装）：**
```
① params → ParamRow を動的生成
② ccMapService.getCcNumber(pluginId, paramId) で CC番号取得
③ engine.handleMidiCC() でパラメータ変更
```

**将来追加（実装しない）：**
- Preset（Save / Load / Delete）
- D&D ハンドル（MacroKnob アサイン）→ 次の段階
- RangeSlider（min/max 絞り）→ 上位 WindowPlugin で導入

**props：**
```typescript
interface SimpleWindowPluginProps {
  layerId: string
  pluginId: string
  pluginName: string       // 表示用
  params: Record<string, PluginParam>
  // PluginParam.min / max がスライダー範囲になる
}
```

**ファイル：**
```
src/plugins/windows/simple-window/
├── index.ts
└── SimpleWindowPlugin.tsx
```

### 4-2. FxWindowPlugin

FX Plugin 専用 UI。ON/OFF トグルが必要なため別実装。

**責務（v1 最小実装）：**
```
① FX ON/OFF トグル（FX Plugin 固有の仕様）
② params → ParamRow 動的生成
③ ccMapService.getCcNumber(pluginId, paramId) で CC番号取得
④ engine.handleMidiCC() でパラメータ変更
```

**ファイル：**
```
src/plugins/windows/fx-window/
├── index.ts
└── FxWindowPlugin.tsx
```

---

## 5. Plugin Manager の責務

```
1. Geometry Plugin の Apply / Remove
   → engine.setLayerPlugin(layerId, pluginId)
   → MIDIRegistry の更新（registerParams / clearParams）

2. WindowPlugin の Apply / Remove
   → どの WindowPlugin を使うかを決定
   → Geometry Plugin の種別に応じて自動選択：
     Geometry / Camera / Light → SimpleWindowPlugin
     FX                        → FxWindowPlugin

3. ペアの管理
   → Geometry Apply と同時に対応 WindowPlugin を起動
   → Geometry Remove と同時に WindowPlugin を終了
```

---

## 6. 廃止する既存 SimpleWindow

Plugin Manager 実装後、以下は廃止する：

| 廃止対象 | 代替 |
|---|---|
| `src/ui/GeometrySimpleWindow.tsx` | `SimpleWindowPlugin` |
| `src/ui/FxSimpleWindow.tsx` | `FxWindowPlugin` |
| `src/ui/CameraSimpleWindow.tsx` | `SimpleWindowPlugin` |

廃止タイミング：Phase B 実装・動作確認完了後。

---

## 7. 密結合の解消

現行の CameraSimpleWindow は `engine.listCameraPlugins()` / `engine.setCameraPlugin()` を直接呼ぶ密結合。
Plugin Manager が「どの Plugin を使うか」を管理することで解消する。

```
現状（密結合）
CameraSimpleWindow → engine.listCameraPlugins() → エンジンが Camera 種別を管理

あるべき姿（疎結合）
Plugin Manager → Camera Plugin を選択して Apply
SimpleWindowPlugin → 渡された params を表示するだけ
```

---

## 8. 実装順序

| Phase | 作業 | 状態 |
|---|---|---|
| A | MIDIRegistry への Geometry 登録 | ⬜ 実装中（Day54 基盤完成） |
| A | GeometrySimpleWindow → onPluginApply 接続 | ⬜ 未実装 |
| B | SimpleWindowPlugin 新規実装 | ⬜ 未実装 |
| B | FxWindowPlugin 新規実装 | ⬜ 未実装 |
| B | ccNumber の RegisteredParameter への付与 | ⬜ 未実装（Phase B の未解決事項あり） |
| 将来 | 既存 SimpleWindow 廃止 | ⬜ Phase B 完了後 |

---

## 9. Phase B の未解決事項（要壁打ち）

1. **cc-mapping.md の整備状況**
   - 全 Plugin 分の CC 番号が定義されているか確認が必要
   - 未定義 param は CC1000〜 自動払い出しで良いか

2. **値域変換の責務**
   - pluginMin / pluginMax（Plugin の実値域）
   - ccMin / ccMax（0.0〜1.0 正規化）
   - この変換を誰が持つか（ccMapService / WindowPlugin / engine）

3. **多重レイヤー問題**
   - 同一 pluginId が複数レイヤーに存在する場合の ccNumber の扱い
   - bindings フェーズ（MacroKnob D&D）と一緒に設計する

---

## 10. References

- `docs/spec/midi-registry.spec.md` — MIDIRegistry 仕様
- `docs/spec/cc-mapping.spec.md` — CC マッピング仕様
- `docs/spec/window-plugin.spec.md` — WindowPlugin 定義
- `docs/spec/simple-window.spec.md` — 既存 SimpleWindow（廃止予定）
- `docs/spec/plugin-lifecycle.spec.md` — Plugin ライフサイクル
