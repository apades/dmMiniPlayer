import vpContext from '@root/components/VideoPlayerV2/context'
import { PlayerEvent } from '@root/core/event'
import SubtitleManager, { TranslateMode } from '@root/core/SubtitleManager'
import type { SubtitleRow } from '@root/core/SubtitleManager/types'
import { useOnce } from '@root/hook'
import configStore from '@root/store/config'
import { minmax } from '@root/utils'
import { useMemoizedFn, useSet } from 'ahooks'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import {
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react'
import Color from 'color'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleText: FC<Props> = (props) => {
  const { subtitleManager } = props
  const [activeRows, setActiveRows] = useState<Record<string, SubtitleRow>>({})
  const [fontSize, setFontSize] = useState(configStore.subtitle_fontSize)
  const { eventBus } = useContext(vpContext)
  const containerRef = useRef<HTMLDivElement>(null)

  // window.subtitleManager = subtitleManager
  useOnce(() => {
    const enterActiveRows = subtitleManager.activeRows
    const activeRows: Record<string, SubtitleRow> = {}
    enterActiveRows.forEach((row) => (activeRows[row.id] = row))
    setActiveRows(activeRows)

    const unListenEnter = subtitleManager.on2('row-enter', (row) => {
      // console.log('row-enter', row)
      // activeRowsManager.add(row)
      setActiveRows((activeRows) => ({ ...activeRows, [row.id]: row }))
    })
    const unListenLeave = subtitleManager.on2('row-leave', (row) => {
      // console.log('row-leave', row)
      setActiveRows((activeRows) => {
        delete activeRows[row.id]
        return { ...activeRows }
      })
    })
    const unListenReset = subtitleManager.on2('reset', () => {
      setActiveRows({})
    })

    return () => {
      unListenEnter()
      unListenLeave()
      unListenReset()
    }
  })

  const updateFontSize = useMemoizedFn(() => {
    if (!configStore.subtitle_autoSize)
      return setFontSize(configStore.subtitle_fontSize)
    if (!containerRef.current) return

    // 先计算出目标大小
    const tarSize =
      (configStore.subtitle_fontSize /
        configStore.subtitle_autoSize_startWidth) *
      containerRef.current.clientWidth *
      configStore.subtitle_autoSize_scaleRate
    // 再根据最大大小调整
    const clampSize = minmax(
      tarSize,
      configStore.subtitle_fontSize,
      configStore.subtitle_autoSize_maxSize,
    )
    setFontSize(clampSize)
  })

  useOnce(() => eventBus.on2(PlayerEvent.resize, updateFontSize))
  useOnce(() => autorun(updateFontSize))

  const renderText = useMemo((): ((row: SubtitleRow) => ReactNode) => {
    switch (subtitleManager.translateMode) {
      case TranslateMode.none:
        return (row) => <p>{row.text}</p>
      case TranslateMode.single:
        return (row) => <p>{row.translatedText ?? ''}</p>
      case TranslateMode.double:
        return (row) => (
          <>
            <p>{row.translatedText}</p>
            <p
              style={{
                fontSize:
                  configStore.subtitle_originTextFontSizeScaleInDoubleMode *
                    fontSize +
                  'px',
              }}
            >
              {row.text}
            </p>
          </>
        )
    }
  }, [
    subtitleManager.translateMode,
    configStore.subtitle_originTextFontSizeScaleInDoubleMode,
    fontSize,
  ])

  const bgColor = useMemo(() => {
    return Color.rgb(configStore.subtitle_bg)
      .alpha(configStore.subtitle_bgOpacity)
      .toString()
  }, [configStore.subtitle_bg, configStore.subtitle_bgOpacity])

  return (
    <div
      className="vp-subtitle w-full flex flex-col justify-center items-center left-0 bottom-[12px] px-[24px]"
      style={{
        opacity: !subtitleManager.showSubtitle
          ? 0
          : configStore.subtitle_opacity,
      }}
      ref={containerRef}
    >
      {Object.values(activeRows).map((row, i) => (
        <div
          key={row.id}
          className="relative z-[2] [&>p]:px-[8px] [&>p]:py-[2px] [&>p]:text-center [&>p]:flex-col [&>p]:bg-[var(--bg)] [&>p]:w-fit f-center flex-col"
          style={{
            color: configStore.subtitle_fontColor,
            opacity: configStore.subtitle_fontOpacity,
            fontWeight: configStore.subtitle_fontWeight,
            fontFamily: configStore.subtitle_fontFamily,
            fontSize: fontSize + 'px',
            '--bg': bgColor,
          }}
        >
          {renderText(row)}
        </div>
      ))}
    </div>
  )
}

export default observer(SubtitleText)
