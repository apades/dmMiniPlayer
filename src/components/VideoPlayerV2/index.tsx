import {
  ArrowsAltOutlined,
  CloseOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LeftOutlined,
  SettingOutlined,
  ShrinkOutlined,
} from '@ant-design/icons'
import { PlayerEvent } from '@root/core/event'
import { CommonSubtitleManager } from '@root/core/SubtitleManager'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import configStore, { ReplacerDbClickAction } from '@root/store/config'
import { isDocPIP, isIframe, ownerWindow } from '@root/utils'
import { hasParent } from '@root/utils/dom'
import { useMemoizedFn, useUnmount, useUpdate } from 'ahooks'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'
import ShadowRootContainer from '../ShadowRootContainer'
import VideoPlayerSide from '../VideoPlayer/Side'
import SubtitleSelection from '../VideoPlayer/subtitle/SubtitleSelection'
import SubtitleText from '../VideoPlayer/subtitle/SubtitleText'
import vpContext, { ContextData, defaultVpContext } from './context'
import DanmakuContainer from './DanmakuContainer'
import { DanmakuInput, DanmakuInputIcon } from './DanmakuInput'
import DanmakuSettingBtn from './bottomPanel/DanmakuSettingBtn'
import {
  useInWindowKeydown,
  useKeydown,
  useTogglePlayState,
  useWebVideoEventsInit,
} from './hooks'
import LoadingIcon from './LoadingIcon'
import PlaybackRateSelection from './bottomPanel/PlaybackRateSelection'
import PlayedTime from './bottomPanel/PlayedTime'
import PlayerProgressBar from './bottomPanel/PlayerProgressBar'
import SpeedIcon from './SpeedIcon'
import TogglePlayActionButton from './bottomPanel/TogglePlayActionButton'
import VolumeBar from './bottomPanel/VolumeBar'
import VolumeIcon from './VolumeIcon'
import screenfull from '@root/utils/screenfull'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { postMessageToTop } from '@root/utils/windowMessages'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { Key } from '@root/types/key'
import CurrentTimeTooltipsWithKeydown from './bottomPanel/CurrentTimeTooltipsWithKeydown'

export type VideoPlayerHandle = {
  setCurrentTime: (time: number, pause?: boolean) => void
  togglePlayState: ReturnType<typeof useTogglePlayState>
  updateVideo: (video: HTMLVideoElement) => void
  updateVideoStream: (videoStream: MediaStream) => void
  ref: React.MutableRefObject<HTMLVideoElement | undefined>
}

type Props = {
  className?: string
  isReplacerMode?: boolean
  showCloseButton?: boolean
} & Omit<ContextData, 'eventBus'>

type VpInnerProps = Props & {
  setContext: React.Dispatch<React.SetStateAction<ContextData>>
} & Pick<ContextData, 'eventBus'>

const ACTION_AREA_ACTIVE = 'active'

