# grid-tunnel - Basic Template

## Shape
speed: 0.8
radius: 4.0
segments: 8
rings: 20
length: 40

## Color
hue: 280

## Recommended FX
after-image:
  enabled: true
  damp: 0.85
rgb-shift:
  enabled: true
  amount: 0.002
bloom:
  enabled: true
  strength: 0.5

## Macro Knobs
knob1:
  name: WARP
  midi_cc: 1
  assign:
    - param: speed
      min: 0.0  max: 3.0  curve: linear
