import VideoChanger from '@root/core/VideoChanger'
import { useOnce } from '@root/hook'
import { formatTime, formatView } from '@root/utils'
import type { Rec } from '@root/utils/typeUtils'
import type WebProvider from '@root/web-provider/webProvider'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import { useEffect, useRef, useState, type FC } from 'react'
import { LockFilled, UnlockFilled } from '@ant-design/icons'
import configStore from '@root/store/config'
import { runInAction } from 'mobx'
import SideVideoListPanel from './VideoList'
import vpConfig from '@root/store/vpConfig'
import SideDanmakuListPanel from './DanmakuList'

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
  duration?: number
  id?: string
}
export type VideoList = {
  category: string
  /**默认为true */
  isSpa?: boolean
  items: VideoItem[]
}
export type Props = {
  videoList?: VideoList[]
  webProvider: WebProvider
  onClick?: (videoItem: VideoItem) => void
  onChange?: (videoItem: VideoItem) => void
}

const VIDEO_LIST = 'video-list',
  DANMAKU_LIST = 'danmaku-list'
const VideoPlayerSide: FC<Props> = (props) => {
  const hasVideoList = !!props.videoList,
    hasDanmakuList = vpConfig.canShowDanmakus

  console.log('hasVideoList', hasVideoList)

  const [tab, setTab] = useState(DANMAKU_LIST)

  useEffect(() => {
    if (!hasVideoList) setTab(DANMAKU_LIST)
  }, [hasDanmakuList])

  return (
    <div className="side-outer-container">
      <div className="side-inner-container">
        <div className="action-panel">
          <div style={{ flex: 1 }}></div>
          {hasVideoList && (
            <div
              className="btn"
              onClick={() => {
                setTab(VIDEO_LIST)
              }}
            >
              video
            </div>
          )}
          {hasDanmakuList && (
            <div
              className="btn"
              onClick={() => {
                setTab(DANMAKU_LIST)
              }}
            >
              danmaku
            </div>
          )}

          <div
            className="btn"
            onClick={() => {
              runInAction(() => {
                configStore.sideLock = !configStore.sideLock
              })
            }}
          >
            {configStore.sideLock ? <LockFilled /> : <UnlockFilled />}
          </div>
        </div>
        {hasVideoList && (
          <div
            className={classNames(tab != VIDEO_LIST && 'hidden', 'main-panel')}
          >
            <SideVideoListPanel {...props} />
          </div>
        )}
        {hasDanmakuList && (
          <div
            className={classNames(
              tab != DANMAKU_LIST && 'hidden',
              'main-panel'
            )}
          >
            <SideDanmakuListPanel webProvider={props.webProvider} />
          </div>
        )}
      </div>
    </div>
  )
}

export default observer(VideoPlayerSide)
