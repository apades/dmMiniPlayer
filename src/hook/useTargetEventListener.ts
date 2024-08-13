import { noop } from '@root/utils'
import { useLatest } from 'ahooks'
import { BasicTarget } from 'ahooks/lib/utils/domTarget'
import useEffectWithTarget from 'ahooks/lib/utils/useEffectWithTarget'
import { getTargetElement } from 'ahooks/lib/utils/domTarget'

export type Target =
  | BasicTarget<HTMLElement | Element | Window | Document>
  | undefined
function useTargetEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  target: Target
): void
function useTargetEventListener<K extends keyof ElementEventMap>(
  eventName: K,
  handler: (ev: ElementEventMap[K]) => void,
  target: Target
): void
function useTargetEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (ev: DocumentEventMap[K]) => void,
  target: Target
): void
function useTargetEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (ev: WindowEventMap[K]) => void,
  target: Target
): void
/**
 * 相比起ahooks的useEventListener，改进了target没有时不要传window进去，就不挂载事件
 *
 * why: 因为PlayerProgressBar的mouseHover事件在target没有时挂在了window，此时触发很多个handler(里面还判断了target是否存在才继续运行)，**然而由于宏任务阻挡事件冒泡**，有一部分handler在target存在了触发了以前window上的handler了。这导致了很多情况下没有hover PlayerProgressBar却出现了tooltips的问题
 */
function useTargetEventListener(
  eventName: string,
  handler: noop,
  target: Target
) {
  const handlerRef = useLatest(handler)

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target)
      if (!targetElement?.addEventListener) {
        return
      }

      const eventListener = (event: Event) => {
        return handlerRef.current(event)
      }

      targetElement.addEventListener(eventName, eventListener)

      return () => {
        targetElement.removeEventListener(eventName, eventListener)
      }
    },
    [eventName],
    target
  )
}
export default useTargetEventListener
