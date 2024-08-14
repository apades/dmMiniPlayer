import Dropdown from '@root/components/Dropdown'
import FileDropper from '@root/components/FileDropper'
import Iconfont from '@root/components/Iconfont'
import type SubtitleManager from '@root/core/SubtitleManager'
import vpConfig from '@root/store/vpConfig'
import { t } from '@root/utils/i18n'
import classNames from 'classnames'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { type FC, memo } from 'react'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleSelectionInner: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel

  return (
    <Dropdown menuRender={() => <Menu {...props} />}>
      <div
        className="p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors"
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
      >
        <Iconfont
          type="subtitle"
          size={18}
          className={classNames(!vpConfig.showSubtitle && 'opacity-50')}
        />
      </div>
    </Dropdown>
  )
})

const Menu: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  return (
    <div className="w-[150px] bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white">
      {[
        {
          key: 'add',
          label: (
            <div className="relative w-full h-full f-center cursor-pointer">
              {t('vp.addNewSubtitle')}
              <input
                className="absolute w-full left-0 top-0 h-full opacity-0 cursor-pointer"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  subtitleManager.addFileSubtitle(file)
                }}
                accept=".srt, .ass"
              />
            </div>
          ),
          onClick: async () => {},
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
          <p className="font-medium">{t('vp.subtitleSupport')}</p>
        </div>
      }
      handleDrop={async (dataTransfer) => {
        const file = dataTransfer.files[0]
        props.subtitleManager.addFileSubtitle(file)
      }}
      getPopupContainer={() =>
        window?.documentPictureInPicture?.window?.document?.body ??
        document.body
      }
    >
      <div>
        <SubtitleSelectionInner {...props} />
      </div>
    </FileDropper>
  )
})

export default SubtitleSelection
