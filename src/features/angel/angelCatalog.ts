import type { AngelContainerStyle } from '@/features/angel/AngelContainerContext'

export type AngelCategory =
  | 'body'
  | 'hair'
  | 'accessories'
  | 'tops'
  | 'bottoms'
  | 'footwear'
  | 'stage'

export type EyeStyle = 'side-glance' | 'forward' | 'happy' | 'wink' | 'starlight'
export type MouthStyle = 'smile' | 'pout' | 'grin'

export interface AngelAvatarConfig {
  skinTone: string
  eyeStyle: EyeStyle
  eyeColor: string
  blushIntensity: number
  blushColor: string
  freckles: boolean
  mouthStyle: MouthStyle
  wingsEnabled: boolean
  wingColor: string
  hairId: string
  hairColor: string
  accessoryIds: string[]
  accessoryColor: string
  topId: string
  topColor: string
  bottomId: string
  bottomColor: string
  footwearId: string
  footwearColor: string
  containerStyle: AngelContainerStyle
}

export interface WardrobeItem {
  id: string
  label: string
  category: Exclude<AngelCategory, 'body' | 'stage'>
  modelUrl: string | null
  defaultColor: string
  supportsColor: boolean
  excludes?: string[]
}

export const SKIN_TONE_PRESETS: { id: string; label: string; hex: string }[] = [
  { id: 'porcelain', label: 'porcelain', hex: '#f7dfd0' },
  { id: 'peach', label: 'peach', hex: '#f2c8b0' },
  { id: 'warm-tan', label: 'warm tan', hex: '#d99e78' },
  { id: 'caramel', label: 'caramel', hex: '#b67852' },
  { id: 'espresso', label: 'espresso', hex: '#73462c' },
  { id: 'pastel-mint', label: 'mint vinyl', hex: '#b8ebd8' },
  { id: 'pastel-lilac', label: 'lilac vinyl', hex: '#dcc7f2' },
]

export const SWATCH_PALETTE: string[] = [
  '#1f1d24',
  '#4a3228',
  '#e2f872',
  '#d4adf0',
  '#83d4d4',
  '#eb6b34',
  '#f2a2b8',
  '#f4f4f6',
  '#3f4d3f',
  '#424a68',
]

export const EYE_STYLES: { id: EyeStyle; label: string }[] = [
  { id: 'side-glance', label: 'side glance' },
  { id: 'forward', label: 'forward' },
  { id: 'happy', label: 'happy' },
  { id: 'wink', label: 'wink' },
  { id: 'starlight', label: 'starlight' },
]

export const MOUTH_STYLES: { id: MouthStyle; label: string }[] = [
  { id: 'smile', label: 'smile' },
  { id: 'pout', label: 'soft pout' },
  { id: 'grin', label: 'grin' },
]

export const WARDROBE_ITEMS: WardrobeItem[] = [
  // Hair
  { id: 'none', label: 'bald', category: 'hair', modelUrl: null, defaultColor: '#1f1d24', supportsColor: false },
  { id: 'short-crop', label: 'short crop', category: 'hair', modelUrl: '/models/angel/hair/short-crop.glb?v=3', defaultColor: '#1f1d24', supportsColor: true },
  { id: 'long-bob', label: 'long bob', category: 'hair', modelUrl: '/models/angel/hair/long-bob.glb?v=3', defaultColor: '#4a3228', supportsColor: true },

  // Accessories
  { id: 'round-glasses', label: 'round glasses', category: 'accessories', modelUrl: '/models/angel/accessories/round-glasses.glb?v=3', defaultColor: '#222228', supportsColor: true },
  { id: 'halo', label: 'halo', category: 'accessories', modelUrl: '/models/angel/accessories/halo.glb?v=3', defaultColor: '#f2d85a', supportsColor: true },

  // Tops
  { id: 'none', label: 'none', category: 'tops', modelUrl: null, defaultColor: '#eb6b34', supportsColor: false },
  { id: 'oversized-hoodie', label: 'hoodie', category: 'tops', modelUrl: '/models/angel/tops/oversized-hoodie.glb?v=3', defaultColor: '#eb6b34', supportsColor: true },
  { id: 'graphic-tee', label: 'tee', category: 'tops', modelUrl: '/models/angel/tops/graphic-tee.glb?v=3', defaultColor: '#f4f4f6', supportsColor: true },

  // Bottoms
  { id: 'none', label: 'none', category: 'bottoms', modelUrl: null, defaultColor: '#424a68', supportsColor: false },
  { id: 'athletic-shorts', label: 'shorts', category: 'bottoms', modelUrl: '/models/angel/bottoms/athletic-shorts.glb?v=3', defaultColor: '#424a68', supportsColor: true },
  { id: 'cargo-pants', label: 'cargo pants', category: 'bottoms', modelUrl: '/models/angel/bottoms/cargo-pants.glb?v=3', defaultColor: '#3f4d3f', supportsColor: true },

  // Footwear
  { id: 'none', label: 'barefoot', category: 'footwear', modelUrl: null, defaultColor: '#f4f4f6', supportsColor: false },
  { id: 'sneakers', label: 'sneakers', category: 'footwear', modelUrl: '/models/angel/footwear/sneakers.glb?v=3', defaultColor: '#f4f4f6', supportsColor: true },
  { id: 'slides', label: 'slides', category: 'footwear', modelUrl: '/models/angel/footwear/slides.glb?v=3', defaultColor: '#1f1d24', supportsColor: true },
]

