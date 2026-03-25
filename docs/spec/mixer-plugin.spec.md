# Mixer Plugin Spec

> SSoT: このファイル
> 対応実装: `src/plugins/mixers/simple-mixer/**`
> 担当エージェント: Mixer Agent
> 状態: ✅ Mixer Simple Window v1実装済み / 🔴 Phase 11 UI再設計・未実装
> 更新: Day30（Output/Edit view・縦フェーダー6本・SWAPボタン・Transition/Crossfader v2送り）

---

## 1. Purpose（目的）

Output view / Edit view のレイヤールーティング操作 UI を提供する。

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

- MUST: Edit view 用縦フェーダー × 3本（L1/L2/L3）を持つこと
- MUST: Output view 用縦フェーダー × 3本（L1/L2/L3）を持つこと
- MUST: ⇄ SWAP ボタンを持つこと（Large/Small screen のアサイン入れ替え）
- MUST: Large screen / Small screen の現在のアサインを常にラベル表示すること
- MUST: エンジン API を通じてのみ Parameter Store を操作する（直接操作禁止）
- MUST: v1 の時点から MixerPlugin Interface に準拠する（v2 で設計変更ゼロにするため）
- MUST: `renderer` と `enabled` フィールドを持つこと
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）
- ~~MUST: 閉じることができない~~ → **廃止**（Day28壁打ちで廃止・View メニューから表示/非表示を切り替える）
- ~~MUST: Transition Plugin 選択プルダウンを必ず持つ~~ → **v2送り**（Day30壁打ち）
- ~~MUST: クロスフェーダーを必ず持つ~~ → **v2送り**（Day30壁打ち）

---

## 4. v2 送り機能（コードは残す・UI は非表示）

以下の機能は実装済みだが、v1 では UI を非表示にする。
コードは削除せずカプセル化して保持すること。

| 機能 | v1 | v2 |
|---|---|---|
| Transition プルダウン | **非表示** | 表示 |
| Crossfader | **非表示** | 表示 |
| Tap Tempo / BPM | **非表示** | 表示 |

---

## 5. Interface（型・APIシグネチャ）

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

## 6. ディレクトリ構成（Day29〜）

```
src/plugins/mixers/            ← MixerPlugin 専用ディレクトリ（新設）
└── simple-mixer/
    ├── index.ts               ← MixerPlugin 登録エントリー
    └── MixerSimpleWindow.tsx  ← デフォルト最小 UI（旧 SimpleMixer.tsx）
```

旧パス `src/plugins/windows/simple-mixer/` は Day29 に移動・リネーム済み。

---

## 7. Mixer Simple Window UI構成（Phase 11 確定版）

```
┌─────────────────────────────────────────────────────────┐
│  MIXER SIMPLE WINDOW                                    │
│                                                         │
│  EDIT view              OUTPUT view                     │
│  L1    L2    L3         L1    L2    L3                  │
│  ┌──┐  ┌──┐  ┌──┐      ┌──┐  ┌──┐  ┌──┐               │
│  │▓▓│  │  │  │▓▓│      │▓▓│  │▓▓│  │  │               │
│  │▓▓│  │  │  │▓▓│      │▓▓│  │▓▓│  │  │               │
│  │▓▓│  │  │  │▓▓│      │▓▓│  │▓▓│  │  │               │
│  └──┘  └──┘  └──┘      └──┘  └──┘  └──┘               │
│  80%    0%  100%        100%  60%    0%                 │
│                                                         │
│                     ⇄ SWAP                              │
│                                                         │
│         Large: [ EDIT ]    Small: [ OUTPUT ]            │
└─────────────────────────────────────────────────────────┘
```

### フェーダー仕様

- **Edit view 縦フェーダー × 3本**（左側）: L1/L2/L3 の Edit view への Opacity（0〜100%）
- **Output view 縦フェーダー × 3本**（右側）: L1/L2/L3 の Output view への Opacity（0〜100%）
- 各フェーダーは独立・同じレイヤーを両方に含めることができる
- Opacity 0% = そのビューにブレンドされない / 100% = 完全にブレンド

### SWAP ボタン仕様

- ⇄ SWAP ボタン1つで Large screen と Small screen のアサインを完全入れ替え
- ボタン下部に現在のアサインを常にラベル表示（`Large: [ EDIT ]  Small: [ OUTPUT ]` 等）
- ラベルがないと操作者が混乱するため**必須**

---

## 8. View メニューとの連携

Mixer Simple Window は View メニューから表示/非表示を切り替えられる。

```
View > Mixer Simple Window  （⌘3）
```

キーボードショートカット `3` でも同様にトグル可能。

---

## 9. エンジン API（Mixer Agent が使えるもの）

```typescript
engine.getLayers(): Layer[]                              // レイヤー状態取得
engine.setLayerOpacity(layerId, opacity): void           // Opacity 更新
engine.clock                                             // BPM クロック（readonly）

// Phase 11 で追加予定
engine.setLayerRouting(layerId, routing: LayerRouting): void
engine.getScreenAssign(): ScreenAssignState
engine.swapScreenAssign(): void
```

---

## 10. 公式 MixerPlugin 一覧

| Plugin 名 | コンセプト | バージョン |
|---|---|---|
| Mixer Simple Window | 縦フェーダー6本（Edit×3 + Output×3）・SWAP・最小構成・デフォルト | v1（固定）→ v2（Plugin 化） |
| Geometry Launcher | 自動化された MixerPlugin・BPM に合わせてスワップを自動実行 | v2 |
| CrossfadeMixer | Program/Preview 大画面 + クロスフェーダー・本格 VJ 向け | v2 |

---

## 11. Test Cases（検証可能な条件）

```typescript
// TC-1: Edit view フェーダーが3本存在する（L1/L2/L3）
// TC-2: Output view フェーダーが3本存在する（L1/L2/L3）
// TC-3: SWAP ボタンが存在する
// TC-4: SWAP後にラベルが切り替わる
//   Large: OUTPUT → SWAP → Large: EDIT
//   Small: EDIT   → SWAP → Small: OUTPUT
```

---

## 12. References

- 要件定義書 v1.9 §15「MixerPlugin」
- 実装計画書 v3.1 §6「Phase 11」
- `src/plugins/mixers/CLAUDE.md`
- `docs/spec/simple-window.spec.md`
- `docs/spec/program-preview-bus.spec.md`（Output/Edit view・ルーティング定義）
- `docs/spec/window-plugin.spec.md`
- Mixer Agent 担当範囲: `docs/spec/agent-roles.md`
