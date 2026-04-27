# Day81 Phase 1 プロンプト — LayerPreset / LayerInstance / LayerRuntime 型追加

## 前提確認

まず以下を読んでください：
1. `docs/spec/layer-window.spec.md`（今日の SSoT）
2. `src/application/schema/index.ts`（現行の型定義）

## やること（Phase 1 のみ）

`src/application/schema/index.ts` に以下の3つの型を追加する。

**追加する型（spec §2 に定義済み）：**

```typescript
// LayerPreset（§2.1）
export interface LayerPreset {
  id: string
  name: string
  geometryPluginId: string
  cameraPluginId: string
  fxPluginIds: string[]
  cameraParams?: Record<string, number>
  geometryParams?: Record<string, number>
  createdAt: string
}

// LayerInstance（§2.2）
export interface LayerInstance {
  id: string
  presetId: string
  layerId: string
}

// LayerRuntime（§2.3）
export interface LayerRuntime {
  layerId: string
  active: LayerInstance
  next: LayerInstance | null
}
```

## 追加場所

`schema/index.ts` の末尾（`GEO_PRESET_STORE_KEY` 定数の下）に追加する。

コメントブロックも付けること：

```typescript
// ============================================================
// Layer Window（spec: docs/spec/layer-window.spec.md）
// ============================================================
```

## 完了条件

- `pnpm tsc --noEmit` エラーゼロ
- `pnpm test --run` 129 tests 全グリーン（既存テストが壊れていないこと）

## 注意

- `any` 禁止
- 既存の型・定数は一切変更しない
- Phase 2（layerManager 拡張）は今日はやらない
