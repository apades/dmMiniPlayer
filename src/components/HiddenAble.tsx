import { FC, PropsWithChildren, useContext } from 'react'
import Trigger from '@rc-component/trigger'
import vpContext from './VideoPlayerV2/context'

type Props = {} & PropsWithChildren
const HiddenAble: FC<Props> = (props) => {
  const { videoPlayerRef } = useContext(vpContext)
  return (
    <Trigger
      popupPlacement="topRight"
      action={['contextMenu']}
      popupAlign={{
        overflow: {
          adjustX: 1,
          adjustY: 1,
        },
      }}
      popupClassName="point-popup"
      builtinPlacements={{
        topRight: {
          points: ['tr', 'tr'],
        },
      }}
      popup={
        <div style={{ padding: 20, background: 'rgba(0, 255, 0, 0.3)' }}>
          This is popup
        </div>
      }
      alignPoint
      getPopupContainer={(ref) =>
        videoPlayerRef.current || ref?.parentElement || ref
      }
    >
      <div>{props.children}</div>
    </Trigger>
  )
}

export default HiddenAble
