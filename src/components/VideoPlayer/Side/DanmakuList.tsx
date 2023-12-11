import SnapLastItemList from '@root/components/SnapLastItemList'
import type { Barrage } from '@root/danmaku'
import vpConfig from '@root/store/vpConfig'
import type WebProvider from '@root/web-provider/webProvider'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import type { FC } from 'react'

type Props = {
  webProvider: WebProvider
}
const SideDanmakuListPanel: FC<Props> = (props) => {
  const barrages = props.webProvider.miniPlayer.danmakuController.barrages
  return (
    <SnapLastItemList>
      {/* 取巧的办法让组件更新 */}
      <div className="hidden">{vpConfig.danmakuLength}</div>

      {barrages.map((danmaku) => {
        return (
          <DanmakuListItem
            danmaku={danmaku}
            key={danmaku.id}
            inactive={!vpConfig.activeDanmakusMap.has(danmaku.id)}
          />
        )
      })}
    </SnapLastItemList>
  )
}

const DanmakuListItem: FC<{ danmaku: Barrage; inactive?: boolean }> = (
  props
) => {
  const { danmaku, inactive } = props
  return (
    <div
      className={classNames(
        'danmaku text-xs',
        inactive && 'inactive opacity-60'
      )}
    >
      <div className="user inline-block mr-1">{danmaku.uname}:</div>
      <div className="text inline" style={{ color: danmaku.color }}>
        {danmaku.text}
      </div>
    </div>
  )
}

export default observer(SideDanmakuListPanel)
