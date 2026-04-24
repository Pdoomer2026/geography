import { test, expect } from '@playwright/test'

/**
 * GeometryStandardDnDWindow の動作確認
 *
 * 確認項目:
 * 1. RangeSlider が表示されるか
 * 2. D&D ハンドル（≡）が表示されるか
 * 3. D&D で MacroKnob にドロップしたとき AssignDialog が開くか
 */

test.describe('GeometryStandardDnDWindow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForTimeout(1000)
  })

  test('RangeSlider が表示される', async ({ page }) => {
    const header = page.getByText('GEOMETRY STD D&D')
    await expect(header).toBeVisible()

    const loHandle = page.locator('text=▼').first()
    await expect(loHandle).toBeVisible()

    const hiHandle = page.locator('text=▲').first()
    await expect(hiHandle).toBeVisible()
  })

  test('≡ D&D ハンドルが表示される', async ({ page }) => {
    const dragHandle = page.locator('text=≡').first()
    await expect(dragHandle).toBeVisible()
  })

  test('D&D で AssignDialog が開く', async ({ page }) => {
    const dragHandle = page.locator('text=≡').first()
    const knobCell = page.locator('[title*="macro-"]').first()

    await dragHandle.dragTo(knobCell)

    const assignDialog = page.getByText('ASSIGN').first()
    await expect(assignDialog).toBeVisible({ timeout: 2000 })
  })
})
