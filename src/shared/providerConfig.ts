const providerConfig = {
  'bilibili-video': [
    /https:\/\/www.bilibili.com\/video\/.*/,
    /https:\/\/www.bilibili.com\/list\/.*/,
    /https:\/\/www.bilibili.com\/bangumi\/.*/,
  ],
  'bilibili-live': [/https:\/\/live.bilibili.com\/.*/],
  douyu: [/https:\/\/www\.douyu\.com\/.*/],
  cc: [/https:\/\/cc\.163\.com\/.*/],
  ddrk: [/https:\/\/ddys\.(art|pro)\/.*/],
  douyin: [/https:\/\/live\.douyin\.com\/.*/],
  donghuafeng: [/https:\/\/ani\.gamer\.com\.tw\/.*/],
  twitch: [/https:\/\/www\.twitch\.tv\/.*/],
  youtube: [/https:\/\/www\.youtube\.com\/.*/],
} as const

export default providerConfig
export function getProviderConfig(url: string) {
  return Object.entries(providerConfig).find(([key, value]) =>
    value.some((reg) => reg.test(url)),
  )?.[0] as keyof typeof providerConfig | undefined
}
