# GeoGraphy 引き継ぎメモ｜Day67（3ゾーンアーキテクチャ移行）｜2026-04-21

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
| Engine | `src/core/engine.ts` |
| App.tsx | `src/ui/App.tsx` |
| application/schema（型定義） | `src/application/schema/index.ts` |
| geo-transitions | `src/application/command/geo-transitions/` |
| MidiInputWrapper | `src/application/adapter/input/MidiInputWrapper.ts` |
| 引き継ぎ（最新） | `docs/handover/day67-2026-04-21.md` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day67`
- **最新コミット**: `6f0e98d`
- **テスト**: 127 tests グリーン・tsc エラーゼロ

---

## 確定したアーキテクチャ（Day67）

```
src/
  engine/              Three.jsプラグイン（疎結合）
    geometry/ fx/ cameras/ lights/ particles/

  application/         意思決定・Registry・Transport
    command/
      geo-transitions/
    adapter/（旧 drivers/）
      input/（MidiInputWrapper）
    schema/（旧 types/ の実体）
      index.ts / midi-registry.ts / windowMode.ts / geoAPI.d.ts

  ui/                  表示・操作
    components/
      window/（旧 plugins/windows/）
      mixers/（旧 plugins/mixers/）

  core/                → 将来 application/ に統合予定
  types/               → 自動生成ファイルのみ残存
  plugins/             ✅ 完全廃止
```

### コアアーキテクチャ（変更なし）
```
MidiInputWrapper → TransportEvent → engine.handleMidiCC()
  → TransportManager → AssignRegistry → ParameterStore
  → engine.flushParameterStore() → TransportRegistry → Plugin.params
```

---

## 次回やること

1. **`src/core/` → `src/application/` への移行**
2. **Sequencer Window spec 検討**（Phase 16）
3. **`film` / `frei-chen` が FX_STACK_ORDER に未登録**（警告対応）

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`
- **git commit メッセージ**: 日本語長文は `.claude/dayN-commit.txt` に書いて `git commit -F`
- **write_file ルール**: 既存ファイルには使わない（`edit_file` を使う）

---

## 次回チャット用スタートプロンプト

```
Day68開始
```