const VideoPlayerV2Inner = observer(
  forwardRef<VideoPlayerHandle, VpInnerProps>((props, ref) => {
    const forceUpdate = useUpdate()
    const { isLive } = useContext(vpContext)
    const [isFullInWeb, setFullInWeb] = useState(false)
    const [isFullscreen, setFullscreen] = useState(false)

    const subtitleManager = useMemo(() => {
      if (props.subtitleManager) return props.subtitleManager
      else return new CommonSubtitleManager()
    }, [props.subtitleManager])
    useUnmount(() => {
      subtitleManager.unload()
    })

    const { run, clear } = useDebounceTimeoutCallback(() => {
      videoPlayerRef.current?.classList.remove(ACTION_AREA_ACTIVE)
    }, 1000)

    const videoPlayerRef = useRef<HTMLDivElement>(null)
    /**video插入替换位置 */
    const videoInsertRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>()
    /**这个专属于vp的ref，videoRef是专属于传入的webVideo */
    const inVpVideoRef = useRef<HTMLVideoElement>()

    useEffect(() => {
      if (!videoPlayerRef.current) return
      videoPlayerRef.current.focus()
    }, [videoPlayerRef.current])

    useEffect(() => {
      if (!props.webVideo) return
      if (!videoRef.current) {
        videoRef.current = props.webVideo
      }

      // 不替换video
      if (!props.useWebVideo) {
        updateVideoRef(videoRef.current)
        return
      }

      if (!videoInsertRef.current) return
      // 替换video node
      const parent = videoInsertRef.current?.parentElement
      const lastVideo = videoRef.current
      if (!parent) return
      console.log('替换video node')
      parent.insertBefore(videoRef.current, videoInsertRef.current)
      updateVideoRef(videoRef.current)

      // return () => {
      //   try {
      //     if (lastVideo?.parentElement != parent) return
      //     if (!videoInsertRef.current) return

      //     console.log('还原videoInert')
      //     parent.replaceChild(videoInsertRef.current, lastVideo)
      //   } catch (error) {
      //     console.error(error)
      //   }
      // }
    }, [videoRef.current, isFullInWeb])

    const toggleFullInWeb = useMemoizedFn(() => {
      setFullInWeb((v) => {
        const toFullInWeb = !v
        if (isIframe()) {
          postMessageToTop(
            toFullInWeb
              ? PostMessageEvent.fullInWeb_request
              : PostMessageEvent.fullInWeb_close,
          )
        }
        return toFullInWeb
      })
    })
    const toggleFullscreen = useMemoizedFn(() => {
      if (screenfull.isFullscreen) {
        screenfull.exit()
        setFullscreen(false)
      } else {
        screenfull.isEnabled && screenfull.request(videoPlayerRef.current)
        setFullscreen(true)
      }
    })

    useEffect(() => {
      if (!isFullInWeb) return
      const bodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = bodyOverflow
      }
    }, [isFullInWeb])
    const quitFullMode = useMemoizedFn(() => {
      if (isFullInWeb) return toggleFullInWeb()
      if (screenfull.isFullscreen) return toggleFullscreen()
    })

    useTargetEventListener(
      'dblclick',
      () => {
        if (!props.isReplacerMode) return
        if (configStore.replacerDbClickAction === ReplacerDbClickAction.none)
          return
        switch (configStore.replacerDbClickAction) {
          case ReplacerDbClickAction.fullscreen: {
            toggleFullscreen()
            break
          }
          case ReplacerDbClickAction.fullpage: {
            toggleFullInWeb()
            break
          }
        }
      },
      videoPlayerRef.current,
    )

    const updateVideoRef = useMemoizedFn((video: HTMLVideoElement) => {
      // console.trace('updateVideoRef', video)
      videoRef.current = video
      if (!subtitleManager.initd) {
        subtitleManager.init(video)
      }
      subtitleManager.video = video

      const isLive = props.isLive || video.duration === Infinity

      const keydownWindow = props.useWebVideo
        ? ownerWindow(video)
        : ownerWindow(videoPlayerRef.current)
      props.setContext((v) => ({
        ...v,
        isLive,
        webVideo: video,
        keydownWindow,
      }))

      if (!props.useWebVideo && props.videoStream) {
        updateVideoStream(props.videoStream)
      }
      forceUpdate()
    })

    const handleChangeActionArea = useMemoizedFn(
      (visible = true, lock = false) => {
        if (configStore.vpActionAreaLock) return

        if (visible) {
          run(() => {
            videoPlayerRef.current?.classList.add(ACTION_AREA_ACTIVE)
          })
          if (lock) {
            clear()
          }
        } else {
          clear()
          videoPlayerRef.current?.classList.remove(ACTION_AREA_ACTIVE)
        }
      },
    )

    const togglePlayState = useTogglePlayState()

    // 初始化
    useInWindowKeydown()
    useWebVideoEventsInit()

    useKeydown((key) => {
      if (key === 'Escape') {
        quitFullMode()
      }
    })

    const setCurrentTime = useMemoizedFn((time: number, pause?: boolean) => {
      if (!videoRef.current) return
      videoRef.current.currentTime = time
      if (pause) togglePlayState('pause')
    })
    const updateVideoStream = useMemoizedFn((stream: MediaStream) => {
      if (!inVpVideoRef.current) return
      inVpVideoRef.current.srcObject = stream
    })
    const updateVideo = useMemoizedFn((video: HTMLVideoElement) => {
      if (videoRef.current && videoPlayerRef.current && props.useWebVideo) {
        const videoInVp = hasParent(videoRef.current, videoPlayerRef.current)
        // 避免检测到替换了video，但旧video还存在vp中
        if (videoInVp) {
          videoRef.current.parentElement!.removeChild(videoRef.current)
        }
      }

      updateVideoRef(video)
    })

    useImperativeHandle(ref, () => {
      return {
        setCurrentTime,
        togglePlayState,
        updateVideo,
        updateVideoStream,
        ref: videoRef,
      }
    })

    const handleOpenSetting = useMemoizedFn(() => {
      const tarWin =
        (videoPlayerRef.current?.ownerDocument.defaultView as any) ?? window
      // 全屏模式和docPIP内需要
      if (isFullscreen || isDocPIP(tarWin)) {
        if (!videoPlayerRef.current) return
        window.openSettingPanel(videoPlayerRef.current)
      } else {
        postMessageToTop(PostMessageEvent.openSettingPanel)
      }
    })

    const el = (
      <div
        tabIndex={1}
        className={classNames(
          'video-player-v2 relative overflow-hidden select-none wh-[100%] group',
          props.className,
          configStore.vpActionAreaLock && ACTION_AREA_ACTIVE,
        )}
        style={{
          '--color-main': '#0669ff',
          '--area-height': '40px',
          '--btn-size': '120px',
          '--box-shadow': '0 2px 4px rgba(55, 60, 68, 0.2)',
          '--c-text-main': 'rgba(0, 0, 0, 0.85)',
          '--side-width': configStore.sideWidth + 'px',
        }}
        ref={videoPlayerRef}
        onMouseLeave={() => {
          handleChangeActionArea(false)
        }}
      >
        <link rel="stylesheet" href={Browser.runtime.getURL('/css.css')} />
        <div
          className={classNames(
            'video-container relative h-full bg-black',
            !isLive && 'cursor-pointer',
          )}
          onClick={() => {
            !isLive && togglePlayState()
          }}
          onMouseMove={() => {
            handleChangeActionArea(true)
          }}
        >
          <div ref={videoInsertRef}></div>
          <style>
            {`.video-player-v2 video {
    position: absolute !important;
    top: initial !important;
    right: initial !important;
    bottom: initial !important;
    left: initial !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 auto !important;
    cursor: pointer !important;
    ${configStore.videoSharpening ? `filter: contrast(1) !important;` : ''}
    pointer-events: none !important;
    transform: initial !important;
    z-index: initial !important;
  }`}
          </style>
          {!props.useWebVideo && (
            <video
              ref={(ref) => {
                if (!ref) return
                if (!props.webVideo) {
                  updateVideoRef(ref)
                }

                inVpVideoRef.current = ref
              }}
              autoPlay
              muted
            />
          )}

          {/* 状态icon */}
          <LoadingIcon />
          <VolumeIcon />
          <SpeedIcon />
        </div>

        {/* 底部操作栏 */}
        <div
          className={classNames(
            'video-action-area w-full transition-all duration-500',
            // tailwind 检测不到ACTION_AREA_ACTIVE这种动态参数
            `absolute bottom-[calc(-1*(var(--area-height)+5px))] group-[&.active]:bottom-0`,
          )}
          onMouseEnter={(e) => handleChangeActionArea(true, true)}
          onMouseLeave={() => {
            handleChangeActionArea(false)
          }}
        >
          <div className="absolute bottom-[calc(100%+12px)] w-full pointer-events-none">
            <SubtitleText subtitleManager={subtitleManager} />
          </div>

          {!isLive && <PlayerProgressBar />}

          <div className="opacity-0 group-[&.active]:opacity-100 transition-all duration-500">
            <div className="mask w-full h-[calc(var(--area-height)+10px)] absolute bottom-0 bg-gradient-to-t from-[#000] opacity-70 z-[1]"></div>
            <div className="actions text-white px-5 py-2 f-i-center relative z-[6] gap-3 h-area-height">
              <TogglePlayActionButton />
              <PlayedTime />

              <div className="f-i-center gap-1">
                <SubtitleSelection subtitleManager={subtitleManager} />

                <DanmakuSettingBtn />

                <DanmakuInputIcon danmakuSender={props.danmakuSender} />

                <PlaybackRateSelection />

                <div
                  className={classNames(
                    'p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors mb:hidden',
                  )}
                  onClick={handleOpenSetting}
                >
                  <SettingOutlined />
                </div>
              </div>

              <div className="right ml-auto f-i-center gap-1">
                <VolumeBar />
                {props.isReplacerMode && (
                  <>
                    <div
                      className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors ml-[6px]"
                      onClick={toggleFullInWeb}
                    >
                      {isFullInWeb ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                    </div>
                    <div
                      className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <FullscreenExitOutlined />
                      ) : (
                        <FullscreenOutlined />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <DanmakuInput danmakuSender={props.danmakuSender} />
        <DanmakuContainer />
        <div className="group-[&.active]:opacity-0 transition-all">
          <CurrentTimeTooltipsWithKeydown />
        </div>

        {/* 侧边操作栏 */}
        {props.sideSwitcher && (
          <div className="side-action-area ab-vertical-center transition-all duration-500 h-full z-[11] right-[calc(var(--side-width)*-1)] w-[calc(var(--side-width)+15px)] hover:right-0 group/side">
            <VideoPlayerSide sideSwitcher={props.sideSwitcher} />
            <div className="side-dragger group-hover/side:opacity-100 group-[&.active]:opacity-100 opacity-0 absolute ab-vertical-center w-[15px] h-[30px] bg-[#0007] rounded-tl-[5px] rounded-bl-[5px] transition-all text-white f-center">
              <LeftOutlined
                className={classNames(
                  'group-hover/side:rotate-180 rotate-0 text-xs',
                )}
              />
            </div>
          </div>
        )}

        {props.isReplacerMode && (
          <div
            className={classNames(
              'absolute right-[20px] top-0 z-20 group-[&.active]:top-[20px]',
              'opacity-0 group-[&.active]:opacity-100',
              'rounded-full wh-[40px] cursor-pointer text-white bg-bg hover:bg-bg-hover text-[22px] f-center transition-all',
            )}
            onClick={() => {
              props.videoPlayer.emit(PlayerEvent.close)
            }}
          >
            <CloseOutlined />
          </div>
        )}
      </div>
    )

    if (isFullInWeb)
      return createPortal(
        <ShadowRootContainer>
          <div className="fixed top-0 left-0 size-full z-[9999]">{el}</div>
        </ShadowRootContainer>,
        document.body,
      )

    return el
  }),
)

const VideoPlayerV2 = forwardRef<VideoPlayerHandle, Props>((props, ref) => {
  const [context, setContext] = useState<ContextData>({
    ...defaultVpContext,
    ...props,
  })

  return (
    <vpContext.Provider value={context}>
      <VideoPlayerV2Inner
        {...props}
        eventBus={context.eventBus}
        setContext={setContext}
        ref={ref}
      />
    </vpContext.Provider>
  )
})

export default VideoPlayerV2
