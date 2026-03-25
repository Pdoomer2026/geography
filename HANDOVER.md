# GeoGraphy 引き継ぎメモ｜Day29完了｜2026-03-25

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（ブラウザ）**: `pnpm dev`（ポート5173）
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| 要件定義書（最新） | `docs/要件定義書_v1.9.md` |
| 実装計画書（最新） | `docs/実装計画書_v3.1.md` |
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| MacroKnobManager（コア） | `src/core/macroKnob.ts` |
| App.tsx | `src/ui/App.tsx` |
| useAutosave hook | `src/ui/useAutosave.ts` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | `src/ui/FxSimpleWindow.tsx` |
| Macro Knob Simple Window | `src/ui/MacroKnobSimpleWindow.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| アーカイブ（旧 CLAUDE.md） | `docs/archive/CLAUDE/` |

---

## 今回のセッション（Day29）で完了したこと

### A. Phase 10 実装：spec ファイル更新・新規作成

| ファイル | 作業 |
|---|---|
| `docs/spec/mixer-plugin.spec.md` | MixerPlugin 再定義・Simple Window との関係・廃止制約の削除 |
| `docs/spec/simple-window.spec.md` | **新規作成**（Simple Window の概念・フォールバック動作・View メニュー連携） |
| `docs/spec/window-plugin.spec.md` | **新規作成**（Window Plugin 再定義・targetPluginId 宣言・v2〜） |
| `docs/spec/electron.spec.md` | View メニュー追加（⌘1/2/3・H/S）・IPC イベント定義 |
| `docs/spec/fx-control-ui.spec.md` | FxControlPanel → FxSimpleWindow にリネーム反映・旧参照削除 |

### B. Phase 10 実装：ディレクトリ新設・ファイル移動・リネーム

```
src/plugins/mixers/                        ← 新設
src/plugins/mixers/CLAUDE.md               ← 新規作成
src/plugins/mixers/simple-mixer/
  MixerSimpleWindow.tsx                    ← 新規作成（旧 SimpleMixer.tsx の内容を移行・リネーム）
  index.ts                                 ← 新規作成

src/ui/FxSimpleWindow.tsx                  ← 新規作成（旧 FxControlPanel.tsx の内容を移行・リネーム）
src/ui/MacroKnobSimpleWindow.tsx           ← 新規作成（旧 MacroKnobPanel.tsx の内容を移行・リネーム）

削除済み：
  src/plugins/windows/simple-mixer/SimpleMixer.tsx
  src/plugins/windows/simple-mixer/index.ts
  src/ui/FxControlPanel.tsx
  src/ui/MacroKnobPanel.tsx
```

### C. Phase 10 実装：View メニュー追加

- `electron/main.js`：View メニュー新設（Mixer/FX/Macro Knob Simple Window の表示/非表示・⌘1/2/3・H/S）
- `electron/preload.js`：View メニューイベントを `onMenuEvents` に追加
- `src/types/geoAPI.d.ts`：`onMenuEvents` の型定義に View メニューイベントを追加
- `src/ui/App.tsx`：import パス全更新・View メニューイベントハンドラ追加

### D. Phase 10 実装：CLAUDE.md 群の全面更新

| ファイル | 作業 |
|---|---|
| `CLAUDE.md` | v10 に更新。始業時・終業時の CLAUDE.md 読み方（MUST）を追加。実装詳細を各モジュールへ移行。 |
| `src/core/CLAUDE.md` | エンジン固定部分テーブルを3列化（固定部分・役割・アクセスルール）。Program/Preview バス・LayerManager・Clock を移行。 |
| `src/ui/CLAUDE.md` | Window/Panel 命名原則・Simple Window 一覧を移行。旧名称・旧制約の記述を削除。 |
| `src/plugins/mixers/CLAUDE.md` | 新規作成。MixerPlugin の二重構造・MUST ルール統合。 |
| `src/plugins/windows/CLAUDE.md` | Window Plugin 再定義。旧 simple-mixer 移動経緯を削除。 |

### E. 今日の新しい気づき（CLAUDE.md に反映済み）

**始業時・終業時の CLAUDE.md 正しい使い方を確立した。**

- 始業時：HANDOVER.md で作業対象を特定 → ルートで全体方針確認 → **対象モジュールの CLAUDE.md を必ず読む** → spec を読む → 実装開始
- 終業時：触ったモジュールを列挙 → 各モジュールの CLAUDE.md を読む → **ルートかモジュールかを正しく判断して更新** → HANDOVER.md を書く
- ルートに実装詳細・モジュール固有ルールを書かない。各モジュールの CLAUDE.md に委譲する。

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day28`（Day29 のコミット・タグは本セッション終了時に打つ）
- **テスト**: 104 tests グリーン（tsc エラーゼロ確認済み）
- **docs/ 直下**: `要件定義書_v1.9.md` / `実装計画書_v3.1.md` のみ（最新版）
- **docs/archive/**: 旧ドキュメント・旧 CLAUDE.md アーカイブ済み

---

## 次回やること（Day30）

### 最優先：Phase 11 Preview サムネイルキャンバス

実装計画書 v3.1 §6 に従って実施：

| 順序 | 作業 |
|---|---|
| 1 | `docs/spec/program-preview-bus.spec.md` を読む（MUST） |
| 2 | `previewBus.ts` に小キャンバス用 WebGLRenderer を追加（320×180） |
| 3 | `MixerSimpleWindow.tsx` の PREVIEW エリアにキャンバスを mount |
| 4 | FPS への影響を `pnpm dev:electron` で確認 |
| 5 | tsc + test 両方通過確認 |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ

- **CLAUDE.md の読み方（MUST）**: ルートCLAUDE.md →「始業時の読み方」セクションを参照
- **CLAUDE.md アーカイブの場所**: `docs/archive/CLAUDE/`（日付付きファイル名）
- **ドキュメントアーカイブ方針**: `docs/` 直下は最新版のみ・旧版は `docs/archive/` に移動
- **命名変換（Day29確立）**:
  - `SimpleMixer.tsx` → `MixerSimpleWindow.tsx`
  - `FxControlPanel.tsx` → `FxSimpleWindow.tsx`
  - `MacroKnobPanel.tsx` → `MacroKnobSimpleWindow.tsx`
- **Window Plugin は v2 から**: v1 では Simple Window のみ・Window Plugin の実装は v2 以降

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day30を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day30）」を読んで Phase 11 実装を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → ルート CLAUDE.md → 作業対象モジュールの CLAUDE.md → spec の順で読むこと
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- プランを提示・承認を得てから実装を開始すること
- ステップバイステップで進めること（いきなり実装しない）
- 要件定義書: docs/要件定義書_v1.9.md
- 実装計画書: docs/実装計画書_v3.1.md（Phase 11 §6 参照）
```
