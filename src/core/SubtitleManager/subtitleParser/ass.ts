import type { SubtitleRow } from '../types'
import libAssParser from 'ass-parser'

function resolveDialogueTime(dialogueTime: string): number {
  let [hours, min, sec] = dialogueTime.split(':')

  return +hours * 60 * 60 + +min * 60 + +sec
}

function resolveText(inputText: string) {
  inputText = inputText.replaceAll('\\N', '\n')
  while (true) {
    const configMark = inputText.indexOf('{')
    if (configMark === -1) return inputText

    const configBlock = inputText.slice(
      inputText.indexOf('{') + 1,
      inputText.indexOf('}')
    )

    const configBlocks = configBlock.split('\\')
    configBlocks.shift()

    inputText = inputText.replace(`{${configBlock}}`, '')
  }
}

export default function assParser(content: string): SubtitleRow[] {
  const parser = libAssParser(content)
  const eventsBody = parser.find((p: any) => p.section == 'Events').body
  const subtitleRows: SubtitleRow[] = []

  let idIndex = 0
  for (let dialogue of eventsBody) {
    if (dialogue.key != 'Dialogue') continue
    const subtitleRow: SubtitleRow = {
      endTime: 0,
      htmlText: '',
      id: idIndex++ + '',
      startTime: 0,
      text: '',
    }
    Object.keys(dialogue.value).forEach((key) => {
      const value = dialogue.value[key]

      key = key.toLowerCase()
      switch (key) {
        case 'end': {
          subtitleRow.endTime = resolveDialogueTime(value)
          break
        }
        case 'start': {
          subtitleRow.startTime = resolveDialogueTime(value)
          break
        }
        case 'text': {
          const text = resolveText(value)
          subtitleRow.text = text
          subtitleRow.htmlText = text
        }
      }
    })

    subtitleRows.push(subtitleRow)
  }

  return subtitleRows
}
