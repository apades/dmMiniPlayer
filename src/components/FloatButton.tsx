import { SettingOutlined } from '@ant-design/icons'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import isPluginEnv from '@root/shared/isPluginEnv'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { FLOAT_BTN_HIDDEN } from '@root/shared/storeKey'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { FloatButtonPos } from '@root/store/config/floatButton'
import { dq, throttle, uuid } from '@root/utils'
import { useBrowserSyncStorage } from '@root/utils/storage'
import { useMemoizedFn, useSize } from 'ahooks'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import { FC, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'
import icon from '../../assets/icon.png'
import ShadowRootContainer from './ShadowRootContainer'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'

type Props = {
  container: HTMLElement
  vel: HTMLVideoElement
  fixedPos?: boolean
  initPos: { x: number; y: number }
}

const FloatButton: FC<Props> = (props) => {
  const { container, vel, fixedPos } = props

  const videoIsContainer = vel === container

  useOnce(
    useBrowserSyncStorage(FLOAT_BTN_HIDDEN, (hidden) => {
      if (!floatBtn.current) return
      floatBtn.current.style.visibility = !hidden ? 'visible' : 'hidden'
    })
  )

  const [id, setId] = useState(() => uuid())

  useOnce(() => {
    vel.setAttribute('data-dm-vid', id)

    return () => {
      vel.removeAttribute('data-dm-vid')
    }
  })

  // fixed会受到 transform、perspective、filter 或 backdrop-filter 影响上下文
  // @see https://developer.mozilla.org/zh-CN/docs/Web/CSS/position#fixed
  const setFixedPosIn = useMemoizedFn(() => {
    const { left, top } = container.getBoundingClientRect()
    ;(floatBtn as any).style = `left:${left + 5}px !important;top:${
      top + 5
    }px !important;position:fixed !important;`
  })

  const floatBtn = useRef<HTMLDivElement>(null)
  const isLockRef = useRef(false)
  const hiddenFloatBtn = useMemoizedFn(() => {
    if (isLockRef.current) return
    floatBtn.current?.classList.add('hidden')
  })
  const showFloatBtn = useMemoizedFn(() => {
    floatBtn.current?.classList.remove('hidden')
  })
  const { clear, run } = useDebounceTimeoutCallback(hiddenFloatBtn, 2000)
  const startShowFloatBtn = useMemoizedFn(() => {
    run(showFloatBtn)
  })
  const setFixedPosInMove = useMemoizedFn(throttle(setFixedPosIn, 1000))

  useOnce(() => {
    if (fixedPos) {
      if (!videoIsContainer) {
        container.style.position = 'relative'
      } else {
        setFixedPosIn()
      }
    }
  })
  useTargetEventListener(
    'mousemove',
    () => {
      if (fixedPos && videoIsContainer) {
        setFixedPosInMove()
      }
      startShowFloatBtn()
    },
    container
  )
  useTargetEventListener(
    'mouseleave',
    () => {
      clear()
      hiddenFloatBtn()
    },
    container
  )

  const handleStartPIP = useMemoizedFn(() => {
    const videoEl =
      container instanceof HTMLVideoElement
        ? container
        : container.querySelector('video')

    console.log('视频容器', videoEl, '父容器', container)
    if (!videoEl) return
    const postCaptureModeDataMsg = async () => {
      console.log('id', id)
      const rect = videoEl.getBoundingClientRect()
      postMessageToTop(PostMessageEvent.startPIPCaptureDisplayMedia, {
        cropTarget: await window.CropTarget.fromElement(videoEl),
        duration: videoEl.duration,
        currentTime: videoEl.currentTime,
        isPause: videoEl.paused,
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
        vw: videoEl.videoWidth,
        vh: videoEl.videoHeight,
        id,
      })
      window.__controllingVideoEl = videoEl
    }
    try {
      top!.document
    } catch (error) {
      console.error('非同源iframe，采用其他方式')
      try {
        postCaptureModeDataMsg()
        return true
      } catch (error) {
        console.error('CropTarget.fromElement没法用', error)
        videoEl.requestPictureInPicture()
        throw Error('该视频可能在非同源的iframe中，目前不支持非同源iframe')
      }
    }

    switch (configStore.docPIP_renderType) {
      case DocPIPRenderType.capture_displayMedia:
      case DocPIPRenderType.capture_tabCapture:
        postCaptureModeDataMsg()
        break
      default: {
        postMessageToTop(PostMessageEvent.startPIPFromButtonClick, {
          id,
        })
      }
    }
    return true
  })

  const handleOpenSetting = useMemoizedFn(() => {
    postMessageToTop(PostMessageEvent.openSettingPanel)
  })

  // 处理top发来的更新video状态的消息
  useOnce(
    onPostMessage(PostMessageEvent.updateVideoState, (data) => {
      if (data.id !== id) return
      if (data.isPause) {
        window.__controllingVideoEl.pause()
      }
      if (data.isPlay) {
        window.__controllingVideoEl.play()
      }
      if (data.currentTime !== undefined) {
        window.__controllingVideoEl.currentTime = data.currentTime
      }
    })
  )
  // 处理top发来的请求PIP
  useOnce(
    onPostMessage(PostMessageEvent.requestVideoPIP, (data) => {
      if (data.id !== id) return
      handleStartPIP()
    })
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
          container
        )}

      {createPortal(
        <ShadowRootContainer>
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
              'f-i-center w-fit absolute z-[100] h-[28px] text-[14px] text-white text-center rounded cursor-pointer opacity-100 transition-opacity [&.hidden]:opacity-0 overflow-hidden'
            )}
            onMouseEnter={() => {
              clear()
              showFloatBtn()
            }}
            style={posStyle}
          >
            <div
              className="f-center wh-[32px,28px] bg-bg hover:bg-bg-hover transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleStartPIP()
              }}
              onMouseEnter={() => {
                clear()
              }}
            >
              <img
                className="wh-[16px]"
                src={
                  isPluginEnv
                    ? `${Browser.runtime.getURL('/assets/icon.png')}`
                    : icon
                }
              />
            </div>
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
          {/* </DraggerContainer> */}
        </ShadowRootContainer>,
        container
      )}
    </>
  )
}

export default observer(FloatButton)
