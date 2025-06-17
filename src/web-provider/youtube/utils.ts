import type {
  SubtitleItem,
  SubtitleRow,
} from '@root/core/SubtitleManager/types'
import { dq } from '@root/utils'

export async function getVideoInfo(url = location.href) {
  const htmlText = await fetch(url).then((res) => res.text())

  try {
    return JSON.parse(
      '{' + htmlText.match(/ytInitialPlayerResponse = \{(.*)\};var/)?.[1] + '}',
    )
  } catch (error) {
    return JSON.parse(
      '{' + htmlText.match(/ytInitialPlayerResponse = \{(.*)\};/)?.[1] + '}',
    )
  }
}

export async function getSubtitles(
  url = location.href,
): Promise<SubtitleItem[]> {
  const id = new URLSearchParams(location.search).get('v')
  const videoInfo = await fetch('/youtubei/v1/player', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId: id,
      context: {
        client: {
          clientName: 'WEB_EMBEDDED_PLAYER',
          clientVersion: '1.20241009.01.00',
        },
      },
    }),
  }).then((res) => res.json())

  const subtitles =
    videoInfo?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

  console.log('subtitles', subtitles)
  return subtitles.map((s: any) => ({
    label: s?.name?.simpleText || s?.name?.runs?.[0]?.text || s.languageCode,
    value: s.baseUrl,
  }))
}

export async function getSubtitle(subtitleUrl: string): Promise<SubtitleRow[]> {
  const xmlText = await fetch(subtitleUrl).then((res) => res.text())
  const parse = new DOMParser()
  const document = parse.parseFromString(xmlText, 'text/xml').documentElement

  const textEls = dq('text', document)

  return textEls.map((el, i) => {
    const startTime = +(el.getAttribute('start') ?? 0),
      duration = +(el.getAttribute('dur') ?? 0),
      text = (el.textContent ?? '').replace(/&#(\d+);/g, (_, $1) => {
        return String.fromCharCode(+$1)
      })

    return {
      startTime,
      endTime: startTime + duration,
      text,
      htmlText: text,
      id: i + '',
    }
  })
}
