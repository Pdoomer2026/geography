# Mixer Plugin Spec

> SSoT: このファイル
> 対応実装: `src/plugins/mixers/simple-mixer/**`
> 担当エージェント: Mixer Agent
> 状態: ✅ Mixer Simple Window v1実装済み / v2でPlugin化予定
> 更新: Day29（アーキテクチャ整理・Day28壁打ち反映）

---

## 1. Purpose（目的）

Program/Preview バスの操作 UI を提供する。

v1 は **Mixer Simple Window**（固定実装）として提供する。
v2 で MixerPlugin Interface に準拠した Plugin 化を行い、コントリビューターが独自 Mixer を追加できるようにする。

---

## 2. 概念の二重構造（重要）

| 語彙 | レイヤー | 定義 |
|---|---|---|
| **MixerPlugin** | Plugin エコシステム | コントリビューターが開発・登録する Plugin 単位 |
| **Mixer Simple Window** | UX | MixerPlugin 起動時のデフォルト最小 UI |

- Mixer Simple Window は、カスタム Window Plugin が有効でないときのフォールバックとして機能する
- v1 では Mixer Simple Window 固定・MixerPlugin の交換は v2 から

---

## 3. Constraints（不変条件・MUSTルール）

- MUST: Transition Plugin 選択プルダウンを必ず持つ
- MUST: クロスフェーダーを必ず持つ
- MUST: エンジン API を通じてのみ Parameter Store を操作する（直接操作禁止）
- MUST: v1 の時点から MixerPlugin Interface に準拠する（v2 で設計変更ゼロにするため）
- MUST: `renderer` と `enabled` フィールドを持つ
- ~~MUST: 閉じることができない~~ → **廃止**（Day28壁打ちで廃止・View メニューから表示/非表示を切り替える）

---

## 4. Interface（型・APIシグネチャ）

```typescript
interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  component: React.FC   // Mixer Simple Window として表示される
}
```

---

## 5. ディレクトリ構成（Day29〜）

```
src/plugins/mixers/            ← MixerPlugin 専用ディレクトリ（新設）
└── simple-mixer/
    ├── index.ts               ← MixerPlugin 登録エントリー
    └── MixerSimpleWindow.tsx  ← デフォルト最小 UI（旧 SimpleMixer.tsx）
```

旧パス `src/plugins/windows/simple-mixer/` は Day29 に移動・リネーム済み。

---

## 6. Mixer Simple Window UI構成

```
┌─────────────────────────────────────┐
│  PROGRAM          PREVIEW           │
│  ┌────┐┌────┐┌────┐  ┌──────────┐  │
│  │ L1 ││ L2 ││ L3 │  │サムネイル│  │
│  │ ▓▓ ││ ▓▓ ││ ▓▓ │  │ 320×180 │  │
│  └────┘└────┘└────┘  └──────────┘  │
│  Transition: [ CrossFade       ▼ ] │
│  ════════════╪════════ CROSSFADER  │
│  [TAP]  128 BPM                    │
└─────────────────────────────────────┘
```

---

## 7. View メニューとの連携

Mixer Simple Window は View メニューから表示/非表示を切り替えられる。

```
View > Mixer Simple Window  （⌘3）
```

キーボードショートカット `3` でも同様にトグル可能。

---

## 8. エンジン API（Mixer Agent が使えるもの）

```typescript
engine.setTransition(id: string): void       // Transition 切り替え
engine.getLayers(): Layer[]                  // レイヤー状態取得
engine.clock                                 // BPM クロック（readonly）
```

---

## 9. 公式 MixerPlugin 一覧

| Plugin 名 | コンセプト | バージョン |
|---|---|---|
| Mixer Simple Window | 縦フェーダー × レイヤー数・最小構成・デフォルト | v1（固定）→ v2（Plugin 化） |
| Geometry Launcher | 自動化された MixerPlugin・BPM に合わせてスワップを自動実行 | v2 |
| CrossfadeMixer | Program/Preview 大画面 + クロスフェーダー・本格 VJ 向け | v2 |

---

## 10. Test Cases（検証可能な条件）

```typescript
// TC-1: Transition プルダウンが存在する
const { getByRole } = render(<MixerSimpleWindow />)
expect(getByRole('combobox')).toBeDefined()

// TC-2: クロスフェーダーが存在する
expect(getByRole('slider')).toBeDefined()
```

---

## 11. References

- 要件定義書 v1.9 §15「MixerPlugin」
- `src/plugins/mixers/CLAUDE.md`
- `docs/spec/simple-window.spec.md`
- `docs/spec/window-plugin.spec.md`
- Mixer Agent 担当範囲: `docs/spec/agent-roles.md`
