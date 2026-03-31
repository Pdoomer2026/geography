# GeoGraphy 引き継ぎメモ｜Day35（壁打ち：シーケンサー・MacroKnob・MIDI設計）｜2026-03-31

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 今回のセッション（Day35）で完了したこと

### A. シーケンサー アーキテクチャ設計（壁打ち確定）

- 「1小節のキャンバスに Shape を描く」が本質
- `src/plugins/sequencers/` に独立配置（固有 CLAUDE.md）
- MacroKnob ID 経由で値を送る疎結合設計
- ステップ数 1〜32 可変・64拍ループ固定
- 参照モデル：Massive Stepper/Performer・ShaperBox 3
- 実装は MacroKnob Panel 完成後

### B. MacroKnob / MIDI アーキテクチャ設計（壁打ち確定）

- MacroKnob = コア固定（Plugin 化しない）
- 全入力源（MIDI/Sequencer/LFO）のルーター
- MIDI 2.0 対応：`electron/main.js` 経由（IPC）
- CC番号 32,768個・32bit 解像度・双方向通信
- `MacroKnobSimpleWindow` → `MacroKnobPanel` にリネーム
- `src/ui/panels/macro-knob/` に移動

### C. Panel ディレクトリ新設（設計確定）

```
src/ui/panels/
├── CLAUDE.md
├── preferences/
│   ├── CLAUDE.md
│   └── PreferencesPanel.tsx
└── macro-knob/
    ├── CLAUDE.md（最重要）
    └── MacroKnobPanel.tsx
```

### D. CC番号 Rosetta Stone 策定（初期定義）

| CC番号 | 抽象概念 | Geometry | FX | Shader |
|---|---|---|---|---|
| CC 20 | Primary Amount | Size/Radius | Mix | Emission |
| CC 21 | Density/Detail | Segments | Grain | Tiling |
| CC 22 | Deformation | Twist/Noise | Glitch | Displacement |
| CC 23 | Sharpness/Width | Stroke | Contrast | Fresnel |
| CC 24 | Temporal Speed | Rotation | Feedback | UV Flow |

### E. ディレクトリ全体構造（確定）

```
src/plugins/
├── geometry/ / particles/ / fx/ / lights/ / mixers/ / transitions/（既存）
├── sequencers/     ← 【新設確定】
└── windows/        ← v2〜（空）
```

### F. Obsidian 保存

- `macroknob-midi-architecture-day35.md`
- `sequencer-architecture-day35.md`

---

## 現在の状態

- **タグ**: `day34`（Day35 は設計作業のみ・コミットなし）
- **テスト**: 104 tests グリーン・tsc エラーゼロ
- **コードベース変更**: なし

---

## 次回やること（Day36）

| 優先度 | 作業 |
|---|---|
| ★★★ | `docs/spec/cc-standard.spec.md` 新設 |
| ★★★ | `docs/spec/macro-knob.spec.md` 更新 |
| ★★★ | `src/ui/panels/` 新設・ファイル移動・リネーム実装 |
| ★★ | `simple-window.spec.md` 更新 |
| ★★ | `docs/spec/sequencer.spec.md` 新設 |
| ★ | 録画機能の動作確認 |