export const DEFAULT_ANGEL_CONFIG: AngelAvatarConfig = {
  skinTone: '#f2c8b0',
  eyeStyle: 'side-glance',
  eyeColor: '#3a261d',
  blushIntensity: 0.65,
  blushColor: '#ff8a9b',
  freckles: false,
  mouthStyle: 'smile',
  wingsEnabled: true,
  wingColor: '#faf8f5',
  hairId: 'none',
  hairColor: '#1f1d24',
  accessoryIds: [],
  accessoryColor: '#f2d85a',
  topId: 'none',
  topColor: '#eb6b34',
  bottomId: 'none',
  bottomColor: '#424a68',
  footwearId: 'none',
  footwearColor: '#f4f4f6',
  containerStyle: 'none',
}

export const ANGEL_AVATAR_STORAGE_KEY = 'trongngyn_angel_avatar'

export function getItemsByCategory(
  category: Exclude<AngelCategory, 'body' | 'stage'>
): WardrobeItem[] {
  return WARDROBE_ITEMS.filter((item) => item.category === category)
}

export function findWardrobeItem(
  category: Exclude<AngelCategory, 'body' | 'stage'>,
  id: string
): WardrobeItem | undefined {
  return WARDROBE_ITEMS.find((item) => item.category === category && item.id === id)
}

export function toggleAccessory(currentIds: string[], targetId: string): string[] {
  const exists = currentIds.includes(targetId)
  if (exists) {
    return currentIds.filter((id) => id !== targetId)
  }
  const target = findWardrobeItem('accessories', targetId)
  const excluded = new Set(target?.excludes ?? [])
  return [...currentIds.filter((id) => !excluded.has(id)), targetId]
}

export function randomizeAngelConfig(
  currentContainer: AngelContainerStyle = 'none'
): AngelAvatarConfig {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const hairPool = getItemsByCategory('hair')
  const topPool = getItemsByCategory('tops')
  const bottomPool = getItemsByCategory('bottoms')
  const shoePool = getItemsByCategory('footwear')
  const accPool = getItemsByCategory('accessories')

  const chosenAcc: string[] = []
  for (const acc of accPool) {
    if (Math.random() > 0.55) {
      chosenAcc.push(acc.id)
    }
  }

  return {
    skinTone: pick(SKIN_TONE_PRESETS).hex,
    eyeStyle: pick(EYE_STYLES).id,
    eyeColor: pick(['#3a261d', '#2b4a6f', '#3d5c3a', '#6d4c9c', '#1a1920']),
    blushIntensity: 0.4 + Math.random() * 0.5,
    blushColor: '#ff8a9b',
    freckles: Math.random() > 0.65,
    mouthStyle: pick(MOUTH_STYLES).id,
    wingsEnabled: Math.random() > 0.2,
    wingColor: pick(['#faf8f5', '#e2f872', '#d4adf0', '#83d4d4']),
    hairId: pick(hairPool).id,
    hairColor: pick(SWATCH_PALETTE),
    accessoryIds: chosenAcc,
    accessoryColor: pick(SWATCH_PALETTE),
    topId: pick(topPool).id,
    topColor: pick(SWATCH_PALETTE),
    bottomId: pick(bottomPool).id,
    bottomColor: pick(SWATCH_PALETTE),
    footwearId: pick(shoePool).id,
    footwearColor: pick(SWATCH_PALETTE),
    containerStyle: currentContainer,
  }
}

export function encodeAngelConfig(config: AngelAvatarConfig): string {
  try {
    const json = JSON.stringify(config)
    const bytes = new TextEncoder().encode(json)
    let bin = ''
    bytes.forEach((b) => {
      bin += String.fromCharCode(b)
    })
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

export function decodeAngelConfig(encoded: string | null | undefined): AngelAvatarConfig | null {
  if (!encoded || typeof encoded !== 'string') return null
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4)
    const bin = atob(padded)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<AngelAvatarConfig>
    if (!parsed || typeof parsed !== 'object') return null

    const validHair = findWardrobeItem('hair', parsed.hairId ?? '')?.id ?? DEFAULT_ANGEL_CONFIG.hairId
    const validTop = findWardrobeItem('tops', parsed.topId ?? '')?.id ?? DEFAULT_ANGEL_CONFIG.topId
    const validBottom =
      findWardrobeItem('bottoms', parsed.bottomId ?? '')?.id ?? DEFAULT_ANGEL_CONFIG.bottomId
    const validFootwear =
      findWardrobeItem('footwear', parsed.footwearId ?? '')?.id ?? DEFAULT_ANGEL_CONFIG.footwearId
    const validAccessories = Array.isArray(parsed.accessoryIds)
      ? parsed.accessoryIds.filter((id) => Boolean(findWardrobeItem('accessories', id)))
      : []

    return {
      ...DEFAULT_ANGEL_CONFIG,
      ...parsed,
      hairId: validHair,
      topId: validTop,
      bottomId: validBottom,
      footwearId: validFootwear,
      accessoryIds: validAccessories,
      blushIntensity:
        typeof parsed.blushIntensity === 'number'
          ? Math.max(0, Math.min(1, parsed.blushIntensity))
          : DEFAULT_ANGEL_CONFIG.blushIntensity,
    }
  } catch {
    return null
  }
}
