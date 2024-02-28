// 有些网站注入eventHacker会导致网页出现问题
// @example https://github.com/apades/dmMiniPlayer/issues/11
// 现在只提供需要注入的网址就行了

export const eventHackerEnableSites = [
  /https:\/\/live\.douyin\.com\/.*/,
  /https:\/\/www\.twitch\.tv\/.*/,
  /https:\/\/www\.youtube\.com\/.*/,
  /https:\/\/www\.douyu\.com\/.*/,
]
