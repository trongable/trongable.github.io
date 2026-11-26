import { test, expect } from '@playwright/test'

test.describe('Angel Builder (/angel)', () => {
  test('renders 3D Angel studio with zero console errors and allows category customization', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/#/angel?paused=true')

    await expect(page.getByRole('heading', { name: 'angel builder' })).toBeVisible()
    await expect(page.getByTestId('angel-studio-canvas')).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()

    // Verify no "sonny" text appears on page
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.toLowerCase()).not.toContain('sonny')

    // Switch hair & top categories
    await page.getByTestId('tab-hair').click()
    await page.getByTestId('item-hair-short-crop').click()
    await page.getByTestId('tab-tops').click()
    await page.getByTestId('item-tops-oversized-hoodie').click()

    expect(errors).toEqual([])
  })
})
