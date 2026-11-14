import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { runCodeInTopWindow } from '@root/inject/contentSender'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import { dq1 } from '@root/utils'

const LEXICAL_INPUT_SELECTOR = 'data-dm-lexical-input'

/** Runs in the page so it can see the React fiber holding the Lexical editor. */
function writeLexicalEditorText(selector: string, value: string, seq: number) {
  const el = document.querySelector(selector) as HTMLElement | null
  if (!el) return
  const applied = Number(el.getAttribute('data-dm-lexical-seq') || 0)
  if (seq < applied) return
  el.setAttribute('data-dm-lexical-seq', String(seq))

  let editor = (el as any).__dmLexicalEditor
  if (!editor?._editorState) {
    const fiberKey = Object.keys(el).find((key) =>
      key.startsWith('__reactFiber'),
    )
    let fiber = fiberKey ? (el as any)[fiberKey] : null
    while (fiber && !editor) {
      let context = fiber.dependencies?.firstContext
      while (context) {
        const memo = context.memoizedValue
        const candidate = Array.isArray(memo) ? memo[0] : memo
        if (
          candidate &&
          typeof candidate.parseEditorState === 'function' &&
          typeof candidate.setEditorState === 'function' &&
          candidate._editorState
        ) {
          editor = candidate
          break
        }
        context = context.next
      }
      fiber = fiber.return
    }
    if (editor) (el as any).__dmLexicalEditor = editor
  }
  if (!editor) return

  const state = editor.parseEditorState(
    JSON.stringify({
      root: {
        children: [
          {
            children: value
              ? [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: value,
                    type: 'text',
                    version: 1,
                  },
                ]
              : [],
            direction: value ? 'ltr' : null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: value ? 'ltr' : null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }),
  )
  editor.setEditorState(state)
}

function installLexicalWriter(source: string) {
  if ((window as any).__dmWriteKickLexical) return
  ;(window as any).__dmWriteKickLexical = eval(`(${source})`)
}

function callLexicalWriter(selector: string, value: string, seq: number) {
  ;(window as any).__dmWriteKickLexical?.(selector, value, seq)
}

class KickDanmakuSender extends DanmakuSender {
  private lexicalWriteSeq = 0
  private pendingLexicalText: string | null = null
  private lexicalTimer = 0
  private writerReady: Promise<void> | null = null
  private writingToWeb = false
  private unbindLexicalInput = () => {}

  protected override onInput() {
    const textInput = this.textInput
    const webTextInput = this.webTextInput
    let composing = false
    const syncToWeb = () => {
      if (composing) return
      this.scheduleLexicalWrite(textInput.value)
    }
    const syncFromWeb = () => {
      if (this.writingToWeb) return
      // The PiP input stays activeElement after the page is focused again.
      if (textInput.ownerDocument.hasFocus()) return
      const value = this.readWebText()
      if (textInput.value !== value) textInput.value = value
    }
    const onStart = () => {
      composing = true
    }
    const onEnd = () => {
      composing = false
      syncToWeb()
    }
    const pullOnFocus = () => {
      const value = this.readWebText()
      if (textInput.value !== value) textInput.value = value
    }
    textInput.addEventListener('input', syncToWeb)
    textInput.addEventListener('compositionstart', onStart)
    textInput.addEventListener('compositionend', onEnd)
    textInput.addEventListener('focus', pullOnFocus)
    webTextInput.addEventListener('input', syncFromWeb)
    this.unbindLexicalInput = () => {
      textInput.removeEventListener('input', syncToWeb)
      textInput.removeEventListener('compositionstart', onStart)
      textInput.removeEventListener('compositionend', onEnd)
      textInput.removeEventListener('focus', pullOnFocus)
      webTextInput.removeEventListener('input', syncFromWeb)
      window.clearTimeout(this.lexicalTimer)
    }
  }

  private readWebText() {
    const el = this.webTextInput
    const lexicalText = el?.querySelector('[data-lexical-text="true"]')
    if (lexicalText) return lexicalText.textContent ?? ''
    return (el?.innerText ?? '').replace(/\n$/, '')
  }

  override unload() {
    this.unbindLexicalInput()
    super.unload()
  }

  private scheduleLexicalWrite(value: string) {
    this.pendingLexicalText = value
    window.clearTimeout(this.lexicalTimer)
    // Rebuilding the Lexical editor blocks the input. Wait until typing pauses.
    this.lexicalTimer = window.setTimeout(() => {
      const next = this.pendingLexicalText
      if (next == null) return
      this.pendingLexicalText = null
      this.setWebTextInputValue(next)
    }, 150)
  }

  override setWebTextInputValue(value: string) {
    const element = this.webTextInput
    if (!element?.hasAttribute('data-lexical-editor')) {
      super.setWebTextInputValue(value)
      return
    }
    const seq = ++this.lexicalWriteSeq
    element.setAttribute(LEXICAL_INPUT_SELECTOR, '')
    const selector = `[${LEXICAL_INPUT_SELECTOR}]`
    this.writingToWeb = true
    if (!this.writerReady) {
      this.writerReady = runCodeInTopWindow(installLexicalWriter, [
        writeLexicalEditorText.toString(),
      ] as const).then(() => undefined)
    }
    void this.writerReady
      .then(() =>
        runCodeInTopWindow(callLexicalWriter, [selector, value, seq] as const),
      )
      .finally(() => {
        this.writingToWeb = false
      })
  }

  protected override triggerInputEvent() {
    if (this.webTextInput?.hasAttribute('data-lexical-editor')) return
    super.triggerInputEvent()
  }
}

export default class KickProvider extends HtmlDanmakuProvider {
  private waitChat?: MutationObserver

  override onInit() {
    super.onInit()
    this.danmakuSender = undefined
    this.syncSender()
    this.bindChat()
    this.addOnUnloadFn(
      onRouteChange(() => {
        setTimeout(() => this.bindChat(), 500)
      }),
    )
    this.addOnUnloadFn(() => {
      this.waitChat?.disconnect()
      this.waitChat = undefined
    })
  }

  private isLoggedIn() {
    const chat = dq1('#channel-chatroom')
    if (!chat) return false
    return !dq1('[data-testid="login"]', chat)
  }

  private syncSender() {
    if (!this.isLoggedIn()) {
      this.danmakuSender = undefined
      return
    }
    if (this.danmakuSender instanceof KickDanmakuSender) return
    this.danmakuSender = new KickDanmakuSender()
    this.danmakuSender.setData(this.getDanmakuSenderConfig())
  }

  private bindChat() {
    const config = this.getObserveHtmlDanmakuConfig()
    if (config.container) {
      this.waitChat?.disconnect()
      this.waitChat = undefined
      this.stopObserveHtmlDanmaku()
      this.startObserveHtmlDanmaku(config)
      this.syncSender()
      return
    }
    if (this.waitChat) return
    this.waitChat = new MutationObserver(() => this.bindChat())
    this.waitChat.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  getObserveHtmlDanmakuConfig() {
    return {
      container: dq1<HTMLElement>('#chatroom-messages>*')!,
      deepWatchContainer: true,
      child: '*',
      text: (node: HTMLElement) => dq1('div.w-full>span', node) || node,
      // isDanmu: (node: HTMLElement) => !!dq1('[data-chat-entry-user-id]', node),
    }
  }

  getDanmakuSenderConfig() {
    const input = dq1<HTMLElement>('[data-testid="chat-input"]')
    return {
      webTextInput: input as HTMLInputElement,
      webSendButton: (dq1('#chatroom-footer button') ||
        input?.parentElement?.querySelector('button') ||
        undefined) as HTMLElement | undefined,
    }
  }
}
