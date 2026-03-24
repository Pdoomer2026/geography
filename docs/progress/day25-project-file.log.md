# Day25 — Project File 実装ログ
> spec: docs/spec/project-file.spec.md
> 担当: Claude Desktop
> 日付: 2026-03-24

---

## 目標

Electron Phase 2: GeoGraphyProject 型の実装と SceneState の serialize / deserialize。
Project タブの Save / Load が実際に SceneState を含むファイルを読み書きする。

---

## ステップ記録

### Step 1: `GeoGraphyProject` 型を `src/types/index.ts` に追加 ✅

- `GeoGraphyProject` インターフェースを spec §3 に従い追加
- `PROJECT_FILE_VERSION = '1.0.0'` 定数を追加
- 既存の型定義（SceneState / LayerState 等）はそのまま維持

**変更ファイル**: `src/types/index.ts`

---

### Step 2: `engine.ts` に serialize / deserialize API を追加 ✅

追加メソッド:

| メソッド | 説明 |
|---|---|
| `getSceneState()` | 現在の layerManager 状態から SceneState を構築して返す |
| `loadSceneState(state)` | SceneState を programBus / previewBus に適用 |
| `buildProject(name)` | name + getSceneState() から GeoGraphyProject を構築 |
| `restoreProject(project)` | project.sceneState を loadSceneState() で復元 |

**変更ファイル**: `src/core/engine.ts`

---

### Step 3: `PreferencesPanel.tsx` の ProjectTab を GeoGraphyProject 対応に更新 ✅

変更点:
- 旧来の `ProjectFile` 型（空シェル）を削除し `GeoGraphyProject` に移行
- `handleSave()`: `engine.buildProject(projectName)` で実際の SceneState を含む JSON を生成・保存
- `handleSaveAs()`: 同上 + OS ダイアログ
- `handleLoad()`: JSON をパースして `engine.restoreProject(project)` を呼び出す
- プロジェクト名入力フィールドを追加（Save 前に名前を変更可能）
- `status` に `'saving'` / `'loading'` を追加してボタンの二重クリックを防止
- LocalStorage キーを `geography:project-v2` / `geography:recent-v2` に変更（旧データとの衝突回避）

**変更ファイル**: `src/ui/PreferencesPanel.tsx`

---

### Step 4: テスト追加 ✅

`tests/core/projectFile.test.ts` を新規作成。

テストケース（7件）:
1. JSON.stringify → JSON.parse でデータが失われない
2. sceneState の layers が正しくシリアライズされる
3. fxStack の各エントリーが正しく復元される
4. presetRefs が空オブジェクトとして保存・復元される
5. `PROJECT_FILE_VERSION` が `"1.0.0"` である
6. `savedAt` が ISO 8601 形式である
7. 複数レイヤーを持つ SceneState が正しく復元される

---

## 完了条件確認（実行待ち）

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

期待結果:
- tsc: PASS（型エラーゼロ）
- tests: 97 passed（90 + 7 新規）

---

## 実装しなかったこと（スコープ外）

- `presetRefs` の外部ファイル読み込み（spec §5 Step 3）→ v2 以降
- `setup.geometry` の復元（チェックリストへの反映）→ Day25候補2
- 自動保存（アプリ終了時 `autosave.geography`）→ Day25候補1の残り
