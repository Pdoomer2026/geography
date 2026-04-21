# GeoGraphy 引き継ぎメモ｜Day68（src/core/ 完全解体）｜2026-04-21

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| CC Mapping（SSoT） | `docs/spec/cc-mapping.md` |
| CC Map JSON（自動生成） | `settings/cc-map.json` |
| Engine | `src/application/orchestrator/engine.ts` |
| LayerManager | `src/application/orchestrator/layerManager.ts` |
| FxStack | `src/application/orchestrator/fxStack.ts` |
| Clock | `src/application/orchestrator/tempo/clock.ts` |
| Registry | `src/application/registry/registry.ts` |
| TransportManager | `src/application/registry/transportManager.ts` |
| TransportRegistry | `src/application/registry/transportRegistry.ts` |
| AssignRegistry | `src/application/registry/assignRegistry.ts` |
| ParameterStore | `src/application/registry/state/parameterStore.ts` |
| CcMapService | `src/application/catalog/ccMapService.ts` |
| ProjectManager | `src/application/adapter/storage/projectManager.ts` |
| PresetStore | `src/application/adapter/storage/presetStore.ts` |
| App.tsx | `src/ui/App.tsx` |
| application/schema（型定義） | `src/application/schema/index.ts` |
| Config 定数 | `src/application/schema/config.ts` |
| Command | `src/application/command/command.ts` |
| geo-transitions | `src/application/command/geo-transitions/` |
| MidiInputWrapper | `src/application/adapter/input/MidiInputWrapper.ts` |
| 引き継ぎ（最新） | `docs/handover/day68-2026-04-21.md` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day68`（最新コミット: `d0c858f`）
- **テスト**: 127 tests グリーン・tsc エラーゼロ
- **PR #1**: https://github.com/Pdoomer2026/geography/pull/1

---

## 確定したアーキテクチャ（Day68）

```
src/
  engine/              Three.jsプラグイン（疎結合）
    geometry/ fx/ cameras/ lights/ particles/

  application/         意思決定・Registry・Transport
    orchestrator/      エンジン中枢
      engine.ts
      layerManager.ts
      fxStack.ts
      programBus.ts
      previewBus.ts
      tempo/clock.ts
    registry/          パラメータ管理
      registry.ts
      transportManager.ts
      transportRegistry.ts
      assignRegistry.ts
      state/parameterStore.ts
    command/
      command.ts
      geo-transitions/
    catalog/
      ccMapService.ts   ← 将来 paramCatalog に昇格予定
    adapter/
      input/MidiInputWrapper.ts
      storage/projectManager.ts presetStore.ts
    schema/
      index.ts  config.ts  midi-registry.ts
      windowMode.ts  geoAPI.d.ts  midiRegistry.ts

  ui/                  表示・操作
    components/window/ mixers/
    panels/
    hooks/

  core/                CLAUDE.md のみ残存（ファイルなし）
  types/               自動生成ファイルのみ（geo-cc-map.generated.ts等）
```

---

## Day68 で完了したこと

### src/core/ 完全解体（17ファイル → application/ へ移行）

| Step | 移行ファイル | 新パス |
|---|---|---|
| 1 | config.ts | application/schema/config.ts |
| 1 | command.ts | application/command/command.ts |
| 1 | clock.ts | application/orchestrator/tempo/clock.ts |
| 1 | midiRegistry.ts | application/schema/midiRegistry.ts |
| 2 | registry.ts | application/registry/registry.ts |
| 2 | transportRegistry.ts | application/registry/transportRegistry.ts |
| 2 | assignRegistry.ts | application/registry/assignRegistry.ts |
| 2 | parameterStore.ts | application/registry/state/parameterStore.ts |
| 2 | transportManager.ts | application/registry/transportManager.ts |
| 3 | presetStore.ts | application/adapter/storage/presetStore.ts |
| 3 | projectManager.ts | application/adapter/storage/projectManager.ts |
| 4 | programBus.ts | application/orchestrator/programBus.ts |
| 4 | previewBus.ts | application/orchestrator/previewBus.ts |
| 4 | fxStack.ts | application/orchestrator/fxStack.ts |
| 5 | ccMapService.ts | application/catalog/ccMapService.ts |
| 5 | layerManager.ts | application/orchestrator/layerManager.ts |
| 5 | engine.ts | application/orchestrator/engine.ts |

- shim方式で安全に移行（各Step後にtsc+testグリーン確認）
- 全 import を新パスに更新後 shim を完全削除
- src/engine/ 3ファイルの registry 参照も更新
- src/core/ は CLAUDE.md のみ残存（実装ファイルゼロ）

---

## 次回やること

1. **Sequencer Window spec 検討**（Phase 16）
2. **`film` / `frei-chen` が FX_STACK_ORDER に未登録**（警告対応）
3. **CLAUDE.md の更新**（src/core/ 解体を反映、新パスを記載）
4. **src/core/CLAUDE.md の扱い決定**（削除 or 廃止注記追加）

---

## 環境メモ

- **ブランチ**: `refactor/day53-design`
- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **実装ルール**: 実装前に必ず提案 → 確認 → 実装の順で進める
- **git commit**: 日本語長文は `.claude/dayN-commit.txt` に書いて `git commit -F` で実行
- **write_file ルール**: 既存ファイルには使わない（`edit_file` を使う）
- **NFC 正規化**: 日本語ファイル編集後は `python3 /Users/shinbigan/nfc_normalize.py`

---

## 次回チャット用スタートプロンプト

```
Day69開始
```
