import VideoChanger from '@root/core/VideoChanger'
import { useOnce } from '@root/hook'
import { formatTime, formatView } from '@root/utils'
import type { Rec } from '@root/utils/typeUtils'
import classNames from 'classnames'
import { useEffect, useRef, useState, type FC } from 'react'
import type { Props as SideProps, VideoItem } from './index'

const SideVideoListPanel: FC<SideProps> = (props) => {
  const videoChanger = useRef<VideoChanger>(null)
  const [activeMap, setActiveMap] = useState<Rec<number>>({})

  useOnce(() => {
    videoChanger.current = new VideoChanger(props.webProvider)
    props.webProvider.videoChanger = videoChanger.current
  })

  // 更新active数据
  useEffect(() => {
    const activeMap: Rec<number> = {}

    props.videoList.forEach((list, i) => {
      const activeIndex = list.items.findIndex((v) => v.isActive)
      if (activeIndex == -1) return
      activeMap[i] = activeIndex
    })

    console.log('侧边栏传入数据', activeMap, props.videoList)

    setActiveMap(activeMap)
  }, [props.videoList])

  return props.videoList.map((list, vi) => {
    const isCoverTitle = !!list.items?.[0]?.cover
    return (
      <div key={vi}>
        <h3>{list.category}</h3>
        <ul className="select-list">
          {list.items.map((item, ii) => {
            return (
              <li
                key={item.id ?? ii}
                className={classNames(
                  'select',
                  activeMap[vi] == ii && 'active',
                  isCoverTitle && 'cover-title'
                )}
                title={item.title}
                onClick={() => {
                  props.onClick?.(item)
                  if (list.isSpa === false) {
                    videoChanger.current.changeVideo(item.link).then(() => {
                      props.onChange?.(item)
                    })
                  } else {
                    item.linkEl.click()
                    props.onChange?.(item)
                  }
                  setActiveMap((map) => ({ ...map, [vi]: ii }))
                }}
              >
                {isCoverTitle ? <CoverTitleItem {...item} /> : item.title}
              </li>
            )
          })}
        </ul>
      </div>
    )
  })
}

const CoverTitleItem: FC<VideoItem> = (data) => {
  return (
    <>
      <div className="img-container">
        <img src={data.cover} loading="lazy" />
        {data.played && <div className="info">{formatView(+data.played)}</div>}
        {data.duration && (
          <div className="duration">{formatTime(+data.duration)}</div>
        )}
      </div>
      <div className="right">
        <div className="title" title={data.title}>
          {data.title}
        </div>
        <div className="name">{data.user}</div>
      </div>
    </>
  )
}

export default SideVideoListPanel
