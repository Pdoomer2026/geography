# Plugin Registry Spec

> SSoT: このファイル
> 対応実装: `src/core/registry.ts`
> 担当エージェント: Claude Code
> 状態: ✅ 実装済み・仕様化

---

## 1. Purpose（目的）

全Pluginを一元管理する。import.meta.globによる自動登録で、
エージェントがPluginを追加してもClaude Codeへの依頼なしに即時反映される。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: Pluginの登録はimport.meta.globによる自動登録のみ（手動登録禁止）
- MUST: registryはengine.tsからのみ操作する
- MUST: 各Plugin GroupはENABLED_PLUGIN_GROUPSフラグで有効/無効を切り替える
- MUST: 無効なPlugin Groupのプラグインはregistryに登録しない

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface PluginRegistry {
  register(plugin: PluginBase): void
  get(id: string): PluginBase | undefined
  list(): PluginBase[]
  listByType(type: 'geometry' | 'fx' | 'particle' | 'light' | 'transition'): PluginBase[]
}
```

---

## 4. 自動登録パターン

```typescript
// 各カテゴリのindex.tsで使用
const modules = import.meta.glob('./*/index.ts', { eager: true })
Object.values(modules).forEach((m: any) => registry.register(m.default))
```

---

## 5. Plugin Groupフラグ（config.ts）

```typescript
export const ENABLED_PLUGIN_GROUPS = {
  threejs: true,    // v1
  pixijs: false,    // v2
  opentype: false,  // v3
}
```

---

## 6. Test Cases（検証可能な条件）

```typescript
// TC-1: register後にgetで取得できる
registry.register(mockPlugin)
expect(registry.get(mockPlugin.id)).toEqual(mockPlugin)

// TC-2: list()は登録済み全Pluginを返す
expect(registry.list().length).toBeGreaterThan(0)

// TC-3: 同じidで上書き登録するとエラー
expect(() => registry.register(duplicatePlugin)).toThrow()
```

---

## 7. References

- 実装計画書 v2.5 §4.3
- `src/core/registry.ts`
- `src/core/config.ts` — ENABLED_PLUGIN_GROUPS
