import { FC, memo, useContext, useRef, useState } from 'react'
import vpContext from './context'
import { useOnce } from '@root/hook'
import { createElement } from '@root/utils'

const _danmakuContainer = createElement('div', {
  style: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
})

const DanmakuContainer: FC = (props) => {
  const { webVideo, isLive, danmakuEngine, videoPlayer } = useContext(vpContext)
  const danmakuContainer = useRef<HTMLDivElement>(null)
  useOnce(() => {
    if (!danmakuEngine || !danmakuContainer.current || !webVideo) return
    danmakuEngine.init({
      media: webVideo,
      container: _danmakuContainer,
    })
    danmakuContainer.current.appendChild(_danmakuContainer)
  })

  if (!danmakuEngine) return null

  return (
    <div
      className="absolute left-0 top-0 size-full overflow-hidden pointer-events-none"
      ref={danmakuContainer}
    ></div>
  )
}

export default DanmakuContainer
