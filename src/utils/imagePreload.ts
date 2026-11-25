const decodedCache = new Set<string>()

/**
 * Preloads and decodes an image off the main thread using HTMLImageElement.prototype.decode().
 * Decoded bitmaps reside in the browser's in-memory image cache so DOM mounting is instantaneous.
 */
export function preloadAndDecodeImage(url?: string | null): Promise<void> {
  if (!url || typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve()
  }

  if (decodedCache.has(url)) {
    return Promise.resolve()
  }

  const img = new Image()
  img.src = url

  if ('decode' in img && typeof img.decode === 'function') {
    return img
      .decode()
      .then(() => {
        decodedCache.add(url)
      })
      .catch(() => {
        // Fallback for decoding abort or network interruption
        decodedCache.add(url)
      })
  }

  return new Promise((resolve) => {
    img.onload = () => {
      decodedCache.add(url)
      resolve()
    }
    img.onerror = () => {
      resolve()
    }
  })
}

/**
 * Checks whether an image URL has already been decoded and cached in memory.
 */
export function isImageDecoded(url?: string | null): boolean {
  return url ? decodedCache.has(url) : false
}

/**
 * Clears the preload cache (essential for test isolation across vitest workers).
 */
export function clearImagePreloadCache(): void {
  decodedCache.clear()
}
