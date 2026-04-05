# GeoGraphy 引き継ぎメモ｜Day19完了｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 今回のセッション（Day19）で完了したこと

### 1. FxControlPanel 小数表示バグ修正
`formatParamValue(value, min, max)` 関数を追加。`range = max - min` の大きさで桁数を判定。
RGB Shift Amount が `0.00` → `0.05` と正しく表示されるようになった。

### 2. 個別UI表示/非表示ショートカット
`uiVisible: boolean` → `uiVisible: { macro, fx, mixer }` に拡張。
1/2/3/H/S/F キーで個別・一括制御が可能になった。

**コミット**: `50ccf0e`

## 現在の状態
- **ブランチ**: `main`
- **テスト**: 71 tests グリーン
- **tsc**: PASS

## 次回やること（Day20候補）
1. 新しい Geometry Plugin 追加（sphere・torus・terrain など）
2. Light Plugin 管理の整備
3. カメラシステム改善（camera-system.spec.md 作成から）
4. MacroKnob → FX パラメーター割り当て
