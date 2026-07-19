import { PlusSquareOutlined, TranslationOutlined } from '@ant-design/icons'
import Dropdown from '@root/components/Dropdown'
import FileDropper from '@root/components/FileDropper'
import Iconfont from '@root/components/Iconfont'
import Tabs from '@root/components/Tabs'
import ActionButton from '@root/components/VideoPlayerV2/bottomPanel/ActionButton'
import vpContext from '@root/components/VideoPlayerV2/context'
import { PlayerEvent } from '@root/core/event'
import type SubtitleManager from '@root/core/SubtitleManager'
import { TranslateMode, TranslateService } from '@root/core/SubtitleManager'
import { useOnce } from '@root/hook'
import { t } from '@root/utils/i18n'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { runInAction } from 'mobx'
import { observer, useObserver } from 'mobx-react'
import { type FC, memo, useContext, useEffect, useState } from 'react'

type MenuTab = 'subtitle' | 'translate'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleSelectionInner: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  const { eventBus, videoPlayerRef } = useContext(vpContext)

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
    <Dropdown
      menuRender={() => <Menu {...props} />}
      getPopupContainer={(node) =>
        videoPlayerRef.current || node.ownerDocument.body!
      }
    >
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
    <div className="w-[150px]">
      <Tabs
        className=" bg-[#000] rounded-[4px] p-[4px] text-[14px] text-white max-h-[calc(100vh-var(--area-height)-10px)] custom-scrollbar overflow-auto"
        tabs={[
          {
            label: (
              <button
                className={classNames(
                  'flex-1 h-[24px] rounded-[4px] f-center cursor-pointer transition-colors',
                  '[&.active]:bg-gray-800 [&.active]:text-[var(--color-main)]',
                  '[&:not(.active)]:hover:bg-gray-800 [&:not(.active)]:bg-transparent',
                )}
              >
                <Iconfont type="subtitle" size={14} />
              </button>
            ),
            value: 'subtitle',
            content: (
              <>
                {[
                  {
                    key: 'add',
                    label: (
                      <div className="relative w-full h-full f-center cursor-pointer gap-1">
                        <PlusSquareOutlined />
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
                          title=""
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
              </>
            ),
          },
          {
            label: (
              <button
                type="button"
                className={classNames(
                  'flex-1 h-[24px] rounded-[4px] f-center cursor-pointer transition-colors',
                  '[&.active]:bg-gray-800 [&.active]:text-[var(--color-main)]',
                  '[&:not(.active)]:hover:bg-gray-800 [&:not(.active)]:bg-transparent',
                )}
              >
                <TranslationOutlined className="text-[14px]" />
              </button>
            ),
            value: 'translate',
            content: <TranslatePanel />,
          },
        ]}
        adjustContent="bottom"
      ></Tabs>
    </div>
  )
})

const TranslatePanel: FC = observer((props) => {
  const { subtitleManager } = useContext(vpContext)
  const [isOpen, setOpen] = useState(false)
  const [isShowOriginalLang, setShowOriginalLang] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      subtitleManager.translateMode = 'none'
      return
    }
    if (isShowOriginalLang) {
      subtitleManager.translateMode = 'double'
    } else {
      subtitleManager.translateMode = 'single'
    }
  }, [isOpen, isShowOriginalLang])

  return (
    <div className="flex-col px-2 py-1 gap-2 text-xs [&_.label]:mb-1 [&_.label-switch]:f-i-center [&_.label-switch]:justify-between [&_.label-switch]:gap-4">
      <div className="label-switch">
        {t('subtitleTranslate.enable')}{' '}
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => setOpen(e.target.checked)}
        />
      </div>
      <div
        className={classNames(
          'flex-col gap-2',
          !isOpen && 'opacity-60 pointer-events-none',
        )}
      >
        <div className="label-switch">
          {t('subtitleTranslate.bilingual')}
          <input
            type="checkbox"
            checked={isShowOriginalLang}
            onChange={(e) => setShowOriginalLang(e.target.checked)}
          />
        </div>
        <div className="label">{t('subtitleTranslate.service')}</div>
        <select
          className="w-full bg-transparent border-[1px] border-gray-300 rounded-[4px]"
          name="translateService"
          value={subtitleManager.translateService}
          onChange={(e) => {
            subtitleManager.translateService = e.target
              .value as keyof typeof TranslateService
          }}
        >
          {Object.values(TranslateService).map((v) => {
            return (
              <option key={v} value={v} className="bg-transparent text-black">
                {v}
              </option>
            )
          })}
        </select>
      </div>
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
