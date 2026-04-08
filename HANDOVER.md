# GeoGraphy 引き継ぎメモ｜Day48（housekeeping・Camera バグ修正・実装計画書 v4.0）｜2026-04-08

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
| 実装計画書（最新） | `docs/実装計画書_v4.0.md` |
| Preferences Panel | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| Camera Plugin spec | `docs/spec/camera-plugin.spec.md` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day47`（Day48 タグはセッション終了時に打つ）
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day48 で完了したこと

### 1. handover/_archive/ 廃止

旧形式の handover ファイル群（hikitsugi-* / HANDOVER-day* 等）を格納していた `_archive/` ディレクトリを削除。`docs/handover/` にフラット統合済みのため不要と判断。git 履歴に残るので復元可能。

### 2. Preferences Panel Camera 初期値バグ修正

**症状**: Preferences パネルを開くと Camera セクションが常に Static 表示になる。

**根本原因**: `useEffect`（初回補正）で `resolveCamId(geoId)` を参照していたが、これは registry の `defaultCameraPluginId`（デフォルト値）であり、engine が実際に管理している Camera Plugin の状態ではなかった。さらに `if (resolved !== 'static-camera')` という条件が Static を上書きしない設計になっていた。

**修正内容**: `engine.getLayers()` から `cameraPlugin.id` を直接読むように変更。パネルを開いた瞬間に engine の実際のカメラ状態を正確に反映するようになった。

| ファイル | 変更内容 |
|---|---|
| `src/ui/panels/preferences/PreferencesPanel.tsx` | useEffect の初回補正を `engine.getLayers()` 参照に変更 |

### 3. 実装計画書 v4.0 作成

v3.1 をアーカイブし v4.0 を新規作成。

- Day32〜Day48 の実績を追記
- フェーズ定義を現実に合わせて全面更新（Phase 15〜19 を新定義）
- 現在地を Phase 15（MacroKnob D&D アサイン UI）と明確化
- 実装順序: Phase 15 → 16（Sequencer）→ 17（Shader）を明記
- 確立済みアーキテクチャ原則を最新化（Camera Plugin・Preset・requiresRebuild 等）

---

## 確立した新ルール（Day48）

特になし（既存ルールの適用・整理のみ）

---

## 次回やること（Day49）

### 優先度 ★★★（Phase 15 開始）
| 作業 |
|---|
| `docs/spec/macro-knob.spec.md` §4 を読んで D&D アサイン UI 実装プランを立てる |
| GeometrySimpleWindow・FxSimpleWindow の param 行に `[≡]` D&D ハンドルを追加 |
| MacroKnobPanel のドロップゾーン実装（min/max ダイアログ含む） |
| 右クリックでアサイン解除（個別・全解除） |

### 優先度 ★★
| 作業 |
|---|
| MacroKnob 弧インジケーターの min/max 範囲表示 |
| アサイン永続化（GeoGraphyProject に macroKnobAssigns を保存） |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173` の2ステップ必須。HMR・hard reload では反映されない
- **Preset は GeoGraphyProject をそのまま保存**（Day47確立）: localStorage キー `geography:presets-v1`
- **Camera 初期値バグ修正済み**（Day48）: PreferencesPanel は engine.getLayers() から cameraPlugin.id を直接読む
- **requiresRebuild フラグ**（Day46確立）: メッシュ形状に影響する param に `requiresRebuild: true` を必ず設定
- **Camera Plugin はファクトリ関数パターン**（Day45確立）: `getCameraPlugin()` が毎回新インスタンスを生成
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day49開始
引き継ぎスキル
```
