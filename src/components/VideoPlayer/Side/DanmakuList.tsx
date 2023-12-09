import type { Barrage } from '@root/danmaku'
import vpConfig from '@root/store/vpConfig'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import type { FC } from 'react'

const SideDanmakuListPanel: FC = (props) => {
  return (
    <div>
      {vpConfig.inactiveDanmakus.map((danmaku, i) => {
        return <DanmakuListItem danmaku={danmaku} inactive key={danmaku.id} />
      })}
      {vpConfig.activeDanmakus.map((danmaku, i) => {
        return <DanmakuListItem danmaku={danmaku} key={danmaku.id} />
      })}
    </div>
  )
}

const DanmakuListItem: FC<{ danmaku: Barrage; inactive?: boolean }> = (
  props
) => {
  const { danmaku, inactive } = props
  return (
    <div className={classNames('danmaku', inactive && 'inactive')}>
      <div className="user">{danmaku.uname}:</div>
      <div className="text" style={{ color: danmaku.color }}>
        {danmaku.text}
      </div>
    </div>
  )
}

export default observer(SideDanmakuListPanel)
