import PostMessageEvent, {
  PostMessageProtocolMap,
} from '@root/shared/postMessageEvent'
import { dq, isUndefined } from '.'
import { isArray } from 'lodash-es'
import mitt from 'mitt'
import Events2 from './Events2'

const ID = 'dmMiniPlayer'

export function postMessageToTop<
  T extends PostMessageEvent,
  data extends PostMessageProtocolMap[T]
>(...[type, data]: data extends undefined ? [T] : [T, data]) {
  return top?.postMessage(
    {
      ID,
      type,
      data,
    },
    '*'
  )
}

export function postMessageToChild<
  T extends PostMessageEvent,
  data extends PostMessageProtocolMap[T]
>(
  ...[type, data, target]: data extends undefined
    ? [T, undefined?, Window?]
    : [T, data, Window?]
) {
  let targets = !isUndefined(target)
    ? isArray(target)
      ? target
      : [target]
    : dq('iframe').map((iframe) => iframe.contentWindow!)

  const sendOk: Window[] = []
  targets.forEach((target) => {
    try {
      target!.postMessage(
        {
          ID,
          type,
          data,
        },
        '*'
      )
      sendOk.push(target)
    } catch (error) {}
  })
  return sendOk
}

const eventSource = new Events2()
window.addEventListener('message', (event) => {
  if (event.data?.ID !== ID) return
  eventSource.emit(event.data.type, {
    data: event.data.data,
    source: event.source,
  })
})

export function onPostMessage<T extends PostMessageEvent>(
  type: T,
  callback: (data: PostMessageProtocolMap[T], source: Window) => void
) {
  return eventSource.on2(type as any, ({ data, source }: any) =>
    callback(data, source)
  )
}
