# src/ui/components/mixers - CLAUDE.md v2

## 役割

MixerPlugin とその Simple Window を管理する。
Mixer Agent がコントリビューションする領域（v2〜）。

spec: `docs/spec/mixer-plugin.spec.md`

---

## 概念の二重構造（重要）

| 語彙 | レイヤー | 定義 |
|---|---|---|
| **MixerPlugin** | Plugin エコシステム | コントリビューターが開発・登録する Plugin 単位 |
| **Mixer Simple Window** | UX | MixerPlugin 起動時のデフォルト最小 UI |

Mixer Simple Window は、カスタム Window Plugin がないときのフォールバック。
v1 では Mixer Simple Window 固定。MixerPlugin の交換は v2 から。

---

## ディレクトリ構成

```
src/ui/components/mixers/
├── CLAUDE.md
└── simple-mixer/
    ├── index.ts
    └── MixerSimpleWindow.tsx
```

コントリビューターが Mixer を追加する場合：
```
src/ui/components/mixers/
└── [mixer-name]/
    ├── index.ts
    ├── [Name]SimpleWindow.tsx   または   [Name]Window.tsx（カスタム UI）
    ├── CLAUDE.md
    └── README.md
```

---

## MixerPlugin Interface

```typescript
/**
 * MixerPlugin は現在 PluginBase を継承していない特殊な存在。
 * params を持たないため ModulatablePlugin 非対象。
 *
 * TODO（v2〜）: CC706（Crossfade）対応時に ModulatablePlugin への編入を検討する。
 *   その時点で PluginBase 継承に統一する。
 */
interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  component: React.FC   // Mixer Simple Window として表示される
}
```

### Plugin 二分類における MixerPlugin の位置づけ

| 分類 | 対象 | MixerPlugin |
|---|---|---|
| ModulatablePlugin | Geometry / FX / Particle | — |
| PluginBase のみ | Transition / Window | — |
| **特殊** | **現在は独自定義** | **✅ ここ** |

Mixer は UI を持つコンポーネントのため、MIDI 2.0 外部制御は現在不要。

---

## Mixer Simple Window UI（Phase 11 確定版）

```
┌─────────────────────────────────────────────────────────┐
│  MIXER SIMPLE WINDOW                                    │
│                                                         │
│  EDIT view              OUTPUT view                     │
│  L1    L2    L3         L1    L2    L3                  │
│  ┌──┐  ┌──┐  ┌──┐      ┌──┐  ┌──┐  ┌──┐               │
│  │▓▓│  │  │  │▓▓│      │▓▓│  │▓▓│  │  │               │
│  └──┘  └──┘  └──┘      └──┘  └──┘  └──┘               │
│  80%    0%  100%        100%  60%    0%                 │
│                                                         │
│                     ⇄ SWAP                              │
│                                                         │
│         Large: [ EDIT ]    Small: [ OUTPUT ]            │
└─────────────────────────────────────────────────────────┘
```

- **Edit view 縦フェーダー × 3本**（左側）: L1/L2/L3 の Edit view への Opacity（0〜100%）
- **Output view 縦フェーダー × 3本**（右側）: L1/L2/L3 の Output view への Opacity（0〜100%）
- **⇄ SWAP ボタン**: Large screen と Small screen のアサインを完全入れ替え
- **アサインラベル**: 現在のアサインを常に表示（`Large: [ EDIT ]  Small: [ OUTPUT ]`）

---

## MUST ルール

- MUST: `renderer` と `enabled` フィールドを持つこと
- MUST: v1 から MixerPlugin Interface に準拠した実装にすること（v2 で Plugin 化するとき設計変更ゼロにするため）
- MUST: Edit view 用縦フェーダー × 3本（L1/L2/L3）を持つこと
- MUST: Output view 用縦フェーダー × 3本（L1/L2/L3）を持つこと
- MUST: ⇄ SWAP ボタンを持つこと（Large/Small screen のアサイン入れ替え）
- MUST: Large screen / Small screen の現在のアサインを常にラベル表示すること
- MUST: エンジン API を通じてのみ Parameter Store を操作すること
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）

## v2 送り（コードは残す・UI は非表示）

以下は実装済みだが v1 では UI を非表示にする：
- Transition Plugin 選択プルダウン
- Crossfader
- Tap Tempo / BPM

---

## View メニューとの連携

Mixer Simple Window は View メニュー（⌘3）またはキーボード「3」で表示/非表示を切り替えられる。

---

## 用語定義（Day30確定）

| 用語 | 定義 |
|---|---|
| **Large screen** | Electronメインウィンドウ（大画面） |
| **Small screen** | MixerSimpleWindow内の小画面 |
| **Output view** | 出力映像（観客に見せる映像）|
| **Edit view** | 編集映像（次に出す映像を仕込む場所）|

詳細仕様: `docs/spec/program-preview-bus.spec.md` / `docs/spec/mixer-plugin.spec.md`

---

## 公式 MixerPlugin 一覧

| Plugin 名 | バージョン |
|---|---|
| Mixer Simple Window（simple-mixer） | v1（固定）→ v2（Plugin 化） |
| Geometry Launcher | v2 |
| CrossfadeMixer | v2 |
