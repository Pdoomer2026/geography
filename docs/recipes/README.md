# GeoGraphy Recipes
# 成功した実装パターンの蓄積

> 目的: 同じパターンを再実装するときの参照・コントリビューター向けガイド
> 更新: 実装完了後にClaude Desktopが追記する

---

## Recipe一覧

| Recipe | 内容 | 追加日 |
|---|---|---|
| （Day12完了後に追加予定）geometry-plugin-basic | Geometry Plugin最小実装 | - |
| （Day12完了後に追加予定）layer-css-blend | CSSレイヤー合成パターン | - |
| transition-pure-function | execute()純粋関数パターン | 2026-03-18 |

---

## transition-pure-function
> CrossFade / Beat Cut で確立したパターン

### 要点
- `execute(from, to, progress)` は副作用ゼロ・新しいSceneStateを返す
- 引数のSceneStateを直接変更しない（`JSON.parse(JSON.stringify(from))` でディープコピー）
- `progress: 0.0` = fromのみ / `progress: 1.0` = toのみ

### コード例
```typescript
execute(from: SceneState, to: SceneState, progress: number): SceneState {
  const result = JSON.parse(JSON.stringify(from)) as SceneState
  result.layers = result.layers.map((layer, i) => ({
    ...layer,
    opacity: from.layers[i].opacity * (1 - progress) + to.layers[i].opacity * progress
  }))
  return result
}
```

### spec参照
`docs/spec/transition-plugin.spec.md` TC-4
