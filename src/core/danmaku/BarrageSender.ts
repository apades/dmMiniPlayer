import { wait } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'

export type Props = {
  textInput: HTMLTextAreaElement | HTMLInputElement
  webTextInput: HTMLTextAreaElement | HTMLInputElement
  webSendButton: HTMLElement
}
export default class BarrageSender implements Props {
  textInput: HTMLInputElement
  webTextInput: HTMLTextAreaElement | HTMLInputElement
  webSendButton: HTMLElement

  constructor(props: Props) {
    Object.assign(this, props)
    this.textInput.value = this.webTextInput.value

    this.onInput()
  }

  protected onInput() {
    this.webTextInput.addEventListener('input', (e) => {
      let val = (e.target as HTMLInputElement).value
      this.textInput.value = val
    })
    this.textInput.addEventListener('input', async (e) => {
      await wait()
      let val = (e.target as HTMLInputElement).value
      this.setWebTextInput(val)
      if (!(e as any).isComposing) {
        this.onWebTextInputGetEvents().then(() => {
          this.textInput.value = this.webTextInput.value
        })
      }
      this.triggerInputEvent()
    })
    this.textInput.addEventListener('compositionend', (e) => {
      this.onWebTextInputGetEvents().then(() => {
        this.textInput.value = this.webTextInput.value
      })
    })
  }

  protected triggerInputEvent() {
    this.webTextInput.dispatchEvent(new Event('input', { bubbles: true }))
    this.webTextInput.dispatchEvent(new Event('keydown', { bubbles: true }))
    this.webTextInput.dispatchEvent(new Event('change', { bubbles: true }))
  }

  protected onWebTextInputGetEvents() {
    return new Promise<void>((res) => {
      const events = ['input', 'keydown', 'change']
      let count = 0
      const fn = () => {
        count++
        if (count == events.length) {
          removeListener()
          res()
        }
      }
      const addListener = (event: string) => {
        this.webTextInput.addEventListener(event, fn)
      }
      const removeListener = () => {
        events.forEach((e) => {
          this.webTextInput.addEventListener(e, fn)
        })
      }

      events.forEach((e) => addListener(e))
    })
  }

  send() {
    this.webSendButton.click()
    this.textInput.value = ''
  }

  setWebTextInput(value: string) {
    const element = this.webTextInput
    try {
      // react 的onChange特有的修改setter
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set
      const prototype = Object.getPrototypeOf(element)
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        'value'
      ).set

      if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value)
      } else {
        valueSetter.call(element, value)
      }
    } catch (error) {
      element.value = value
    }
  }
}
