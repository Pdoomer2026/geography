# GeoGraphy 引き継ぎメモ｜Day44（MIDI IPC 廃止・Camera Plugin 設計確定）｜2026-04-07

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
| Camera Plugin spec（新規） | `docs/spec/camera-plugin.spec.md`（Day44新設） |
| Preferences Panel spec | `docs/spec/preferences-panel.spec.md`（Day44更新） |
| Simple Window spec | `docs/spec/simple-window.spec.md`（Day44更新） |
| MacroKnob spec | `docs/spec/macro-knob.spec.md`（Day44更新） |
| CC Mapping spec | `docs/spec/cc-mapping.spec.md`（Day44更新） |
| CC Standard spec | `docs/spec/cc-standard.spec.md`（Day44更新） |
| App.tsx（MIDI受信追加） | `src/ui/App.tsx` |
| engine.ts（ccMapService接続） | `src/core/engine.ts` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day43`
- **テスト**: 112 tests グリーン・tsc エラーゼロ

---

## Day44 で完了したこと

### A. MIDI 受信設計の根本的な修正（spec 3ファイル更新）

Day44 の壁打ちで「MIDI IPC 経路は不要」と確定。

- **外部コントローラー → GeoGraphy 入り口**: Web MIDI API（MIDI 1.0）で受信・renderer 直接
- **GeoGraphy 内部バス**: MidiCCEvent フォーマット（MIDI 2.0 準拠・0.0〜1.0 float）で統一
- 「CC番号体系 = MIDI 2.0 AC」と「受信プロトコル」は別の話として明確化
- MIDI 2.0 ネイティブ受信は将来タスク（C++ addon 前提）

更新した spec:
- `macro-knob.spec.md` — §1 アーキテクチャ図・§2 MUST ルール修正
- `cc-mapping.spec.md` — §1 概要の「MIDI IPC」削除・内部バス説明追加
- `cc-standard.spec.md` — §1「MIDI 2.0 AC空間を選ぶ理由」に分離の注記追加

### B. `ccMapService.init()` を `engine.initialize()` から呼ぶ（実装）

- `src/core/engine.ts` に `ccMapService` を import
- `engine.initialize()` 内で `await ccMapService.init()` を呼ぶように接続

### C. Web MIDI API 受信を App.tsx に実装

- `src/ui/App.tsx` に MIDI 受信 useEffect を追加
- `navigator.requestMIDIAccess()` → Control Change（0xB0）を受信
- `rawValue / 127` で正規化 → `MidiCCEvent` に変換 → `engine.handleMidiCC()` を呼ぶ
- cleanup: unmount 時に `input.onmidimessage = null`

### D. Camera Plugin 設計確定（spec 新規作成）

`docs/spec/camera-plugin.spec.md` を新規作成。設計の核心：

- **Camera は独立した Plugin** — `cameraPreset` 埋め込みは仮実装だったと確定
- **`CameraPlugin extends ModulatablePlugin`** — params を持つ → MacroKnob / D&D 対象
- **3種類**: OrbitCameraPlugin / AerialCameraPlugin / StaticCameraPlugin
- **`defaultCameraPluginId + defaultCameraParams`** — Geometry Plugin はカメラ推奨を伝えるだけ
- **`isCameraUserOverridden`** フラグ — ユーザーが手動変更後は Geometry 切り替えで追従しない
- 「Geometry と Camera の相性」はマニュアルに記載・アプリ内で強制しない

### E. Preferences Panel spec 更新

Setup タブに **CAMERA セクション**を追加（レイヤーごとにドロップダウンで Camera Plugin を選択）。

```
GEOMETRY（レイヤーごと）: [ icosphere ▼ ] [ starfield ▼ ] [ None ▼ ]
CAMERA（レイヤーごと）:   [ orbit-camera ▼ ] [ static-camera ▼ ] [ static-camera ▼ ]
FX（チェックボックス）:   ☑ Bloom ☑ AfterImage ...
```

### F. Simple Window spec 更新

- Geometry Simple Window・Camera Simple Window を一覧に追加
- View メニューに Cmd+4（Geometry）・Cmd+5（Camera）を追加
- キーボードショートカット `4` / `5` を追加

---

## 確立した新ルール（Day44）

### MIDI 受信は renderer 直接・IPC 不要
- Web MIDI API は renderer（App.tsx）で直接使う
- `electron/main.js` への MIDI IPC 経路は不要（将来も追加しない）
- MIDI 2.0 ネイティブ受信は C++ addon が必要・将来タスク

### Camera Plugin 設計原則
- Camera は独立した Plugin として設計する（Geometry に埋め込まない）
- `cameraPreset` は仮実装・Day45 で廃止
- `isCameraUserOverridden` フラグで自動連動とユーザー意図を両立

---

## 次回やること（Day45）

### 優先度 ★★★（Camera Plugin 実装）
| 作業 |
|---|
| `CameraPlugin` インターフェースを `src/types/index.ts` に追加 |
| `CameraMode` / `CameraPreset` を types から削除 |
| `OrbitCameraPlugin` 実装（`src/plugins/cameras/orbit/`） |
| `AerialCameraPlugin` 実装（`src/plugins/cameras/aerial/`） |
| `StaticCameraPlugin` 実装（`src/plugins/cameras/static/`） |
| Camera Plugin 自動登録（`src/plugins/cameras/index.ts`） |
| `LayerManager` を Camera Plugin 機構に移行（`isCameraUserOverridden` フラグ含む） |
| 各 Geometry Plugin から `cameraPreset` 削除・`defaultCameraPluginId` に置き換え |
| `engine.ts` API 更新（`setCameraPlugin` / `applyCameraSetup` 等） |
| `camera-system.spec.md` をアーカイブ（`camera-plugin.spec.md` に統合） |
| テスト更新（`cameraSystem.test.ts`） |

### 優先度 ★★（UI）
| 作業 |
|---|
| `GeometrySimpleWindow` 新設（全 Geometry の params スライダー + `[≡]` ハンドル） |
| `CameraSimpleWindow` 新設（Camera Plugin 切り替え + params スライダー + `[≡]` ハンドル） |
| Preferences Setup タブに Camera セクション追加 |
| D&D アサイン UI（`[≡]` ハンドル → MacroKnob ドロップ） |

### 優先度 ★
| 作業 |
|---|
| Day42・Day43・Day44 の Obsidian dev-log 作成 |
| `CLAUDE.md` の spec 一覧に `camera-plugin.spec.md` を追記 |

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
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Camera は独立 Plugin**（Day44確立）: `cameraPreset` は仮実装・Day45 で廃止
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"`
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day45開始
引き継ぎスキル
```
