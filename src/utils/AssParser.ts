import type { DanMoveType, DanType } from '@root/danmaku'
import { parse } from 'ass-compiler'
import Color from 'color'
import { splitArray } from '.'

type Dialogue = {
  start: number
  end: number
  text: string
  color: string
  type: DanMoveType
  y?: number
  [key: string]: string | number
}
export default class AssParser {
  assContent: string

  formats: string[]

  parsers: any[] = []

  private _dans: DanType[] = []
  get dans(): DanType[] {
    if (this.dialogues.length && !this._dans.length) {
      this.dialogues.forEach(({ color = 'white', start, text, type }) => {
        this._dans.push({ color, text, time: start, type })
      })
    }
    return this._dans
  }

  dialogues: Dialogue[] = []
  constructor(assContent: string) {
    this.assContent = assContent

    // this.resolveFormats()
    this.resolveParser()
  }

  resolveDialogueTime(dialogueTime: string): number {
    let [hours, min, sec] = dialogueTime.split(':')

    return +hours * 60 * 60 + +min * 60 + +sec
  }

  resolveParser() {
    const parsers = parse(this.assContent).events.dialogue
    this.parsers = parsers

    // let dialogues: Dialogue[] = []
    for (let dialogue of parsers) {
      let dialogueEntries = Object.entries(dialogue)
      for (let index in dialogueEntries) {
        let [key, value] = dialogueEntries[index]

        key = key.toLowerCase()
        if (key == 'start' || key == 'end') {
          // value = this.resolveDialogueTime(value as string)
        } else if (key == 'text') {
          let { color, danMoveType, text } = this.resolveText(
            dialogue.Text.raw as string,
          )
          value = text

          dialogueEntries.push(['type', danMoveType])
          dialogueEntries.push(['color', color])
        }
        dialogueEntries[index] = [key, value]
      }

      this.dialogues.push(Object.fromEntries(dialogueEntries) as Dialogue)
    }
  }

  resolveText(inputText: string): {
    color: string
    text: string
    danMoveType: DanMoveType
  } {
    let danMoveType: DanMoveType = 'right',
      color = '',
      text = ''

    let configBlock = inputText.slice(
      inputText.indexOf('{') + 1,
      inputText.indexOf('}'),
    )

    let configBlocks = configBlock.split('\\')
    configBlocks.shift()

    configBlocks.forEach((config) => {
      if (config.includes('pos')) {
        // TODO 还有个bottom，懒得弄了
        danMoveType = 'top'
      } else if (config.includes('c&H')) {
        let _color = config.replace('c&H', '')
        _color = _color.replace('&', '')
        _color = _color.padEnd(6, '0')
        let [b, g, r] = splitArray([..._color], 2)

        color = Color(`#${r.join('')}${g.join('')}${b.join('')}`).hex()
      } else if (config.includes('move')) {
        danMoveType = 'right'
      }
    })

    return {
      danMoveType,
      color,
      text: inputText.replace(`{${configBlock}}`, ''),
    }
  }
}
