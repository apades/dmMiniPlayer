import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import { dq1 } from '@root/utils'

export default class KickProvider extends HtmlDanmakuProvider {
  private waitChat?: MutationObserver

  override onInit() {
    super.onInit()
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

  private bindChat() {
    const config = this.getObserveHtmlDanmakuConfig()
    if (config.container) {
      this.waitChat?.disconnect()
      this.waitChat = undefined
      this.stopObserveHtmlDanmaku()
      this.startObserveHtmlDanmaku(config)
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
