/**
 * Triggers a brief tactile selection tick on supported mobile browsers/WebViews.
 */
export function triggerSelectionHaptic(durationMs = 10): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  try {
    navigator.vibrate(durationMs)
  } catch {
    // Ignore restricted vibration calls when user activation or permission is absent
  }
}
