# GeoGraphy 引き継ぎメモ｜Day61（CLAUDE.md 全面整合・Window 体系確定）｜2026-04-15

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
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11） |
| src/core/CLAUDE.md | `src/core/CLAUDE.md`（v7） |
| src/ui/CLAUDE.md | `src/ui/CLAUDE.md`（v4） |
| src/ui/panels/CLAUDE.md | `src/ui/panels/CLAUDE.md`（v3） |
| src/plugins/windows/CLAUDE.md | `src/plugins/windows/CLAUDE.md`（v3） |
| src/plugins/windows/macro-window/CLAUDE.md | `src/plugins/windows/macro-window/CLAUDE.md` |
| src/drivers/CLAUDE.md | `src/drivers/CLAUDE.md` |
| Transport Architecture spec | `docs/spec/transport-architecture.spec.md` |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| CC Mapping（SSoT） | `docs/spec/cc-mapping.md` |
| CC Map JSON（自動生成） | `settings/cc-map.json` |
| Engine | `src/core/engine.ts` |
| TransportManager | `src/core/transportManager.ts` |
| TransportRegistry | `src/core/transportRegistry.ts` |
| AssignRegistry | `src/core/assignRegistry.ts`（旧 macroKnob.ts から改名） |
| ProjectManager | `src/core/projectManager.ts` |
| PresetStore | `src/core/presetStore.ts` |
| GeometrySimpleWindow | `src/plugins/windows/simple-window/GeometrySimpleWindow.tsx` |
| CameraSimpleWindow | `src/plugins/windows/simple-window/CameraSimpleWindow.tsx` |
| FxSimpleWindow | `src/plugins/windows/simple-window/FxSimpleWindow.tsx` |
| MacroWindow | `src/plugins/windows/macro-window/MacroWindow.tsx` |
| App.tsx | `src/ui/App.tsx` |
| PreferencesPanel | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MidiInputWrapper | `src/drivers/input/MidiInputWrapper.ts` |
| 引き継ぎ（最新） | `docs/handover/day61-2026-04-15.md` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day60`（Day61 分は未打）
- **最新コミット**: `0b84d15`（docs: update CLAUDE.md files to reflect Day61 refactoring）
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## 確定したアーキテクチャ（Day61 時点）

### Window 体系
| 分類 | 場所 |
|---|---|
| Simple Window | `src/plugins/windows/simple-window/` |
| Macro Window | `src/plugins/windows/macro-window/` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/` |

### Panel 体系
| Panel | 場所 |
|---|---|
| Preferences Panel | `src/ui/panels/preferences/` |

### コアアーキテクチャ
```
MidiInputWrapper（drivers/input/）
  → TransportEvent { slot, value, source: 'midi' }
  → engine.handleMidiCC()
        ↓
  TransportManager → AssignRegistry 参照 → ParameterStore
        ↓
  engine.flushParameterStore() → TransportRegistry → Plugin.params
```

---

## Day59〜61 の主要実装（参照用）

### Day59（WindowPlugin 全面刷新）
- SimpleWindowPlugin / CameraWindowPlugin / FxWindowPlugin を自律化
- `registrationKey` 導入（`'layer-N:geometry'` / `'layer-N:camera'` / `'layer-N:fx'`）
- `TransportEvent` に `layerId?` 追加
- 旧 SimpleWindow 全廃止→アーカイブ

### Day60（Save/Load・Preset・FX レイヤー別対応）
- `projectManager.ts` / `presetStore.ts` 新設
- Save/Load で全パラメータを正確に復元（`applySceneState()` 新設）
- cc-mapping.md v0.4（5桁番号体系）・83 mappings 再生成
- Preference FX L1/L2/L3 タブ・レイヤー別独立 FX 設定

### Day61（CLAUDE.md 全面整合）
- 全 CLAUDE.md を Day58〜60 の実装に追従させた
- MacroKnob Panel → MacroWindow 格下げを全ドキュメントに反映
- SimpleWindow パスを `src/plugins/windows/simple-window/` に統一
- `src/drivers/CLAUDE.md` に TransportEvent フローを明文化

---

## 次回やること

1. **ベースライン確認**
   ```bash
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
   ```
2. **Day61 タグ打ち**
   ```bash
   git tag day61 && git push origin main --tags
   ```
3. **Sequencer spec 壁打ち**（Day60 から持ち越し）
   - TimelineLogger の仕様から決める
   - Sequencer のデータフォーマット設計

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`
- **git commit メッセージ**: 日本語長文は `.claude/dayN-commit.txt` に書いて `git commit -F`
- **write_file ルール**: 既存ファイルには使わない・move_file → read → 差分提示 → 承認 → write_file
- **gen:cc-map**: cc-mapping.md 編集後は必ず `pnpm gen:cc-map` を実行

---

## 次回チャット用スタートプロンプト

```
Day62開始
```
