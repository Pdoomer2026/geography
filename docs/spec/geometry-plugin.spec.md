# Geometry Plugin Spec

> SSoT: このファイル
> 対応実装: `src/plugins/geometry/**`
> 担当エージェント: Geometry Agent
> 状態: ✅ grid-wave実装済み / contour・grid-tunnel未着手

---

## 1. Purpose（目的）

Three.jsで幾何学パターンを描画するPluginの共通仕様。
コントリビューターがこのspecに従ってPluginを追加できる。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: `renderer: 'threejs'` を必ず設定
- MUST: `enabled: true` をデフォルト値として設定
- MUST: `destroy()` で `geometry.dispose()` / `material.dispose()` / `scene.remove()` を呼ぶ
- MUST: `update()` で新規オブジェクトをアロケートしない（GC負荷）
- MUST: 頂点を動かす場合は `geometry.attributes.position.needsUpdate = true` を設定
- MUST: ColorはHue / Alphaのみ管理（Saturation等はColorGrading FXに委譲）
- MUST: 各Pluginディレクトリに `template-basic.md` を用意する

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface GeometryPlugin extends PluginBase {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  params: Record<string, PluginParam>
}

interface PluginBase {
  id: string          // 'grid-wave' など kebab-case
  name: string        // 'Grid Wave' など表示名
  renderer: 'threejs' // Geometry Pluginは常に 'threejs'
  enabled: boolean    // デフォルト true
}
```

---

## 4. ファイル構成（必須）

```
plugins/geometry/[category]/[name]/
├── index.ts              ← GeometryPlugin export（デフォルトexport）
├── [Name]Geometry.ts     ← Three.jsロジック
├── [name].config.ts      ← パラメーター定義
├── README.md             ← ユーザー向け説明
├── CLAUDE.md             ← 実装ガイド（Claude Code / Agents向け）
├── template-basic.md     ← 厳選パラメーター + Recommended設定
└── template-all.md       ← 全パラメーター
```

---

## 5. 自動登録

```typescript
// src/plugins/geometry/index.ts
const modules = import.meta.glob('./*/index.ts', { eager: true })
Object.values(modules).forEach((m: any) => registry.register(m.default))
```

**index.tsにデフォルトexportがあれば自動登録される。Geometry Agentの追加作業はPluginディレクトリの作成のみ。**

---

## 6. v1実装プラグイン

| カテゴリ | Plugin | 状態 |
|---|---|---|
| wave | grid-wave | ✅ 実装済み |
| terrain | contour | ⬜ 未着手 |
| tunnel | grid-tunnel | ⬜ 未着手 |

---

## 7. Test Cases（検証可能な条件）

```typescript
// TC-1: renderer と enabled フィールドが存在する
expect(plugin.renderer).toBe('threejs')
expect(plugin.enabled).toBeDefined()

// TC-2: create() 後にsceneにオブジェクトが追加される
plugin.create(scene)
expect(scene.children.length).toBeGreaterThan(0)

// TC-3: destroy() 後にsceneからオブジェクトが除去される
plugin.create(scene)
plugin.destroy(scene)
expect(scene.children.length).toBe(0)

// TC-4: update() は例外を投げない
expect(() => plugin.update(0.016, 0.5)).not.toThrow()
```

---

## 8. References

- 要件定義書 v1.7 §11「Geometry Plugin」
- `src/plugins/geometry/CLAUDE.md`
- Geometry Agent担当範囲: `docs/spec/agent-roles.md`
