# GeoGraphy 引き継ぎメモ｜Day47（Preferences Setup タブ改修・Preset システム）｜2026-04-08

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
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11・ブラウザ確認フロー追記） |
| Preferences Panel | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| Camera Plugin spec | `docs/spec/camera-plugin.spec.md` |
| camera-system.spec.md | アーカイブ済み `docs/archive/spec/2026-04-08_Day47_camera-system.spec.md` |
| engine.ts | `src/core/engine.ts`（`applyCameraSetup()` 追加） |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day47`（作業中）
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day47 で完了したこと

### 1. Preferences Setup タブ 全面改修

#### Geometry セクション
- チェックボックス方式 → **レイヤーごとのドロップダウン**方式に変更（spec 準拠）
- None 選択でそのレイヤーを mute

#### Camera セクション（新設）
- レイヤーごとにドロップダウンで Camera Plugin を選択
- Geometry 変更 → `defaultCameraPluginId` で Camera 自動連動（手動変更後は `manual` バッジを表示して追従しない）
- APPLY → `engine.applyCameraSetup()` で一括反映

#### Preset システム（新設）
- `GeoGraphyProject` をそのままプリセットとして保存（全シーンステート・MIDI2.0パラメーター含む）
- 保存先: `localStorage`（キー: `geography:presets-v1`）
- **Load → 即 engine 反映**（APPLY 不要）
- Save As: 名前付きで保存（Enter キーでも保存可）
- Delete: 選択中のプリセットを削除
- **デフォルトプリセット4つを内蔵**（localStorage が空 or 欠けていれば自動マージ投入）
  - `Default`: Icosphere / Torus / Contour + Orbit/Orbit/Static カメラ
  - `Orbit Scene`: Icosphere / TorusKnot / Torus + 全レイヤー Orbit
  - `Aerial Scene`: HexGrid / Contour / GridWave + Aerial/Static/Static
  - `Tunnel`: GridTunnel / Icosphere / GridWave + Static/Orbit/Static
  - 全プリセット FX は全て OFF（ユーザーが自分で有効化する設計）

### 2. `engine.applyCameraSetup()` 追加

| ファイル | 変更内容 |
|---|---|
| `src/core/engine.ts` | `applyCameraSetup(cameraPluginIds: string[]): void` 追加 |

### 3. `camera-system.spec.md` アーカイブ

`camera-plugin.spec.md` に統合済みのため旧ファイルをアーカイブ。

### 4. CLAUDE.md ブラウザ確認フロー追記

Cursor でコマンド実行後は必ず `pnpm dev` → `open http://localhost:5173` の2ステップが必要なことを明記。

---

## 確立した新ルール（Day47）

- **ブラウザ確認フロー**（Day47確立）: Cursor でコマンド実行後は `pnpm dev` → `open http://localhost:5173` の2ステップ。HMR・hard reload では反映されない
- **Preset は GeoGraphyProject をそのまま保存**（Day47確立）: Plugin ID だけでなく全シーンステート・MIDI2.0パラメーターを含む
- **Load → 即 engine 反映**（Day47確立）: Preset の Load は APPLY 不要。`applyToEngine()` を内部で呼ぶ

---

## 次回やること（Day48）

### 優先度 ★★★
| 作業 |
|---|
| Day42〜Day47 の Obsidian dev-log 作成（積み残し） |
| Preferences Panel の Camera 初期値バグ調査（Static になる根本原因の特定） |

### 優先度 ★★
| 作業 |
|---|
| Sequencer Plugin 設計開始（uProgress 0.0〜1.0 の制御源） |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブラウザ確認フロー**（Day47確立）: Cursor コマンド実行後は `pnpm dev` → `open http://localhost:5173` の2ステップ必須
- **Preset は GeoGraphyProject をそのまま保存**（Day47確立）: localStorage キー `geography:presets-v1`
- **requiresRebuild フラグ**（Day46確立）: 新規 Geometry Plugin 追加時はメッシュ形状に影響する param に `requiresRebuild: true` を必ず設定する
- **Camera Plugin はファクトリ関数パターン**（Day45確立）: `() => CameraPlugin` を export し、`getCameraPlugin()` が毎回新インスタンスを生成。モジュールレベル変数は禁止
- **SimpleWindow の params 管理**（Day45確立）: ポーリングは Plugin ID 変化の検知のみ。params の値はローカル state で管理し `onChange` で直接 engine に書き込む
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止（move_file でバックアップしてから write_file）
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day48開始
引き継ぎスキル
```
