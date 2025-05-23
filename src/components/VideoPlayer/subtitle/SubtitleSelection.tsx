import { TranslationOutlined } from '@ant-design/icons'
import Dropdown from '@root/components/Dropdown'
import FileDropper from '@root/components/FileDropper'
import Iconfont from '@root/components/Iconfont'
import ActionButton from '@root/components/VideoPlayerV2/bottomPanel/ActionButton'
import vpContext from '@root/components/VideoPlayerV2/context'
import { PlayerEvent } from '@root/core/event'
import type SubtitleManager from '@root/core/SubtitleManager'
import { translateMode } from '@root/core/SubtitleManager'
import { useOnce } from '@root/hook'
import { t } from '@root/utils/i18n'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { type FC, memo, useContext } from 'react'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleSelectionInner: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  const { eventBus } = useContext(vpContext)

  const handleChangeVisible = useMemoizedFn(() => {
    runInAction(() => {
      if (!subtitleManager.activeSubtitleLabel) {
        if (subtitleManager.subtitleItems.length) {
          subtitleManager.useSubtitle(subtitleManager.subtitleItems[0].label)
          subtitleManager.showSubtitle = true
        } else {
          return console.log('No subtitle')
        }
      } else {
        subtitleManager.showSubtitle = !subtitleManager.showSubtitle
      }
    })
  })

  useOnce(() =>
    eventBus.on2(PlayerEvent.command_subtitleVisible, () => {
      handleChangeVisible()
    }),
  )

  return (
    <Dropdown menuRender={() => <Menu {...props} />}>
      <ActionButton
        isUnActive={!subtitleManager.showSubtitle}
        onClick={handleChangeVisible}
      >
        <Iconfont type="subtitle" size={18} />
      </ActionButton>
    </Dropdown>
  )
})

const Menu: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  return (
    <div className="w-[150px] bg-[#000] rounded-[4px] p-[4px] text-[14px] text-white max-h-[calc(100vh-var(--area-height)-10px)] custom-scrollbar overflow-auto">
      <div className="f-i-center px-2 py-1 justify-between gap-2">
        <TranslationOutlined className="text-[16px]" />
        <select
          value={subtitleManager.translateMode}
          className="bg-[#333] flex-1"
          onChange={(e) => {
            runInAction(() => {
              subtitleManager.translateMode = e.target.value as any
            })
          }}
        >
          {Object.entries(translateMode).map(([v, text]) => (
            <option className="bg-[#333]" key={v} value={v}>
              {text}
            </option>
          ))}
        </select>
      </div>
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
        ...subtitleManager.subtitleItems.map((subtitleItem, i) => {
          return {
            key: i,
            label: subtitleItem.label,
            onClick: () => {
              subtitleManager.useSubtitle(subtitleItem.label)
              subtitleManager.showSubtitle = true
            },
            isActive: activeLabel == subtitleItem.label,
          }
        }),
      ].map((v, i) => (
        <div
          key={i}
          className={classNames(
            'h-[24px] px-[4px] rounded-[4px] text-ellipsis text-center cursor-pointer hover:bg-gray-800 w-full transition-colors whitespace-nowrap overflow-hidden leading-[24px]',
            v.isActive && 'text-[var(--color-main)]',
            i !== 0 && 'mt-1',
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
  const { isLive } = useContext(vpContext)
  if (isLive) return null
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
