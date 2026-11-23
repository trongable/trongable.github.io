/**
 * Standalone diagnostic CLI runner for the Videos Page
 * Can be executed directly via: node scripts/test-videos-cli.js
 */
import { chromium } from '@playwright/test'

async function runVideosCliDiagnostic() {
  console.log('\n======================================================')
  console.log('  VIDEOS PAGE - PLAYWRIGHT DIAGNOSTIC AUDIT RUNNER')
  console.log('======================================================\n')

  const consoleLogs = []
  const consoleErrors = []

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  page.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    consoleLogs.push({ type, text })
    if (type === 'error') {
      consoleErrors.push(text)
    }
  })

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message)
  })

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`)
      passed++
    } else {
      console.error(`  [FAIL] ${message}`)
      failed++
    }
  }

  try {
    const targetUrl = 'http://localhost:5173/#/videos'
    console.log(`[1] Navigating to ${targetUrl}...`)
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // Check main shell
    const hasHeader = await page.locator('text=video archives').isVisible()
    assert(hasHeader, 'Header displays "video archives"')

    const hasReturnHome = await page.getByRole('button', { name: 'Return home' }).isVisible()
    assert(hasReturnHome, 'Return home (← home) button is visible')

    // Check canvas
    const canvas = page.locator('[data-testid="cerebro-chamber-container"] canvas')
    const hasCanvas = await canvas.isVisible()
    assert(hasCanvas, 'WebGL 3D Canvas is active and visible')

    // Check accessibility buttons
    const navButtons = await page.locator('nav[aria-label="Available Videos"] button').count()
    assert(navButtons === 7, `Found all 7 accessible video buttons (found: ${navButtons})`)

    // Click first video using accessible navigation button
    console.log('\n[2] Selecting first video via accessible navigation button (dispatchEvent click)...')
    const firstBtn = page.getByRole('button', { name: 'Play Attack on Titan: Get Ready For This AMV' })
    await firstBtn.dispatchEvent('click')

    // Wait for the 340ms flight + overlay mount
    const overlay = page.locator('[data-testid="video-theater-overlay"]')
    await overlay.waitFor({ state: 'visible', timeout: 5000 })
    assert(await overlay.isVisible(), 'Theater player overlay mounted successfully after 3D flight')

    // Check title in overlay
    const overlayTitle = await overlay.getByText('Attack on Titan: Get Ready For This AMV').isVisible()
    assert(overlayTitle, 'Video title is displayed in theater mode HUD')

    // Verify iframe
    const iframe = overlay.locator('iframe')
    const iframeSrc = await iframe.getAttribute('src')
    assert(
      iframeSrc && iframeSrc.includes('qopBymi9FYY') && iframeSrc.includes('autoplay=1'),
      `YouTube iframe src correctly formatted: ${iframeSrc?.slice(0, 55)}...`
    )

    // Verify no author credit or cerebro references
    const hasAuthor = await overlay.locator('text=/Lil Onionette/i').isVisible()
    assert(!hasAuthor, 'Author channel name is omitted as requested')

    const hasCerebro = await overlay.locator('text=/cerebro/i').isVisible()
    assert(!hasCerebro, 'Text references to "cerebro" are removed')

    // Cycle Next video
    console.log('\n[3] Testing Next video cycling...')
    const nextBtn = overlay.getByRole('button', { name: 'Next video' })
    await nextBtn.click()
    await page.waitForTimeout(300)

    const nextTitle = await overlay.getByText('Trongavitus :: Bells and Whistles - Halo 3 and Reach minitage').isVisible()
    assert(nextTitle, 'Next button successfully cycles to second video')

    // Keyboard ESC dismissal
    console.log('\n[4] Testing ESC dismissal and hitch-free dissolve...')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250) // Wait for 180ms dissolve
    const isOverlayGone = !(await overlay.isVisible())
    assert(isOverlayGone, 'Escape key triggers smooth 180ms exit dissolve and unmount')

    // Test deep-linking
    console.log('\n[5] Testing query parameter deep-linking (?v=5qR27jBSYaE)...')
    await page.goto('http://localhost:5173/#/videos?v=5qR27jBSYaE')
    await overlay.waitFor({ state: 'visible', timeout: 3000 })
    const deepLinkTitle = await overlay.getByText('Aspirations Trailer :: Edited by trongzor media').isVisible()
    assert(deepLinkTitle, 'Deep-linking via ?v= query param automatically launches targeted video')

    // Close and test return home
    console.log('\n[6] Testing Return home navigation...')
    const returnChamberBtn = overlay.getByRole('button', { name: 'Return to chamber' })
    await returnChamberBtn.click()
    await page.waitForTimeout(250)

    const returnHome = page.getByRole('button', { name: 'Return home' })
    await returnHome.click()
    await page.waitForTimeout(300)
    const currentUrl = page.url()
    assert(currentUrl.includes('#/?halo=true'), `Returned home successfully (${currentUrl})`)

    // Audit console logs & errors
    console.log('\n[7] Auditing browser console logs and errors...')
    assert(consoleErrors.length === 0, `Zero browser console errors detected (errors: ${consoleErrors.length})`)
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e) => console.error('    Error detail:', e))
    }

  } catch (err) {
    console.error('\nDiagnostic execution error:', err)
    failed++
  } finally {
    await browser.close()
  }

  console.log('\n------------------------------------------------------')
  console.log(`Diagnostic Summary: ${passed} passed, ${failed} failed`)
  console.log('------------------------------------------------------\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runVideosCliDiagnostic()
