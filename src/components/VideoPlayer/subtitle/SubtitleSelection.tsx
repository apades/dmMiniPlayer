import Iconfont from '@root/components/Iconfont'
import type SubtitleManager from '@root/core/SubtitleManager'
import { observer } from 'mobx-react'
import { type FC, memo, useState } from 'react'
import classNames from 'classnames'
import vpConfig from '@root/store/vpConfig'
import { runInAction } from 'mobx'
import FileDropper from '@root/components/FileDropper'
import Dropdown from '@root/components/Dropdown'
import { createElement, inputFile } from '@root/utils'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleSelectionInner: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel

  return (
    <Dropdown menuRender={() => <Menu {...props} />}>
      <Iconfont
        type="subtitle"
        size={18}
        className={classNames(!vpConfig.showSubtitle && 'opacity-50')}
        onClick={() => {
          runInAction(() => {
            if (!subtitleManager.activeSubtitleLabel) {
              if (subtitleManager.subtitleItems.length) {
                subtitleManager.useSubtitle(
                  subtitleManager.subtitleItems[0].label
                )
                vpConfig.showSubtitle = true
              } else {
                return console.log('No subtitle')
              }
            } else {
              vpConfig.showSubtitle = !vpConfig.showSubtitle
            }
          })
        }}
      />
    </Dropdown>
  )
})

const Menu: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  return (
    <div className="w-[150px] bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px]">
      {[
        {
          key: 'add',
          label: 'add new subtitle',
          onClick: async () => {
            const file = await inputFile('.srt, .ass')
            if (!file) return
            subtitleManager.addFileSubtitle(file)
          },
          isActive: false,
        },
        ...subtitleManager.subtitleItems.map((subtitleItem) => {
          return {
            key: subtitleItem.value,
            label: subtitleItem.label,
            onClick: () => {
              subtitleManager.useSubtitle(subtitleItem.label)
              vpConfig.showSubtitle = true
            },
            isActive: activeLabel == subtitleItem.label,
          }
        }),
      ].map((v, i) => (
        <div
          key={i}
          className={classNames(
            'h-[24px] px-[4px] rounded-[4px] text-ellipsis text-center cursor-pointer hover:bg-gray-800 w-full transition-colors whitespace-nowrap overflow-hidden leading-[24px]',
            v.isActive && 'text-[var(--color-main)]'
          )}
          onClick={v.onClick}
        >
          {v.label}
        </div>
      ))}
    </div>
  )
})

const SubtitleSelection: FC<Props> = memo((props) => {
  return (
    <FileDropper
      global
      dragoverRender={
        <div className="f-center w-full h-full gap-[24px] bg-[#fff3]">
          <Iconfont type="file" size={30} />
          <p className="font-medium">Support .srt .ass</p>
        </div>
      }
      handleDrop={async (dataTransfer) => {
        const file = dataTransfer.files[0]
        props.subtitleManager.addFileSubtitle(file)
      }}
    >
      <div>
        <SubtitleSelectionInner {...props} />
      </div>
    </FileDropper>
  )
})

export default SubtitleSelection
