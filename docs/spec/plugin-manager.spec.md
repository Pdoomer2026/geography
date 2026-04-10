# Plugin Manager Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day57 実装完了

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
  → RegisteredParameter に ccNumber と value を追加
  → WindowPlugin が MIDIRegistry を filter して ParamRow を動的生成
  → ユーザーが初めてパラメータを操作できる状態になる
```

---

## 4. WindowPlugin 定義

### 4-1. SimpleWindowPlugin

Geometry / Camera / Light Plugin 共通の汎用 UI。

**責務（v1 最小実装）：**
```
① params → ParamRow を動的生成
② ccNumber は props から受け取る（App.tsx が付与済み）
③ engine.handleMidiCC() でパラメータ変更
④ params[].value は常に engine の現在値と同期済み（逆流・200ms ポーリング）
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
  pluginName: string                   // 表示用
  params: RegisteredParameterWithCC[]  // Registry から filter するだけで取得
  // params[].value は常に engine の現在値と同期済み（逆流）
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
③ ccNumber は props から受け取る（App.tsx が付与済み）
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
| A | MIDIRegistry への Geometry 登録 | 完了 Day56 |
| A | GeometrySimpleWindow → onPluginApply 接続 | 完了 Day56 |
| B | SimpleWindowPlugin 新規実装 | 完了 Day56 |
| B | FxWindowPlugin 新規実装 | 完了 Day56 |
| B | ccNumber の RegisteredParameter への付与 | 完了 Day56 |
| B | MidiCCEvent.cc → slot 導入（Slot 概念の先行定着） | 完了 Day57 |
| B | Registry に value 追加（Plugin → Window 逆流） | 完了 Day57 |
| 将来 | 既存 SimpleWindow 廃止 | 動作確認完了後 |

---

## 9. 将来対応項目

1. **既存 SimpleWindow 廃止** → GeometrySimpleWindow / FxSimpleWindow / CameraSimpleWindow を削除
2. **[L1][L2][L3] タブ切り替え** → layer-1 固定から activeLayer state へ
3. **多重レイヤー問題** → bindings フェーズ（MacroKnob D&D）と一緒に設計
4. **transform** → UI（WindowPlugin）の責務として将来実装

---

## 10. References

- `docs/spec/midi-registry.spec.md` — MIDIRegistry 仕様
- `docs/spec/cc-mapping.spec.md` — CC マッピング仕様
- `docs/spec/window-plugin.spec.md` — WindowPlugin 定義
- `docs/spec/simple-window.spec.md` — 既存 SimpleWindow（廃止予定）
- `docs/spec/plugin-lifecycle.spec.md` — Plugin ライフサイクル
