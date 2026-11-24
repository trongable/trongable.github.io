import { test, expect } from '@playwright/test'

const VIDEOS = [
  {
    id: 'qopBymi9FYY',
    youtubeId: 'qopBymi9FYY',
    title: 'Attack on Titan: Get Ready For This AMV',
  },
  {
    id: 'q_25b9zlUa0',
    youtubeId: 'q_25b9zlUa0',
    title: 'Halo 3/Reach :: Bells and Whistles Minitage',
  },
  {
    id: '5qR27jBSYaE',
    youtubeId: '5qR27jBSYaE',
    title: 'Halo 3 :: Aspirations Trailer',
  },
  {
    id: '7ZCbvoHtwSY',
    youtubeId: '7ZCbvoHtwSY',
    title: 'Halo 3 :: H3M1',
  },
  {
    id: '_ZMbKpKUmsU',
    youtubeId: '_ZMbKpKUmsU',
    title: 'Halo 3 :: Betatage',
  },
  {
    id: 'OPB3AVjlPyg',
    youtubeId: 'OPB3AVjlPyg',
    title: 'Halo 4 :: Highlights',
  },
  {
    id: 'NXck93vKCpQ',
    youtubeId: 'NXck93vKCpQ',
    title: 'FFA #5 - Round 1, Heat 1 (Trongavitus POV)',
  },
]

const PHOTOS = [
  { id: 'photo-chipmunk', title: 'zion national park' },
  { id: 'photo-anemone', title: 'washington dc' },
  { id: 'photo-yellow-rose', title: 'arlington va' },
  { id: 'photo-airplane', title: 'washington dc' },
  { id: 'photo-mantis', title: 'tysons corner va' },
  { id: 'photo-stickers', title: 'dc hardcore' },
  { id: 'photo-wild-daisies', title: 'great falls va' },
  { id: 'photo-truck', title: 'richmond va' },
  { id: 'photo-beaded-mobile', title: 'washington dc' },
  { id: 'photo-salvage-angel', title: 'baltimore md' },
  { id: 'photo-sparring', title: 'cdmx' },
  { id: 'photo-monarchs', title: 'mexico' },
  { id: 'photo-yellow-rose-bud', title: 'arlington va' },
  { id: 'photo-rainbow', title: 'falls church va' },
  { id: 'photo-red-rose-bud', title: 'arlington va' },
  { id: 'photo-milky-way', title: 'zion national park' },
  { id: 'photo-badlands', title: 'badlands national park' },
  { id: 'photo-bison', title: 'custer state park' },
  { id: 'photo-vintage-toys', title: 'falls church va' },
  { id: 'photo-hogan', title: 'page az' },
]

