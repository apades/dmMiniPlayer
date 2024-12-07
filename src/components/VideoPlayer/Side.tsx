import { SideSwitcher } from '@root/core/SideSwitcher'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { formatTime, formatView, isNumber } from '@root/utils'
import { isElementInViewport } from '@root/utils/dom'
import type { Rec } from '@root/utils/typeUtils'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import { useEffect, useRef, useState, type FC } from 'react'
import scrollIntoView from 'scroll-into-view'

export type VideoItem = {
  /**spa点击切换路由的link元素 */
  linkEl: HTMLElement
  title: string
  link: string
  /**item的容器 */
  el: HTMLElement

  isActive?: boolean
  cover?: string
  played?: number
  user?: string
  duration?: number | string
  id?: string
}
export type VideoList = {
  category: string
  /**
   * @deprecated 暂时不要用iframe打开
   * 默认为true
   *  */
  isSpa?: boolean
  items: VideoItem[]
}
export type Props = {
  // videoList: VideoList[]
  // webProvider: WebProvider
  sideSwitcher: SideSwitcher
  onClick?: (videoItem: VideoItem) => void
  onChange?: (videoItem: VideoItem) => void
}

const VideoPlayerSide: FC<Props> = (props) => {
  // const videoChanger = useRef(new VideoChanger(props.webProvider))
  const [activeMap, setActiveMap] = useState<Rec<number>>({})
  const [activeEl, setActiveEl] = useState<HTMLLIElement>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActiveElInitd, setActiveElInitd] = useState(false)

  // 更新active数据
  useEffect(() => {
    const activeMap: Rec<number> = {}

    props.sideSwitcher.videoList.forEach((list, i) => {
      const activeIndex = list.items.findIndex((v) => v.isActive)
      if (activeIndex == -1) return
      activeMap[i] = activeIndex
    })

    // console.log('侧边栏传入数据', activeMap, props.sideSwitcher.videoList)

    setActiveMap(activeMap)
  }, [props.sideSwitcher.videoList])

  useTargetEventListener(
    'mouseenter',
    () => {
      if (isActiveElInitd) return
      setActiveElInitd(true)
      if (!activeEl) return
      containerRef.current?.scrollTo({
        top: activeEl.offsetTop - 40,
        behavior: 'smooth',
      })
    },
    containerRef.current
  )

  useEffect(() => {
    if (!activeEl) return
    if (!isActiveElInitd) return
    containerRef.current?.scrollTo({
      top: activeEl.offsetTop - 40,
      behavior: 'smooth',
    })
  }, [activeEl])

  return (
    <div className="side-outer-container h-full">
      <div
        className="side-inner-container w-[var(--side-width)] h-full ml-auto p-[8px] overflow-auto text-white text-sm bg-[#0007] bor-l-[#fff7] custom-scrollbar flex-col gap-[8px]"
        ref={containerRef}
      >
        {props.sideSwitcher.videoList.map((list, vi) => {
          if (!list.items?.length) return null
          return (
            <div key={vi}>
              <h3 className="text-sm mb-1">{list.category}</h3>
              <ul className="select-list flex flex-col gap-1 m-0 pl-0 list-none">
                {list.items.map((item, ii) => {
                  const isCoverItem = !!item.cover
                  return (
                    <li
                      key={item.id ?? ii}
                      className={classNames(
                        'px-[8px] py-[2px] overflow-hidden whitespace-nowrap overflow-ellipsis bor-[#fff7] rounded-[2px] cursor-pointer',
                        activeMap[vi] == ii && 'active bg-[#80bfff]',
                        isCoverItem && 'cover-title f-i-center gap-1'
                      )}
                      title={item.title}
                      ref={(el) => {
                        if (!el) return
                        if (activeMap[vi] == ii) setActiveEl(el)
                      }}
                      onClick={() => {
                        props.onClick?.(item)
                        if (list.isSpa === false) {
                          // videoChanger.current
                          //   .changeVideo(item.link)
                          //   .then(() => {
                          //     props.onChange?.(item)
                          //   })
                        } else {
                          item.linkEl.click()
                          props.onChange?.(item)
                        }
                        setActiveMap((map) => ({ ...map, [vi]: ii }))
                      }}
                    >
                      {isCoverItem ? <CoverTitleItem {...item} /> : item.title}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CoverTitleItem: FC<VideoItem> = (data) => {
  const infoSharedClass = `absolute px-[2px] py-[1px] bg-[#0005] rounded-[4px]`
  return (
    <>
      <div className="img-container wh-[99px,66px] relative text-xs">
        <img
          className="wh-[100%] object-contain"
          src={data.cover}
          loading="lazy"
        />
        {data.played && (
          <div className={classNames('info bottom-1 left-1', infoSharedClass)}>
            {formatView(+data.played)}
          </div>
        )}
        {data.duration && (
          <div
            className={classNames('duration right-1 bottom-1', infoSharedClass)}
          >
            {isNumber(data.duration)
              ? formatTime(+data.duration)
              : data.duration}
          </div>
        )}
      </div>
      <div className="right flex-1 overflow-hidden">
        <div className="title line-clamp-2 mb-1 text-wrap" title={data.title}>
          {data.title}
        </div>
        <div className="name line-clamp-1 text-[#fffc] text-xs">
          {data.user}
        </div>
      </div>
    </>
  )
}

export default observer(VideoPlayerSide)
