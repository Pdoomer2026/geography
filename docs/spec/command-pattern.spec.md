# Command Pattern Spec

> SSoT: このファイル  
> 対応実装: `src/core/parameterStore.ts` / `src/core/commandHistory.ts`  
> フェーズ: Phase 2  
> 状態: ✅ 実装済み・仕様化

---

## 1. Purpose（目的）

Parameter Storeへのすべての変更をCommandオブジェクト経由で行うことで、
アンドゥ・リドゥを任意のタイミングで実現する。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: Parameter Storeへの直接代入禁止（`store.values[key] = value` は禁止）
- MUST: すべての変更は `Command.execute()` 経由のみ
- MUST: `MAX_UNDO_HISTORY = 50`（config.tsの値を参照）
- MUST: アンドゥ: `Cmd+Z` / リドゥ: `Cmd+Shift+Z`

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}

class SetParameterCommand implements Command {
  constructor(
    private key: string,
    private prev: number,
    private next: number
  ) {}
  execute(): void  // store[key] = next
  undo(): void     // store[key] = prev
  description: string  // 'Set ${key}: ${prev} → ${next}'
}
```

---

## 4. Behavior（振る舞いの定義）

- `execute()` → historyに追加・redoスタックをクリア
- `undo()` → historyから取り出し・undoスタックに積む
- 履歴が`MAX_UNDO_HISTORY`を超えたら先頭を破棄

---

## 5. Test Cases（検証可能な条件）

```typescript
// TC-1: execute後に値が更新される
cmd.execute()
expect(store.get(key)).toBe(nextValue)

// TC-2: undo後に値が元に戻る
cmd.execute()
cmd.undo()
expect(store.get(key)).toBe(prevValue)

// TC-3: MAX_UNDO_HISTORY超過時に先頭が破棄される
// 51回executeした後、historyの長さはMAX_UNDO_HISTORY
expect(history.length).toBeLessThanOrEqual(MAX_UNDO_HISTORY)
```

---

## 6. References

- 要件定義書 v1.7 §16「Command パターン」
- 実装計画書 v2.5 §4.2
- `src/core/config.ts` — MAX_UNDO_HISTORY
