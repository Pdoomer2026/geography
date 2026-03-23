# Plugin Lifecycle Spec

> SSoT: このファイル
> 対象: 全 Plugin（Geometry / FX / Window / Transition / Particle / Light）
> 担当エージェント: Claude Code
> 状態: ⬜ 設計記録済み・実装は Day22 以降

---

## 1. 設計思想

GeoGraphy の全 Plugin は **ライフサイクルを2フェーズに分けて管理する**。

```
Setup フェーズ（プレイ前）
  → 使う Plugin を選択 → その時点で初めてインスタンス化（create / mount）
  → 選んでいない Plugin はクラス定義だけ存在（メモリ・VRAM 未使用）

Play フェーズ（プレイ中）
  → インスタンス化済みの Plugin のみ動作
  → enabled=true/false の切り替えのみ（軽量）
  → 新規インスタンス化・destroy は行わない
```

---

## 2. Plugin ライフサイクルの4ステージ

```
Class（定義のみ）
  ↓ Setup フェーズで「使う」と選択したとき
Instance（create() / mount()）
  ↓ Play フェーズで有効化
Active（enabled=true・毎フレーム update()）
  ↕ Play フェーズで enabled 切り替え（軽量）
Inactive（enabled=false・update() スキップ）
  ↓ セッション終了 or Setup で「使わない」に変更
Disposed（destroy() / unmount()）
```

| ステージ | メモリ | VRAM | update() |
|---|---|---|---|
| Class | ゼロ | ゼロ | なし |
| Instance | あり | あり（FX のみ） | なし |
| Active | あり | あり | 毎フレーム |
| Inactive | あり | あり | スキップ |
| Disposed | ゼロ | ゼロ | なし |

---

## 3. 全 Plugin カテゴリへの適用

### Geometry Plugin
- **現状**: Registry に全プラグインが登録済み・全レイヤーにセット可能
- **理想**: Setup 画面で使う Plugin を選択 → その時点で `create(scene)` を呼ぶ
- **未使用 Plugin**: `create()` を呼ばない → Three.js オブジェクト未生成

### FX Plugin
- **現状**: `createFxPlugins()` で全10個のインスタンスを生成・全 Pass を addPass
- **理想**: Setup 画面で使う FX を選択 → `create(composer)` で addPass
- **未使用 FX**: インスタンスなし → RenderTarget（VRAM）未確保
- **Play 中の ON/OFF**: `enabled=true/false` のみ（Pass の抜き差しは行わない）

### Window Plugin（SimpleMixer など）
- **現状**: 常にマウント済み
- **理想**: Setup で使う Window を選択 → mount
- **v1 例外**: SimpleMixer は閉じられない（MixerPlugin ルール）→ 常に Active

### Transition Plugin
- **現状**: 全トランジションがメモリに存在
- **理想**: Setup で使うものだけインスタンス化

### Particle / Light Plugin
- Geometry Plugin と同じルールを適用

---

## 4. Setup フェーズ UI（v2 実装予定）

```
┌─────────────────────────────────────────┐
│  SETUP                                  │
│                                         │
│  Geometry  ☑ Grid Wave                  │
│            ☑ Contour                    │
│            ☐ Grid Tunnel                │
│                                         │
│  FX        ☑ AfterImage                 │
│            ☑ Bloom                      │
│            ☐ RGB Shift                  │
│            ☐ ColorGrading               │
│                                         │
│  [START PLAY]                           │
└─────────────────────────────────────────┘
```

---

## 5. 実装優先順位

| Plugin | 優先度 | 理由 |
|---|---|---|
| FX Plugin | 高 | VRAM 節約効果が大きい・Pass の addPass/skip が明確 |
| Geometry Plugin | 高 | Three.js オブジェクトの生成コストが高い |
| Transition Plugin | 中 | 軽量だが統一のため |
| Window Plugin | 低 | v1 は SimpleMixer 固定のため影響小 |

---

## 6. FxStack の変更方針（Day22 以降）

現状の `setEnabled()` は `pass.enabled=false` でスキップするだけ。
以下に変更する：

```
setEnabled(fxId, true)
  → Plugin が未インスタンス化なら create(composer) を呼ぶ
  → composer を再構築（enabled=true のものだけ addPass）

setEnabled(fxId, false)
  → destroy() を呼ぶ
  → composer を再構築（該当を除外）
```

再構築は「操作時の一瞬だけ」重い。Play フェーズ中は行わない。

---

## 7. References

- `docs/spec/geometry-plugin.spec.md`
- `docs/spec/fx-stack.spec.md`
- `docs/spec/mixer-plugin.spec.md`
- `src/core/fxStack.ts`
