# Simple Window Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（概念定義）/ Claude Code（実装）
> 状態: 🔴 新規作成（Day29・Day28壁打ち反映）

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

| Simple Window 名 | 対応 Plugin / Manager | ファイルパス | 旧名称 |
|---|---|---|---|
| Mixer Simple Window | MixerPlugin | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` | `SimpleMixer.tsx` |
| FX Simple Window | FX Plugin | `src/ui/FxSimpleWindow.tsx` | `FxControlPanel.tsx` |
| Macro Knob Simple Window | MacroKnobManager | `src/ui/MacroKnobSimpleWindow.tsx` | `MacroKnobPanel.tsx` |

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
「閉じてはいけない」という旧制約は Day28 壁打ちで廃止された。

```
View
  ├── Mixer Simple Window        （⌘3）
  ├── FX Simple Window           （⌘2）
  └── Macro Knob Simple Window   （⌘1）
```

キーボードショートカットとの対応：

| キー | Simple Window |
|---|---|
| `1` | Macro Knob Simple Window |
| `2` | FX Simple Window |
| `3` | Mixer Simple Window |
| `H` | 全 Window 非表示 |
| `S` | 全 Window 表示 |

---

## 6. 命名規則

### ファイル命名（必須）

```
[PluginName]SimpleWindow.tsx
```

例: `MixerSimpleWindow.tsx` / `FxSimpleWindow.tsx` / `MacroKnobSimpleWindow.tsx`

### UX 語彙での表記

- `Mixer Simple Window`（スペース区切り）
- ファイル名は PascalCase の `MixerSimpleWindow`

---

## 7. Window と Panel の区別（重要）

| 名称 | 定義 | 対象 |
|---|---|---|
| **Window** | Plugin エコシステムの UI・コントリビューターがデザインできる | Simple Window / Window Plugin |
| **Panel** | アプリ固定の小窓・コントリビューターが触れない | Preferences Panel |

Simple Window は Window の一種。Panel ではない。

---

## 8. Constraints（MUSTルール）

- MUST: Simple Window のファイル名は `[Name]SimpleWindow.tsx` とすること
- MUST: Simple Window は View メニューから表示/非表示を切り替えられること
- MUST: カスタム Window Plugin が有効な場合は非表示になること（v2〜）
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）
- MUST: localStorage を使用しないこと

---

## 9. References

- 要件定義書 v1.9 §5「Window / Panel 設計」
- `docs/spec/mixer-plugin.spec.md`
- `docs/spec/window-plugin.spec.md`
- `docs/spec/electron.spec.md`（View メニュー）
