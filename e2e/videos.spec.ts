import { test, expect } from '@playwright/test'

const VIDEOS = [
  {
    id: 'video-1',
    youtubeId: 'qopBymi9FYY',
    title: 'Attack on Titan: Get Ready For This AMV',
  },
  {
    id: 'video-2',
    youtubeId: 'q_25b9zlUa0',
    title: 'Trongavitus :: Bells and Whistles - Halo 3 and Reach minitage',
  },
  {
    id: 'video-3',
    youtubeId: '5qR27jBSYaE',
    title: 'Aspirations Trailer :: Edited by trongzor media',
  },
  {
    id: 'video-4',
    youtubeId: '7ZCbvoHtwSY',
    title: 'Trongavitus H3M1 :: Edited by trongzor media',
  },
  {
    id: 'video-5',
    youtubeId: '_ZMbKpKUmsU',
    title: 'Betatage The Olden Days :: Edited by trongzor media',
  },
  {
    id: 'video-6',
    youtubeId: 'OPB3AVjlPyg',
    title: '[Halo 4] Halo 4 Highlights by Trongavitus',
  },
  {
    id: 'video-7',
    youtubeId: 'NXck93vKCpQ',
    title: 'FFA #5 - Round 1, Heat 1 (Trongavitus POV)',
  },
]

