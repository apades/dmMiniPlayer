import { SettingOutlined } from '@ant-design/icons'
import { FC, useMemo, useRef } from 'react'
import Browser from 'webextension-polyfill'
import DraggerContainer from './DraggerContainer'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { useOnce } from '@root/hook'
import { useBrowserLocalStorage } from '@root/utils/storage'
import { FLOAT_BTN_HIDDEN } from '@root/shared/storeKey'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { useMemoizedFn, useSize } from 'ahooks'
import { throttle } from '@root/utils'
import ShadowRootContainer from './ShadowRootContainer'
import { createPortal } from 'react-dom'
import isPluginEnv from '@root/shared/isPluginEnv'
import icon from '../../assets/icon.png'

type Props = {
  container: HTMLElement
  vel: HTMLVideoElement
  fixedPos?: boolean
}
const FloatButton: FC<Props> = (props) => {
  const { container, vel, fixedPos } = props

  const videoIsContainer = vel === container

  useOnce(
    useBrowserLocalStorage(FLOAT_BTN_HIDDEN, (hidden) => {
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

  const containerSize = useSize(container)
  const floatBtnSize = useSize(floatBtn)

  // TODO 判断进入4个角，然后转成初始是以right,top或right,bottom定位的pos
  return createPortal(
    <ShadowRootContainer>
      <DraggerContainer
        bounds={{
          left: 0,
          top: 0,
          right: (containerSize?.width ?? 0) - (floatBtnSize?.width ?? 0) - 10,
          bottom:
            (containerSize?.height ?? 0) - (floatBtnSize?.height ?? 0) - 10,
        }}
        defaultClassName="absolute top-0 left-0 w-full"
        onStart={() => {
          clear()
          isLockRef.current = true
        }}
        onStop={() => {
          isLockRef.current = false
        }}
      >
        <div
          ref={floatBtn}
          className="f-i-center w-fit absolute top-[5px] left-[5px] z-[100] h-[28px] text-[14px] text-white text-center rounded cursor-pointer opacity-100 transition-opacity [&.hidden]:opacity-0 overflow-hidden"
          onMouseEnter={() => {
            console.log('clear')
            clear()
            showFloatBtn()
          }}
        >
          <div
            className="f-center px-2 bg-bg h-full hover:bg-bg-hover transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              const videoEl =
                container instanceof HTMLVideoElement
                  ? container
                  : container.querySelector('video')

              console.log('视频容器', videoEl, '父容器', container)
              const event = new CustomEvent('inject-response', {
                detail: {
                  type: 'start-PIP',
                  data: {
                    videoEl,
                  },
                },
              })
              try {
                top!.document
              } catch (error) {
                console.error(error)
                if (videoEl) {
                  videoEl.requestPictureInPicture()
                }
                throw Error(
                  '该视频可能在非同源的iframe中，目前不支持非同源iframe'
                )
              }
              top?.dispatchEvent(event)
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
            className="f-center px-2 bg-bg h-full hover:bg-bg-hover transition-colors"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
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
      </DraggerContainer>
    </ShadowRootContainer>,
    container
  )
}

export default FloatButton
