# GeoGraphy 引き継ぎメモ｜Day20完了｜2026-03-23

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
| 引き継ぎメモ（過去） | `docs/handover/HANDOVER-day{N}.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack コア | `src/core/fxStack.ts` |
| LayerManager | `src/core/layerManager.ts` |
| FX Plugins | `src/plugins/fx/` |
| App ルート | `src/ui/App.tsx` |
| FX コントロール UI | `src/ui/FxControlPanel.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| Contour Plugin | `src/plugins/geometry/terrain/contour/` |
| Grid Tunnel Plugin | `src/plugins/geometry/tunnel/grid-tunnel/` |
| Day20進捗ログ | `docs/progress/day20-*.log.md` |

## 今回のセッション（Day20）で完了したこと

### 1. Layer Mute Toggle
SimpleMixer の L1/L2/L3 カードをクリックで MUTE/LIVE 切り替え。
- LIVE = 緑文字 `#44ff88` / MUTE = 赤文字 `#ff4444`
- `engine.setLayerMute(layerId, mute)` を新規追加

### 2. Layer Plugin Selector
各レイヤーカードに Plugin プルダウンを追加。
- 選択肢: None + Registry の全登録 Plugin
- `engine.setLayerPlugin(layerId, pluginId | null)` を新規追加
- `engine.getRegisteredPlugins()` を新規追加
- None 選択 → plugin=null + mute=true

### 3. Contour Geometry Plugin（terrain/contour）
複数方向サイン波の重ね合わせによる地形的ワイヤーフレーム。
- params: speed / scale / amplitude / segments / size / hue
- テスト: 7 tests 追加

### 4. Grid Tunnel Geometry Plugin（tunnel/grid-tunnel）
多角形リングを Z 方向に並べたトンネル前進アニメーション。
- params: speed / radius / segments / rings / length / hue
- テスト: 7 tests 追加

### 5. BlendMode Selector
各レイヤーカードに blendMode プルダウンを追加。
- 選択肢: Normal / Add / Multiply / Screen / Overlay
- `engine.setLayerBlendMode(layerId, blendMode)` を新規追加

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day20 - BlendMode Selector + spec更新（SimpleMixer）` (`de43040`)
- **テスト**: 85 tests グリーン（71 → 85、+14）
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## GeoGraphy UI 現状レイアウト

```
【通常モード】
┌─────────────────────────────────────────┐  ┌──────────────────────┐
│  MACRO KNOBS  32 × MIDI   0 ASSIGNED    │  │  FX CONTROLS    [－] │
│  [#1][#2]...[#32]                       │  │  AfterImage  [ON]    │
└─────────────────────────────────────────┘  │  Bloom       [ON]    │
                                             │  RGB Shift   [ON]    │
   ← 任意の Geometry Plugin × 3 レイヤー →  │  ColorGrading[ON]    │
                                             └──────────────────────┘
┌─────────────────────────────────────────────────────┐
│  SIMPLE MIXER                                        │
│  L1:[Plugin▼][BlendMode▼] LIVE                      │
│  L2:[Plugin▼][BlendMode▼] LIVE                      │
│  L3:[Plugin▼][BlendMode▼] MUTE                      │
└─────────────────────────────────────────────────────┘
右下ヒント: 1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面
```

## Geometry Plugin 登録状況

| カテゴリ | Plugin ID | 名前 | 状態 |
|---|---|---|---|
| wave | grid-wave | Grid Wave | ✅ |
| terrain | contour | Contour | ✅ Day20追加 |
| tunnel | grid-tunnel | Grid Tunnel | ✅ Day20追加 |
| particle | starfield | Starfield | ✅ |
| light | ambient | Ambient | ✅（enabled=false） |

## 発生した問題と解決策

- **問題**: `registeredPlugins` の取得タイミング（useEffect の依存配列問題）
  → **解決**: `syncLayers()` のポーリングループ内で毎回取得する方式に統一

- **問題**: 開発サーバーが `pnpm test --run` 実行後に落ちる
  → **解決**: テスト実行時は dev サーバーを止めるか別ターミナルで管理

## 次回やること（Day21候補）

1. **カメラシステム改善**
   - `docs/spec/camera-system.spec.md` を新規作成してから実装
   - `camera.position.set(0, 8, 12)` + `lookAt(0, 0, 0)` で斜め上視点
   - 各 Geometry Plugin ごとに推奨カメラ位置を持てるとベター

2. **Opacity スライダー**
   - SimpleMixer の各レイヤーカードに opacity スライダーを追加
   - `engine.setLayerOpacity(layerId, opacity)` を追加

3. **Light Plugin 管理の整備**
   - ambient を grid-wave の scene に正しく追加する仕組みを作る

4. **MacroKnob → FX / Geometry パラメーター割り当て**
   - マクロノブを FX / Geometry パラメーターにアサインする仕組み

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 85 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day21を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（85 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay21実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day21-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
