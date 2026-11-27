/**
 * Returns true when the user's OS/browser prefers reduced motion.
 */
export function isReducedMotionEnabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
