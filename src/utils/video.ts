/**twitch的直播duration都是很长的 */
const isLiveMinDuration = 1000 * 60 * 60 * 5

export const checkIsLive = (video: HTMLVideoElement) =>
  video.duration == Infinity || video.duration > isLiveMinDuration
