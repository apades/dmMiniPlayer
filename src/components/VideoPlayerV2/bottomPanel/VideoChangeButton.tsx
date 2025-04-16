import { observer } from 'mobx-react'
import { FC, useContext, useMemo } from 'react'
import { StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons'
import { VideoList } from '@root/components/VideoPlayer/Side'
import { useOnce } from '@root/hook'
import { PlayerEvent } from '@root/core/event'
import { useMemoizedFn } from 'ahooks'
import toast from 'react-hot-toast'
import vpContext from '../context'
import ActionButton from './ActionButton'

type Props = {
  mainList: VideoList
  index: number
}
export const ChangePreVideoButton: FC = observer((props) => {
  const { sideSwitcher } = useContext(vpContext)

  if (!sideSwitcher?.videoList.length) return
  const mainList = sideSwitcher.videoList.find((v) => v.mainList)
  if (!mainList) return

  const index = mainList.items.findIndex((v) => v.isActive)
  if (index === -1 || index === 0) return

  return <Pre index={index} mainList={mainList} />
})

const Pre: FC<Props> = (props) => {
  const { index, mainList } = props
  const { eventBus } = useContext(vpContext)

  useOnce(() => eventBus.on2(PlayerEvent.command_preVideo, handleClick))

  const handleClick = useMemoizedFn(() => {
    const item = mainList.items[index - 1]
    item.linkEl.click()
    toast(item.title)
  })

  return (
    <ActionButton onClick={handleClick}>
      <StepBackwardOutlined />
    </ActionButton>
  )
}

export const ChangeNextVideoButton: FC = observer((props) => {
  const { sideSwitcher } = useContext(vpContext)

  if (!sideSwitcher?.videoList.length) return
  const mainList = sideSwitcher.videoList.find((v) => v.mainList)
  if (!mainList) return

  const index = mainList.items.findIndex((v) => v.isActive)
  if (index === -1 || index === mainList.items.length - 1) return
  return <Next index={index} mainList={mainList} />
})

const Next: FC<Props> = (props) => {
  const { index, mainList } = props
  const { eventBus } = useContext(vpContext)

  useOnce(() => eventBus.on2(PlayerEvent.command_nextVideo, handleClick))

  const handleClick = useMemoizedFn(() => {
    const item = mainList.items[index + 1]
    item.linkEl.click()
    toast(item.title)
  })

  return (
    <ActionButton onClick={handleClick}>
      <StepForwardOutlined />
    </ActionButton>
  )
}
