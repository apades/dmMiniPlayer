import { parse } from 'ass-compiler'
import type { SubtitleRow } from '../types'

function resolveDialogueTime(dialogueTime: string): number {
  const [hours, min, sec] = dialogueTime.split(':')

  return +hours * 60 * 60 + +min * 60 + +sec
}

function resolveText(inputText: string) {
  inputText = inputText.replaceAll('\\N', '\n')
  while (true) {
    const configMark = inputText.indexOf('{')
    if (configMark === -1) return inputText

    const configBlock = inputText.slice(
      inputText.indexOf('{') + 1,
      inputText.indexOf('}'),
    )

    const configBlocks = configBlock.split('\\')
    configBlocks.shift()

    inputText = inputText.replace(`{${configBlock}}`, '')
  }
}

export default function assParser(content: string): SubtitleRow[] {
  const parser = parse(content)
  // const eventsBody = parser.find((p: any) => p.section == 'Events').body
  const subtitleRows: SubtitleRow[] = []

  let idIndex = 0
  for (const dialogue of parser.events.dialogue) {
    // if (dialogue.key != 'Dialogue') continue
    const subtitleRow: SubtitleRow = {
      endTime: 0,
      htmlText: '',
      id: idIndex++ + '',
      startTime: 0,
      text: '',
    }
    Object.keys(dialogue).forEach((key) => {
      const value = (dialogue as any)[key]

      key = key.toLowerCase()
      switch (key) {
        case 'end': {
          subtitleRow.endTime = value
          break
        }
        case 'start': {
          subtitleRow.startTime = value
          break
        }
        case 'text': {
          const text = resolveText(dialogue.Text.combined)
          subtitleRow.text = text
          subtitleRow.htmlText = text
        }
      }
    })

    subtitleRows.push(subtitleRow)
  }

  return subtitleRows
}