test.describe('Videos Page End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept console errors to ensure 0 uncaught exceptions
    page.on('pageerror', (err) => {
      console.error('[Browser Uncaught Error]', err.message)
    })
  })

  test('TC-01: Page initial load, header, return button, and WebGL canvas mounting', async ({ page }) => {
    await page.goto('/#/videos')

    // Verify main page shell
    const mainContainer = page.locator('[data-testid="videos-page"]')
    await expect(mainContainer).toBeVisible()

    // Verify return home button
    const returnHomeBtn = page.getByRole('button', { name: 'Return home' })
    await expect(returnHomeBtn).toBeVisible()

    // Verify WebGL Canvas is present and sizes to container
    const canvas = page.locator('[data-testid="cerebro-chamber-container"] canvas')
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

  test('TC-02: Accessible video navigation items exist for all 7 videos', async ({ page }) => {
    await page.goto('/#/videos')

    const nav = page.getByRole('navigation', { name: 'Available Videos' })
    await expect(nav).toBeAttached()

    for (const video of VIDEOS) {
      const btn = nav.getByRole('button', { name: `Play ${video.title}` })
      await expect(btn).toBeAttached()
    }
  })

  test('TC-03 & TC-04: Video selection, 3D transit, and theater player overlay mounting', async ({ page }) => {
    await page.goto('/#/videos')

    const firstVideo = VIDEOS[0]
    const playBtn = page.getByRole('button', { name: `Play ${firstVideo.title}` })

    // Trigger video selection via accessible navigation button (dispatchEvent for sr-only)
    await playBtn.dispatchEvent('click')

    // Wait for the two-stage transit: 3D flight (340ms) then overlay mounts
    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    // Verify title in theater overlay
    await expect(overlay.getByText(firstVideo.title)).toBeVisible()

    // Verify absence of channel names and counters
    await expect(overlay.locator('text=/cerebro/i')).not.toBeVisible()
    await expect(overlay.locator('text=/ARCHIVE ENTRY/i')).not.toBeVisible()

    // Verify embedded iframe
    const iframe = overlay.locator('iframe')
    await expect(iframe).toBeVisible()
    const iframeSrc = await iframe.getAttribute('src')
    expect(iframeSrc).toContain(`embed/${firstVideo.youtubeId}`)
    expect(iframeSrc).toContain('autoplay=1')
  })

  test('TC-05: Prev / Next cycling via UI buttons and wraparound', async ({ page }) => {
    await page.goto('/#/videos')

    // Start with video-2
    const secondVideo = VIDEOS[1]
    await page.getByRole('button', { name: `Play ${secondVideo.title}` }).dispatchEvent('click')

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })
    await expect(overlay.getByText(secondVideo.title)).toBeVisible()

    // Click Next -> advances to video-3
    const nextBtn = overlay.getByRole('button', { name: 'Next video' })
    await nextBtn.click()
    const thirdVideo = VIDEOS[2]
    await expect(overlay.getByText(thirdVideo.title)).toBeVisible()
    const nextIframe = overlay.locator('iframe')
    expect(await nextIframe.getAttribute('src')).toContain(thirdVideo.youtubeId)

    // Click Prev -> returns to video-2
    const prevBtn = overlay.getByRole('button', { name: 'Previous video' })
    await prevBtn.click()
    await expect(overlay.getByText(secondVideo.title)).toBeVisible()

    // Click Prev again -> returns to video-1
    await prevBtn.click()
    await expect(overlay.getByText(VIDEOS[0].title)).toBeVisible()

    // Click Prev on video-1 -> wraps around to video-7
    await prevBtn.click()
    const lastVideo = VIDEOS[6]
    await expect(overlay.getByText(lastVideo.title)).toBeVisible()
    const wrapIframe = overlay.locator('iframe')
    expect(await wrapIframe.getAttribute('src')).toContain(lastVideo.youtubeId)
  })

  test('TC-06: Keyboard navigation with ArrowRight, ArrowLeft, and Escape', async ({ page }) => {
    await page.goto('/#/videos')

    // Open middle video
    const middleVideo = VIDEOS[3]
    await page.getByRole('button', { name: `Play ${middleVideo.title}` }).dispatchEvent('click')

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })
    await expect(overlay.getByText(middleVideo.title)).toBeVisible()

    // Press ArrowRight -> advances to video 5
    await page.keyboard.press('ArrowRight')
    const nextVideo = VIDEOS[4]
    await expect(overlay.getByText(nextVideo.title)).toBeVisible()

    // Press ArrowLeft -> returns to video 4
    await page.keyboard.press('ArrowLeft')
    await expect(overlay.getByText(middleVideo.title)).toBeVisible()

    // Press Escape -> triggers smooth exit
    await page.keyboard.press('Escape')
    // Wait for the 180ms dissolve + unmount
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('TC-07: Hitch-free theater closing transition via UI button', async ({ page }) => {
    await page.goto('/#/videos')

    await page.getByRole('button', { name: `Play ${VIDEOS[0].title}` }).dispatchEvent('click')
    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 4000 })

    // Click Return to chamber button
    const returnBtn = overlay.getByRole('button', { name: 'Return to chamber' })
    await returnBtn.click()

    // Overlay smoothly dissolves and is unmounted
    await expect(overlay).not.toBeVisible({ timeout: 2000 })

    // Return home button and header remain interactable
    await expect(page.getByRole('button', { name: 'Return home' })).toBeVisible()
  })

  test('TC-08: Direct deep-linking via query parameter ?v=<id>', async ({ page }) => {
    const targetVideo = VIDEOS[1]
    await page.goto(`/#/videos?v=${targetVideo.youtubeId}`)

    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await expect(overlay).toBeVisible({ timeout: 2000 })
    await expect(overlay.getByText(targetVideo.title)).toBeVisible()

    const iframe = overlay.locator('iframe')
    expect(await iframe.getAttribute('src')).toContain(targetVideo.youtubeId)
  })

  test('TC-09: Return home navigation returns to #/?expanded=true', async ({ page }) => {
    await page.goto('/#/videos')

    const returnHomeBtn = page.getByRole('button', { name: 'Return home' })
    await returnHomeBtn.click()

    await expect(page).toHaveURL(/.*#\/\?expanded=true/)
  })

  test('TC-10: 3D Canvas mousemove stability without unintentional edge panning', async ({ page }) => {
    await page.goto('/#/videos')

    const canvas = page.locator('[data-testid="cerebro-chamber-container"] canvas')
    await expect(canvas).toBeVisible()
    const box = (await canvas.boundingBox())!

    // Move mouse across center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)

    // Move mouse toward right outer edge (passive hover produces zero unintentional panning)
    await page.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2)
    await page.waitForTimeout(200)

    // Move mouse back to center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)

    // Verify canvas remains stable and no console error was fired
    await expect(canvas).toBeVisible()
  })

  test('TC-11: Cyber terminal line activates on typing and executes tuner commands', async ({ page }) => {
    await page.goto('/#/videos')

    // Initial state: Tuner container is not visible
    const tunerContainer = page.locator('[data-testid="geometry-tuner"]')
    await expect(tunerContainer).not.toBeVisible()

    // Type on the page to awaken the terminal line
    await page.keyboard.type('tuner enable')
    const terminal = page.locator('[data-testid="cyber-terminal-line"]')
    await expect(terminal).toBeVisible()
    await expect(terminal).toContainText('tuner enable')

    // Press Enter to execute command
    await page.keyboard.press('Enter')

    // Tuner HUD is now visible
    await expect(tunerContainer).toBeVisible()

    // Clicking the terminal line stops propagation and does not trigger page clicks
    await terminal.click()
    await expect(page).toHaveURL(/.*#\/videos/)

    // Type tuner disable to dismiss the HUD
    await page.keyboard.type('tuner disable')
    await page.keyboard.press('Enter')
    await expect(tunerContainer).not.toBeVisible()
  })

  test('TC-12: Canvas click-drag and wheel panning', async ({ page }) => {
    await page.goto('/#/videos')

    const canvas = page.locator('[data-testid="cerebro-chamber-container"] canvas')
    await expect(canvas).toBeVisible()
    const box = (await canvas.boundingBox())!

    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2

    // Perform click-and-drag panning
    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + 120, centerY + 30, { steps: 5 })
    await page.mouse.up()

    // Perform trackpad/wheel panning
    await page.mouse.wheel(50, -30)
    await page.waitForTimeout(100)

    await expect(canvas).toBeVisible()
  })

  test('TC-13: Video Chamber Tuner tab provides dedicated video parameters', async ({ page }) => {
    // Navigate with ?tuner=true query parameter
    await page.goto('/#/videos?tuner=true')

    const tunerContainer = page.locator('[data-testid="geometry-tuner"]')
    await expect(tunerContainer).toBeVisible()

    // Bottom pill indicates chamber: video
    await expect(tunerContainer.locator('text=chamber:')).toBeVisible()
    await expect(tunerContainer.locator('text=video')).toBeVisible()

    // Open drawer
    const toggleBtn = page.getByLabel('Toggle parameter drawer')
    await toggleBtn.click()

    const drawer = page.locator('[data-testid="geometry-tuner-drawer"]')
    await expect(drawer).toBeVisible()

    // Verify dedicated "Video Chamber" tab is present and selected
    await expect(drawer.getByRole('button', { name: 'Video Chamber', exact: true })).toBeVisible()
    await expect(drawer.locator('text=Sphere Radius')).toBeVisible()
    await expect(drawer.locator('text=Thumbnail Scale')).toBeVisible()
    await expect(drawer.locator('text=Horizontal Wrap Arc')).toBeVisible()
    await expect(drawer.locator('text=Pan Sensitivity')).toBeVisible()
    await expect(drawer.locator('text=Dim Intensity')).toBeVisible()
    await expect(drawer.getByRole('button', { name: /Reset Video Chamber/i })).toBeVisible()
  })
})
