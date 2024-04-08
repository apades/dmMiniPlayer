import configStore from '@root/store/config'

/**twitch/youtube的直播duration都是很长的 */
const isLiveMinDuration = 60 * 60 * 5

export const checkIsLive = (video: HTMLVideoElement) => {
  const durationIsLive = configStore.videoNoJudgeDurInLive
    ? false
    : video.duration > isLiveMinDuration
  return video.duration == Infinity || durationIsLive
}
