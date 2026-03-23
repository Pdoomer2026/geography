# Day22 進捗ログ

> 日付: 2026-03-23
> ブランチ: main

---

## 完了したこと

### 1. CLAUDE.md v8 更新
- 開発環境制約セクションを新設
- filesystem MCP が使えれば Claude Desktop 環境と判断できることを明記
- ターミナルコマンド依頼時は必ずコピペ可能なコマンドを渡すルールを追加

### 2. 誤った変更のロールバック
- `src/types/index.ts` の `IFxStack` に承認なしで追加した `setComposer()` を削除
- tsc エラーゼロ・90 tests グリーンに復帰

### 3. SimpleMixer.tsx PREVIEW バス修正
- `previewBus.mount()` を useEffect 内で呼ぶよう修正
- canvas が未生成なら mount() で生成してから append する

### 4. 壁打ち：Preferences パネル・Electron・プロジェクトファイル設計
- ⚙ ボタン（画面左上固定）→ タブ切り替えパネル
- タブ: Setup / Project / Plugins / Audio / MIDI / Output
- Setup タブ: 使う Geometry・FX を選択 → [APPLY]
- Project タブ: プロジェクトファイルの Save / Load / Save As
- GeoGraphy を Electron アプリとして配布することを決定
- プラグイン配布: v1手動 → v2ドロップ → v3ストアの段階的導入
- プロジェクトファイル（.geography）の構造を設計

### 5. spec ファイル新規作成（3つ）
- `docs/spec/electron.spec.md`
- `docs/spec/preferences-panel.spec.md`
- `docs/spec/project-file.spec.md`

---

## テスト・型チェック状態

- tsc: PASS（型エラーゼロ）
- tests: 90 passed（変化なし）

---

## コミット

- `feat: Day21 - Camera System + Opacity Slider + FX Layer Tab + Plugin Lifecycle Spec + CLAUDE.md v8`
- `docs: Day22 - Electron / Preferences Panel / Project File spec`
