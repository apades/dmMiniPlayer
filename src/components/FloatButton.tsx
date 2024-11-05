import { SettingOutlined } from '@ant-design/icons'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import isPluginEnv from '@root/shared/isPluginEnv'
import { DRAG_POS, FLOAT_BTN_HIDDEN } from '@root/shared/storeKey'
import configStore from '@root/store/config'
import { throttle } from '@root/utils'
import {
  setBrowserSyncStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import { useMemoizedFn, useSize } from 'ahooks'
import { observer } from 'mobx-react'
import { FC, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'
import icon from '../../assets/icon.png'
import DraggerContainer from './DraggerContainer'
import ShadowRootContainer from './ShadowRootContainer'
import classNames from 'classnames'
import { FloatButtonPos } from '@root/store/config/floatButton'

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

  useTargetEventListener(
    'message',
    (e) => {
      const data = e.data
      console.log('iframe message', e.data)
      if (data?.from !== 'dmMiniPlayer-main') return
      switch (data?.type) {
        case 'update-video-state': {
          if (data.data.isPause) {
            window.__controllingVideoEl.pause()
          }
          if (data.data.isPlay) {
            window.__controllingVideoEl.play()
          }
          if (data.data.currentTime !== undefined) {
            window.__controllingVideoEl.currentTime = data.data.currentTime
          }
          break
        }
      }
    },
    window
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
              onClick={async (e) => {
                e.stopPropagation()
                const videoEl =
                  container instanceof HTMLVideoElement
                    ? container
                    : container.querySelector('video')

                console.log('视频容器', videoEl, '父容器', container)
                if (!videoEl) return
                try {
                  top!.document
                } catch (error) {
                  console.error('非同源iframe，采用其他方式', error)
                  try {
                    top?.postMessage(
                      {
                        from: 'dmMiniPlayer',
                        type: 'start-PIP-capture-displayMedia',
                        data: {
                          cropTarget: await window.CropTarget.fromElement(
                            videoEl
                          ),
                          duration: videoEl.duration,
                          currentTime: videoEl.currentTime,
                          isPause: videoEl.paused,
                        },
                      },
                      '*'
                    )
                    window.__controllingVideoEl = videoEl
                  } catch (error) {
                    console.error('CropTarget.fromElement没法用', error)
                    videoEl.requestPictureInPicture()
                    throw Error(
                      '该视频可能在非同源的iframe中，目前不支持非同源iframe'
                    )
                  }
                }
                top?.dispatchEvent(
                  new CustomEvent('inject-response', {
                    detail: {
                      type: 'start-PIP',
                      data: {
                        videoEl,
                      },
                    },
                  })
                )
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

                try {
                  top!.document
                } catch (error) {
                  console.error(error)
                  throw Error(
                    '该视频可能在非同源的iframe中，目前不支持非同源iframe'
                  )
                }
                top?.openSettingPanel()
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
