import ProgressBar from '@root/components/ProgressBar'
import _env from '@root/store/config'
import { formatTime, minmax, wait } from '@root/utils'
import cls from 'classnames'
import {
  forwardRef,
  memo,
  type ReactElement,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from 'react'
import { checkJumpInBufferArea } from './utls'
import VolumeBar from './VolumeBar'
import Iconfont from '../Iconfont'
import { LoadingOutlined } from '@ant-design/icons'
import BarrageInput from './BarrageInput'
import { useOnce } from '@root/hook'
import { VideoPlayerLoadEvent } from './events'
import { observer } from 'mobx-react'

type BarEventsKey = 'onMouseMove' | 'onMouseOut' | 'onMouseEnter' | 'onClick'

type EventBase = Omit<
  {
    [k in keyof React.DOMAttributes<HTMLVideoElement>]?: (
      event: React.SyntheticEvent<HTMLVideoElement, Event>
    ) => void
  },
  'children' | 'dangerouslySetInnerHTML'
>

export type Props = EventBase & {
  barEvents?: {
    [key in BarEventsKey]?: (
      rect: DOMRect,
      e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => void
  }
} & {
  mobxOption?: { canSendBarrage: boolean }
  webVideo?: HTMLVideoElement
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

  renderSiderActionArea?: () => ReactElement
}

export type VideoPlayerHandle = {
  setCurrentTime: (time: number, isPause?: boolean) => void
  pause: () => void
  play: () => void
  ref: React.MutableRefObject<HTMLVideoElement>
}

const VideoPlayer = observer(
  forwardRef<VideoPlayerHandle, Props>((props, ref) => {
    let {
      canPlay = true,
      isRenderNotifiChild = true,
      keydownWindow = window,
    } = props
    let videoRef = useRef<HTMLVideoElement>(props.webVideo)
    let compVideoRef = useRef<HTMLVideoElement>(null)
    let player = useRef<HTMLDivElement>(null)
    const playBtnEl = useRef<HTMLSpanElement>(null)
    const barrageInputRef = useRef<HTMLInputElement>()

    let [currentTime, setCurrentTime] = useState(0)
    let [duration, setDuration] = useState(props.duration || 0)

    let [isVisibleActionAreaInFC, setVisibleActionAreaInFC] = useState(false)
    let [isActionAreaLock, setActionAreaLock] = useState(false)

    let [playing, setPlaying] = useState(!props?.webVideo?.paused)
    let [canPause, setCanPause] = useState(true)
    let [isLoading, setLoading] = useState(false)
    let [isInputMode, setInputMode] = useState(false)

    let [loaded, setLoaded] = useState<{ s: number; e: number }[]>([])
    let [isFirstPlay, setIsFirstPlay] = useState(false)

    let [volume, setVolume] = useState(props?.webVideo?.volume * 100)

    let [playedPercent, setPlayedPercent] = useState(0)
    let [isPlayEnd, setPlayEnd] = useState(false)
    let [timeupdateQueue, setTimeupdateQueue] = useState<
      ((time: number) => void)[]
    >([])
    let [eventListenMap, setEventListenMap] = useState<{
      [k in keyof HTMLMediaElementEventMap]?: ((
        event: HTMLMediaElementEventMap[k]
      ) => void)[]
    }>({})

    const getIsLive = () => videoRef.current.duration == Infinity

    useOnce(() => {
      window.dispatchEvent(VideoPlayerLoadEvent)
    })

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
          console.log('add', event)
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
        ref: videoRef,
      })
    )

    // 多个播放器标识
    let index = props.index ?? -1
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

    let [speed, setSpeed] = useState(1)
    useEffect(() => {
      if (isFirstPlay) return
      videoRef.current.playbackRate = speed
    }, [speed, isFirstPlay])

    // keydowm
    let [isFocus, setFoucs] = useState(false)
    useEffect(() => {
      if (isFocus) window.videoPlayers.focusIndex = index
    }, [isFocus])

    useEffect(() => {
      // if (!videoRef.current) return

      // system
      let handleKeyDown = (e: KeyboardEvent) => {
        if (window.videoPlayers.focusIndex !== index) return
        let tar = e.target as HTMLElement
        // console.log('tar', _isFocused, index, isFirstPlay)
        if (
          tar.tagName === 'TEXTAREA' ||
          tar.tagName === 'INPUT' ||
          tar.contentEditable === 'true'
        )
          return
        e.stopPropagation()
        // console.log('keydown', e.code)
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
            e.preventDefault()
            let getNewTime = () =>
              minmax(videoRef.current.currentTime + 5, 0, duration)

            if (isFirstPlay) {
              playerOpause('play').then(() => {
                videoRef.current.currentTime = getNewTime()
              })
            } else {
              videoRef.current.currentTime = getNewTime()
            }
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

      return () => {
        // console.log('vp quit')
        keydownWindow.removeEventListener('keydown', handleKeyDown)
      }
    }, [videoRef.current, duration, isFirstPlay])

    useEffect(() => {
      if (!window.videoPlayers.list.size) window.videoPlayers.focusIndex = index

      let player = {
        pause() {
          let el = player.videoEl()
          if (!el) return
          if (el.classList.contains('can-pause')) el.pause()
        },
        async setCurrentTime(time: number, isPause: boolean) {
          if (isFirstPlay) setIsFirstPlay(false)
          await wait()
          let el = player.videoEl()

          let isInBuffer = checkJumpInBufferArea(el.buffered, time)
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
      console.log('playerOpause', playing, canPause)
      await wait(0)
      if ((playing || type === 'pause') && canPause && type !== 'play') {
        console.log('pause')
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

    let RenderVideoNoti = (
      props: {
        state: boolean
        el: ReactElement
      }[]
    ) => {
      let showIndex = props.findIndex((d) => d.state === true),
        isShow = showIndex !== -1
      return (
        <div
          className="video-noti"
          style={{
            display: isShow ? 'block' : 'none',
          }}
        >
          {isShow && props[showIndex].el}
        </div>
      )
    }

    let RenderActionArea = () => {
      return (
        <div className={cls('actions', isInputMode && 'is-input')}>
          {getIsLive() ? (
            <span className="live-dot"></span>
          ) : (
            <span ref={playBtnEl} className="pp" onClick={() => playerOpause()}>
              {playing ? (
                <Iconfont type="iconicon_player_pause" />
              ) : (
                <Iconfont type="iconicon_player_play" />
              )}
            </span>
          )}

          <span style={{ whiteSpace: 'nowrap' }}>
            {formatTime(currentTime)}
            {!getIsLive() && ` / ${formatTime(duration)} `}
          </span>
          {props.mobxOption?.canSendBarrage && (
            <Iconfont
              type="input"
              onClick={() => {
                setInputMode((v) => {
                  if (!v) {
                    wait().then(() => barrageInputRef.current.focus())
                  }
                  return !v
                })
              }}
              style={{ fontSize: 16, cursor: 'pointer', lineHeight: 0 }}
            />
          )}

          <BarrageInput
            ref={barrageInputRef}
            setActionAreaLock={(v) => {
              setActionAreaLock(v)
              console.log('reset', v)
              if (!v) setVisibleActionAreaInFC(false)
            }}
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
            <VolumeBar setVolume={setVolume} volume={volume} />
          </div>
        </div>
      )
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

    const eventsMap = useMemo(() => {
      let eventsMap: React.DetailedHTMLProps<
        React.VideoHTMLAttributes<HTMLVideoElement>,
        HTMLVideoElement
      > = {}

      let eventBase: EventBase = {
        onLoadedMetadata: (e) => {
          //
        },
        onPause: () => setPlaying(false),
        onPlay: (e) => {
          console.log('onPlay')
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
          console.log('e.target', e)
          setDuration((e.target as HTMLVideoElement).duration)
        },
        onError: (e) => {
          console.error('is paly error', e)
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

      return eventsMap
    }, [videoRef])

    // 挂载事件
    useEffect(() => {
      if (!videoRef.current) return
      const entries = Object.entries(eventsMap)
      console.log('emap', entries, videoRef.current)
      entries.forEach(([key, fn]) => {
        videoRef.current.addEventListener(key, fn)
      })
      return () => {
        entries.forEach(([key, fn]) => {
          videoRef.current.removeEventListener(key, fn)
        })
      }
    }, [videoRef.current, eventsMap])

    // ---video event---

    return (
      <div
        className={cls('video-player', props.className, {
          'action-area-show': isVisibleActionAreaInFC,
          'buffer-test': _env.vpBufferTest,
          'is-firstplay': isFirstPlay,
          'is-live': getIsLive(),
        })}
        tabIndex={-1}
        data-vid={index}
        onFocus={() => setFoucs(true)}
        onBlur={() => setFoucs(false)}
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

          {/* 视频封面 */}
          <div className="video-cover full-view-layer">
            {props.renderCoverChild?.()}
          </div>

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
              ...(props.notifiChild || []),
            ])}
        </div>

        {/* 底部操作栏 */}
        <div
          className="video-action-area"
          onMouseEnter={(e) => handleFullscreenShowActionArea(true)}
          onMouseLeave={handleResetActionAreaShow}
        >
          <div className="mask"></div>
          {RenderActionArea()}
        </div>

        {/* 侧边操作栏 */}
        {props.renderSiderActionArea && (
          <div
            className="side-action-area"
            onMouseEnter={(e) => handleFullscreenShowActionArea(true)}
            onMouseLeave={handleResetActionAreaShow}
          >
            {props.renderSiderActionArea()}
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

export default memo(VideoPlayer)
