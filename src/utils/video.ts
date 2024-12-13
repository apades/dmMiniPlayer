import configStore from '@root/store/config'

export const checkIsLive = (video: HTMLVideoElement | undefined) => {
  if (!video) return false
  return video.duration == Infinity
}
