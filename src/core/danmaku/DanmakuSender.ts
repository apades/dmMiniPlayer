import { addEventListener, wait } from '@root/utils'
import { isUndefined } from 'lodash-es'

function getDom<T extends HTMLElement>(el: T | string) {
  return typeof el == 'string' ? (document.querySelector(el) as T) : el
}
export type Props = {
  textInput: HTMLTextAreaElement | HTMLInputElement | string
  webTextInput: HTMLTextAreaElement | HTMLInputElement | string
  webSendButton: HTMLElement | string
}

/**
 * 先setData(props)把所有属性填满，再用init()开始运行，最后unload卸载
 */
export default class DanmakuSender {
  get textInput() {
    return getDom(this.props.textInput)
  }
  get webTextInput() {
    return getDom(this.props.webTextInput)
  }
  get webSendButton() {
    return getDom(this.props.webSendButton)
  }
  isHtmlInputMode = false

  private props: Props = { textInput: '', webSendButton: '', webTextInput: '' }

  setData(props: Partial<Props>) {
    Object.assign(this.props, props)
  }

  init() {
    if (
      !this.props.textInput ||
      !this.props.webTextInput ||
      !this.props.webSendButton
    ) {
      console.warn('未完全初始化setData', this.props)
      throw Error('未完全初始化setData')
    }
    this.unload()

    this.isHtmlInputMode = this.webTextInput?.contentEditable == 'true'
    this.textInput.value = this.webTextValue

    this.onInput()
  }

  private listens: (() => void)[] = []
  unload() {
    this.listens.forEach((fn) => fn())
    this.listens.length = 0
  }

  get webTextValue() {
    return (
      (this.isHtmlInputMode
        ? this.webTextInput.textContent
        : this.webTextInput.value) ?? ''
    )
  }

  protected onInput() {
    this.listens.push(
      addEventListener(this.webTextInput, (webTextInput) => {
        webTextInput.addEventListener('input', (e) => {
          const val = webTextInput.value
          if (isUndefined(val)) return
          this.textInput.value = val
        })
      }),
    )

    this.listens.push(
      addEventListener(this.textInput, (textInput) => {
        textInput.addEventListener('input', async (e) => {
          await wait()
          const val = textInput.value
          this.setWebTextInputValue(val)
          if (!(e as any).isComposing) {
            this.onWebTextInputGetEvents().then(() => {
              this.textInput.value = this.webTextValue
            })
          }
          this.triggerInputEvent()
        })
        textInput.addEventListener('compositionend', (e) => {
          this.onWebTextInputGetEvents().then(() => {
            this.textInput.value = this.webTextValue
          })
        })
      }),
    )
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
    if (this.webSendButton.click) {
      this.webSendButton.click()
    } else {
      // 抖音的挂载在svg上没有click方法，且是假的方法需要通过冒泡传给父元素处理
      this.webSendButton.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
        }),
      )
    }

    this.textInput.value = ''
  }

  setWebTextInputValue(value: string) {
    const element = this.webTextInput
    if (this.isHtmlInputMode) {
      element.textContent = value
      return
    }
    try {
      // react 的onChange特有的修改setter
      const valueSetter = Object.getOwnPropertyDescriptor(
        element,
        'value',
      )!.set!
      const prototype = Object.getPrototypeOf(element)
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        'value',
      )!.set!

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
