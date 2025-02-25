import { SettingOutlined } from '@ant-design/icons'
import { useOnce } from '@root/hook'
import useAutoPIPHandler from '@root/hook/useAutoPIPHandler'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { VIDEO_ID_ATTR } from '@root/shared/config'
import env from '@root/shared/env'
import isPluginEnv from '@root/shared/isPluginEnv'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { FLOAT_BTN_HIDDEN, LATEST_SAVE_VERSION } from '@root/shared/storeKey'
import configStore from '@root/store/config'
import { FloatButtonPos } from '@root/store/config/floatButton'
import playerConfig from '@root/store/playerConfig'
import { DocPIPRenderType } from '@root/types/config'
import { throttle, tryCatch, uuid } from '@root/utils'
import { getIsZh, t } from '@root/utils/i18n'
import { postStartPIPDataMsg } from '@root/utils/pip'
import {
  setBrowserLocalStorage,
  useBrowserLocalStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import { sendMediaStreamInSender } from '@root/utils/webRTC'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'
import getWebProvider from '@root/web-provider/getWebProvider'
import { useMemoizedFn, useSize, useUnmount } from 'ahooks'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import { FC, SVGProps, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'
import icon from '../../assets/icon.png'
import AppRoot from './AppRoot'

type Props = {
  container: HTMLElement
  vel: HTMLVideoElement
  fixedPos?: boolean
  initPos: { x: number; y: number }
}

const FloatButton: FC<Props> = (props) => {
  const { container, vel, fixedPos } = props

  const videoRef = useRef<HTMLVideoElement>()
  const [changeLog] = useState(() => {
    const log = getIsZh() ? env.upgrade_zh : env.upgrade_en
    return log || t('floatButton.smallUpdate')
  })
  const [savedVer, setSavedVer] = useState('')

  useOnce(() =>
    useBrowserSyncStorage(FLOAT_BTN_HIDDEN, (hidden) => {
      if (!floatBtn.current) return
      floatBtn.current.style.visibility = !hidden ? 'visible' : 'hidden'
    }),
  )

  const [isUpgradeShow, setUpgradeShow] = useState(false)

  useOnce(() =>
    useBrowserLocalStorage(LATEST_SAVE_VERSION, (ver) => {
      setUpgradeShow(ver !== env.version)
      if (ver) setSavedVer(ver)
    }),
  )

  const [id] = useState(() => uuid())

  useOnce(() => {
    vel.setAttribute(VIDEO_ID_ATTR, id)

    return () => {
      vel.removeAttribute(VIDEO_ID_ATTR)
    }
  })

  useAutoPIPHandler(vel)

  // fixed会受到 transform、perspective、filter 或 backdrop-filter 影响上下文
  // @see https://developer.mozilla.org/zh-CN/docs/Web/CSS/position#fixed
  const setFixedPosIn = useMemoizedFn(() => {
    if (!floatBtn.current) return
    const { left, top } = vel.getBoundingClientRect()
    ;(floatBtn.current as any).style = `left:${
      left + configStore.floatButtonX
    }px !important;top:${
      top + configStore.floatButtonY
    }px !important;position:fixed !important;`
  })

  const floatBtn = useRef<HTMLDivElement>(null)
  const isLockRef = useRef(false)
  const isHoverLockRef = useRef(false)
  const hiddenFloatBtn = useMemoizedFn(() => {
    if (isLockRef.current) return
    if (isHoverLockRef.current) return
    floatBtn.current?.classList.add('hidden-btn')
  })
  const showFloatBtn = useMemoizedFn(() => {
    floatBtn.current?.classList.remove('hidden-btn')
  })
  const { clear, run } = useDebounceTimeoutCallback(hiddenFloatBtn, 2000)
  const startShowFloatBtn = useMemoizedFn(() => {
    run(showFloatBtn)
  })
  const setFixedPosInMove = useMemoizedFn(throttle(setFixedPosIn, 500))

  const mouseTarget = fixedPos ? vel : container
  useOnce(() => {
    if (fixedPos) {
      setFixedPosIn()
    }
  })
  useTargetEventListener(
    'mousemove',
    () => {
      if (fixedPos) {
        setFixedPosInMove()
      }
      startShowFloatBtn()
    },
    mouseTarget,
  )
  useTargetEventListener(
    'mouseleave',
    () => {
      clear()
      hiddenFloatBtn()
    },
    mouseTarget,
  )

  // webRTC unmount
  const webRTCUnmountRef = useRef(() => {})
  useUnmount(webRTCUnmountRef.current)

  const handleStartPIP = useMemoizedFn(async () => {
    const videoEl =
      container instanceof HTMLVideoElement
        ? container
        : container.querySelector('video')

    console.log('视频容器', videoEl, '父容器', container)
    if (!videoEl) return
    videoRef.current = videoEl

    // 检测可否访问top
    const [cannotAccessTop] = tryCatch(() => top!.document)
    if (cannotAccessTop) {
      const type = configStore.notSameOriginIframeCaptureModePriority
      console.log(`🟡 非同源iframe，将启用其他模式 ${type}`)

      // 走非同源iframe捕获模式
      const [isErrorInOtherMode] = await tryCatch(async () => {
        switch (type) {
          case DocPIPRenderType.capture_captureStreamWithWebRTC:
            const stream = videoEl.captureStream()
            const { unMount } = sendMediaStreamInSender({ stream })

            const handleUnmount = () => {
              unMount()
              unListen()
            }
            const unListen = onPostMessage(
              PostMessageEvent.webRTC_close,
              handleUnmount,
            )
            webRTCUnmountRef.current = handleUnmount
            break
        }

        await postStartPIPDataMsg(type, videoEl)
      })

      if (isErrorInOtherMode) {
        console.error(
          '🔴 其他模式也不可用，启动保底的旧画中画',
          isErrorInOtherMode,
        )
        videoEl.requestPictureInPicture()
        throw Error('该视频可能在非同源的iframe中，目前不支持非同源iframe')
      }

      return true
    }

    // 检测该video是不是在同源的iframe里
    const isInIframeVideo = videoEl.ownerDocument !== top?.document
    // blob:开头的视频不能用replaceVideoEl模式
    const isBlobSrc = videoEl.src.startsWith('blob:')
    if (isInIframeVideo && isBlobSrc) {
      const type = configStore.sameOriginIframeCaptureModePriority
      console.log(`🟡 同源iframe，将启用其他模式 ${type}`)
      postStartPIPDataMsg(type, videoEl)
      return true
    }

    // 如果都没用上面的模式，则走默认的设置的优先模式
    postStartPIPDataMsg(configStore.docPIP_renderType, videoEl)
    return true
  })

  const handleOpenSetting = useMemoizedFn(() => {
    postMessageToTop(PostMessageEvent.openSettingPanel)
  })

  // 处理top发来的更新video状态的消息
  useOnce(() =>
    onPostMessage(PostMessageEvent.updateVideoState, (data) => {
      if (data.id !== id || !videoRef.current) return
      const video = videoRef.current
      if (data.isPause) {
        video.pause()
      }
      if (data.isPlay) {
        video.play()
      }
      if (data.currentTime !== undefined) {
        video.currentTime = data.currentTime
      }
    }),
  )
  // 处理top发来的请求PIP
  useOnce(() =>
    onPostMessage(PostMessageEvent.requestVideoPIP, (data) => {
      if (data.id !== id) return
      handleStartPIP()
    }),
  )

  const containerSize = useSize(container)
  const floatBtnSize = useSize(floatBtn)

  const posStyle = useMemo(() => {
    switch (configStore.floatButtonPos) {
      case FloatButtonPos.leftBottom:
        return {
          left: +configStore.floatButtonX,
          bottom: +configStore.floatButtonY,
        }
      case FloatButtonPos.rightBottom:
        return {
          right: +configStore.floatButtonX,
          bottom: +configStore.floatButtonY,
        }
      case FloatButtonPos.leftTop:
        return {
          left: +configStore.floatButtonX,
          top: +configStore.floatButtonY,
        }
      case FloatButtonPos.rightTop:
        return {
          right: +configStore.floatButtonX,
          top: +configStore.floatButtonY,
        }
    }
  }, [
    configStore.floatButtonPos,
    configStore.floatButtonX,
    configStore.floatButtonY,
  ])

  return (
    <>
      {/* 拖动测试的4个角 */}
      {/* TODO 懒得弄这么精细了 */}
      {configStore.dragArea_show &&
        createPortal(
          <div>
            {[
              ['left', 'top'],
              ['left', 'bottom'],
              ['right', 'top'],
              ['right', 'bottom'],
            ].map(([x, y], i) => {
              return (
                <div
                  key={i}
                  style={{
                    width:
                      ((containerSize?.width ?? 0) *
                        configStore.dragArea_cornerPercentW) /
                      100,
                    height:
                      ((containerSize?.height ?? 0) *
                        configStore.dragArea_cornerPercentH) /
                      100,
                    [x]: 0,
                    [y]: 0,
                    // 下面就不用tailwind了，注入到网页里怕出问题
                    position: 'absolute',
                    backgroundColor: '#0669ff',
                    opacity: 0.5,
                    border: '1px #fff',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                ></div>
              )
            })}
          </div>,
          container,
        )}

      {createPortal(
        <AppRoot isShadowRoot>
          {/* TODO 拖拽功能在小网站还可以用，但是油管、bilibili这些复杂网站会出问题 */}
          {/* <DraggerContainer
            bounds={{
              left: 0,
              top: 0,
              right:
                (containerSize?.width ?? 0) - (floatBtnSize?.width ?? 0) - 10,
              bottom:
                (containerSize?.height ?? 0) - (floatBtnSize?.height ?? 0) - 10,
            }}
            onStart={() => {
              clear()
              isLockRef.current = true
            }}
            onStop={(e, data) => {
              isLockRef.current = false
              setBrowserSyncStorage(DRAG_POS, {
                x: data.x,
                y: data.y,
                xType: 'left',
                yType: 'top',
              })
            }}
            clickSensitive={2}
            initPosition={{
              x: props.initPos.x,
              y: props.initPos.y,
            }}
          > */}
          <div
            ref={floatBtn}
            className={classNames(
              'group z-[100] text-[14px] text-white text-center cursor-pointer opacity-100 transition-opacity [&.hidden-btn]:opacity-0 hidden-btn',
            )}
            style={{ ...posStyle, position: 'absolute' }}
            onMouseEnter={() => {
              isHoverLockRef.current = true
              clear()
              showFloatBtn()
            }}
            onMouseLeave={() => {
              isHoverLockRef.current = false
            }}
          >
            <div className="f-i-center w-fit overflow-hidden rounded h-[28px]">
              <div
                className="f-center wh-[32px,28px] bg-bg hover:bg-bg-hover transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartPIP()
                }}
              >
                <img
                  className="wh-[16px]"
                  width={16}
                  height={16}
                  src={
                    isPluginEnv
                      ? `${Browser.runtime.getURL('/assets/icon.png')}`
                      : icon
                  }
                />
              </div>
              {configStore.showReplacerBtn && (
                <div
                  className="f-center wh-[32px,28px] bg-bg hover:bg-bg-hover transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const videoEl =
                      container instanceof HTMLVideoElement
                        ? container
                        : container.querySelector('video')

                    if (!videoEl) return
                    videoRef.current = videoEl
                    playerConfig.forceDocPIPRenderType =
                      DocPIPRenderType.replaceWebVideoDom
                    const provider = getWebProvider()
                    window.provider = provider
                    provider.openPlayer({ videoEl })
                  }}
                >
                  <ReplaceIcon className="w-[16px]" />
                </div>
              )}
              <div
                className="f-center wh-[32px,28px] bg-bg hover:bg-bg-hover transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  isLockRef.current = true
                  clear()
                  showFloatBtn()
                  setTimeout(() => {
                    isLockRef.current = false
                  }, 500)

                  handleOpenSetting()
                }}
              >
                <SettingOutlined />
              </div>
            </div>

            {isUpgradeShow && (
              <>
                <div className="absolute top-[-2px] right-[-2px] rounded-full wh-[8px] bg-red-500"></div>
                <div
                  className={classNames(
                    'absolute max-w-[200px] w-max bg-bg overflow-hidden max-h-0 transition-all group-hover:max-h-[300px] text-[12px] rounded',
                    {
                      'left-[var(--x)] top-[var(--y)]':
                        configStore.floatButtonPos === FloatButtonPos.leftTop,
                      'left-[var(--x)] bottom-[var(--y)]':
                        configStore.floatButtonPos ===
                        FloatButtonPos.leftBottom,
                      'right-[var(--x)] top-[var(--y)]':
                        configStore.floatButtonPos === FloatButtonPos.rightTop,
                      'right-[var(--x)] bottom-[var(--y)]':
                        configStore.floatButtonPos ===
                        FloatButtonPos.rightBottom,
                    },
                  )}
                  style={{
                    '--y': 'calc(100% + 4px)',
                    '--x': '0',
                  }}
                >
                  <div className="p-1 text-left whitespace-pre-wrap">
                    <p className="f-i-center mb-1">
                      NEW: {savedVer || ''} -&gt; {env.version}{' '}
                      <a
                        href={
                          'https://github.com/apades/dmMiniPlayer/blob/main/docs/changeLog' +
                          `${getIsZh() ? '-zh' : ''}` +
                          `.md#v${env.version.replaceAll('.', '')}`
                        }
                        target="_blank"
                        className="ml-auto text-blue-500"
                      >
                        More
                      </a>
                    </p>
                    {changeLog}
                    <div className="f-i-center">
                      <div
                        className="ml-auto cursor-pointer bg-bg-hover px-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setBrowserLocalStorage(
                            LATEST_SAVE_VERSION,
                            env.version,
                          )
                          setUpgradeShow(false)
                          isHoverLockRef.current = false
                        }}
                      >
                        OK
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* </DraggerContainer> */}
        </AppRoot>,
        container,
      )}
    </>
  )
}

const ReplaceIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M0 3.2c0-1.12 0-1.68.218-2.11C.41.714.716.408 1.092.216c.428-.218.988-.218 2.11-.218h.6c1.12 0 1.68 0 2.11.218c.376.192.682.498.874.874c.218.428.218.988.218 2.11v.6c0 1.12 0 1.68-.218 2.11a2 2 0 0 1-.874.874c-.428.218-.988.218-2.11.218h-.6c-1.12 0-1.68 0-2.11-.218a2 2 0 0 1-.874-.874C0 5.482 0 4.922 0 3.8zM3.2 1h.6c.577 0 .949 0 1.23.024c.272.022.372.06.422.085c.188.096.341.249.437.437c.025.05.063.15.085.422c.023.283.024.656.024 1.23v.6c0 .577 0 .949-.024 1.23c-.022.272-.06.372-.085.422a1 1 0 0 1-.437.437c-.05.025-.15.063-.422.085c-.283.023-.656.024-1.23.024h-.6c-.577 0-.949 0-1.23-.024c-.272-.022-.372-.06-.422-.085a1 1 0 0 1-.437-.437c-.025-.05-.063-.15-.085-.422a17 17 0 0 1-.024-1.23v-.6c0-.577 0-.949.024-1.23c.022-.272.06-.372.085-.422c.096-.188.249-.341.437-.437c.05-.025.15-.063.422-.085C2.253 1 2.626 1 3.2 1M9 12.2c0-1.12 0-1.68.218-2.11c.192-.376.498-.682.874-.874c.428-.218.988-.218 2.11-.218h.6c1.12 0 1.68 0 2.11.218c.376.192.682.498.874.874c.218.428.218.988.218 2.11v.6c0 1.12 0 1.68-.218 2.11a2 2 0 0 1-.874.874c-.428.218-.988.218-2.11.218h-.6c-1.12 0-1.68 0-2.11-.218a2 2 0 0 1-.874-.874C9 14.482 9 13.922 9 12.8zm3.8-2.2c.577 0 .949 0 1.23.024c.272.022.372.06.422.085c.188.096.341.249.437.437c.025.05.063.15.085.422c.023.283.024.656.024 1.23v.6c0 .577 0 .949-.024 1.23c-.022.272-.06.372-.085.422a1 1 0 0 1-.437.437c-.05.025-.15.063-.422.085c-.283.023-.656.024-1.23.024h-.6c-.577 0-.949 0-1.23-.024c-.272-.022-.372-.06-.422-.085a1 1 0 0 1-.437-.437c-.025-.05-.063-.15-.085-.422a17 17 0 0 1-.024-1.23v-.6c0-.577 0-.949.024-1.23c.022-.272.06-.372.085-.422c.096-.188.249-.341.437-.437c.05-.025.15-.063.422-.085c.283-.023.656-.024 1.23-.024z"
      clipRule="evenodd"
    />
    <path
      fill="currentColor"
      d="M8 2.5a.5.5 0 0 1 .5-.5h2A2.5 2.5 0 0 1 13 4.5v1.79l1.15-1.15a.5.5 0 0 1 .707.707l-2 2a.5.5 0 0 1-.707 0l-2-2a.5.5 0 0 1 .707-.707l1.15 1.15V4.5a1.5 1.5 0 0 0-1.5-1.5h-2a.5.5 0 0 1-.5-.5zM3.31 8.04a.5.5 0 0 1 .188-.038h.006a.5.5 0 0 1 .351.146l2 2a.5.5 0 0 1-.707.707l-1.15-1.15v1.79a1.5 1.5 0 0 0 1.5 1.5h2a.5.5 0 0 1 0 1h-2a2.5 2.5 0 0 1-2.5-2.5v-1.79l-1.15 1.15a.5.5 0 0 1-.707-.707l2-2a.5.5 0 0 1 .162-.109z"
    />
  </svg>
)

export default observer(FloatButton)
