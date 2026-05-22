import type {
  SubtitleItem,
  SubtitleRow,
} from '@root/core/SubtitleManager/types'
import { dq, wait } from '@root/utils'

const YOUTUBE_PLAYER_CLIENT_VERSION = '2.20250626.01.00'

function getCurrentVideoId(url = location.href) {
  return new URL(url).searchParams.get('v')
}

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
  const subtitles = await getVideoCaptionTracks(url)

  console.log('subtitles', subtitles)
  return subtitles.map((s: any) => ({
    label: s?.name?.simpleText || s?.name?.runs?.[0]?.text || s.languageCode,
    value: s.baseUrl,
  }))
}

export async function getVideoCaptionTracks(url = location.href) {
  const id = getCurrentVideoId(url)
  if (!id) return []

  for (let i = 0; i < 6; i++) {
    const captionTracks = await getVideoSubtitlesInfo(id)
    if (captionTracks.length) return captionTracks
    await wait(500 + i * 250)
  }

  return []
}

async function getVideoSubtitlesInfo(id: string | number) {
  const videoInfo = await fetch('/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId: id,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: YOUTUBE_PLAYER_CLIENT_VERSION,
        },
      },
    }),
    credentials: 'include',
  }).then((res) => res.json())

  return (
    videoInfo?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  )
}

export async function getSubtitle(subtitleUrl: string): Promise<SubtitleRow[]> {
  const xmlText = await fetch(subtitleUrl, {
    credentials: 'include',
  }).then((res) => res.text())
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
