// navigator-extensions.d.ts

interface NavigatorUABrandVersion {
  brand: string
  version: string
}

interface UADataValues {
  platform?: string
  platformVersion?: string
  fullVersionList?: NavigatorUABrandVersion[]
  model?: string
  architecture?: string
  bitness?: string
  mobile?: boolean
}

interface NavigatorUAData {
  brands: NavigatorUABrandVersion[]
  mobile: boolean
  platform: string
  getHighEntropyValues(hints: string[]): Promise<UADataValues>
  toJSON(): Record<string, unknown>
}

interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  readonly downlink: number
  readonly downlinkMax?: number
  readonly rtt: number
  readonly saveData: boolean
  readonly type?:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'none'
    | 'wifi'
    | 'wimax'
    | 'other'
    | 'unknown'
  onchange?: (this: NetworkInformation, ev: Event) => void
}

interface Navigator {
  readonly userAgentData?: NavigatorUAData
  readonly connection?: NetworkInformation
  readonly deviceMemory?: number
}
