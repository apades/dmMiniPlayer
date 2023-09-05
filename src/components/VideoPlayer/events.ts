import AsyncLock from '@root/utils/AsyncLock'

export const videoPlayerLoad = 'videoPlayerLoad'

export const VideoPlayerLoadEvent = new CustomEvent('videoPlayerLoad')

export const loadLock = new AsyncLock()
window.addEventListener(videoPlayerLoad, () => {
  loadLock.ok()
})

export const onVideoPlayerLoad = () => loadLock.waiting()
