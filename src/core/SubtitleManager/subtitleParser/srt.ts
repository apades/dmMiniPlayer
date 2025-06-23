import domParser from 'node-html-parser'
import type { SubtitleRow } from '../types'

// TODO 一些复杂的pos之类的？
function fixed_str_digit(how_many_digit: number, str: string, padEnd = true) {
  if (str.length == how_many_digit) {
    return str
  }
  if (str.length > how_many_digit) {
    return str.slice(0, how_many_digit)
  }
  if (str.length < how_many_digit) {
    if (padEnd) {
      return str.padEnd(how_many_digit, '0')
    } else {
      return str.padStart(how_many_digit, '0')
    }
  }
}

function correctFormat(time: string) {
  // Fix the format if the format is wrong
  // 00:00:28.9670 Become 00:00:28,967
  // 00:00:28.967  Become 00:00:28,967
  // 00:00:28.96   Become 00:00:28,960
  // 00:00:28.9    Become 00:00:28,900

  // 00:00:28,96   Become 00:00:28,960
  // 00:00:28,9    Become 00:00:28,900
  // 00:00:28,0    Become 00:00:28,000
  // 00:00:28,01   Become 00:00:28,010
  // 0:00:10,500   Become 00:00:10,500
  let str = time.replace('.', ',')

  var hour = null
  var minute = null
  var second = null
  var millisecond = null

  // Handle millisecond
  var [front, ms] = str.split(',')
  millisecond = fixed_str_digit(3, ms)

  // Handle hour
  var [a_hour, a_minute, a_second] = front.split(':')
  hour = fixed_str_digit(2, a_hour, false)
  minute = fixed_str_digit(2, a_minute, false)
  second = fixed_str_digit(2, a_second, false)

  return `${hour}:${minute}:${second},${millisecond}`
}

function timestampToSeconds(srtTimestamp: string) {
  srtTimestamp = correctFormat(srtTimestamp)
  const [rest, millisecondsString] = srtTimestamp.split(',')
  const milliseconds = parseInt(millisecondsString)
  const [hours, minutes, seconds] = rest.split(':').map((x) => parseInt(x))
  const result = milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours

  // fix odd JS roundings, e.g. timestamp '00:01:20,460' result is 80.46000000000001
  return Math.round(result * 1000) / 1000
}

// window.timestampToSeconds = timestampToSeconds

export default function srtParser(content: string): SubtitleRow[] {
  content = content.trim()
  const srtLines = content.split('\n')

  const startIndex = srtLines.findIndex(
    (line) => line.trim() === '1' || line.trim() === '0',
  )

  srtLines.splice(0, startIndex)

  const subtitles: SubtitleRow[] = []
  let subtitle: SubtitleRow = {
    endTime: 0,
    startTime: 0,
    htmlText: '',
    id: '0',
    text: '',
  }
  const firstLine = srtLines[0].trim()
  if (+firstLine + '' != firstLine) {
    throw Error('Error parser in line 1, not a standard number in start line')
  }
  let index = +firstLine

  for (let i = 0; i < srtLines.length; i++) {
    const line = srtLines[i].trim()

    if (line === index.toString()) {
      subtitle = {
        endTime: 0,
        startTime: 0,
        htmlText: '',
        id: index + '',
        text: '',
      }
      index++
    } else if (line.includes('-->')) {
      const [startTime, endTime] = line.split(' --> ')
      subtitle.startTime = timestampToSeconds(startTime)
      subtitle.endTime = timestampToSeconds(endTime)
    } else if (line === '') {
      // 开始push subtitleRow进去rs
      const fullText = subtitle.text.trim()
      const htmlText = `<p>${fullText}</p>`
      subtitle.htmlText = htmlText

      const parser = domParser(htmlText)
      const root = parser.childNodes[0]
      const hasMultiChild = !!root.childNodes.length
      const text = hasMultiChild
        ? Array.from(root.childNodes)
            .map((node) => node.textContent)
            .join('\n')
        : root.textContent
      subtitle.text = text ?? ''

      subtitles.push(subtitle)
    } else {
      if (subtitle.text) {
        subtitle.text += '\n'
      }
      subtitle.text += line
    }
  }

  return subtitles
}