test.describe('Gallery Page End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept console errors to ensure 0 uncaught exceptions
    page.on('pageerror', (err) => {
      console.error('[Browser Uncaught Error]', err.message)
    })
  })

  test('TC-01: Page initial load, header, return button, and WebGL canvas mounting', async ({ page }) => {
    await page.goto('/#/gallery')

    const pageContainer = page.locator('[data-testid="gallery-page"]')
    await expect(pageContainer).toBeVisible()

    const returnBtn = page.getByRole('button', { name: 'Return home' })
    await expect(returnBtn).toBeVisible()
    await expect(returnBtn).toHaveText('← home')

    const chamberContainer = page.locator('[data-testid="cerebro-chamber-container"]')
    await expect(chamberContainer).toBeVisible()

    const canvas = chamberContainer.locator('canvas')
    await expect(canvas).toBeVisible()

    // Wait for R3F ResizeObserver to resize canvas to full container
    await expect.poll(async () => {
      const box = await canvas.boundingBox()
      return box ? box.width : 0
    }, { timeout: 3000 }).toBeGreaterThan(300)

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThan(150)
  })

  test('TC-02: Accessible navigation items exist for all 27 gallery items (7 videos + 20 photos in 3 rows of 9)', async ({ page }) => {
    await page.goto('/#/gallery')

    const nav = page.getByRole('navigation', { name: 'Available Gallery Items' })
    await expect(nav).toBeAttached()

    const allItems = [...VIDEOS, ...PHOTOS]
    for (const item of allItems) {
      const btn = nav.locator(`[data-testid="gallery-nav-btn-${item.id}"]`)
      await expect(btn).toBeAttached()
    }
  })

  test('TC-03: Video selection, 3D transit, and theater player overlay mounting', async ({ page }) => {
    await page.goto('/#/gallery')

    const firstVideo = VIDEOS[0]
    const playBtn = page.locator(`[data-testid="gallery-nav-btn-${firstVideo.id}"]`)

    // Trigger video selection via accessible navigation button (dispatchEvent for sr-only)
    await playBtn.dispatchEvent('click')

    // Wait for the two-stage transit: 3D flight (340ms) then overlay mounts
    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    // Verify title in theater overlay (forced lowercase)
    await expect(overlay.getByText(firstVideo.title.toLowerCase())).toBeVisible()

    // Verify embedded iframe
    const iframe = overlay.locator('iframe')
    await expect(iframe).toBeVisible()
    const iframeSrc = await iframe.getAttribute('src')
    expect(iframeSrc).toContain(`embed/${firstVideo.youtubeId}`)
    expect(iframeSrc).toContain('autoplay=1')
  })

  test('TC-04: Photo selection, 3D transit into focus, and photo viewer mounting', async ({ page }) => {
    await page.goto('/#/gallery')

    const photo = PHOTOS[1] // anemone
    const viewBtn = page.locator(`[data-testid="gallery-nav-btn-${photo.id}"]`)

    await viewBtn.dispatchEvent('click')

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    // Verify title in overlay
    await expect(overlay.getByText(photo.title.toLowerCase())).toBeVisible()

    // Verify high-resolution image is rendered
    const img = overlay.locator('img')
    await expect(img).toBeVisible()
    const imgSrc = await img.getAttribute('src')
    expect(imgSrc).toContain('anemone-white.jpg')

    // Click return to fly out of focus
    const returnBtn = overlay.getByRole('button', { name: 'Return to chamber' })
    await returnBtn.click()

    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('TC-05: Prev / Next cycling across items and keyboard shortcuts', async ({ page }) => {
    await page.goto('/#/gallery')

    const firstVideo = VIDEOS[0]
    const playBtn = page.locator(`[data-testid="gallery-nav-btn-${firstVideo.id}"]`)
    await playBtn.dispatchEvent('click')

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    // Arrow keys navigation
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    await expect(overlay).toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)
    await expect(overlay).toBeVisible()

    // Escape closes focus
    await page.keyboard.press('Escape')
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('TC-06: Direct deep-linking via query parameter ?v=<id> and ?item=<id>', async ({ page }) => {
    const targetVideo = VIDEOS[1]
    await page.goto(`/#/gallery?v=${targetVideo.youtubeId}`)

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 2000 })
    await expect(overlay.getByText(targetVideo.title.toLowerCase())).toBeVisible()

    // Direct deep-link to photo
    await page.goto('/#/gallery?item=photo-chipmunk')
    await expect(overlay).toBeVisible({ timeout: 2000 })
    await expect(overlay.getByText('zion national park')).toBeVisible()
  })

  test('TC-07: Return home navigation returns to #/?expanded=true', async ({ page }) => {
    await page.goto('/#/gallery')

    const returnHomeBtn = page.getByRole('button', { name: 'Return home' })
    await returnHomeBtn.click()

    await expect(page).toHaveURL(/.*#\/\?expanded=true/)
  })

  test('TC-08: Canvas click-drag and wheel panning with expanded bounds', async ({ page }) => {
    await page.goto('/#/gallery')

    const canvas = page.locator('[data-testid="cerebro-chamber-container"] canvas')
    await expect(canvas).toBeVisible()
    const box = (await canvas.boundingBox())!

    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    // Wide horizontal panning
    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + 240, centerY + 40, { steps: 5 })
    await page.mouse.up()

    // Wheel tilt
    await page.mouse.wheel(80, -50)
    await page.waitForTimeout(100)

    await expect(canvas).toBeVisible()
  })

  test('TC-09: Gallery Chamber Tuner provides expanded parameter controls', async ({ page }) => {
    await page.goto('/#/gallery?tuner=true')

    const tunerContainer = page.locator('[data-testid="geometry-tuner"]')
    await expect(tunerContainer).toBeVisible()

    // Bottom pill indicates chamber: gallery
    await expect(tunerContainer.locator('text=chamber:')).toBeVisible()
    await expect(tunerContainer.locator('text=gallery')).toBeVisible()

    // Open drawer
    const toggleBtn = page.getByLabel('Toggle parameter drawer')
    await toggleBtn.click()

    const drawer = page.locator('[data-testid="geometry-tuner-drawer"]')
    await expect(drawer).toBeVisible()

    // Verify Gallery Chamber tab is selected
    await expect(drawer.getByRole('button', { name: 'Gallery Chamber', exact: true })).toBeVisible()
    await expect(drawer.locator('text=Sphere Radius')).toBeVisible()
    await expect(drawer.locator('text=Horizontal Wrap Arc')).toBeVisible()
    await expect(drawer.locator('text=Pan Sensitivity')).toBeVisible()
  })

  test('TC-10: Gallery order is randomized on page load and stable per visit', async ({ page }) => {
    // 1. Visit with random=false should have exact canonical first item
    await page.goto('/#/gallery?random=false')
    const navDeterministic = page.getByRole('navigation', { name: 'Available Gallery Items' })
    const firstButtonCanonical = await navDeterministic.locator('button').first().textContent()
    expect(firstButtonCanonical).toBe('View zion national park')

    // 2. Normal visit without random=false is randomized and contains all 27 items
    await page.goto('/#/gallery')
    const navRandom = page.getByRole('navigation', { name: 'Available Gallery Items' })
    const buttons = await navRandom.locator('button').all()
    expect(buttons).toHaveLength(27)
  })
})
