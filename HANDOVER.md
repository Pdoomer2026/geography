# GeoGraphy 引き継ぎメモ｜Day46（Geometry Plugin メッシュ再構築対応）｜2026-04-08

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
| Geometry Plugin CLAUDE.md | `src/plugins/geometry/CLAUDE.md`（requiresRebuild ルール追記済み） |
| Camera Plugin spec | `docs/spec/camera-plugin.spec.md` |
| Camera Plugin 実装 | `src/plugins/cameras/`（orbit / aerial / static / index.ts） |
| CameraSimpleWindow | `src/ui/CameraSimpleWindow.tsx` |
| GeometrySimpleWindow | `src/ui/GeometrySimpleWindow.tsx` |
| types | `src/types/index.ts`（PluginParam に requiresRebuild? 追加済み） |
| LayerManager | `src/core/layerManager.ts`（rebuildPlugin() 追加済み） |
| engine.ts | `src/core/engine.ts`（setGeometryParam に再構築ロジック追加済み） |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day46`（作業中）
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day46 で完了したこと

### Geometry Plugin メッシュ再構築対応

GeometrySimpleWindow のスライダーで `segments` / `radius` 等のメッシュ形状に影響する param を変更しても見た目が変わらなかった問題を解決。

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `PluginParam` に `requiresRebuild?: boolean` 追加 |
| `src/core/layerManager.ts` | `rebuildPlugin()` メソッド追加（destroy→create） |
| `src/core/engine.ts` | `setGeometryParam()` に再構築ロジック追加 |
| 全 7 Geometry Plugin config | `requiresRebuild: true` を対象 param に設定 |
| `src/plugins/geometry/CLAUDE.md` | `requiresRebuild` ルールを MUST 節に追記 |
| `tests/core/engine.test.ts` | TC-geo-1 / TC-geo-2 テスト 2 件追加（114 tests） |

**対応済み Plugin・param:**
- `wave/grid-wave`: segments / size
- `terrain/contour`: segments / size
- `tunnel/grid-tunnel`: radius / segments / rings / length
- `solid/torusknot`: radius / tube / tubularSegs / radialSegs / p / q
- `solid/torus`: radius / tube / radialSegs / tubularSegs
- `solid/icosphere`: detail / radius
- `terrain/hex-grid`: cols / rows / hexSize / maxHeight

**目視確認済み**: Torus の Radius（3→10）・Radial Segments（16→3）が即座に再構築されることをブラウザで確認。

---

## 確立した新ルール（Day46）

- **requiresRebuild フラグ**（Day46確立）: メッシュの頂点数・形状が変わる param には `requiresRebuild: true` を必ず設定する。詳細は `src/plugins/geometry/CLAUDE.md` 参照。

---

## 次回やること（Day47）

### 優先度 ★★★
| 作業 |
|---|
| Preferences Setup タブに Camera セクション追加（レイヤーごとのドロップダウン） |
| `camera-system.spec.md` をアーカイブ（`camera-plugin.spec.md` に統合済み） |

### 優先度 ★★
| 作業 |
|---|
| Day42〜Day46 の Obsidian dev-log 作成 |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **requiresRebuild フラグ**（Day46確立）: 新規 Geometry Plugin 追加時はメッシュ形状に影響する param に `requiresRebuild: true` を必ず設定する
- **Camera Plugin はファクトリ関数パターン**（Day45確立）: `() => CameraPlugin` を export し、`getCameraPlugin()` が毎回新インスタンスを生成。モジュールレベル変数は禁止
- **SimpleWindow の params 管理**（Day45確立）: ポーリングは Plugin ID 変化の検知のみ。params の値はローカル state で管理し `onChange` で直接 engine に書き込む
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止（move_file でバックアップしてから write_file）
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Camera は独立 Plugin・ファクトリパターン**（Day45確立）: `cameraPreset` 完全廃止・モジュールレベル変数禁止
- **SimpleWindow の params はローカル state 管理**（Day45確立）: ポーリングに上書きさせない
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day47開始
引き継ぎスキル
```
