cd /Users/shinbigan/geography && git add -A && git commit -m "feat: introduce Zod schema for DragPayload (Day69)" \
  -m "feat: zod/dragPayload.schema.ts を新設（UI→Application 境界の実行時検証）
refactor: schema/index.ts の手書き DragPayload interface を Zod 派生型に差し替え
fix: MacroWindow drop ハンドラーを safeParse に変更（不正 payload を console.error で検出）
Zod パターン確立・Sequencer Lane 等の拡張はこのパターンで実施する"
