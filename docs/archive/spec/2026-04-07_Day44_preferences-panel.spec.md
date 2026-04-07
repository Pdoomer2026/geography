# Preferences Panel Spec

> SSoT: このファイル
> 担当エージェント: Claude Code
> 状態: ⬜ Day22 壁打ち完了・実装は今後

---

## 1. 概要

画面左上に固定の ⚙ ボタンを配置する。
クリックで Preferences パネルが開閉する。
パネル内はタブで切り替える。

---

## 2. UI レイアウト

### ⚙ ボタン（常時表示）

```
画面左上・固定配置
z-index: 最前面
H キー（全UI非表示）のときも表示を維持する
```

### Preferences パネル

```
┌─────────────────────────────────────────────────┐
│  ⚙ PREFERENCES                               ✕  │
│  [Setup] [Project] [Plugins] [Audio] [MIDI] [Output] │
│─────────────────────────────────────────────────│
│                                                 │
│  （選択中タブのコンテンツ）                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

- 幅: 480px
- 位置: 画面左上 ⚙ ボタンの直下
- 背景: `#0f0f1e`（他パネルと統一）
- ✕ ボタンで閉じる

---

## 3. タブ一覧

| タブ | v1 状態 | 内容 |
|---|---|---|
| Setup | ✅ 実装対象 | 使う Geometry・FX の選択 |
| Project | ✅ 実装対象 | プロジェクトファイルの Save / Load |
| Plugins | ⬜ Coming Soon | プラグインの追加・管理 |
| Audio | ⬜ Coming Soon | オーディオ入力設定 |
| MIDI | ⬜ Coming Soon | MIDI デバイス設定 |
| Output | ⬜ Coming Soon | 出力先設定 |

---

## 4. Setup タブ

### UI

```
SETUP

GEOMETRY
  ☑ Grid Wave    ☑ Contour    ☐ Grid Tunnel
  ☐ ...

FX
  ☑ AfterImage   ☑ Bloom      ☐ Feedback
  ☐ Kaleidoscope ☐ Mirror     ☐ Zoom Blur
  ☑ RGB Shift    ☐ CRT        ☐ Glitch
  ☑ Color Grading

                                      [APPLY]
```

### APPLY の動作

1. チェックされた Geometry・FX だけをインスタンス化
2. チェックが外れたものは `destroy()` を呼んで VRAM を解放
3. composer を再構築（チェック済みの FX だけ addPass）
4. 描画が一瞬止まる（数十ms）→ 許容済み
5. パネルを閉じる

### デフォルト選択状態

- Geometry: 全て ☑（全プラグインを使う）
- FX: spec `fx-stack.spec.md` のデフォルト設定に準拠
  - ☑: AfterImage / Bloom / RGB Shift / Color Grading
  - ☐: Feedback / Kaleidoscope / Mirror / Zoom Blur / CRT / Glitch

---

## 5. Project タブ

### UI

```
PROJECT

現在のプロジェクト: my-scene.geography

[Save]   [Save As...]   [Load]

─────────────────────────────
最近のファイル
  my-scene.geography        2026-03-23 19:00
  test-scene.geography      2026-03-22 14:30
```

### 各ボタンの動作

| ボタン | 動作 |
|---|---|
| Save | 現在のプロジェクトファイルパスに上書き保存。未保存なら Save As と同じ動作 |
| Save As... | ファイル保存ダイアログ（Electron）→ 新しいパスに保存 |
| Load | ファイル開くダイアログ（Electron）→ プロジェクトを読み込む |

### 自動保存

- アプリ終了時に現在のプロジェクトを自動保存
- 保存先: `~/Documents/GeoGraphy/autosave.geography`

---

## 6. Plugins タブ（v1 は Coming Soon）

```
PLUGINS

  プラグインストアは準備中です。
  現在は ~/Documents/GeoGraphy/plugins/ に
  手動でプラグインを追加できます。
```

---

## 7. Audio / MIDI / Output タブ（v1 は Coming Soon）

```
COMING SOON
```

---

## 8. キーボードショートカット

- `P` キー → Preferences パネルの開閉トグル
- ヒント表示に追加: `P:Prefs`

---

## 9. References

- `docs/spec/electron.spec.md`
- `docs/spec/project-file.spec.md`
- `docs/spec/plugin-lifecycle.spec.md`
- `docs/spec/fx-stack.spec.md`
