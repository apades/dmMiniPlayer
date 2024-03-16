import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { useOnce } from '@root/hook'
import configStore from '@root/store/config'
import vpConfig from '@root/store/vpConfig'
import { useSet } from 'ahooks'
import { observer } from 'mobx-react'
import { type FC } from 'react'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleText: FC<Props> = (props) => {
  const { subtitleManager } = props
  const [activeRows, activeRowsManager] = useSet<SubtitleRow>()

  window.subtitleManager = subtitleManager
  useOnce(() => {
    const activeRows = subtitleManager.activeRows
    activeRows.forEach((row) => activeRowsManager.add(row))

    const unListenEnter = subtitleManager.on2('row-enter', (row) => {
      console.log('row-enter', row)
      activeRowsManager.add(row)
    })
    const unListenLeave = subtitleManager.on2('row-leave', (row) => {
      console.log('row-leave', row)
      activeRowsManager.remove(row)
    })

    return () => {
      unListenEnter()
      unListenLeave()
    }
  })
  return (
    <div
      className="vp-subtitle w-full flex flex-col justify-center items-center left-0 bottom-[12px] px-[24px]"
      style={{
        opacity: !vpConfig.showSubtitle ? 0 : configStore.subtitle_opacity,
      }}
    >
      {Array.from(activeRows.values()).map((row, i) => (
        <div key={i} className="relative w-fit">
          <div
            className="absolute w-full h-full"
            style={{
              backgroundColor: configStore.subtitle_bg,
              opacity: configStore.subtitle_bgOpacity,
            }}
          ></div>
          <div
            className="relative z-[2] px-[8px] py-[2px] text-center whitespace-pre-line"
            style={{
              color: configStore.subtitle_fontColor,
              opacity: configStore.subtitle_fontOpacity,
              fontWeight: configStore.subtitle_fontWeight,
              fontFamily: configStore.subtitle_fontFamily,
              fontSize: configStore.subtitle_fontSize,
            }}
          >
            {row.text}
          </div>
        </div>
      ))}
    </div>
  )
}

export default observer(SubtitleText)
