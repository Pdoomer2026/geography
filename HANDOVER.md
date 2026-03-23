# GeoGraphy 引き継ぎメモ｜Day21完了｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| config（定数） | `src/core/config.ts` |
| FX Plugins | `src/plugins/fx/` |
| FX コントロール UI | `src/ui/FxControlPanel.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| Camera System spec | `docs/spec/camera-system.spec.md` |
| Plugin Lifecycle spec | `docs/spec/plugin-lifecycle.spec.md` |
| Day21進捗ログ | `docs/progress/day21-*.log.md` |

## 今回のセッション（Day21）で完了したこと

### 1. カメラシステム改善
- `docs/spec/camera-system.spec.md` 新規作成（SDD原則）
- `CameraPreset` 型を `src/types/index.ts` に追加
- `DEFAULT_CAMERA_PRESET`（position: 0,8,12 / lookAt: 0,0,0）を `config.ts` に追加
- `layerManager.setPlugin()` でカメラプリセットを自動適用
- 各 Plugin に `cameraPreset` 追加
  - grid-wave: (0, 8, 12)
  - contour: (0, 10, 14)
  - grid-tunnel: (0, 0, 5) ← 正面視点
- `tests/core/cameraSystem.test.ts` 新規作成（5 tests）
- `tests/core/layerManager.test.ts` のモック修正（`position.set()` 対応）

### 2. Opacity スライダー
- `engine.setLayerOpacity(layerId, opacity)` を追加
- SimpleMixer 各レイヤーカードに `α` スライダーを追加
- カード高さ 130px → 150px に拡大

### 3. FX Controls レイヤー切り替えタブ
- `FxControlPanel` に `[L1][L2][L3]` タブを追加
- `engine.getFxPlugins(layerId?)` / `setFxEnabled(fxId, enabled, layerId?)` / `setFxParam(fxId, paramKey, value, layerId?)` を layerId 対応に拡張
- `engine.initialize()` で全3レイヤーに `createFxPlugins()` を適用（独立した FX スタック）

### 4. Plugin Lifecycle Spec 設計
- `docs/spec/plugin-lifecycle.spec.md` 新規作成
- 設計思想：Setup フェーズでインスタンス化、Play フェーズは enabled 切り替えのみ
- FX・Geometry・Window・Transition 全 Plugin に共通適用
- `CLAUDE.md` の spec 一覧に追記

## 現在の状態（重要）

- **ブランチ**: `main`
- **テスト**: 90 tests グリーン（85 → 90、+5）
- **tsc**: PASS（型エラーゼロ）
- **未コミット**: あり（コミット待ち）

## GeoGraphy UI 現状レイアウト

```
【通常モード】
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  MACRO KNOBS  32 × MIDI  0 ASSIGNED  │  │  FX CONTROLS  [L1][L2][L3] [－]│
│  [#1][#2]...[#32]                    │  │  AfterImage  [ON]            │
└──────────────────────────────────────┘  │  Bloom       [ON]            │
                                          │  RGB Shift   [ON]            │
   ← 任意の Geometry Plugin × 3 レイヤー→  │  ColorGrading[ON]            │
                                          └──────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  SIMPLE MIXER                                               │
│  L1:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L2:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L3:[Plugin▼][BlendMode▼] α[━━━━━] MUTE                   │
└────────────────────────────────────────────────────────────┘
```

## 発生した問題と解決策

- **問題**: `layerManager.test.ts` のモック `PerspectiveCamera.position` が `set()` メソッドを持っていなかった
  → **解決**: `position` を `{ x, y, z, set(x,y,z){...} }` 形式に修正。`lookAt = vi.fn()` も追加

- **問題**: Chrome 拡張のスクリーンショット API が不安定
  → **対処**: 手動でスクリーンショットを撮ってもらう方式で確認

## PREVIEW エリアについて（未実装・既知）

SimpleMixer の PREVIEW エリアが空白のまま。  
`previewBus` は v1 プレースホルダー（2D Canvas にテキスト描画のみ）。  
`previewBus.mount()` が呼ばれていないため canvas が null → PREVIEW に何もマウントされない。  
本実装（offscreen Three.js Scene）は Phase 7 予定。**Day21 のスコープ外として記録済み。**

## Plugin Lifecycle 設計メモ（重要・Day22以降の実装方針）

今日の壁打ちで合意した設計原則：

```
Setup フェーズ（プレイ前）:
  使う Plugin を選択 → create() / addPass() でインスタンス化
  → 未選択 Plugin はクラス定義のみ（VRAM・メモリ未使用）

Play フェーズ（プレイ中）:
  enabled=true/false の切り替えのみ（軽量）
  → 新規インスタンス化・destroy は行わない
```

適用対象：Geometry / FX / Window / Transition / Particle / Light 全 Plugin  
詳細：`docs/spec/plugin-lifecycle.spec.md`

## 次回やること（Day22候補）

1. **コミット**（最優先）
   ```bash
   git add -A && git commit -m "feat: Day21 - Camera System + Opacity Slider + FX Layer Tab + Plugin Lifecycle Spec"
   ```

2. **Plugin Lifecycle 実装（FX から着手）**
   - `FxStack` の `setEnabled()` をインスタンス化制御に変更
   - Setup フェーズ UI の設計・実装
   - spec: `docs/spec/plugin-lifecycle.spec.md`

3. **PREVIEW バス本実装**
   - `previewBus.mount()` を `engine.initialize()` 内で呼ぶ
   - offscreen 2D Canvas サムネイル（v1）→ offscreen Three.js Scene（Phase 7）
   - SimpleMixer の PREVIEW エリアに実際の映像サムネイルを表示

4. **MacroKnob → FX / Geometry パラメーター割り当て**
   - マクロノブを FX / Geometry パラメーターにアサインする仕組み

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 90 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day22を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（90 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay22実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day22-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
