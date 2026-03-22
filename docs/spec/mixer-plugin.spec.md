# Mixer Plugin Spec

> SSoT: このファイル
> 対応実装: `src/plugins/windows/simple-mixer/**`
> 担当エージェント: Mixer Agent
> 状態: ✅ SimpleMixer v1実装済み / v2でPlugin化予定

---

## 1. Purpose（目的）

Program/Previewバスの操作UIを提供する。
v1はSimpleMixerとして固定実装・v2でMixerPlugin Interfaceに準拠したPlugin化を行う。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: 閉じることができない（閉じるボタンを実装してはいけない）
- MUST: Transition Plugin選択プルダウンを必ず持つ
- MUST: クロスフェーダーを必ず持つ
- MUST: エンジンAPIを通じてのみParameter Storeを操作する（直接操作禁止）
- MUST: v1の時点からMixerPlugin Interfaceに準拠する（v2で設計変更ゼロにするため）
- MUST: `renderer` と `enabled` フィールドを持つ

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  component: React.FC   // 閉じられないWindowPlugin
}
```

---

## 4. SimpleMixer UI構成

```
┌─────────────────────────────────────┐
│  PROGRAM          PREVIEW           │
│  ┌────┐┌────┐┌────┐  ┌──────────┐  │
│  │ L1 ││ L2 ││ L3 │  │サムネイル│  │
│  │ ▓▓ ││ ▓▓ ││ ▓▓ │  │ 320×180 │  │
│  └────┘└────┘└────┘  └──────────┘  │
│  Transition: [ CrossFade       ▼ ] │
│  ════════════╪════════ CROSSFADER  │
└─────────────────────────────────────┘
```

---

## 5. エンジンAPI（Mixer Agentが使えるもの）

```typescript
engine.setTransition(id: string): void       // Transition切り替え
engine.getLayers(): Layer[]                  // レイヤー状態取得
engine.clock                                 // BPMクロック（readonly）
```

---

## 6. Test Cases（検証可能な条件）

```typescript
// TC-1: 閉じるボタンが存在しない
const { queryByLabelText } = render(<SimpleMixer />)
expect(queryByLabelText('close')).toBeNull()

// TC-2: Transitionプルダウンが存在する
const { getByRole } = render(<SimpleMixer />)
expect(getByRole('combobox')).toBeDefined()

// TC-3: クロスフェーダーが存在する
expect(getByRole('slider')).toBeDefined()
```

---

## 6. References

- 要件定義書 v1.7 §8「SimpleMixer」/ §9「Mixer Plugin」
- `src/plugins/windows/CLAUDE.md`
- Mixer Agent担当範囲: `docs/spec/agent-roles.md`
