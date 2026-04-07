# GeoGraphy 引き継ぎメモ｜Day43（CC Mapping 3層構造 実装完了）｜2026-04-07

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11） |
| CC Mapping SSoT | `docs/spec/cc-mapping.md`（v0.2） |
| CC Mapping 設計仕様 | `docs/spec/cc-mapping.spec.md` |
| CC Standard | `docs/spec/cc-standard.spec.md`（v0.3） |
| CC Map 生成スクリプト | `scripts/generate-cc-map.ts`（Day43新設） |
| CC Map JSON（自動生成物） | `settings/cc-map.json`（Day43新設・手動編集禁止） |
| CC Map Service | `src/core/ccMapService.ts`（Day43新設） |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| MacroKnob コア | `src/core/macroKnob.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day41`（Day42・Day43 はこのセッションでコミット予定）
- **テスト**: 112 tests グリーン・tsc エラーゼロ

---

## Day43 で完了したこと

### A. 型定義更新（`src/types/index.ts`）

- `MacroAssign.ccNumber: number`（必須フィールド）を追加・旧 `defaultCC?: number` を削除
- `MacroKnobManager` Interface に `addAssign()` / `removeAssign()` を追加
- `GeoGraphyProject` に `macroKnobAssigns: MacroKnobConfig[]` を追加（永続化対応）

### B. `src/core/macroKnob.ts` 更新

- `addAssign(knobId, assign)` 実装（MAX_ASSIGNS 超過時は throw）
- `removeAssign(knobId, paramId)` 実装

### C. `scripts/generate-cc-map.ts` 新規作成

- `docs/spec/cc-mapping.md` をパースして `settings/cc-map.json` を生成
- 未マッピング paramId を警告出力する機能付き
- `tsx` を devDependencies に追加
- `package.json` に `"gen:cc-map": "tsx scripts/generate-cc-map.ts"` を追加

### D. `settings/cc-map.json` 生成

- `pnpm gen:cc-map` を実行して 71 mappings を生成
- Geometry 7本・Particle 1本・FX 12本 = 全 20 Plugin 対応

### E. `src/core/ccMapService.ts` 新規作成

- `ParamMapping` / `CcMapService` Interface を定義
- Layer 1（cc-map.json）と Layer 2（cc-overrides.json）をマージして lookup
- `getCcNumber()` / `getMapping()` / `getAllMappings()` / `applyOverride()` / `resetOverride()` / `resetAllOverrides()` を実装
- `window.geoAPI` が optional なことに対応（`?.` チェーン）

### F. `electron/main.js` + `electron/preload.js` 更新

- `load-cc-map` IPC ハンドラー追加（settings/cc-map.json を返す）
- `load-cc-overrides` IPC ハンドラー追加（~/Documents/GeoGraphy/cc-overrides.json を返す）
- `save-cc-overrides` IPC ハンドラー追加
- preload.js に `loadCcMap` / `loadCcOverrides` / `saveCcOverrides` を公開

### G. `src/types/geoAPI.d.ts` 更新

- `loadCcMap()` / `loadCcOverrides()` / `saveCcOverrides()` を型定義に追加

### H. テスト更新（`tests/core/macroKnob.test.ts`）

- 既存テストの `assigns` に `ccNumber` フィールドを追加（型定義変更に追従）
- TC-9: `addAssign()` → assigns に追加される
- TC-10: `removeAssign()` → assigns から削除される
- TC-11: `addAssign()` が MACRO_KNOB_MAX_ASSIGNS を超えると throw

---

## 確立した新ルール（Day43）

### write_file を使う場合の正しいフロー
```
move_file（既存 → .claude/ にバックアップ）
  → write_file（新規作成）
  → NFC 正規化
```
（`create_file` は Claude Desktop 専用・filesystem MCP では `write_file` を使う）

### pnpm gen:cc-map の実行タイミング
- 新 Plugin 追加時: cc-mapping.md に追記 → pnpm gen:cc-map
- CC 番号変更時: cc-mapping.md を編集 → pnpm gen:cc-map
- cc-map.json は手動編集禁止・自動生成物

---

## 次回やること（Day44）

### 優先度 ★★★
| 作業 |
|---|
| MIDI IPC 経路実装（`electron/main.js` → `App.tsx` → `engine.handleMidiCC`） |
| D&D アサイン UI（Simple Window の `[≡]` ハンドル → MacroKnob へのドロップ） |
| `ccMapService.init()` を `engine.initialize()` から呼ぶ |

### 優先度 ★★
| 作業 |
|---|
| Preferences > CC Map タブ実装（`src/ui/panels/preferences/PreferencesPanel.tsx`） |
| MIDI デバイス接続 Panel（Preferences > MIDI タブ） |
| MacroKnob Preset Save/Load |

### 優先度 ★
| 作業 |
|---|
| CLAUDE.md の spec 一覧に cc-mapping 関連を追記 |
| Obsidian dev-log 作成（Day42・Day43 分） |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **NFC 正規化**（Day39確立）: 日本語ファイル作成後は python3 で NFC 正規化を実行
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止（move_file でバックアップしてから write_file）
- **create_file は filesystem MCP には存在しない**: `write_file` を使う
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **cc-mapping.md 更新後は pnpm gen:cc-map 必須**（Day42確立）
- **tsx が必要**: `pnpm gen:cc-map` は tsx 経由で実行（devDependencies に追加済み）
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"`
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day44開始
引き継ぎスキル
```
