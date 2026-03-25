# src/plugins/mixers - CLAUDE.md

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
src/plugins/mixers/
├── CLAUDE.md
└── simple-mixer/
    ├── index.ts               ← MixerPlugin 登録エントリー
    └── MixerSimpleWindow.tsx  ← デフォルト最小 UI
```

コントリビューターが Mixer を追加する場合：
```
src/plugins/mixers/
└── [mixer-name]/
    ├── index.ts
    ├── [Name]SimpleWindow.tsx   または   [Name]Window.tsx（カスタム UI）
    ├── CLAUDE.md
    └── README.md
```

---

## MixerPlugin Interface

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

## MUST ルール

- MUST: `renderer` と `enabled` フィールドを持つこと
- MUST: v1 から MixerPlugin Interface に準拠した実装にすること（v2 で Plugin 化するとき設計変更ゼロにするため）
- MUST: Transition Plugin 選択プルダウンを必ず持つこと
- MUST: クロスフェーダーを必ず持つこと
- MUST: エンジン API を通じてのみ Parameter Store を操作すること
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）

---

## View メニューとの連携

Mixer Simple Window は View メニュー（⌘3）またはキーボード「3」で表示/非表示を切り替えられる。

---

## 公式 MixerPlugin 一覧

| Plugin 名 | バージョン |
|---|---|
| Mixer Simple Window（simple-mixer） | v1（固定）→ v2（Plugin 化） |
| Geometry Launcher | v2 |
| CrossfadeMixer | v2 |
