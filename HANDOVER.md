# GeoGraphy 引き継ぎメモ｜Day72｜2026-04-21

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
| useSimpleParamRow | `src/ui/hooks/useSimpleParamRow.ts` |
| useDnDParamRow | `src/ui/hooks/useDnDParamRow.ts` |
| useStandardParamRow | `src/ui/hooks/useStandardParamRow.ts` |
| useStandardDnDParamRow | `src/ui/hooks/useStandardDnDParamRow.ts` |
| CommandStream（RxJS） | `src/application/command/commandStream.ts` |
| GeoStore（Zustand） | `src/ui/store/geoStore.ts` |
| Engine | `src/application/orchestrator/engine.ts` |
| FxStack | `src/application/orchestrator/fxStack.ts` |
| App.tsx | `src/ui/App.tsx` |
| FX index | `src/engine/fx/index.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day72`（最新コミット: `36f744d`）
- **テスト**: 127 tests グリーン・tsc エラーゼロ
- **Day72 コミット一覧**:
  ```
  36f744d refactor: migrate all Geometry Plugins to ParamCatalog (Day72)
  ```

---

## Day72 で完了したこと

### ParamCatalog 移行（全 Geometry Plugin 対応完了）
- `param-catalog.spec.md` §6 の移行戦略に基づき icosphere 以外の全6 Plugin を catalog 対応
- 対象: `torus` / `torusknot` / `contour` / `hex-grid` / `grid-tunnel` / `grid-wave`
- 各 `[plugin].config.ts`: `PluginCatalog` + `catalogToPluginParams` を導入。`defaultParams` の重複定義を廃止
- 各 `index.ts`: `catalog` フィールドを Plugin オブジェクトに追加（`ModulatablePlugin.catalog` に接続）
- `step` 値を初めて明示的に定義（整数系: 1 / 小数0.1刻み: 0.1 / 細かい調整: 0.01）
- **全7 Plugin が catalog 対応済みになった**（icosphere + 今回の6本）

---

## アーキテクチャ確定事項（Day71）

### イベント駆動の2本立て設計
```
onRegistryChanged  → プラグイン構造変化（Plugin切り替え・登録/解除）
onParamChanged     → パラメーター値変化（MacroKnob 操作・スライダー操作）
```

### paramCommand$ フロー（全Window統一済み）
```
UI スライダー操作
  → useSimpleParamRow / useDnDParamRow / useStandardParamRow 等
  → paramCommand$.next({ slot, value, source: 'window', layerId })
  → App.tsx の throttleTime(16ms)
  → engine.handleMidiCC()
  → flushParameterStore()
  → onParamChanged 発火 → Window 再描画
```

### FX_STACK_ORDER（12本・確定）
```
after-image → feedback → bloom → kaleidoscope → mirror
→ zoom-blur → rgb-shift → crt → glitch → film → frei-chen → color-grading（最後）
```

---

## 次回やること

### 優先度 高
1. **Sequencer Window spec 検討**（Phase 16）
   - `docs/spec/` に `sequencer-window.spec.md` を新規作成
   - BPM クロックとの連携設計

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
Day73開始
```
