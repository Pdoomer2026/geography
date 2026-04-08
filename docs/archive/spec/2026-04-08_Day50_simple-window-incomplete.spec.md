# Simple Window Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（概念定義）/ Claude Code（実装）
> 状態: Day29 新規作成・Day44 Geometry / Camera Simple Window 追加・Day50 engine経由ルール確定

---

## 1. Purpose（目的）

Simple Window は、各 Plugin に付属するデフォルト最小 UI。
カスタム Window Plugin が存在しない場合のフォールバックとして機能する。

---

## 2. 定義

| 概念 | 定義 |
|---|---|
| **Simple Window** | 各 Plugin に付属するデフォルト最小 UI。カスタム Window Plugin がないときのフォールバック |
| **Window Plugin** | コントリビューターが開発するカスタム UI。有効化されると対応 Simple Window が非表示になる |

Simple Window は Plugin エコシステムの一部であり、コントリビューターがカスタム Window Plugin を開発するまでの「合理的なデフォルト」を提供する。

---

## 3. Simple Window 一覧（v1）

| Simple Window 名 | 対応 Plugin / Manager | ファイルパス | 状態 |
|---|---|---|---|
| Mixer Simple Window | MixerPlugin | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` | ✅ 実装済み |
| FX Simple Window | FX Plugin | `src/ui/FxSimpleWindow.tsx` | ✅ 実装済み |
| Geometry Simple Window | Geometry Plugin | `src/ui/GeometrySimpleWindow.tsx` | ✅ Day45 実装済み |
| Camera Simple Window | Camera Plugin | `src/ui/CameraSimpleWindow.tsx` | ✅ Day45 実装済み |

---

## 3.5 Panel 一覧（v1）

アプリ固定・コントリビューターが触れない。`src/ui/panels/` に配置。各 Panel は固有の CLAUDE.md を持つ。

| Panel 名 | 内容 | ファイルパス |
|---|---|---|
| Preferences Panel | Setup / Plugins / MIDI / Output 等 | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MacroKnob Panel | MacroKnob 32個・MIDI 2.0 アサイン・MIDI Learn | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |

---

## 4. フォールバック動作

```
カスタム Window Plugin が有効？
  → YES: Simple Window を非表示にする
  → NO:  Simple Window を表示する（フォールバック）
```

v1 ではカスタム Window Plugin の実装は行わないため、常に Simple Window が表示される。

---

## 5. View メニューとの連携

すべての Simple Window は View メニューから表示/非表示を切り替えられる。

```
View
  ├── Mixer Simple Window      (Cmd+3)
  ├── FX Simple Window         (Cmd+2)
  ├── Geometry Simple Window   (Cmd+5)
  ├── Camera Simple Window     (Cmd+4)
  ├── MacroKnob Panel          (Cmd+1)
  ├── ──────────────────────
  ├── Hide All Windows         (H)
  └── Show All Windows         (S)
```

キーボードショートカットとの対応：

| キー | 対象 |
|---|---|
| `1` | MacroKnob Panel |
| `2` | FX Simple Window |
| `3` | Mixer Simple Window |
| `4` | Camera Simple Window |
| `5` | Geometry Simple Window |
| `H` | 全 Window / Panel 非表示 |
| `S` | 全 Window / Panel 表示 |

---

## 6. 命名規則

### ファイル命名（必須）

```
[PluginName]SimpleWindow.tsx
```

例: `MixerSimpleWindow.tsx` / `FxSimpleWindow.tsx` / `GeometrySimpleWindow.tsx` / `CameraSimpleWindow.tsx`

### UX 語彙での表記

- `Mixer Simple Window`（スペース区切り）
- ファイル名は PascalCase の `MixerSimpleWindow`

---

## 7. Window と Panel の区別（重要）

| 名称 | 定義 | 対象 |
|---|---|---|
| **Window** | Plugin エコシステムの UI・コントリビューターがデザインできる | Simple Window / Window Plugin |
| **Panel** | アプリ固定の小窓・コントリビューターが触れない・`src/ui/panels/` に配置 | Preferences Panel / MacroKnob Panel |

Simple Window は Window の一種。Panel ではない。
MacroKnob Panel は Day35 壁打ちで Panel に確定（旧名: Macro Knob Simple Window）。
Camera Simple Window は Panel ではなく Simple Window として分類する。

---

## 8. Constraints（MUSTルール）

- MUST: Simple Window のファイル名は `[Name]SimpleWindow.tsx` とすること
- MUST: Simple Window は View メニューから表示/非表示を切り替えられること
- MUST: カスタム Window Plugin が有効な場合は非表示になること（v2〜）
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）
- MUST: localStorage を使用しないこと
- MUST: 各パラメーター行に `[≡]` D&D ハンドルを配置すること（MacroKnob アサイン対象）
- MUST: パラメーター変更は `engine.handleMidiCC(MidiCCEvent)` 経由で行うこと（Day50 確定）
- MUST: `macroKnobManager` を直接 import しないこと・`engine` 経由のみ許可

### パラメーター変更のフロー（Day50 確定・全 SimpleWindow 共通）

```typescript
// スライダー onChange の実装パターン
function handleParam(pluginId: string, paramKey: string, value: number, param: PluginParam) {
  const cc = ccMapService.getCcNumber(pluginId, paramKey)
  const normalized = (value - param.min) / (param.max - param.min)
  engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
}

// 表示値の追従は 200ms ポーリングで plugin.params[key].value を読む
```

---

## 9. References

- `docs/spec/macro-knob.spec.md`（MidiManager / MacroKnob 設計・Day50 更新）
- `docs/spec/camera-plugin.spec.md`（Camera Simple Window の UI 詳細）
- `docs/spec/mixer-plugin.spec.md`
- `docs/spec/window-plugin.spec.md`
- `docs/spec/electron.spec.md`（View メニュー）
