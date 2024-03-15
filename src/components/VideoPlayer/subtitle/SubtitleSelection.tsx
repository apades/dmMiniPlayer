import Iconfont from '@root/components/Iconfont'
import type SubtitleManager from '@root/core/SubtitleManager'
import { observer } from 'mobx-react'
import { type FC, memo, useState } from 'react'
import { Dropdown } from 'antd'
import classNames from 'classnames'
import vpConfig from '@root/store/vpConfig'
import { runInAction } from 'mobx'
import FileDropper from '@root/components/FileDropper'

type Props = {
  subtitleManager: SubtitleManager
}
const SubtitleSelectionInner: FC<Props> = observer((props) => {
  const { subtitleManager } = props
  const activeLabel = subtitleManager.activeSubtitleLabel
  const [isOpen, setOpen] = useState(false)

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'add',
            label: 'add new subtitle',
            onClick: () => {},
          },
          ...subtitleManager.subtitleItems.map((subtitleItem) => {
            return {
              key: subtitleItem.value,
              label: subtitleItem.label,
              onClick: () => {
                subtitleManager.useSubtitle(subtitleItem.label)
                vpConfig.showSubtitle = true
              },
              className: classNames(
                activeLabel == subtitleItem.label && 'active'
              ),
            }
          }),
        ],
      }}
      trigger={['hover']}
      getPopupContainer={(node) => node.parentElement}
      open={isOpen}
    >
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
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
      </div>
    </Dropdown>
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
        // console.log('file', file)
        await props.subtitleManager.addFileSubtitle(file)
        props.subtitleManager.useSubtitle(file.name)
      }}
    >
      <SubtitleSelectionInner {...props} />
    </FileDropper>
  )
})

export default SubtitleSelection
