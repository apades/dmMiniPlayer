import { HandlesProps } from '@apad/rc-slider/lib/Handles'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { formatTime } from '@root/utils'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { FC, useContext, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react'
import configStore from '@root/store/config'
import ProgressBar from '../../ProgressBar'
import vpContext from '../context'
import { useTogglePlayState } from '../hooks'
import style from './PlayerProgressBar.less?inline'
import { VideoPreviewData } from '@root/core/VideoPreviewManager'

const previewImageWidth = 200

type Props = {}
const PlayerProgressBar: FC<Props> = (props) => {
  const { webVideo } = useContext(vpContext)
  const [playedPercent, setPlayedPercent] = useState(0)
  const [duration, setDuration] = useState(0)

  useTargetEventListener(
    'durationchange',
    () => {
      if (!webVideo) return
      setDuration(webVideo.duration)
    },
    webVideo,
  )
  useTargetEventListener(
    'timeupdate',
    () => {
      if (!webVideo) return
      setPlayedPercent((webVideo.currentTime / webVideo.duration) * 100)
    },
    webVideo,
  )

  useEffect(() => {
    if (!webVideo || !webVideo.duration) return
    setDuration(webVideo.duration)
    setPlayedPercent((webVideo.currentTime / webVideo.duration) * 100)
  }, [webVideo])

  const togglePlayState = useTogglePlayState()
  const handleOnclick = useMemoizedFn((percent: number) => {
    togglePlayState('play')

    setPlayedPercent(percent)

    setTimeout(() => {
      if (!webVideo) return
      percent = percent / 100
      webVideo.currentTime = webVideo.duration * percent
    }, 0)
  })

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={classNames(
        'played-progress-bar',
        configStore.videoProgress_show && 'use-bottom-progress',
      )}
      style={{
        '--bottom-progress-color': configStore.videoProgress_color,
        '--bottom-progress-height': configStore.videoProgress_height + 'px',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: style }}></style>
      <ProgressBar
        percent={playedPercent}
        onClick={handleOnclick}
        loadColor="#0669ff"
        handleRender={(node, _props) => {
          return <HandleWithToolTips {..._props} duration={duration} />
        }}
      ></ProgressBar>

      <ToolTips containerRef={containerRef} duration={duration} />
    </div>
  )
}

/**在进度条的handler单独的tooltips */
const HandleWithToolTips: FC<
  Parameters<Required<HandlesProps>['handleRender']>[1] & { duration: number }
> = (props) => {
  const [isVisible, setVisible] = useState(false)
  const handleRef = useRef<HTMLDivElement>(null)

  useTargetEventListener(
    'mouseleave',
    () => {
      setVisible(false)
    },
    handleRef.current,
  )
  useTargetEventListener(
    'mouseenter',
    () => {
      setVisible(true)
    },
    handleRef.current,
  )

  return (
    <div
      ref={handleRef}
      className="rc-slider-handle -translate-x-1/2"
      style={{
        left: `${props.value}%`,
      }}
    >
      <div
        className={classNames(
          isVisible || props.dragging ? 'opacity-100' : 'opacity-0',
          'handle-tooltips pointer-events-none',
          'absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2 bg-[#333] rounded-[2px] px-[4px] py-[2px] text-white text-[12px]',
        )}
      >
        {formatTime(props.duration * (props.value / 100))}
      </div>
    </div>
  )
}

type ToolTipsProps = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  duration: number
}
const ToolTips: FC<ToolTipsProps> = (props) => {
  const { containerRef, duration } = props
  const { videoPreviewManger } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const [image, setImage] = useState<VideoPreviewData>()

  useEffect(() => {
    if (!videoPreviewManger) return
    return videoPreviewManger.on2('unload', () => {
      setImage(undefined)
    })
  }, [videoPreviewManger])

  useTargetEventListener(
    'mousemove',
    (e) => {
      if (!containerRef.current) return
      const target = e.target as HTMLElement
      if (target.classList.contains('rc-slider-handle')) {
        return setVisible(false)
      }

      const style = getComputedStyle(containerRef.current)
      const percent = (e.offsetX / containerRef.current.clientWidth) * 100
      setVisible(true)
      // containerRef.current.style.setProperty('--percent', `${percent}%`)
      setPercent(percent)

      videoPreviewManger
        ?.getPreviewImage(duration * (percent / 100))
        .then((res) => {
          setImage(res)
        })
    },
    containerRef.current,
  )
  useTargetEventListener(
    'mouseleave',
    () => {
      setVisible(false)
    },
    containerRef.current,
  )
  useTargetEventListener(
    'mousedown',
    () => {
      setVisible(false)
    },
    containerRef.current,
  )

  if (!image)
    return (
      <div
        className={classNames(
          isVisible ? 'opacity-100' : 'opacity-0',
          'absolute bottom-[calc(100%+4px)] -translate-x-1/2 bg-[#333] rounded-[2px] px-[4px] py-[2px] pointer-events-none text-white text-[12px]',
        )}
        style={{
          left: `${percent}%`,
        }}
      >
        {formatTime(duration * (percent / 100))}
      </div>
    )

  return (
    <div
      className={classNames(
        isVisible ? 'opacity-100' : 'opacity-0',
        'absolute bottom-[calc(100%+4px)] -translate-x-1/2 pointer-events-none text-white text-[12px]',
      )}
      style={{
        left: `clamp(${previewImageWidth / 2}px, ${percent}%, calc(100% - ${previewImageWidth / 2}px))`,
      }}
    >
      <div
        style={{
          width: previewImageWidth,
          height: image.height / (image.width / previewImageWidth),
        }}
      >
        <img src={image.image} className="size-full object-contain" alt="" />
      </div>
      <div className="absolute bottom-0 w-full text-center bg-[#3337] rounded-[2px] px-[4px] py-[2px]">
        {formatTime(duration * (percent / 100))}
      </div>
    </div>
  )
}
export default observer(PlayerProgressBar)
