/**
 * Canonical navigation items rendered by every 3D topology menu.
 */
export interface MenuItemConfig {
  label: string
  path: string
  imageUrl?: string
  isExternal?: boolean
}

export const MENU_ITEMS: MenuItemConfig[] = [
  { label: 'about', path: '/about' },
  { label: 'gallery', path: '/gallery' },
  { label: 'more', path: '/more' },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png' },
  { label: 'dchc', path: 'https://dc-hardcore.com', isExternal: true },
]
