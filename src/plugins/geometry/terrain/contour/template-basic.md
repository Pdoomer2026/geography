# contour - Basic Template

## Shape
speed: 0.3
scale: 0.4
amplitude: 3.0
segments: 80
size: 100

## Color
hue: 160

## Recommended FX
after-image:
  enabled: true
  damp: 0.88
bloom:
  enabled: true
  strength: 0.6
color-grading:
  saturation: 1.2
  contrast: 1.1
  brightness: 1.0

## Recommended Particles
starfield:
  enabled: true
  count: 3000
  speed: 0.2

## Macro Knobs
knob1:
  name: TERRAIN
  midi_cc: 1
  assign:
    - param: amplitude
      min: 0.5  max: 8.0  curve: linear
    - param: scale
      min: 0.1  max: 2.0  curve: linear
