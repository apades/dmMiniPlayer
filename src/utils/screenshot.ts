import { createElement } from '.'

export function screenshotVideo(video: HTMLVideoElement) {
  const el = createElement('canvas')

  el.width = video.videoWidth
  el.height = video.videoHeight

  el.getContext('2d')?.drawImage(video, 0, 0, el.width, el.height)

  return el.toDataURL()
}

export function downloadImage(url: string, name: string) {
  const a = createElement('a')
  a.href = url
  a.download = name
  a.click()
}
