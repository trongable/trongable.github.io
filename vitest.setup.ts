import '@testing-library/jest-dom/vitest'

// Mock browser APIs for jsdom environment
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}

  window.matchMedia =
    window.matchMedia ||
    function (query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
    }
}
