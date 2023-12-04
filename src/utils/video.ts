/**twitch/youtube的直播duration都是很长的 */
const isLiveMinDuration = 60 * 60 * 5

export const checkIsLive = (video: HTMLVideoElement) =>
  video?.duration == Infinity || video?.duration > isLiveMinDuration
