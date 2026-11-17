export const SCRAMBLE_GLYPHS = ['0', '1', '_', '/', '<', '>', '*', '#', '$', '+', '!', '%']

/**
 * Procedurally replaces random characters with cyber glyphs while preserving string length.
 */
export function scrambleGlyphs(text: string, count = 1, glyphs = SCRAMBLE_GLYPHS): string {
  if (!text || count <= 0) return text
  const chars = text.split('')
  const numToScramble = Math.min(chars.length, count)
  for (let i = 0; i < numToScramble; i++) {
    const idx = Math.floor(Math.random() * chars.length)
    chars[idx] = glyphs[Math.floor(Math.random() * glyphs.length)]
  }
  return chars.join('')
}
