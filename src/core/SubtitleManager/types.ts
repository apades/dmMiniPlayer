export type SubtitleItem = {
  label: string
  value: string
}

export type SubtitleRow = {
  id: string

  startTime: number
  endTime: number

  text: string
  /**给Html用的 */
  htmlText: string

  x?: number
  y?: number
}

export type SubtitleManagerEvents = {
  'row-enter': SubtitleRow
  'row-leave': SubtitleRow
  'reset': void
}
