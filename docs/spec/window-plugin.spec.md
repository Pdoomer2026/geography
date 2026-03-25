# Window Plugin Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（概念定義）/ Window Plugin 開発者（実装）
> 状態: 🔴 新規作成（Day29・Day28壁打ち反映）
> 実装開始: v2〜

---

## 1. Purpose（目的）

Window Plugin は、各 Plugin に対してカスタム UI を差し込める仕組み。

事前にどの Plugin にデータを渡すかを宣言して設計する。
コントリビューターが開発・PR で追加できる。
有効化されると対応する Simple Window が非表示になる。

---

## 2. 概念の整理

```
Plugin エコシステム
│
├── Geometry Plugin    → カスタム UI が欲しいとき → Geometry Window Plugin（v2〜）
├── FX Plugin          → カスタム UI が欲しいとき → FX Window Plugin（v2〜）
├── MixerPlugin        → カスタム UI が欲しいとき → Mixer Window Plugin（v2〜）
└── MacroKnobManager   → カスタム UI が欲しいとき → MacroKnob Window Plugin（v2〜）

各 Plugin のデフォルト UI = Simple Window（v1から実装済み）
カスタム UI      = Window Plugin（v2〜）
```

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface WindowPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  targetPluginId: string   // データを渡す対象 Plugin の ID（事前に宣言）
  component: React.FC<WindowPluginProps>
}

interface WindowPluginProps {
  pluginId: string
  engine: EngineAPI         // エンジン API へのアクセス（読み取り専用）
}
```

---

## 4. フォールバック動作（Simple Window との関係）

```
Window Plugin が有効（enabled=true）？
  → YES: 対応する Simple Window を非表示にする
  → NO:  対応する Simple Window を表示する（フォールバック）
```

v1 では Window Plugin は実装しない。
v1 では常に Simple Window が表示される。

---

## 5. ディレクトリ構成

```
src/plugins/windows/           ← Window Plugin 置き場
└── [plugin-name]/
    ├── index.ts               ← Window Plugin 登録エントリー
    ├── [Name]Window.tsx       ← カスタム UI コンポーネント
    ├── CLAUDE.md              ← このプラグインの設計方針
    └── README.md              ← 使い方・データ渡し先の宣言
```

v1 では `src/plugins/windows/` は空（Window Plugin なし）。

---

## 6. データ渡し先の宣言（MUST）

Window Plugin は実装前に、どの Plugin にデータを渡すかを `README.md` に明記すること。

```markdown
# [Plugin Name] Window Plugin

## データ渡し先
- targetPluginId: "geometry-grid-wave"
- 渡すデータ: geometryParams（パラメーター一覧）

## 依存するエンジン API
- engine.getLayer(id).geometryParams
- engine.setGeometryParam(layerId, paramId, value)
```

---

## 7. View メニューとの連携

Window Plugin が提供する UI も、Simple Window と同様に View メニューから表示/非表示を切り替えられる。
View メニューへの項目追加は `electron/main.js` で行う。

---

## 8. Constraints（MUSTルール）

- MUST: Window Plugin は `targetPluginId` を必ず宣言すること
- MUST: Window Plugin は `README.md` にデータ渡し先を明記すること
- MUST: Window Plugin が有効なとき、対応する Simple Window は非表示にすること
- MUST: エンジン API を通じてのみ Parameter Store を操作すること（直接操作禁止）
- MUST: `<form>` タグを使用しないこと（onClick / onChange で代替）
- MUST: localStorage を使用しないこと

---

## 9. 実装開始条件（v2〜）

Window Plugin の本格導入は v2 から。以下が整ってから着手する：

1. Simple Window 体系が v1 で安定稼働していること
2. `targetPluginId` の解決ロジックが engine に実装されていること
3. Window Plugin の有効化/無効化を管理する仕組みが実装されていること

---

## 10. References

- 要件定義書 v1.9 §5「Window / Panel 設計」
- `docs/spec/simple-window.spec.md`
- `docs/spec/mixer-plugin.spec.md`
- `src/plugins/windows/CLAUDE.md`
