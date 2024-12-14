import SubtitleManager from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { useOnce } from '@root/hook'
import configStore from '@root/store/config'
import { useSet } from 'ahooks'
import { observer } from 'mobx-react'
import { useState, type FC } from 'react'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleText: FC<Props> = (props) => {
  const { subtitleManager } = props
  const [activeRows, setActiveRows] = useState<Record<string, SubtitleRow>>({})

  // window.subtitleManager = subtitleManager
  useOnce(() => {
    const enterActiveRows = subtitleManager.activeRows
    const activeRows: Record<string, SubtitleRow> = {}
    enterActiveRows.forEach((row) => (activeRows[row.id] = row))
    setActiveRows(activeRows)

    const unListenEnter = subtitleManager.on2('row-enter', (row) => {
      console.log('row-enter', row)
      // activeRowsManager.add(row)
      setActiveRows((activeRows) => ({ ...activeRows, [row.id]: row }))
    })
    const unListenLeave = subtitleManager.on2('row-leave', (row) => {
      console.log('row-leave', row)
      // activeRowsManager.remove(row)
      // console.log('activeRows', activeRows)
      setActiveRows((activeRows) => {
        delete activeRows[row.id]
        return { ...activeRows }
      })
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
        opacity: !subtitleManager.showSubtitle
          ? 0
          : configStore.subtitle_opacity,
      }}
    >
      {Object.values(activeRows).map((row, i) => (
        <div key={row.id} className="relative w-fit">
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
              fontSize: configStore.subtitle_fontSize + 'px',
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
