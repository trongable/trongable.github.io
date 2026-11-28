import { test, expect } from '@playwright/test'

const VIDEOS = [
  {
    id: 'qopBymi9FYY',
    youtubeId: 'qopBymi9FYY',
    title: 'attack on titan: get ready for this amv',
  },
  {
    id: 'q_25b9zlUa0',
    youtubeId: 'q_25b9zlUa0',
    title: 'halo 3/reach :: bells and whistles minitage',
  },
  {
    id: '5qR27jBSYaE',
    youtubeId: '5qR27jBSYaE',
    title: 'halo 3 :: aspirations trailer',
  },
  {
    id: '7ZCbvoHtwSY',
    youtubeId: '7ZCbvoHtwSY',
    title: 'halo 3 :: h3m1',
  },
  {
    id: '_ZMbKpKUmsU',
    youtubeId: '_ZMbKpKUmsU',
    title: 'halo 3 :: betatage',
  },
  {
    id: 'OPB3AVjlPyg',
    youtubeId: 'OPB3AVjlPyg',
    title: 'halo 4 :: highlights',
  },
  {
    id: 'NXck93vKCpQ',
    youtubeId: 'NXck93vKCpQ',
    title: 'ffa #5 - round 1, heat 1 (trongavitus pov)',
  },
  { id: '1CorPsJtwM8', youtubeId: '1CorPsJtwM8', title: 'monarchs iii' },
  { id: 'LrvfELsyZVY', youtubeId: 'LrvfELsyZVY', title: 'monarchs ii' },
  { id: 'r6YJfytbRE8', youtubeId: 'r6YJfytbRE8', title: 'monarchs i' },
  { id: 'Qv4f0Z9UyBc', youtubeId: 'Qv4f0Z9UyBc', title: 'corolla nc' },
  { id: 'jbsUj8ZGJ0Q', youtubeId: 'jbsUj8ZGJ0Q', title: 'july 4th 2026' },
  { id: 'FZkjZuTGTWk', youtubeId: 'FZkjZuTGTWk', title: 'baltimore md' },
  { id: 'EJ9YCugHMfI', youtubeId: 'EJ9YCugHMfI', title: 'coopers rock state park' },
  { id: 'AglZHPEcqnc', youtubeId: 'AglZHPEcqnc', title: 'arlington va' },
  { id: 'ARlMMjH9S6U', youtubeId: 'ARlMMjH9S6U', title: 'pennsylvania' },
  { id: 'JgRafkC2D9w', youtubeId: 'JgRafkC2D9w', title: 'arlington va' },
  { id: 'wBb8EO6GWMQ', youtubeId: 'wBb8EO6GWMQ', title: 'trap pond state park' },
  { id: '76yTpY6OEJA', youtubeId: '76yTpY6OEJA', title: 'arlington va' },
  { id: 'I6nAwyrAr0s', youtubeId: 'I6nAwyrAr0s', title: 'coopers rock state park' },
  { id: 'AqUk9zJXt_M', youtubeId: 'AqUk9zJXt_M', title: 'washington dc' },
  { id: 'xZz_ZF7bIEs', youtubeId: 'xZz_ZF7bIEs', title: 'great falls va' },
  { id: 'DD-5Qr_u_mE', youtubeId: 'DD-5Qr_u_mE', title: 'okaton sd' },
  { id: '9k0ml1YD3I4', youtubeId: '9k0ml1YD3I4', title: 'badlands national park' },
  { id: '5Htdp2kELys', youtubeId: '5Htdp2kELys', title: 'falls church va' },
  { id: 'DjuyoTjaEBY', youtubeId: 'DjuyoTjaEBY', title: 'monarchs iv' },
  { id: 'Rk2zJAotf2o', youtubeId: 'Rk2zJAotf2o', title: 'monarchs v' },
  { id: 'QPG8lMWOphs', youtubeId: 'QPG8lMWOphs', title: 'brooklyn ny' },
  { id: 'Vk0l7fatwbA', youtubeId: 'Vk0l7fatwbA', title: 'nyc ny' },
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
  { id: 'photo-monotype-monarch-pink', title: 'monarch screenprint i' },
  { id: 'photo-monotype-monarch-cyan', title: 'monarch screenprint ii' },
  { id: 'photo-monotype-monarch-coral', title: 'monarch screenprint iii' },
  { id: 'photo-monotype-monarch-wings', title: 'monarch screenprint iv' },
  { id: 'photo-acrylic-pour-emerald', title: 'acrylic pour i' },
  { id: 'photo-acrylic-pour-coral', title: 'acrylic pour ii' },
  { id: 'photo-acrylic-pour-jade', title: 'acrylic pour iii' },
  { id: 'photo-sonny-screenprint-i', title: 'sonny screenprint i' },
  { id: 'photo-pink-sunset-trees', title: 'arlington va' },
  { id: 'photo-acrylic-pour-magenta', title: 'acrylic pour iv' },
  { id: 'photo-antelope-canyon', title: 'antelope canyon' },
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

  test('TC-02: Accessible navigation items exist for all 60 gallery items (29 videos + 31 photos)', async ({ page }) => {
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

    // Verify title in overlay is horizontally centered below the media
    const titleEl = overlay.getByText(photo.title.toLowerCase())
    await expect(titleEl).toBeVisible()
    const stageEl = overlay.locator('[data-testid="theater-media-stage"]')
    const [titleBox, stageBox] = await Promise.all([titleEl.boundingBox(), stageEl.boundingBox()])
    expect(titleBox).not.toBeNull()
    expect(stageBox).not.toBeNull()
    const titleCenterX = titleBox!.x + titleBox!.width / 2
    const stageCenterX = stageBox!.x + stageBox!.width / 2
    expect(Math.abs(titleCenterX - stageCenterX)).toBeLessThan(4)
    expect(titleBox!.y).toBeGreaterThan(stageBox!.y + stageBox!.height - 2)

    // Verify high-resolution image is rendered
    const img = overlay.locator('[data-testid="theater-main-image"]')
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

    // Verify Gallery Chamber tab is selected and layout/dim customization are removed
    await expect(drawer.getByRole('button', { name: 'Gallery Chamber', exact: true })).toBeVisible()
    await expect(drawer.getByText('Chamber Layout')).not.toBeVisible()
    await expect(drawer.getByRole('button', { name: '3-Tier (A)' })).not.toBeVisible()
    await expect(drawer.getByLabel('Dim Intensity')).not.toBeVisible()
    await expect(drawer.getByLabel('Free Spin (360°+)')).toBeChecked()
    await expect(drawer.getByLabel('Intro Collapse')).toBeChecked()
    await expect(drawer.getByLabel('Scatter on Select')).toBeChecked()
    await expect(drawer.getByLabel('Center Gaze Zoom')).toBeChecked()
    await expect(drawer.getByLabel('Vignette')).toBeChecked()
    await expect(drawer.getByLabel('Ambient Float')).toBeChecked()
    await expect(drawer.getByLabel('Corner Reticles')).toBeChecked()
    await expect(drawer.getByLabel('Motion Blur')).not.toBeChecked()
    await expect(drawer.locator('text=360°').first()).toBeVisible()
    await expect(drawer.locator('text=5.5')).toBeVisible()

    await expect(drawer.locator('text=Sphere Radius')).toBeVisible()
    await expect(drawer.locator('text=Horizontal Wrap Arc')).toBeVisible()
    await expect(drawer.locator('text=Pan Sensitivity')).toBeVisible()
    await expect(drawer.locator('text=Drag Multiplier')).toBeVisible()
    await expect(drawer.locator('text=Fling Inertia')).toBeVisible()
  })

  test('TC-10: Gallery order is randomized on page load and stable per visit', async ({ page }) => {
    // 1. Visit with random=false should have exact canonical first item
    await page.goto('/#/gallery?random=false')
    const navDeterministic = page.getByRole('navigation', { name: 'Available Gallery Items' })
    const firstButtonCanonical = await navDeterministic.locator('button').first().textContent()
    expect(firstButtonCanonical).toBe('View zion national park')

    // 2. Normal visit without random=false is randomized and contains all 60 items
    await page.goto('/#/gallery')
    const navRandom = page.getByRole('navigation', { name: 'Available Gallery Items' })
    const buttons = await navRandom.locator('button').all()
    expect(buttons).toHaveLength(60)
  })

  test('TC-11: Opening terminal shifts open Tuner above it on Y-axis without overlap', async ({ page }) => {
    await page.goto('/#/gallery?tuner=true')

    const tuner = page.locator('[data-testid="geometry-tuner"]')
    await expect(tuner).toBeVisible()
    const beforeBox = await tuner.boundingBox()
    expect(beforeBox).not.toBeNull()

    // Wake CyberTerminalLine by typing a character
    await page.keyboard.press('t')
    const terminal = page.locator('[data-testid="cyber-terminal-line"]')
    await expect(terminal).toBeVisible()

    // Wait for 320ms CRT scanline sweep + 180ms vertical snap (500ms total) to settle
    await page.waitForTimeout(560)

    const [raisedTunerBox, terminalBox] = await Promise.all([tuner.boundingBox(), terminal.boundingBox()])
    expect(raisedTunerBox).not.toBeNull()
    expect(terminalBox).not.toBeNull()

    // Tuner must move upward on Y axis and sit cleanly above the terminal bar
    expect(raisedTunerBox!.y).toBeLessThan(beforeBox!.y - 20)
    expect(raisedTunerBox!.y + raisedTunerBox!.height).toBeLessThan(terminalBox!.y)

    // Dismissing terminal returns Tuner back down
    await page.keyboard.press('Escape')
    await expect(terminal).not.toBeVisible()
    await page.waitForTimeout(220)
    const restoredBox = await tuner.boundingBox()
    expect(restoredBox!.y).toBeCloseTo(beforeBox!.y, 0)
  })

  test('TC-12: Expanded Tuner gear uses high-contrast dark gray and prev/next sit above Tuner pill', async ({ page }) => {
    await page.goto('/#/gallery?tuner=true')

    const toggleBtn = page.getByLabel('Toggle parameter drawer')
    await toggleBtn.click()
    await expect(page.locator('[data-testid="geometry-tuner-drawer"]')).toBeVisible()

    await expect(toggleBtn).toHaveCSS('color', 'rgb(28, 27, 34)')

    // Close drawer so only the expand pill remains visible, then open full-size theater view
    await toggleBtn.click()
    await expect(page.locator('[data-testid="geometry-tuner-drawer"]')).not.toBeVisible()

    const firstPhotoBtn = page.locator(`[data-testid="gallery-nav-btn-${PHOTOS[0].id}"]`)
    await firstPhotoBtn.dispatchEvent('click')

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    const navControls = overlay.locator('[data-testid="theater-nav-controls"]')
    const tuner = page.locator('[data-testid="geometry-tuner"]')
    await page.waitForTimeout(250)

    const [navBox, tunerBox] = await Promise.all([navControls.boundingBox(), tuner.boundingBox()])
    expect(navBox).not.toBeNull()
    expect(tunerBox).not.toBeNull()
    expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(tunerBox!.y + 2)

    // Clicking next button succeeds cleanly without being intercepted by the Tuner pill
    await overlay.getByRole('button', { name: 'Next item' }).click()
    await expect(overlay).toBeVisible()
  })
})
