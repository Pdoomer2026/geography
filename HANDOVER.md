# GeoGraphy 引き継ぎメモ｜Day70｜2026-04-21

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41 / RxJS 7.8.2 / Zustand 5.0.12 / Zod 4.3.6
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| ParamCatalog spec | `docs/spec/param-catalog.spec.md` |
| DragPayload スキーマ | `src/application/schema/zod/dragPayload.schema.ts` |
| RangeConstraint スキーマ | `src/application/schema/zod/rangeConstraint.schema.ts` |
| AssignProposal スキーマ | `src/application/schema/zod/assignProposal.schema.ts` |
| useDnDParamRow | `src/ui/hooks/useDnDParamRow.ts` |
| useStandardParamRow | `src/ui/hooks/useStandardParamRow.ts` |
| useStandardDnDParamRow | `src/ui/hooks/useStandardDnDParamRow.ts` |
| CommandStream（RxJS） | `src/application/command/commandStream.ts` |
| GeoStore（Zustand） | `src/ui/store/geoStore.ts` |
| Engine | `src/application/orchestrator/engine.ts` |
| App.tsx | `src/ui/App.tsx` |
| MacroWindow | `src/ui/components/window/macro-window/MacroWindow.tsx` |
| Playwright config | `playwright.config.ts` |
| e2e テスト | `tests/e2e/standardDnDWindow.spec.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day70`（最新コミット: `92eeb35`）
- **テスト**: 127 tests グリーン・tsc エラーゼロ
- **Day70 コミット一覧**:
  ```
  92eeb35 feat: extract useStandardDnDParamRow / useStandardParamRow / useDnDParamRow hooks
  a3ef660 chore: add test-results and playwright-report to .gitignore
  bc231d8 feat: introduce RangeConstraint and AssignProposal Zod schemas
  ```

---

## Day70 で完了したこと

### Zod スキーマ整理
- `RangeConstraintSchema` 新設（lo/hi = ユーザーが設定した操作範囲）
- `AssignProposalSchema` 新設（MacroKnob アサイン時の初期提案値）
- `DragPayloadSchema` の `lo/hi` フラット → `proposal: AssignProposal` に変更
- `MacroWindow` / `Macro8Window` の `AssignDialog` を `payload.proposal?.lo/hi` に修正

### ParamRow フック3本 抽出
- `useDnDParamRow` → SimpleDnD 系（D&D ハンドルのみ）
- `useStandardParamRow` → Standard 系（lo/hi リマップ正規化）
- `useStandardDnDParamRow` → StandardDnD 系（lo/hi + proposal D&D）
- 対象 Window 9ファイル全て差し替え完了・ブラウザ動作確認済み

### Playwright 導入
- `@playwright/test` インストール・chromium セットアップ
- `tests/e2e/` ディレクトリ新設
- Vitest から e2e テストを除外（`vite.config.ts` の `exclude` 追加）

---

## アーキテクチャ方針（Day70 確定）

### 概念の分離（重要）
| 概念 | 定義元 | 意味 |
|---|---|---|
| `min / max` | Plugin（config.ts） | パラメーターの物理的な限界値 |
| `lo / hi` | ユーザー（RangeSlider） | ユーザーが設定した操作範囲 |
| `proposal` | StandardDnDWindow | MacroKnob アサイン初期提案値 |

### データフロー（StandardDnDWindow → MacroKnob）
```
RangeSlider の lo/hi（RangeConstraint）
    ↓ useStandardDnDParamRow が D&D payload に proposal として乗せる
    ↓ MacroWindow の AssignDialog が proposal.lo/hi を初期値として表示
    ↓ ユーザーが確認・調整
MacroAssign.min / max（0〜1 の正規化済み確定値）
```

### フック設計
```
useDnDParamRow          → SimpleDnD 系（D&D + paramCommand$）
useStandardParamRow     → Standard 系（lo/hi リマップ + paramCommand$）
useStandardDnDParamRow  → StandardDnD 系（lo/hi + proposal D&D + paramCommand$）
```

---

## 次回やること

### 優先度 高
1. **他 Window の RxJS 切り替え**（未完了）
   - SimpleWindow / StandardWindow 系は `engine.handleMidiCC()` 直接呼び出しのまま
   - → `paramCommand$.next()` に統一する
2. **他 Window の Zustand 移行**（未完了）
   - MacroWindow のみ対応済み
   - → `setInterval 200ms` ポーリングを `useGeoStore()` に置き換え
3. **`film` / `frei-chen` が FX_STACK_ORDER に未登録警告対応**

### 優先度 中
4. **Sequencer Window spec 検討**（Phase 16）

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **e2e テスト**: `pnpm exec playwright test --headed`（pnpm dev 起動中に実行）
- **実装ルール**: 実装前に必ず提案 → 確認 → 実装の順で進める
- **git commit**: 日本語長文は `.claude/dayN-commit.sh` に書いて `bash` で実行
- **NFC 正規化**: 日本語ファイル編集後は `python3 /Users/shinbigan/nfc_normalize.py`

---

## 次回チャット用スタートプロンプト

```
Day71開始
```
