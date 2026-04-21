# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: standardDnDWindow.spec.ts >> GeometryStandardDnDWindow >> D&D で AssignDialog が開く
- Location: tests/e2e/standardDnDWindow.spec.ts:34:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.dragTo: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=≡').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: MACRO WINDOW
      - generic [ref=e8]: 32 × MIDI
      - generic [ref=e9]: 0 ASSIGNED
    - generic [ref=e10]:
      - generic "macro-1 | 上下ドラッグで操作" [ref=e11]:
        - img [ref=e12]
        - generic [ref=e15]: "#1"
        - generic [ref=e16]: "0.00"
      - generic "macro-2 | 上下ドラッグで操作" [ref=e17]:
        - img [ref=e18]
        - generic [ref=e21]: "#2"
        - generic [ref=e22]: "0.00"
      - generic "macro-3 | 上下ドラッグで操作" [ref=e23]:
        - img [ref=e24]
        - generic [ref=e27]: "#3"
        - generic [ref=e28]: "0.00"
      - generic "macro-4 | 上下ドラッグで操作" [ref=e29]:
        - img [ref=e30]
        - generic [ref=e33]: "#4"
        - generic [ref=e34]: "0.00"
      - generic "macro-5 | 上下ドラッグで操作" [ref=e35]:
        - img [ref=e36]
        - generic [ref=e39]: "#5"
        - generic [ref=e40]: "0.00"
      - generic "macro-6 | 上下ドラッグで操作" [ref=e41]:
        - img [ref=e42]
        - generic [ref=e45]: "#6"
        - generic [ref=e46]: "0.00"
      - generic "macro-7 | 上下ドラッグで操作" [ref=e47]:
        - img [ref=e48]
        - generic [ref=e51]: "#7"
        - generic [ref=e52]: "0.00"
      - generic "macro-8 | 上下ドラッグで操作" [ref=e53]:
        - img [ref=e54]
        - generic [ref=e57]: "#8"
        - generic [ref=e58]: "0.00"
      - generic "macro-9 | 上下ドラッグで操作" [ref=e59]:
        - img [ref=e60]
        - generic [ref=e63]: "#9"
        - generic [ref=e64]: "0.00"
      - generic "macro-10 | 上下ドラッグで操作" [ref=e65]:
        - img [ref=e66]
        - generic [ref=e69]: "#10"
        - generic [ref=e70]: "0.00"
      - generic "macro-11 | 上下ドラッグで操作" [ref=e71]:
        - img [ref=e72]
        - generic [ref=e75]: "#11"
        - generic [ref=e76]: "0.00"
      - generic "macro-12 | 上下ドラッグで操作" [ref=e77]:
        - img [ref=e78]
        - generic [ref=e81]: "#12"
        - generic [ref=e82]: "0.00"
      - generic "macro-13 | 上下ドラッグで操作" [ref=e83]:
        - img [ref=e84]
        - generic [ref=e87]: "#13"
        - generic [ref=e88]: "0.00"
      - generic "macro-14 | 上下ドラッグで操作" [ref=e89]:
        - img [ref=e90]
        - generic [ref=e93]: "#14"
        - generic [ref=e94]: "0.00"
      - generic "macro-15 | 上下ドラッグで操作" [ref=e95]:
        - img [ref=e96]
        - generic [ref=e99]: "#15"
        - generic [ref=e100]: "0.00"
      - generic "macro-16 | 上下ドラッグで操作" [ref=e101]:
        - img [ref=e102]
        - generic [ref=e105]: "#16"
        - generic [ref=e106]: "0.00"
      - generic "macro-17 | 上下ドラッグで操作" [ref=e107]:
        - img [ref=e108]
        - generic [ref=e111]: "#17"
        - generic [ref=e112]: "0.00"
      - generic "macro-18 | 上下ドラッグで操作" [ref=e113]:
        - img [ref=e114]
        - generic [ref=e117]: "#18"
        - generic [ref=e118]: "0.00"
      - generic "macro-19 | 上下ドラッグで操作" [ref=e119]:
        - img [ref=e120]
        - generic [ref=e123]: "#19"
        - generic [ref=e124]: "0.00"
      - generic "macro-20 | 上下ドラッグで操作" [ref=e125]:
        - img [ref=e126]
        - generic [ref=e129]: "#20"
        - generic [ref=e130]: "0.00"
      - generic "macro-21 | 上下ドラッグで操作" [ref=e131]:
        - img [ref=e132]
        - generic [ref=e135]: "#21"
        - generic [ref=e136]: "0.00"
      - generic "macro-22 | 上下ドラッグで操作" [ref=e137]:
        - img [ref=e138]
        - generic [ref=e141]: "#22"
        - generic [ref=e142]: "0.00"
      - generic "macro-23 | 上下ドラッグで操作" [ref=e143]:
        - img [ref=e144]
        - generic [ref=e147]: "#23"
        - generic [ref=e148]: "0.00"
      - generic "macro-24 | 上下ドラッグで操作" [ref=e149]:
        - img [ref=e150]
        - generic [ref=e153]: "#24"
        - generic [ref=e154]: "0.00"
      - generic "macro-25 | 上下ドラッグで操作" [ref=e155]:
        - img [ref=e156]
        - generic [ref=e159]: "#25"
        - generic [ref=e160]: "0.00"
      - generic "macro-26 | 上下ドラッグで操作" [ref=e161]:
        - img [ref=e162]
        - generic [ref=e165]: "#26"
        - generic [ref=e166]: "0.00"
      - generic "macro-27 | 上下ドラッグで操作" [ref=e167]:
        - img [ref=e168]
        - generic [ref=e171]: "#27"
        - generic [ref=e172]: "0.00"
      - generic "macro-28 | 上下ドラッグで操作" [ref=e173]:
        - img [ref=e174]
        - generic [ref=e177]: "#28"
        - generic [ref=e178]: "0.00"
      - generic "macro-29 | 上下ドラッグで操作" [ref=e179]:
        - img [ref=e180]
        - generic [ref=e183]: "#29"
        - generic [ref=e184]: "0.00"
      - generic "macro-30 | 上下ドラッグで操作" [ref=e185]:
        - img [ref=e186]
        - generic [ref=e189]: "#30"
        - generic [ref=e190]: "0.00"
      - generic "macro-31 | 上下ドラッグで操作" [ref=e191]:
        - img [ref=e192]
        - generic [ref=e195]: "#31"
        - generic [ref=e196]: "0.00"
      - generic "macro-32 | 上下ドラッグで操作" [ref=e197]:
        - img [ref=e198]
        - generic [ref=e201]: "#32"
        - generic [ref=e202]: "0.00"
  - generic [ref=e203]:
    - generic [ref=e204]: MIXER SIMPLE WINDOW
    - generic [ref=e205]:
      - generic [ref=e207]: SMALL SCREEN —EDIT
      - generic [ref=e209]:
        - generic [ref=e210]:
          - generic [ref=e211]: EDIT view
          - generic [ref=e212]:
            - generic [ref=e213]:
              - generic [ref=e214]:
                - generic [ref=e215]: L1
                - slider [ref=e217] [cursor=pointer]: "1"
                - generic [ref=e218]: 100%
              - generic [ref=e219]: Torus
            - generic [ref=e220]:
              - generic [ref=e221]:
                - generic [ref=e222]: L2
                - slider [ref=e224] [cursor=pointer]: "1"
                - generic [ref=e225]: 100%
              - generic [ref=e226]: Torus Knot
            - generic [ref=e227]:
              - generic [ref=e228]:
                - generic [ref=e229]: L3
                - slider [ref=e231] [cursor=pointer]: "1"
                - generic [ref=e232]: 100%
              - generic [ref=e233]: Contour
        - generic [ref=e234]:
          - button "⇄ SWAP" [ref=e235] [cursor=pointer]
          - generic [ref=e236]:
            - generic [ref=e237]: "Large: OUTPUT"
            - generic [ref=e238]: "Small: EDIT"
        - generic [ref=e239]:
          - generic [ref=e240]: OUTPUT view
          - generic [ref=e241]:
            - generic [ref=e242]:
              - generic [ref=e243]:
                - generic [ref=e244]: L1
                - slider [ref=e246] [cursor=pointer]: "1"
                - generic [ref=e247]: 100%
              - generic [ref=e248]: Torus
            - generic [ref=e249]:
              - generic [ref=e250]:
                - generic [ref=e251]: L2
                - slider [ref=e253] [cursor=pointer]: "1"
                - generic [ref=e254]: 100%
              - generic [ref=e255]: Torus Knot
            - generic [ref=e256]:
              - generic [ref=e257]:
                - generic [ref=e258]: L3
                - slider [ref=e260] [cursor=pointer]: "1"
                - generic [ref=e261]: 100%
              - generic [ref=e262]: Contour
  - generic [ref=e264]:
    - generic [ref=e265]:
      - generic [ref=e266]:
        - generic [ref=e267]: GEOMETRY STANDARD
        - generic [ref=e268]:
          - button "L1" [ref=e269] [cursor=pointer]
          - button "L2" [ref=e270] [cursor=pointer]
          - button "L3" [ref=e271] [cursor=pointer]
      - button "－" [ref=e272] [cursor=pointer]
    - generic [ref=e273]:
      - generic [ref=e274]:
        - generic [ref=e275]: Geometry
        - generic [ref=e276]: Torus
      - generic [ref=e277]:
        - generic [ref=e278]:
          - generic [ref=e279]:
            - generic [ref=e280]: CC11101
            - generic [ref=e281]: Radius
            - generic [ref=e282]: "3.00"
          - generic [ref=e284]:
            - generic [ref=e285]:
              - 'generic "lo: 0.50" [ref=e288]': ▼
              - 'generic "hi: 10.00" [ref=e289]': ▲
            - slider [ref=e293] [cursor=pointer]: "3"
            - generic [ref=e294]:
              - generic [ref=e295]: "0.50"
              - generic [ref=e296]: "10.00"
        - generic [ref=e297]:
          - generic [ref=e298]:
            - generic [ref=e299]: CC11102
            - generic [ref=e300]: Tube
            - generic [ref=e301]: "1.00"
          - generic [ref=e303]:
            - generic [ref=e304]:
              - 'generic "lo: 0.10" [ref=e307]': ▼
              - 'generic "hi: 4.00" [ref=e308]': ▲
            - slider [ref=e312] [cursor=pointer]: "1"
            - generic [ref=e313]:
              - generic [ref=e314]: "0.10"
              - generic [ref=e315]: "4.00"
        - generic [ref=e316]:
          - generic [ref=e317]:
            - generic [ref=e318]: CC11202
            - generic [ref=e319]: Radial Segments
            - generic [ref=e320]: "16.00"
          - generic [ref=e322]:
            - generic [ref=e323]:
              - 'generic "lo: 3.0" [ref=e326]': ▼
              - 'generic "hi: 64.0" [ref=e327]': ▲
            - slider [ref=e331] [cursor=pointer]: "16"
            - generic [ref=e332]:
              - generic [ref=e333]: "3.0"
              - generic [ref=e334]: "64.0"
        - generic [ref=e335]:
          - generic [ref=e336]:
            - generic [ref=e337]: CC11201
            - generic [ref=e338]: Tubular Segments
            - generic [ref=e339]: "64.00"
          - generic [ref=e341]:
            - generic [ref=e342]:
              - 'generic "lo: 8.0" [ref=e345]': ▼
              - 'generic "hi: 256.0" [ref=e346]': ▲
            - slider [ref=e350] [cursor=pointer]: "64"
            - generic [ref=e351]:
              - generic [ref=e352]: "8.0"
              - generic [ref=e353]: "256.0"
        - generic [ref=e354]:
          - generic [ref=e355]:
            - generic [ref=e356]: CC11301
            - generic [ref=e357]: Speed
            - generic [ref=e358]: "0.40"
          - generic [ref=e360]:
            - generic [ref=e361]:
              - 'generic "lo: 0.00" [ref=e364]': ▼
              - 'generic "hi: 2.00" [ref=e365]': ▲
            - slider [ref=e369] [cursor=pointer]: "0.4"
            - generic [ref=e370]:
              - generic [ref=e371]: "0.00"
              - generic [ref=e372]: "2.00"
        - generic [ref=e373]:
          - generic [ref=e374]:
            - generic [ref=e375]: CC11401
            - generic [ref=e376]: Hue
            - generic [ref=e377]: "30.00"
          - generic [ref=e379]:
            - generic [ref=e380]:
              - 'generic "lo: 0.0" [ref=e383]': ▼
              - 'generic "hi: 360.0" [ref=e384]': ▲
            - slider [ref=e388] [cursor=pointer]: "30"
            - generic [ref=e389]:
              - generic [ref=e390]: "0.0"
              - generic [ref=e391]: "360.0"
  - generic [ref=e393]:
    - generic [ref=e394]:
      - generic [ref=e395]:
        - generic [ref=e396]: CAMERA STANDARD
        - generic [ref=e397]:
          - button "L1" [ref=e398] [cursor=pointer]
          - button "L2" [ref=e399] [cursor=pointer]
          - button "L3" [ref=e400] [cursor=pointer]
      - button "－" [ref=e401] [cursor=pointer]
    - generic [ref=e402]:
      - generic [ref=e403]:
        - generic [ref=e404]: Camera
        - combobox [ref=e405] [cursor=pointer]:
          - option "Aerial Camera"
          - option "Orbit Camera" [selected]
          - option "Static Camera"
      - generic [ref=e406]:
        - generic [ref=e407]:
          - generic [ref=e408]:
            - generic [ref=e409]: Radius
            - generic [ref=e410]: "12.00"
          - generic [ref=e412]:
            - generic [ref=e413]:
              - 'generic "lo: 1.0" [ref=e416]': ▼
              - 'generic "hi: 50.0" [ref=e417]': ▲
            - slider [ref=e421] [cursor=pointer]: "11.78"
            - generic [ref=e422]:
              - generic [ref=e423]: "1.0"
              - generic [ref=e424]: "50.0"
        - generic [ref=e425]:
          - generic [ref=e426]:
            - generic [ref=e427]: Height
            - generic [ref=e428]: "4.00"
          - generic [ref=e430]:
            - generic [ref=e431]:
              - 'generic "lo: -20.0" [ref=e434]': ▼
              - 'generic "hi: 30.0" [ref=e435]': ▲
            - slider [ref=e439] [cursor=pointer]: "4"
            - generic [ref=e440]:
              - generic [ref=e441]: "-20.0"
              - generic [ref=e442]: "30.0"
        - generic [ref=e443]:
          - generic [ref=e444]:
            - generic [ref=e445]: Speed
            - generic [ref=e446]: "0.40"
          - generic [ref=e448]:
            - generic [ref=e449]:
              - 'generic "lo: 0.00" [ref=e452]': ▼
              - 'generic "hi: 3.00" [ref=e453]': ▲
            - slider [ref=e457] [cursor=pointer]: "0.39"
            - generic [ref=e458]:
              - generic [ref=e459]: "0.00"
              - generic [ref=e460]: "3.00"
        - generic [ref=e461]:
          - generic [ref=e462]:
            - generic [ref=e463]: Auto Rotate
            - generic [ref=e464]: "1.00"
          - generic [ref=e466]:
            - generic [ref=e467]:
              - 'generic "lo: 0.000" [ref=e470]': ▼
              - 'generic "hi: 1.000" [ref=e471]': ▲
            - slider [ref=e475] [cursor=pointer]: "1"
            - generic [ref=e476]:
              - generic [ref=e477]: "0.000"
              - generic [ref=e478]: "1.000"
  - generic [ref=e480]:
    - generic [ref=e481]:
      - generic [ref=e482]:
        - generic [ref=e483]: FX STANDARD
        - generic [ref=e484]:
          - button "L1" [ref=e485] [cursor=pointer]
          - button "L2" [ref=e486] [cursor=pointer]
          - button "L3" [ref=e487] [cursor=pointer]
      - button "－" [ref=e488] [cursor=pointer]
    - generic [ref=e489]:
      - generic [ref=e491]:
        - generic [ref=e492]: AfterImage
        - button "OFF" [ref=e493] [cursor=pointer]
      - generic [ref=e495]:
        - generic [ref=e496]: Feedback
        - button "OFF" [ref=e497] [cursor=pointer]
      - generic [ref=e499]:
        - generic [ref=e500]: Bloom
        - button "OFF" [ref=e501] [cursor=pointer]
      - generic [ref=e503]:
        - generic [ref=e504]: Kaleidoscope
        - button "OFF" [ref=e505] [cursor=pointer]
      - generic [ref=e507]:
        - generic [ref=e508]: Mirror
        - button "OFF" [ref=e509] [cursor=pointer]
      - generic [ref=e511]:
        - generic [ref=e512]: Zoom Blur
        - button "OFF" [ref=e513] [cursor=pointer]
      - generic [ref=e515]:
        - generic [ref=e516]: RGB Shift
        - button "OFF" [ref=e517] [cursor=pointer]
      - generic [ref=e519]:
        - generic [ref=e520]: CRT
        - button "OFF" [ref=e521] [cursor=pointer]
      - generic [ref=e523]:
        - generic [ref=e524]: Glitch
        - button "OFF" [ref=e525] [cursor=pointer]
      - generic [ref=e527]:
        - generic [ref=e528]: Color Grading
        - button "OFF" [ref=e529] [cursor=pointer]
  - generic: P:Prefs 1:Macro 3:Mixer 6:Monitor | H:Hide S:Show F:全非表示+全画面
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * GeometryStandardDnDWindow の動作確認
  5  |  *
  6  |  * 確認項目:
  7  |  * 1. RangeSlider が表示されるか
  8  |  * 2. D&D ハンドル（≡）が表示されるか
  9  |  * 3. D&D で MacroKnob にドロップしたとき AssignDialog が開くか
  10 |  */
  11 | 
  12 | test.describe('GeometryStandardDnDWindow', () => {
  13 |   test.beforeEach(async ({ page }) => {
  14 |     await page.goto('http://localhost:5173/')
  15 |     await page.waitForTimeout(1000)
  16 |   })
  17 | 
  18 |   test('RangeSlider が表示される', async ({ page }) => {
  19 |     const header = page.getByText('GEOMETRY STD D&D')
  20 |     await expect(header).toBeVisible()
  21 | 
  22 |     const loHandle = page.locator('text=▼').first()
  23 |     await expect(loHandle).toBeVisible()
  24 | 
  25 |     const hiHandle = page.locator('text=▲').first()
  26 |     await expect(hiHandle).toBeVisible()
  27 |   })
  28 | 
  29 |   test('≡ D&D ハンドルが表示される', async ({ page }) => {
  30 |     const dragHandle = page.locator('text=≡').first()
  31 |     await expect(dragHandle).toBeVisible()
  32 |   })
  33 | 
  34 |   test('D&D で AssignDialog が開く', async ({ page }) => {
  35 |     const dragHandle = page.locator('text=≡').first()
  36 |     const knobCell = page.locator('[title*="macro-"]').first()
  37 | 
> 38 |     await dragHandle.dragTo(knobCell)
     |                      ^ Error: locator.dragTo: Test timeout of 30000ms exceeded.
  39 | 
  40 |     const assignDialog = page.getByText('ASSIGN').first()
  41 |     await expect(assignDialog).toBeVisible({ timeout: 2000 })
  42 |   })
  43 | })
  44 | 
```