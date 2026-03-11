# plugins/fx/color-grading - CLAUDE.md

## 役割

FX スタックの最後に適用する色調整 FX。Saturation / Contrast / Brightness を GLSL シェーダーで実装する。

**必ず FX スタックの最後に配置すること。**

---

## GLSL シェーダー（v1）

```glsl
// fragment shader
uniform sampler2D tDiffuse;
uniform float saturation;  // デフォルト 1.0（変化なし）
uniform float contrast;    // デフォルト 1.0（変化なし）
uniform float brightness;  // デフォルト 1.0（変化なし）

varying vec2 vUv;

vec3 adjustSaturation(vec3 color, float sat) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luminance), color, sat);
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  vec3 color = texel.rgb;

  // Brightness
  color *= brightness;

  // Contrast
  color = (color - 0.5) * contrast + 0.5;

  // Saturation
  color = adjustSaturation(color, saturation);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
```

---

## パラメーター

| パラメーター | デフォルト | 範囲 |
|---|---|---|
| saturation | 1.0 | 0.0〜2.0 |
| contrast | 1.0 | 0.0〜2.0 |
| brightness | 1.0 | 0.0〜2.0 |

---

## v2 拡張

- RGB Curves（カーブエディター）
- LUT 読み込み（.cube ファイル）・strength ノブ

settings/luts/ に .cube ファイルを置くと自動認識される。
