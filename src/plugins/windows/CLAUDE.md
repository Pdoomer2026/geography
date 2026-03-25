# src/plugins/windows - CLAUDE.md v2

## 役割

Window Plugin（各 Plugin へのカスタム UI）を管理する。
コントリビューターが開発・PR で追加できる領域。

spec: `docs/spec/window-plugin.spec.md`

**v1 では空（Window Plugin なし）。v2 から本格導入。**

---

## Window と Simple Window の違い

| 名称 | 定義 | v1 |
|---|---|---|
| **Simple Window** | 各 Plugin に付属するデフォルト最小 UI | ✅ 実装済み |
| **Window Plugin** | 各 Plugin へのカスタム UI・事前にデータ渡し先を宣言 | v2〜 |

Simple Window は `src/ui/` または `src/plugins/mixers/` に置く。
Window Plugin は `src/plugins/windows/` に置く。

---

## Window Plugin の定義

```typescript
interface WindowPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  targetPluginId: string   // データを渡す対象 Plugin の ID（事前に宣言）
  component: React.FC<WindowPluginProps>
}
```

---

## フォールバック動作

```
Window Plugin が有効（enabled=true）？
  → YES: 対応する Simple Window を非表示にする
  → NO:  対応する Simple Window を表示する（フォールバック）
```

---

## ディレクトリ構成（v2〜）

```
src/plugins/windows/
├── CLAUDE.md
└── [plugin-name]/
    ├── index.ts                 ← Window Plugin 登録エントリー
    ├── [Name]Window.tsx         ← カスタム UI コンポーネント
    ├── CLAUDE.md
    └── README.md                ← データ渡し先の宣言（MUST）
```

---

## MUST ルール

- MUST: Window Plugin は `targetPluginId` を必ず宣言すること
- MUST: `README.md` にデータ渡し先を明記すること
- MUST: Window Plugin が有効なとき、対応する Simple Window は非表示にすること
- MUST: エンジン API を通じてのみ Parameter Store を操作すること
- MUST: `<form>` タグを使用しないこと
