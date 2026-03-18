---
name: shigyou
description: 始業スキル。「始業」「今日の準備」「DAY作成」「作業開始」などのキーワードが含まれる場合に必ず使用する。GeoGraphy の開発セッション開始時に HANDOVER.md を読み込み、今日の DAY[N].md を /Users/shinbigan/geography/ に自動生成し、Claude Code への一行指示を表示する。毎朝の開発開始時に必ずこのスキルを使うこと。
---

# 始業スキル（GeoGraphy 開発セッション開始）

## 目的

毎回の開発セッション開始時に：
1. HANDOVER.md の【引き継ぎ層】を読み込む
2. 今日の `DAY[N].md` を `/Users/shinbigan/geography/` に生成する
3. Claude Code への一行指示を表示する

---

## 手順

### Step 1: HANDOVER.md を読み込む

filesystem ツールで `/Users/shinbigan/geography/HANDOVER.md` を読み込む。

抽出する情報：
- 現在のブランチ・最後のコミット
- 動作確認状態・テスト状況
- 次回の本実装タスク（Day番号含む）
- 未解決の問題

### Step 2: Day番号を特定する

HANDOVER.md の実装済み内容テーブルから最後の Day 番号を読み取り、+1 する。
例：Day6 まで完了 → 今日は Day7

### Step 3: DAY[N].md を生成する

filesystem ツールで `/Users/shinbigan/geography/DAY[N].md` を以下のフォーマットで書き込む。
（既存ファイルは上書きする）

---

# GeoGraphy Day[N] — 実装プランを立ててください

## あなたの役割

GeoGraphy プロジェクトの実装担当。まず **プランだけ** を提示してください。
承認後に実装を開始します。

## 現在の状態（Day[N-1] 完了時点）

- ブランチ: [HANDOVER.md から取得]
- 最終コミット: [HANDOVER.md から取得]
- テスト: [HANDOVER.md から取得]
- 未コミットファイル: [HANDOVER.md から取得]

## Day[N] のタスク

[HANDOVER.md の「次回の本実装タスク」をそのまま転記]

## 設計原則（遵守事項）

1. engine.ts は App.tsx に依存しない
2. Parameter Store の変更は必ず Command 経由
3. Transition Plugin は UI を持たない（React コンポーネントを含めない）
4. SimpleMixer は閉じられない（閉じるボタン禁止）
5. Preview バスは Three.js を使わない（2D Canvas のみ）
6. 1ファイルずつ説明してから実装する（一度に全部書かない）

## お願い

実装前に以下をプランとして提示してください：
1. 実装順序（どのファイルから手をつけるか）
2. 各タスクの変更点サマリー
3. 懸念点・リスク（あれば）

承認後に実装を開始してください。

---

### Step 4: 完了メッセージを表示する

以下をチャットに表示する：

✅ `DAY[N].md` を `/Users/shinbigan/geography/` に生成しました。

**Claude Code のターミナルにこの一行を貼り付けてください：**

```
DAY[N].md を読んで、プランを立ててください。
```

---

## 注意事項

- HANDOVER.md が存在しない場合は「HANDOVER.md が見つかりません」と伝える
- タスクが空の場合は慎太郎に確認する
- DAY[N].md はすでに存在していても上書きする（毎日新鮮な状態にする）
- 設計原則は固定テキストとして必ず含める
