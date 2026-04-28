feat: MacroKnob assign visualization + Camera/FX param sync fix (Day85)

Inspector の Geometry/Camera/FX Panel の ≡ ハンドルに
MacroKnob アサイン状態を可視化。

- geoStore に removeAssign アクションを追加（UI→geoStore→engine 一方通行）
- useStandardDnDParamRow に assignedKnobs / handleRemoveAssign を追加
- DnDHandleWithMenu.tsx 新規作成（左方向メニュー展開・ClipCell パターン）
- GeometryPanel / CameraPanel / FxPanel の ≡ を DnDHandleWithMenu に差し替え
- CameraPanel / FxPanel に onParamChanged 購読を追加（MacroKnob連動バグ修正）
