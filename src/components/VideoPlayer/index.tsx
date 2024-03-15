import { LoadingOutlined } from '@ant-design/icons'
import ProgressBar from '@root/components/ProgressBar'
import { useOnce } from '@root/hook'
import _env, { configStore } from '@root/store/config'
import { formatTime, minmax, wait } from '@root/utils'
import { default as classNames, default as cls } from 'classnames'
import { observer } from 'mobx-react'
import {
  useMemo,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'
import Iconfont from '../Iconfont'
import BarrageInput from './BarrageInput'
import VolumeBar from './VolumeBar'
import { VideoPlayerLoadEvent } from './events'
import { checkJumpInBufferArea } from './utls'
import vpConfig from '@root/store/vpConfig'
import { runInAction } from 'mobx'
import { checkIsLive } from '@root/utils/video'
import FileDropper from '../FileDropper'
import type SubtitleManager from '@root/core/SubtitleManager'
import SubtitleSelection from './subtitle/SubtitleSelection'
import SubtitleText from './subtitle/SubtitleText'
import { CommonSubtitleManager } from '@root/core/SubtitleManager'

type EventBase = Omit<
  {
    [k in keyof React.DOMAttributes<HTMLVideoElement>]?: (
      event: React.SyntheticEvent<HTMLVideoElement, Event>
    ) => void
  },
  'children' | 'dangerouslySetInnerHTML'
>

export type Props = EventBase & {
  webVideo?: HTMLVideoElement
  useWebVideo?: boolean
  keydownWindow?: Window
  uri?: string
  srcObject?: MediaProvider
  duration?: number
  /** 关乎多个播放器之前的键盘操作 */
  index: number | string
  className?: string

  /** 进度条的child */
  renderBarChild?: () => ReactElement
  /** 覆盖播放内容的child */
  renderVideoContainerChild?: () => ReactElement
  /** 通知性质的child */
  notifiChild?: {
    state: boolean
    el: ReactElement
  }[]
  /** 是否渲染通知UI */
  isRenderNotifiChild?: boolean

  coverUrl?: string
  renderCoverChild?: () => ReactElement

  /** 控制是否可以播放 */
  canPlay?: boolean

  autoPlay?: boolean
  originAttr?: React.DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  >

  renderSideActionArea?: ReactElement
  subtitleManager?: SubtitleManager
}

export type VideoPlayerHandle = {
  setCurrentTime: (time: number, isPause?: boolean) => void
  pause: () => void
  play: () => void
  updateVideo: (video: HTMLVideoElement /*  | MediaProvider */) => void
  ref: React.MutableRefObject<HTMLVideoElement>
}

const VideoPlayer = observer(
  forwardRef<VideoPlayerHandle, Props>((props, ref) => {
    const {
      canPlay = true,
      isRenderNotifiChild = true,
      keydownWindow = window,
    } = props
    const videoRef = useRef<HTMLVideoElement>(props.webVideo)
    const compVideoRef = useRef<HTMLVideoElement>(props.webVideo)
    const player = useRef<HTMLDivElement>(null)
    const playBtnEl = useRef<HTMLSpanElement>(null)

    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(props.duration || 0)

    const [isVisibleActionAreaInFC, setVisibleActionAreaInFC] = useState(false)
    const [isActionAreaLock, setActionAreaLock] = useState(false)

    const [playing, setPlaying] = useState(!props?.webVideo?.paused)
    const [canPause, setCanPause] = useState(true)
    const [isLoading, setLoading] = useState(false)
    const [isInputMode, setInputMode] = useState(false)

    const [loaded, setLoaded] = useState<{ s: number; e: number }[]>([])
    const [isFirstPlay, setIsFirstPlay] = useState(false)
    const [isSpeedMode, setSpeedMode] = useState(false)

    const [volume, setVolume] = useState(props?.webVideo?.volume * 100)
    const [isMute, setMute] = useState(props?.webVideo?.muted)

    const [playedPercent, setPlayedPercent] = useState(0)
    const [isPlayEnd, setPlayEnd] = useState(false)
    const [timeupdateQueue, setTimeupdateQueue] = useState<
      ((time: number) => void)[]
    >([])
    const [eventListenMap, setEventListenMap] = useState<{
      [k in keyof HTMLMediaElementEventMap]?: ((
        event: HTMLMediaElementEventMap[k]
      ) => void)[]
    }>({})

    const subtitleManager = useMemo(() => {
      if (props.subtitleManager) return props.subtitleManager
      else return new CommonSubtitleManager()
    }, [props.subtitleManager])

    const getIsLive = () => checkIsLive(videoRef.current)

    useOnce(() => {
      window.dispatchEvent(VideoPlayerLoadEvent)
    })

    useEffect(() => {
      if (!(props.useWebVideo && props.webVideo)) return
      const videoContainer = player.current.querySelector('.video-container')
      videoContainer.insertBefore(videoRef.current, videoContainer.children[0])
      const oldVideoEl = videoRef.current

      compVideoRef.current = props.webVideo
      return () => {
        // console.log('去除旧videoEl', oldVideoEl)
        // videoContainer.removeChild(oldVideoEl)
      }
    }, [videoRef.current])

    useEffect(() => {
      if (window.videoPlayers) return
      window.videoPlayers = {
        add(index, obj) {
          // console.log('add vp', index)
          window.videoPlayers.list.set(index, obj)
        },
        remove(index) {
          window.videoPlayers.list.delete(index)
        },
        play(index) {
          for (let i of window.videoPlayers.list.keys()) {
            if (i === index) continue
            window.videoPlayers.list.get(i)?.pause?.()
          }
          // window.videoPlayers.list.get(index).play()
        },
        list: new Map<string | number, any>(),
        focusIndex: '',
      }
    }, [])

    useEffect(() => {
      if (!props.srcObject) return
      compVideoRef.current.srcObject = props.srcObject
    }, [props.srcObject])

    useEffect(() => {
      setDuration(props.duration)
    }, [props.duration])

    useEffect(() => {
      if (isFirstPlay) return
      Object.entries(eventListenMap).forEach(([event, cbs]) => {
        cbs.forEach((cb) => {
          // console.log('add', event)
          videoRef.current.addEventListener(event, cb)
        })
      })
      return () => {
        Object.entries(eventListenMap).forEach(([event, cbs]) => {
          cbs.forEach((cb) => {
            videoRef.current?.removeEventListener?.(event, cb)
          })
        })
      }
    }, [isFirstPlay, eventListenMap])
    useImperativeHandle(
      ref,
      (): VideoPlayerHandle => ({
        setCurrentTime(time, isPause) {
          if (isFirstPlay) setIsFirstPlay(false)
          setTimeout(() => {
            videoRef.current.currentTime = time
            let isInBuffer = checkJumpInBufferArea(
              videoRef.current.buffered,
              time
            )
            if (!isInBuffer) setLoading(true)
            if (isPause) videoRef.current.pause()
          }, 0)
        },
        pause() {
          if (canPause) videoRef.current.pause()
        },
        play() {
          playerOpause('play')
        },
        updateVideo(video) {
          console.log('播放器更新视频', video)
          videoRef.current = video
          // if (video instanceof HTMLVideoElement) {
          //   videoRef.current = video
          // } else {
          //   compVideoRef.current.srcObject = video
          // }
        },
        ref: videoRef,
      })
    )

    // 多个播放器标识
    const index = props.index ?? -1
    useEffect(() => {
      if (isFirstPlay) return
      videoRef.current.volume = volume / 100
      localStorage['vp_volume'] = volume
    }, [volume])

    useEffect(() => {
      if (!videoRef.current) return
      setDuration(videoRef.current.duration)

      if (props.autoPlay) {
        videoRef.current.setAttribute('mute', '')
        playerOpause('play')
        setTimeout(() => {
          videoRef.current.removeAttribute('mute')
        }, 0)
      }
    }, [videoRef.current])

    const [isFocus, setFocus] = useState(false)
    useEffect(() => {
      if (isFocus) window.videoPlayers.focusIndex = index
    }, [isFocus])

    useEffect(() => {
      let speedModeTimer: NodeJS.Timeout,
        isSpeedMode = false
      const handleKeyDown = (e: KeyboardEvent) => {
        // if (window.videoPlayers.focusIndex !== index) return
        const tar = e.target as HTMLElement
        if (
          tar.tagName === 'TEXTAREA' ||
          tar.tagName === 'INPUT' ||
          tar.contentEditable === 'true'
        )
          return
        // e.stopPropagation()
        switch (e.code) {
          case 'ArrowDown':
            e.preventDefault()
            setVolume((v) => (v - 10 >= 0 ? v - 10 : 0))
            showVolumeNotifi()
            break
          case 'ArrowUp':
            e.preventDefault()
            setVolume((v) => (v + 10 <= 100 ? v + 10 : 100))
            showVolumeNotifi()
            break
          case 'ArrowLeft': {
            if (getIsLive()) return
            e.preventDefault()
            let getNewTime = () =>
              minmax(videoRef.current.currentTime - 5, 0, duration)

            if (isFirstPlay) {
              playerOpause('play').then(() => {
                videoRef.current.currentTime = getNewTime()
              })
            } else {
              videoRef.current.currentTime = getNewTime()
            }
            break
          }
          case 'ArrowRight': {
            if (getIsLive()) return
            if (speedModeTimer) return
            speedModeTimer = setTimeout(() => {
              isSpeedMode = true
              videoRef.current.playbackRate = configStore.playbackRate
              setSpeedMode(true)
            }, 200)
            break
          }
          case 'Space':
            if (getIsLive()) return
            e.preventDefault()
            if (isFirstPlay) playerOpause('play')
            else {
              playBtnEl.current.click()
            }

            break
        }
      }
      keydownWindow.addEventListener('keydown', handleKeyDown)

      const handleKeyUp = (e: KeyboardEvent) => {
        if (window.videoPlayers.focusIndex !== index) return
        const tar = e.target as HTMLElement
        if (
          tar.tagName === 'TEXTAREA' ||
          tar.tagName === 'INPUT' ||
          tar.contentEditable === 'true'
        )
          return
        e.stopPropagation()

        switch (e.code) {
          case 'ArrowRight': {
            if (getIsLive()) return
            e.preventDefault()
            clearTimeout(speedModeTimer)
            speedModeTimer = null
            setSpeedMode(false)

            if (isSpeedMode) {
              videoRef.current.playbackRate = 1
              isSpeedMode = false
            } else {
              const getNewTime = () =>
                minmax(videoRef.current.currentTime + 5, 0, duration)

              if (isFirstPlay) {
                playerOpause('play').then(() => {
                  videoRef.current.currentTime = getNewTime()
                })
              } else {
                videoRef.current.currentTime = getNewTime()
              }
            }
          }
        }
      }
      keydownWindow.addEventListener('keyup', handleKeyUp)

      return () => {
        keydownWindow.removeEventListener('keydown', handleKeyDown)
        keydownWindow.removeEventListener('keyup', handleKeyUp)
      }
    }, [videoRef.current, duration, isFirstPlay])

    useEffect(() => {
      if (!window.videoPlayers.list.size) window.videoPlayers.focusIndex = index

      const player = {
        pause() {
          const el = player.videoEl()
          if (!el) return
          if (el.classList.contains('can-pause')) el.pause()
        },
        async setCurrentTime(time: number, isPause: boolean) {
          if (isFirstPlay) setIsFirstPlay(false)
          await wait()
          const el = player.videoEl()

          const isInBuffer = checkJumpInBufferArea(el.buffered, time)
          if (!isInBuffer) setLoading(true)
          el.currentTime = time
          if (isPause) el.pause()
        },
        videoEl: () =>
          document.querySelector(
            `.video-player[data-vid="${index}"] video`
          ) as HTMLVideoElement,
        onTimeupdate(cb: (time: number) => void) {
          setTimeupdateQueue((q) => {
            q.push(cb)
            return [...q]
          })
        },
        addEventListener<K extends keyof HTMLMediaElementEventMap>(
          event: K,
          cb: (e?: HTMLMediaElementEventMap[K]) => void
        ) {
          setEventListenMap({
            ...eventListenMap,
            [event]: [...(eventListenMap[event] || []), cb],
          })
        },
      }
      window.videoPlayers.add(index, player)
      return () => {
        window.videoPlayers.remove(props.index)
      }
    }, [])

    async function playerOpause(type?: 'play' | 'pause') {
      if (getIsLive()) return
      if (!canPlay) return
      if (isFirstPlay) setIsFirstPlay(false)
      // console.log('播放', playing, '能否暂停', canPause)
      await wait(0)
      if ((playing || type === 'pause') && canPause && type !== 'play') {
        // console.log('pause')
        videoRef.current.pause()
      } else {
        videoRef.current.classList.remove('can-pause')
        setCanPause(false)
        if (isPlayEnd) setPlayedPercent(0)
        return videoRef.current
          .play()
          .then(() => {
            setCanPause(true)
            videoRef.current.volume = volume / 100
            videoRef.current.classList.add('can-pause')
            if (type === 'pause') videoRef.current.pause()
          })
          .catch((err) => {
            console.error('播放出错', err)
            throw err
          })
      }
    }

    let [isVolumeNotiShow, setVolumeNotiShow] = useState(false)
    let volumeNotifTimmer = useRef<NodeJS.Timeout>(null)
    function showVolumeNotifi() {
      if (volumeNotifTimmer.current) clearTimeout(volumeNotifTimmer.current)
      setVolumeNotiShow(true)
      volumeNotifTimmer.current = setTimeout(() => {
        setVolumeNotiShow(false)
      }, 1000)
    }

    let fullscreenActionAreaTimmer = useRef<NodeJS.Timeout>(null)
    let handleFullscreenShowActionArea = (state = true, focus = false) => {
      // if (!isFullscreen && !focus) return false
      if (fullscreenActionAreaTimmer.current)
        clearTimeout(fullscreenActionAreaTimmer.current)
      setVisibleActionAreaInFC(state)
      return true
    }

    let handleResetActionAreaShow = () => {
      if (_env.vpActionAreaLock || isActionAreaLock) return
      if (fullscreenActionAreaTimmer.current)
        clearTimeout(fullscreenActionAreaTimmer.current)
      fullscreenActionAreaTimmer.current = setTimeout(() => {
        setVisibleActionAreaInFC(false)
      }, 500)
    }

    // !! test del
    useEffect(() => {
      if (_env.vpActionAreaLock) handleFullscreenShowActionArea(true)
    }, [])

    let RenderVideoCover = () => {
      return (
        isFirstPlay && (
          <div className={`video-cover`}>
            <img crossOrigin="anonymous" src={props.coverUrl} />
            {props.renderCoverChild?.()}
          </div>
        )
      )
    }

    // 挂载事件
    useEffect(() => {
      if (!videoRef.current) return
      const eventsMap: React.DetailedHTMLProps<
        React.VideoHTMLAttributes<HTMLVideoElement>,
        HTMLVideoElement
      > = {}

      subtitleManager.init(videoRef.current)
      const eventBase: EventBase = {
        onLoadedMetadata: (e) => {},
        onSeeked: () => {},
        onSeeking: () => {},
        onPause: () => setPlaying(false),
        onPlay: (e) => {
          setPlaying(true)
          setPlayEnd(false)
          window.videoPlayers.play(index)
        },
        onTimeUpdate: () => {
          let ctime = videoRef.current.currentTime
          setCurrentTime(ctime)
          setPlayedPercent((ctime / videoRef.current.duration) * 100)
          timeupdateQueue.forEach((fn) => fn(ctime))

          if (_env.vpBufferTest) {
            videoRef.current.removeAttribute('controls')
            videoRef.current.setAttribute('controls', '')
          }
        },
        onEnded: () => {
          setPlayEnd(true)
        },
        onWaiting: () => setLoading(true),
        onCanPlay: () => {
          setLoading(false)
        },
        onProgress: () => {
          let buffered = videoRef.current?.buffered ?? ({} as TimeRanges)
          let _loaded: typeof loaded = []
          for (let i = 0; i < buffered.length; i++) {
            _loaded.push({ s: buffered.start(i), e: buffered.end(i) })
          }
          setLoaded(_loaded)
        },
        onCanPlayThrough: () => {},
        onDurationChange: (e) => {
          setDuration((e.target as HTMLVideoElement).duration)
        },
        onVolumeChange(e) {
          const tar = e.target as HTMLVideoElement
          setMute(tar.muted)
          setVolume(tar.volume * 100)
        },
        onError: (e) => {
          console.error('播放出错了', e)
        },
      }

      Object.keys(eventBase).forEach((key: keyof EventBase) => {
        let realEventKey = key.slice(2).toLowerCase()
        let fnArr: ((
          event: React.SyntheticEvent<HTMLVideoElement, Event>
        ) => void)[] = []

        fnArr.push(eventBase[key])
        if (props[key]) fnArr.push(props[key])

        if (fnArr.length) {
          ;(eventsMap as any)[realEventKey] = (e: any) =>
            fnArr.forEach((fn) => fn(e))
        }
      })

      const entries = Object.entries(eventsMap)
      console.log('video事件监听', entries, videoRef.current)
      entries.forEach(([key, fn]) => {
        videoRef.current.addEventListener(key, fn)
      })

      const oldVideoEl = videoRef.current
      return () => {
        entries.forEach(([key, fn]) => {
          oldVideoEl.removeEventListener(key, fn)
        })
        subtitleManager.reset()
      }
    }, [videoRef.current])

    // ---video event---

    return (
      <div
        className={cls('video-player', props.className, {
          'action-area-show': isVisibleActionAreaInFC,
          'buffer-test': _env.vpBufferTest,
          'is-firstplay': isFirstPlay,
          'is-live': getIsLive(),
        })}
        style={
          {
            '--side-width': configStore.sideWidth + 'px',
          } as CSSProperties
        }
        tabIndex={-1}
        data-vid={index}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        ref={player}
      >
        <div
          className="video-container"
          onClick={() => {
            playerOpause()
          }}
          onMouseMove={(e) => {
            handleFullscreenShowActionArea(true)
            handleResetActionAreaShow()
          }}
        >
          {!props.useWebVideo && (
            <video
              ref={(ref) => {
                if (!props.webVideo) videoRef.current = ref

                compVideoRef.current = ref
              }}
              src={props.uri}
              controls={_env.vpBufferTest}
              autoPlay
              muted
              {...(props.originAttr || {})}
            />
          )}

          {/* 视频封面 */}
          <div className="video-cover">{props.renderCoverChild?.()}</div>

          {props.renderVideoContainerChild?.()}

          {isRenderNotifiChild &&
            RenderVideoNoti([
              {
                state: isLoading && !isFirstPlay,
                el: (
                  <div className="v-defalut-noti v-loading">
                    <LoadingOutlined
                      style={{
                        fontSize: 'var(--btn-icon-size)',
                        color: 'var(--color-main)',
                      }}
                    />
                  </div>
                ),
              },
              {
                state: isVolumeNotiShow,
                el: (
                  <div>
                    <Iconfont type="iconicon_player_volume" />
                    <span style={{ marginLeft: 10 }}>{volume}%</span>
                  </div>
                ),
              },
              {
                state: isSpeedMode,
                el: <div>{configStore.playbackRate}倍速中&gt;&gt;</div>,
                className: 'speed-mode-noti',
              },
              ...(props.notifiChild || []),
            ])}
        </div>

        {/* 底部操作栏 */}
        <div
          className="video-action-area"
          onMouseEnter={(e) => handleFullscreenShowActionArea(true)}
          onMouseLeave={handleResetActionAreaShow}
        >
          <div className="absolute dp:bottom-[calc(100%)] bottom-[calc(100%+8px)] w-full">
            <SubtitleText subtitleManager={subtitleManager} />
          </div>
          <div className="mask"></div>
          <div className={cls('actions', isInputMode && 'is-input')}>
            {getIsLive() ? (
              <span className="live-dot"></span>
            ) : (
              <Iconfont
                ref={playBtnEl}
                onClick={() => playerOpause()}
                type={
                  playing ? 'iconicon_player_pause' : 'iconicon_player_play'
                }
              />
            )}

            <span style={{ whiteSpace: 'nowrap' }}>
              {formatTime(currentTime)}
              {!getIsLive() && ` / ${formatTime(duration)} `}
            </span>

            <SubtitleSelection subtitleManager={subtitleManager} />
            {vpConfig.canShowBarrage && (
              <Iconfont
                onClick={() => {
                  runInAction(() => {
                    vpConfig.showBarrage = !vpConfig.showBarrage
                  })
                }}
                size={18}
                type={vpConfig.showBarrage ? 'danmaku_open' : 'danmaku_close'}
              />
            )}
            <BarrageInput
              setActionAreaLock={(v) => {
                if (configStore.vpActionAreaLock) return
                setActionAreaLock(v)
                if (!v) setVisibleActionAreaInFC(false)
              }}
              setInputMode={setInputMode}
            />

            <div className="played-progress-bar">
              <ProgressBar
                percent={playedPercent}
                onClick={(percent) => {
                  if (!canPlay) return
                  if (isFirstPlay) {
                    playerOpause()
                  }
                  setPlayedPercent(percent)

                  setTimeout(() => {
                    percent = percent / 100
                    videoRef.current.currentTime = duration * percent
                    setCurrentTime(duration * percent)
                  }, 0)
                }}
                loadColor="#0669ff"
              >
                <div className="bar-loaded">
                  {loaded.map(({ s, e }) => (
                    <span
                      key={s}
                      style={{
                        left: `${(s / duration) * 100}%`,
                        width: `${((e - s) / duration) * 100}%`,
                        top: 0,
                      }}
                    ></span>
                  ))}
                </div>
              </ProgressBar>
            </div>

            <div className="func">
              <VolumeBar
                videoRef={videoRef}
                setMute={setMute}
                setVolume={setVolume}
                volume={volume}
              />
            </div>
          </div>
        </div>

        {/* 侧边操作栏 */}
        {props.renderSideActionArea && (
          <div
            className="side-action-area"
            // onMouseEnter={(e) => handleFullscreenShowActionArea(true)}
            // onMouseLeave={handleResetActionAreaShow}
          >
            {props.renderSideActionArea}
            <div className="side-dragger"></div>
          </div>
        )}

        {_env.videoProgress_show && (
          <div
            className="bottom-played-bar"
            style={{
              width: playedPercent + '%',
              height: _env.videoProgress_height + 'px',
              backgroundColor: _env.videoProgress_color,
            }}
          ></div>
        )}
      </div>
    )
  })
)

const RenderVideoNoti = (
  props: {
    state: boolean
    el: ReactElement
    className?: string
  }[]
) => {
  const showIndex = props.findIndex((d) => d.state === true),
    isShow = showIndex !== -1,
    tar = props[showIndex]
  return (
    <div
      className={classNames('video-noti', tar?.className)}
      style={{
        display: isShow ? 'block' : 'none',
      }}
    >
      {isShow && tar.el}
    </div>
  )
}

export default VideoPlayer
